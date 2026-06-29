'use client'

import { gradientFromColors, type Look } from '../../lib/looks'

type Props = {
  look: Look
  index: number // 1-based, drives the Bodoni number
  saved: boolean
  onToggleSave: () => void
  onSimilar: () => void
}

export default function LookCard({ look, index, saved, onToggleSave, onSimilar }: Props) {
  return (
    <div className="look">
      <div className="look-band" style={{ background: gradientFromColors(look.palette) }}>
        <span className="lnum">0{index}</span>
        <span className="lname">{look.name}</span>
      </div>
      <div className="look-body">
        {look.items.map((it, i) => (
          <div className="item" key={`${it.name}-${i}`}>
            <svg className="gi">
              <use href={`#g-${it.icon}`} />
            </svg>
            <span className="inm">{it.name}</span>
            <span className="ic-col">
              <span className="d" style={{ background: it.color_hex || '#999' }} />
              <span className="cn">{it.color_name}</span>
            </span>
          </div>
        ))}

        <div className="why">
          <span className="eyebrow">Почему это работает</span>
          <p>{look.rationale}</p>
        </div>

        <div className="look-act">
          <button type="button" className={`gbtn${saved ? ' saved' : ''}`} onClick={onToggleSave}>
            <svg className="heart" viewBox="0 0 24 24">
              <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
            </svg>
            <span className="lbl">{saved ? 'Сохранено' : 'Сохранить'}</span>
          </button>
          <button type="button" className="gbtn" onClick={onSimilar}>
            Похожие
          </button>
        </div>
      </div>
    </div>
  )
}
