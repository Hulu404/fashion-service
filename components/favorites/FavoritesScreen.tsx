'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabaseBrowser } from '../../lib/supabaseClient'
import { fetchSavedLooks, removeLook, type SavedLook } from '../../lib/savedLooks'
import LookGlyphs from '../podbor/LookGlyphs'
import LookCard from '../podbor/LookCard'

type Props = { userId: string }

export default function FavoritesScreen({ userId }: Props) {
  const supabase = getSupabaseBrowser()
  const [items, setItems] = useState<SavedLook[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const rows = await fetchSavedLooks(supabase, userId)
    setItems(rows)
    setLoading(false)
  }, [supabase, userId])

  useEffect(() => {
    void load()
  }, [load])

  async function unsave(key: string) {
    // Optimistic removal; reload on failure to resync.
    setItems((prev) => prev.filter((r) => r.look_key !== key))
    const { error } = await removeLook(supabase, userId, key)
    if (error) await load()
  }

  return (
    <div className="pb-12">
      <LookGlyphs />

      {/* Masthead with count badge */}
      <header className="flex items-center gap-3 px-[var(--gut)] pt-7 pb-3">
        <a
          href="/podbor"
          aria-label="Назад"
          className="w-9 h-9 rounded-full border border-[color:var(--hair)] bg-porcelain-2 grid place-items-center text-ink hover:bg-porcelain lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </a>
        <h1 className="font-display text-2xl text-ink">Избранное</h1>
        {items.length > 0 && (
          <span className="ml-1 inline-grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full bg-oxblood text-porcelain text-[11px] leading-none">
            {items.length}
          </span>
        )}
      </header>

      {loading ? (
        <p className="px-[var(--gut)] eyebrow">Загрузка…</p>
      ) : items.length === 0 ? (
        <div className="px-10 py-20 text-center lg:max-w-sm lg:mx-auto">
          <div className="text-mocha-soft flex justify-center mb-4" aria-hidden="true">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
            </svg>
          </div>
          <h3 className="font-display text-xl text-ink mb-2">Здесь пока пусто</h3>
          <p className="text-sm text-ink-soft font-light leading-relaxed max-w-[26ch] mx-auto">
            Нажмите ♡ на любом образе в результатах подбора — он появится здесь.
          </p>
          <a href="/podbor" className="btn mt-6 inline-block">
            Собрать образы
          </a>
        </div>
      ) : (
        <div className="pt-1 lg:grid lg:grid-cols-3 lg:gap-5 lg:items-start lg:px-[var(--gut)]">
          {items.map((row, i) => (
            <LookCard
              key={row.look_key}
              look={row.look}
              index={i + 1}
              saved
              onToggleSave={() => unsave(row.look_key)}
              onSimilar={() => {
                window.location.href = '/podbor'
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
