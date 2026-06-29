import ColorStory from './ColorStory'

export default function TrendCard({ trend }: { trend: any }){
  const colors = trend.color_story || []
  return (
    <article className="bg-white rounded-e p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs text-stone">{trend.eyebrow}</div>
          <h4 className="mt-1 font-[var(--font-bodoni)] text-lg">{trend.title}</h4>
          <p className="text-sm text-ink-soft mt-1">{trend.description}</p>
        </div>
        <div className="text-3xl font-[var(--font-bodoni)] text-mocha">{trend.number}</div>
      </div>
      <div className="mt-3">
        <ColorStory story={colors} />
      </div>
    </article>
  )
}
