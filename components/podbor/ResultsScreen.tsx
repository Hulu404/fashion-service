'use client'

import type { BuildParams } from '../../lib/buildOptions'
import { lookKey, type Look } from '../../lib/looks'
import LookGlyphs from './LookGlyphs'
import LookCard from './LookCard'

type Props = {
  looks: Look[]
  params: BuildParams
  usingSeed?: boolean
  /** Content keys of looks the user has saved (source of truth: saved_looks). */
  savedKeys: Set<string>
  onToggleSave: (look: Look) => void
  onBack: () => void
  onRegen: () => void
}

function summaryTags(p: BuildParams): string[] {
  const tags: string[] = []
  if (p.occasion) tags.push(p.occasion)
  p.styles.forEach((s) => tags.push(s))
  if (p.palette) tags.push(`${p.palette} палитра`)
  if (p.fit) tags.push(`${p.fit} силуэт`)
  if (p.has_photo) tags.push('по фото')
  if (tags.length === 0) tags.push('Универсальный подбор')
  return tags
}

export default function ResultsScreen({
  looks,
  params,
  usingSeed,
  savedKeys,
  onToggleSave,
  onBack,
  onRegen,
}: Props) {
  const tags = summaryTags(params)

  return (
    <div className="pb-12">
      <LookGlyphs />

      {/* Topbar */}
      <div className="flex items-center gap-3.5 px-5 pt-6 pb-2 sticky top-0 bg-oat z-10 lg:px-[var(--gut)]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад к параметрам"
          className="w-9 h-9 rounded-full border border-[color:var(--hair)] bg-porcelain-2 grid place-items-center text-ink hover:bg-porcelain"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="font-display text-2xl text-ink">Ваши образы</h1>
      </div>

      {/* Summary chips */}
      <div className="summary">
        {tags.map((t, i) => (
          <span key={`${t}-${i}`} className={`tag${i === 0 ? '' : ' ghost'}`}>
            {t}
          </span>
        ))}
      </div>

      {usingSeed && (
        <p className="px-[var(--gut)] pt-1 pb-1 text-xs text-stone font-light">
          Гардероб пуст — образы собраны из базовых вещей. Добавьте свои фото, чтобы подбор стал точнее.
        </p>
      )}

      {/* Look cards — vertical list on mobile, 3-up grid on desktop */}
      <div className="pt-2 lg:grid lg:grid-cols-3 lg:gap-5 lg:items-start lg:px-[var(--gut)]">
        {looks.map((look, i) => (
          <LookCard
            key={i}
            look={look}
            index={i + 1}
            saved={savedKeys.has(lookKey(look))}
            onToggleSave={() => onToggleSave(look)}
            onSimilar={onRegen}
          />
        ))}
      </div>

      <div className="more-wrap">
        <button type="button" className="btn full" style={{ background: 'var(--ink)' }} onClick={onRegen}>
          Собрать ещё
        </button>
      </div>
    </div>
  )
}
