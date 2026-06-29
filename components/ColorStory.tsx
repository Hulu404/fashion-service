export default function ColorStory({ story }:{story:{name:string,hex:string}[]}){
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-2">
      {story.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div style={{background: s.hex}} className="w-8 h-8 rounded" />
          <div className="text-xs text-stone">{s.name}</div>
        </div>
      ))}
    </div>
  )
}
