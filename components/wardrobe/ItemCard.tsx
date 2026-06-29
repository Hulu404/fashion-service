'use client'

import ColorStory from '../ColorStory'
import { type WardrobeItem } from '../../lib/wardrobe'

type Props = {
  item: WardrobeItem
  /** Signed URL for the private thumbnail, if the item came from a photo. */
  thumbUrl?: string
  onEdit: (item: WardrobeItem) => void
  onDelete: (item: WardrobeItem) => void
}

export default function ItemCard({ item, thumbUrl, onEdit, onDelete }: Props) {
  const swatch =
    item.color_hex && item.color_name
      ? [{ name: item.color_name, hex: item.color_hex }]
      : []

  return (
    <div className="rounded-2xl border border-[color:var(--hair)] bg-porcelain-2 overflow-hidden flex flex-col">
      {/* Thumbnail — photo when available, otherwise a colour-tinted placeholder */}
      <div className="relative aspect-[4/5] bg-porcelain">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt={item.category ?? 'Вещь'} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full grid place-items-center"
            style={{ background: item.color_hex || 'var(--porcelain)' }}
          >
            <span className="text-mocha" aria-hidden="true">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M4 16l4-5 3 3 4-5 5 7" />
                <rect x="3" y="4" width="18" height="16" rx="2" />
              </svg>
            </span>
          </div>
        )}
        {item.season && (
          <span className="absolute top-2 left-2 text-[10px] tracking-[0.06em] px-2 py-1 rounded bg-[rgba(34,20,12,0.55)] text-porcelain">
            {item.season}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 grow">
        <div className="font-display text-base text-ink leading-tight">
          {item.category || 'Без категории'}
        </div>

        {swatch.length > 0 && <ColorStory story={swatch} />}

        {item.style_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.style_tags.map((t, i) => (
              <span key={`${t}-${i}`} className="tag ghost">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-auto pt-1">
          <button
            type="button"
            className="text-xs text-ink border-b border-mocha pb-0.5 hover:text-oxblood hover:border-oxblood"
            onClick={() => onEdit(item)}
          >
            Изменить
          </button>
          <button
            type="button"
            className="text-xs text-stone hover:text-oxblood"
            onClick={() => onDelete(item)}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  )
}
