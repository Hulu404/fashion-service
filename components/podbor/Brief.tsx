'use client'

import type { ReactNode } from 'react'
import { PALETTES, type BuildParams } from '../../lib/buildOptions'

type Props = {
  value: BuildParams
  onSubmit: () => void
  saving?: boolean
}

function paletteShades(name: string | null): string[] {
  if (!name) return []
  return PALETTES.find((p) => p.name === name)?.shades ?? []
}

/**
 * Sticky desktop-only "Ваш бриф" card. Mirrors the live form selection and
 * carries the submit button; hidden on mobile (the inline button stays there).
 */
export default function Brief({ value, onSubmit, saving }: Props) {
  const rows: { label: string; content: ReactNode }[] = []
  if (value.occasion) rows.push({ label: 'Повод', content: value.occasion })
  if (value.styles.length) rows.push({ label: 'Стиль', content: value.styles.join(', ') })
  if (value.palette) {
    rows.push({
      label: 'Палитра',
      content: (
        <span className="brief-pal">
          <span className="brief-strip" aria-hidden="true">
            {paletteShades(value.palette).map((hex, i) => (
              <i key={i} style={{ background: hex }} />
            ))}
          </span>
          {value.palette}
        </span>
      ),
    })
  }
  if (value.fit) rows.push({ label: 'Посадка', content: value.fit })
  if (value.budget) rows.push({ label: 'Бюджет', content: value.budget })
  if (value.has_photo) rows.push({ label: 'Фото', content: 'Добавлено' })

  return (
    <aside className="brief">
      <div className="brief-card">
        <p className="eyebrow">Ваш бриф</p>

        {rows.length > 0 ? (
          <dl className="brief-list">
            {rows.map((r, i) => (
              <div className="brief-row" key={i}>
                <dt>{r.label}</dt>
                <dd>{r.content}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="brief-empty">Отметьте параметры слева — они появятся здесь.</p>
        )}

        <button type="button" className="btn full" onClick={onSubmit} disabled={saving}>
          Собрать образы
        </button>
      </div>
    </aside>
  )
}
