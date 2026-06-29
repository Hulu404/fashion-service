import ColorStory from './ColorStory'

export default function TrendCard({ trend }: { trend: any }){
  const colors = trend.color_story || []
  return (
    <article className="bg-white rounded-e p-4 shadow-sm w-full h-full flex flex-col">
      <div className="flex justify-between items-start gap-3">
        <div>
          <div className="text-xs text-stone">{trend.eyebrow}</div>
          <h4 className="mt-1 font-[var(--font-bodoni)] text-lg">{trend.title}</h4>
          <p className="text-sm text-ink-soft mt-1">{trend.description}</p>
        </div>
        <div className="text-3xl font-[var(--font-bodoni)] text-mocha shrink-0">{trend.number}</div>
      </div>
      <div className="mt-auto pt-4">
        <ColorStory story={colors} />
      </div>
    </article>
  )
}
