'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseBrowser } from '../../lib/supabaseClient'
import { EMPTY_PARAMS, type BuildParams } from '../../lib/buildOptions'
import LoginScreen from '../../components/podbor/LoginScreen'
import BuildForm from '../../components/podbor/BuildForm'
import ResultStub from '../../components/podbor/ResultStub'

type Phase = 'checking' | 'signed-out' | 'loading-profile' | 'ready'
type View = 'form' | 'result'

const PROFILE_COLUMNS = 'occasion, styles, palette, fit, budget, has_photo'

export default function PodborPage() {
  const supabase = getSupabaseBrowser()
  const [phase, setPhase] = useState<Phase>('checking')
  const [session, setSession] = useState<Session | null>(null)
  const [params, setParams] = useState<BuildParams>(EMPTY_PARAMS)
  const [view, setView] = useState<View>('form')
  const [saving, setSaving] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hydrating = useRef(false) // guards autosave while we load existing data

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

  const handleSubmit = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    await persist(params) // ensure the latest selection is stored before navigating
    setView('result')
  }, [params, persist])

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

  return (
    <main className="max-w-md mx-auto min-h-screen bg-oat">
      {view === 'form' ? (
        <BuildForm
          value={params}
          onChange={setParams}
          onSubmit={handleSubmit}
          userId={session.user.id}
          saving={saving}
        />
      ) : (
        <ResultStub params={params} onBack={() => setView('form')} />
      )}
      <div className="px-[22px] pb-10 pt-2">
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
