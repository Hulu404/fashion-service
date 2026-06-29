'use client'

import {
  OCCASIONS,
  STYLES,
  MAX_STYLES,
  PALETTES,
  FITS,
  BUDGETS,
  type BuildParams,
} from '../../lib/buildOptions'
import PhotoZone from './PhotoZone'

type Props = {
  value: BuildParams
  onChange: (next: BuildParams) => void
  onSubmit: () => void
  userId: string
  saving?: boolean
}

/** A single keyboard-accessible chip. Active state is oxblood (via .chip[aria-pressed]). */
function Chip({
  label,
  active,
  onToggle,
}: {
  label: string
  active: boolean
  onToggle: () => void
}) {
  return (
    <button type="button" className="chip" aria-pressed={active} onClick={onToggle}>
      {label}
    </button>
  )
}

export default function BuildForm({ value, onChange, onSubmit, userId, saving }: Props) {
  const setOccasion = (occasion: string) =>
    onChange({ ...value, occasion: value.occasion === occasion ? null : occasion })

  const toggleStyle = (style: string) => {
    const has = value.styles.includes(style)
    if (has) {
      onChange({ ...value, styles: value.styles.filter((s) => s !== style) })
      return
    }
    // multi-select, max 2: drop the oldest selection when full.
    const next =
      value.styles.length >= MAX_STYLES
        ? [...value.styles.slice(1), style]
        : [...value.styles, style]
    onChange({ ...value, styles: next })
  }

  const setPalette = (name: string) =>
    onChange({ ...value, palette: value.palette === name ? null : name })

  const setFit = (fit: string) => onChange({ ...value, fit: value.fit === fit ? null : fit })

  const setBudget = (budget: string) =>
    onChange({ ...value, budget: value.budget === budget ? null : budget })

  return (
    <div className="pb-10">
      {/* Topbar */}
      <div className="flex items-center gap-3.5 px-5 pt-6 pb-2 sticky top-0 bg-oat z-10">
        <a
          href="/"
          aria-label="На витрину"
          className="w-9 h-9 rounded-full border border-[color:var(--hair)] bg-porcelain-2 grid place-items-center text-ink hover:bg-porcelain"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </a>
        <h1 className="font-display text-2xl text-ink">Соберём ваш образ</h1>
        <span className="ml-auto text-[11px] text-stone font-light" aria-live="polite">
          {saving ? 'Сохранение…' : 'Сохранено'}
        </span>
      </div>

      <p className="px-[22px] pt-1.5 pb-1.5 text-sm text-ink-soft font-light leading-relaxed">
        Отметьте, что нужно. Чем точнее ввод, тем точнее подбор.
      </p>

      {/* Повод — single-select */}
      <fieldset className="px-[22px] pt-5">
        <legend className="field-label">Повод</legend>
        <div className="chips">
          {OCCASIONS.map((o) => (
            <Chip key={o} label={o} active={value.occasion === o} onToggle={() => setOccasion(o)} />
          ))}
        </div>
      </fieldset>

      {/* Стиль — multi-select, max 2 */}
      <fieldset className="px-[22px] pt-6">
        <legend className="field-label">
          Стиль <span className="hint">— до двух</span>
        </legend>
        <div className="chips">
          {STYLES.map((s) => (
            <Chip key={s} label={s} active={value.styles.includes(s)} onToggle={() => toggleStyle(s)} />
          ))}
        </div>
      </fieldset>

      {/* Палитра — card strips */}
      <fieldset className="px-[22px] pt-6">
        <legend className="field-label">Палитра</legend>
        <div className="pal-grid">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              className="pal"
              aria-pressed={value.palette === p.name}
              onClick={() => setPalette(p.name)}
            >
              <span className="strip" aria-hidden="true">
                {p.shades.map((hex, i) => (
                  <i key={i} style={{ background: hex }} />
                ))}
              </span>
              <span className="pnm">{p.name}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Посадка — single-select */}
      <fieldset className="px-[22px] pt-6">
        <legend className="field-label">Посадка</legend>
        <div className="chips">
          {FITS.map((f) => (
            <Chip key={f} label={f} active={value.fit === f} onToggle={() => setFit(f)} />
          ))}
        </div>
      </fieldset>

      {/* Бюджет — single-select */}
      <fieldset className="px-[22px] pt-6">
        <legend className="field-label">Бюджет на образ</legend>
        <div className="chips">
          {BUDGETS.map((b) => (
            <Chip key={b} label={b} active={value.budget === b} onToggle={() => setBudget(b)} />
          ))}
        </div>
      </fieldset>

      {/* Зона фото — реальная загрузка + разбор через Claude */}
      <fieldset className="px-[22px] pt-6">
        <legend className="field-label">
          Фото <span className="hint">— необязательно</span>
        </legend>
        <PhotoZone userId={userId} onSaved={() => onChange({ ...value, has_photo: true })} />
      </fieldset>

      <div className="px-[22px] pt-8">
        <button type="button" className="btn full" onClick={onSubmit} disabled={saving}>
          Собрать образы
        </button>
      </div>
    </div>
  )
}
