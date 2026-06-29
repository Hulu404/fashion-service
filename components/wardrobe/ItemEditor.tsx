'use client'

import { useState } from 'react'
import { COLOR_NAMES, hexForColor } from '../../lib/colors'
import {
  CATEGORIES,
  SEASONS,
  EMPTY_DRAFT,
  type WardrobeDraft,
} from '../../lib/wardrobe'

type Props = {
  /** Pre-filled draft when editing; omit to add a new item. */
  initial?: WardrobeDraft
  title: string
  busy?: boolean
  error?: string | null
  onCancel: () => void
  onSave: (draft: WardrobeDraft) => void
}

/**
 * Modal form for adding (manual, no photo) or editing a wardrobe item.
 * Colour is always picked from lib/colors so the palette stays consistent.
 */
export default function ItemEditor({
  initial,
  title,
  busy,
  error,
  onCancel,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<WardrobeDraft>(initial ?? EMPTY_DRAFT)

  const pickColor = (name: string) =>
    setDraft({ ...draft, color_name: name, color_hex: hexForColor(name) ?? '' })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[rgba(20,28,56,0.45)] px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[color:var(--hair)] bg-oat p-5 shadow-eclat"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl text-ink mb-4">{title}</h2>

        <div className="space-y-3">
          <label className="block">
            <span className="field-label">Категория</span>
            <select
              className="field-input"
              value={CATEGORIES.includes(draft.category as (typeof CATEGORIES)[number]) ? draft.category : ''}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              <option value="">— выбрать —</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Цвет</span>
            <div className="flex items-center gap-2">
              <select
                className="field-input"
                value={COLOR_NAMES.includes(draft.color_name) ? draft.color_name : ''}
                onChange={(e) => pickColor(e.target.value)}
              >
                <option value="">— выбрать —</option>
                {COLOR_NAMES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {draft.color_hex && (
                <span
                  className="inline-block w-7 h-7 shrink-0 rounded-full border border-[color:var(--hair)]"
                  style={{ background: draft.color_hex }}
                  aria-hidden="true"
                />
              )}
            </div>
          </label>

          <label className="block">
            <span className="field-label">Материал</span>
            <input
              className="field-input"
              placeholder="например, шерсть"
              value={draft.material}
              onChange={(e) => setDraft({ ...draft, material: e.target.value })}
            />
          </label>

          <label className="block">
            <span className="field-label">Теги стиля (через запятую)</span>
            <input
              className="field-input"
              placeholder="Минимализм, Классика"
              value={draft.style_tags.join(', ')}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  style_tags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>

          <label className="block">
            <span className="field-label">Сезон</span>
            <select
              className="field-input"
              value={SEASONS.includes(draft.season as (typeof SEASONS)[number]) ? draft.season : ''}
              onChange={(e) => setDraft({ ...draft, season: e.target.value })}
            >
              <option value="">— выбрать —</option>
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="text-sm text-oxblood font-light mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button type="button" className="btn" disabled={busy} onClick={() => onSave(draft)}>
            {busy ? 'Сохранение…' : 'Сохранить'}
          </button>
          <button
            type="button"
            className="text-sm text-ink border-b border-mocha pb-0.5 hover:text-oxblood hover:border-oxblood"
            disabled={busy}
            onClick={onCancel}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}
