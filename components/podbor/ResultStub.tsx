'use client'

import type { BuildParams } from '../../lib/buildOptions'

type Props = {
  params: BuildParams
  onBack: () => void
}

function summaryTags(p: BuildParams): string[] {
  const tags: string[] = []
  if (p.occasion) tags.push(p.occasion)
  p.styles.forEach((s) => tags.push(s))
  if (p.palette) tags.push(`${p.palette} палитра`)
  if (p.fit) tags.push(`${p.fit} силуэт`)
  if (p.budget) tags.push(p.budget)
  if (p.has_photo) tags.push('по фото')
  if (tags.length === 0) tags.push('Универсальный подбор')
  return tags
}

export default function ResultStub({ params, onBack }: Props) {
  const tags = summaryTags(params)

  return (
    <div className="pb-12">
      <div className="flex items-center gap-3.5 px-5 pt-6 pb-2 sticky top-0 bg-oat z-10">
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

      <div className="flex gap-2 flex-wrap px-[22px] pt-1 pb-2">
        {tags.map((t, i) => (
          <span key={`${t}-${i}`} className={`tag${i === 0 ? '' : ' ghost'}`}>
            {t}
          </span>
        ))}
      </div>

      <div className="mx-[22px] mt-4 rounded-2xl border border-[color:var(--hair-soft)] bg-porcelain-2 p-8 text-center">
        <div className="text-mocha flex justify-center mb-4" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M5 3v4M3 5h4M6 17v3M5 18h3" />
            <path d="M14 4l2.5 5.5L22 12l-5.5 2.5L14 20l-2.5-5.5L6 12l5.5-2.5z" />
          </svg>
        </div>
        <h2 className="font-display text-xl text-ink">Параметры сохранены</h2>
        <p className="mt-3 text-sm text-ink-soft font-light leading-relaxed max-w-[30ch] mx-auto">
          Движок подбора образов появится в следующем шаге. Ваш выбор уже записан в профиль и
          подтянется при возвращении.
        </p>
        <button type="button" className="btn mt-6" onClick={onBack}>
          Изменить параметры
        </button>
      </div>
    </div>
  )
}
