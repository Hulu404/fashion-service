'use client'

import { useState } from 'react'
import TrendCard from './TrendCard'
import ColorStory from './ColorStory'
import Overlay from './overlays/Overlay'

type Trend = {
  id: string
  number: number
  eyebrow: string
  title: string
  description: string
  lead: string
  color_story: { name: string; hex: string }[]
}

export default function TrendsSection({ trends }: { trends: Trend[] }) {
  const [active, setActive] = useState<Trend | null>(null)

  return (
    <>
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {trends.map((t) => (
          <button
            key={t.id}
            type="button"
            className="trend-trigger"
            onClick={() => setActive(t)}
            aria-label={`Открыть: ${t.title}`}
          >
            <TrendCard trend={t} />
          </button>
        ))}
      </div>

      <Overlay
        open={active !== null}
        onClose={() => setActive(null)}
        variant="dialog"
        eyebrow={active?.eyebrow}
        title={active?.title}
        ariaLabel={active ? `История тренда: ${active.title}` : 'История тренда'}
      >
        {active && (
          <>
            <p className="story-lead">{active.lead}</p>
            {active.color_story?.length > 0 && (
              <div className="story-sw">
                <ColorStory story={active.color_story} />
              </div>
            )}
          </>
        )}
      </Overlay>
    </>
  )
}
