'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseBrowser } from '../../lib/supabaseClient'
import { EMPTY_PARAMS, type BuildParams } from '../../lib/buildOptions'
import LoginScreen from '../../components/podbor/LoginScreen'
import BuildForm from '../../components/podbor/BuildForm'
import Loader from '../../components/podbor/Loader'
import ResultsScreen from '../../components/podbor/ResultsScreen'
import { lookKey, type Look } from '../../lib/looks'
import { fetchSavedKeys, saveLook, removeLook } from '../../lib/savedLooks'

type Phase = 'checking' | 'signed-out' | 'loading-profile' | 'ready'
type View = 'form' | 'loading' | 'result' | 'error'

const PROFILE_COLUMNS = 'occasion, styles, palette, fit, budget, has_photo'

export default function PodborPage() {
  const supabase = getSupabaseBrowser()
  const [phase, setPhase] = useState<Phase>('checking')
  const [session, setSession] = useState<Session | null>(null)
  const [params, setParams] = useState<BuildParams>(EMPTY_PARAMS)
  const [view, setView] = useState<View>('form')
  const [saving, setSaving] = useState(false)

  const [looks, setLooks] = useState<Look[]>([])
  const [usingSeed, setUsingSeed] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hydrating = useRef(false) // guards autosave while we load existing data
  const variety = useRef(1) // bumped on each regeneration to nudge variety

  // --- Auth lifecycle ---
  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setPhase(data.session ? 'loading-profile' : 'signed-out')
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setPhase(nextSession ? 'loading-profile' : 'signed-out')
      if (!nextSession) {
        setParams(EMPTY_PARAMS)
        setView('form')
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  // --- Ensure a profile row exists, then load saved params ---
  useEffect(() => {
    if (phase !== 'loading-profile' || !session) return
    let active = true

    async function loadProfile() {
      const user = session!.user
      // Create the row on first visit without clobbering existing values.
      await supabase
        .from('profiles')
        .upsert({ id: user.id, email: user.email }, { onConflict: 'id', ignoreDuplicates: true })

      const { data } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return

      hydrating.current = true
      setParams({
        occasion: data?.occasion ?? null,
        styles: data?.styles ?? [],
        palette: data?.palette ?? null,
        fit: data?.fit ?? null,
        budget: data?.budget ?? null,
        has_photo: data?.has_photo ?? false,
      })
      setPhase('ready')
      // Release the hydration guard after the params state settles.
      setTimeout(() => {
        hydrating.current = false
      }, 0)
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [phase, session, supabase])

  // --- Load saved-look keys so result cards reflect favourites on entry ---
  useEffect(() => {
    if (phase !== 'ready' || !session) return
    let active = true
    fetchSavedKeys(supabase, session.user.id).then((keys) => {
      if (active) setSavedKeys(keys)
    })
    return () => {
      active = false
    }
  }, [phase, session, supabase])

  const toggleSave = useCallback(
    async (look: Look) => {
      if (!session) return
      const key = lookKey(look)
      const userId = session.user.id
      const wasSaved = savedKeys.has(key)
      // Optimistic toggle; revert on failure.
      setSavedKeys((prev) => {
        const next = new Set(prev)
        if (wasSaved) next.delete(key)
        else next.add(key)
        return next
      })
      const { error } = wasSaved
        ? await removeLook(supabase, userId, key)
        : await saveLook(supabase, userId, look)
      if (error) {
        setSavedKeys((prev) => {
          const next = new Set(prev)
          if (wasSaved) next.add(key)
          else next.delete(key)
          return next
        })
      }
    },
    [session, supabase, savedKeys]
  )

  const persist = useCallback(
    async (next: BuildParams) => {
      if (!session) return
      setSaving(true)
      try {
        await supabase.from('profiles').update(next).eq('id', session.user.id)
      } finally {
        setSaving(false)
      }
    },
    [session, supabase]
  )

  // --- Debounced autosave: keep React state in sync with profiles ---
  useEffect(() => {
    if (phase !== 'ready' || hydrating.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persist(params), 600)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [params, phase, persist])

  const generate = useCallback(async () => {
    if (!session) return
    setView('loading')
    setGenError(null)
    try {
      const res = await fetch('/api/looks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ occasion: params.occasion, variety: variety.current }),
      })
      const data = await res.json()
      if (!res.ok || !Array.isArray(data?.looks) || data.looks.length === 0) {
        setGenError(data?.error || 'Не удалось собрать образы. Попробуйте ещё раз.')
        setView('error')
        return
      }
      setLooks(data.looks as Look[])
      setUsingSeed(Boolean(data.usingSeed))
      setView('result')
    } catch {
      setGenError('Сбой при генерации. Проверьте подключение.')
      setView('error')
    }
  }, [session, params.occasion])

  const handleSubmit = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    await persist(params) // ensure the latest selection is stored before generating
    variety.current = 1
    await generate()
  }, [params, persist, generate])

  const regenerate = useCallback(async () => {
    variety.current += 1
    await generate()
  }, [generate])

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (phase === 'checking' || phase === 'loading-profile') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="eyebrow">Загрузка…</div>
      </main>
    )
  }

  if (phase === 'signed-out' || !session) {
    return <LoginScreen />
  }

  if (view === 'loading') {
    return <Loader />
  }

  return (
    <main
      className={`max-w-md mx-auto min-h-screen bg-oat phone-shell ${
        view === 'error' ? 'lg:max-w-md' : 'lg:max-w-[1320px]'
      }`}
    >
      {view === 'form' ? (
        <BuildForm
          value={params}
          onChange={setParams}
          onSubmit={handleSubmit}
          userId={session.user.id}
          saving={saving}
        />
      ) : view === 'result' ? (
        <ResultsScreen
          looks={looks}
          params={params}
          usingSeed={usingSeed}
          savedKeys={savedKeys}
          onToggleSave={toggleSave}
          onBack={() => setView('form')}
          onRegen={regenerate}
        />
      ) : (
        <div className="pb-12">
          <div className="flex items-center gap-3.5 px-5 pt-6 pb-2">
            <button
              type="button"
              onClick={() => setView('form')}
              aria-label="Назад к параметрам"
              className="w-9 h-9 rounded-full border border-[color:var(--hair)] bg-porcelain-2 grid place-items-center text-ink hover:bg-porcelain"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <h1 className="font-display text-2xl text-ink">Ваши образы</h1>
          </div>
          <div className="mx-[var(--gut)] mt-4 rounded-2xl border border-[color:var(--hair-soft)] bg-porcelain-2 p-8 text-center">
            <p className="text-sm text-oxblood font-light">{genError}</p>
            <button type="button" className="btn mt-5" onClick={regenerate}>
              Попробовать снова
            </button>
          </div>
        </div>
      )}
      {/* Secondary links — on desktop the sidebar carries navigation + sign-out. */}
      <div className="px-[var(--gut)] pb-10 pt-2 flex items-center gap-5 lg:hidden">
        <a
          href="/wardrobe"
          className="text-[11px] text-mocha tracking-[0.08em] uppercase hover:text-oxblood"
        >
          Мой гардероб
        </a>
        <button
          type="button"
          onClick={signOut}
          className="text-[11px] text-stone tracking-[0.08em] uppercase hover:text-oxblood"
        >
          Выйти
        </button>
      </div>
    </main>
  )
}
