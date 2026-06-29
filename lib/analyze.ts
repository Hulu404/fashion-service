// Shared types for the photo-analysis flow (client + server).

export type GarmentAttributes = {
  category: string
  color_name: string
  color_hex: string
  material: string
  style_tags: string[]
  season: string
}

export type PersonAttributes = {
  body_type: string
  color_season: string
  notes: string
}

export type AnalyzeResult = {
  type: 'garment' | 'person'
  garment?: GarmentAttributes
  person?: PersonAttributes
}

export const EMPTY_GARMENT: GarmentAttributes = {
  category: '',
  color_name: '',
  color_hex: '',
  material: '',
  style_tags: [],
  season: '',
}

export const EMPTY_PERSON: PersonAttributes = {
  body_type: '',
  color_season: '',
  notes: '',
}

/**
 * Safely turn a raw model response into an AnalyzeResult.
 * Strips ```json fences / stray prose and normalises field shapes — the model
 * is asked for bare JSON, but lighting and phrasing make this best-effort.
 */
export function parseAnalyzeResult(raw: string): AnalyzeResult | null {
  if (!raw) return null

  // Drop Markdown code fences if the model added them despite instructions.
  let text = raw.trim()
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()

  // Fall back to the first {...} block if there is leading/trailing prose.
  if (!text.startsWith('{')) {
    const brace = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (brace !== -1 && end !== -1 && end > brace) {
      text = text.slice(brace, end + 1)
    }
  }

  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }

  if (data?.type !== 'garment' && data?.type !== 'person') return null

  if (data.type === 'garment') {
    const g = data.garment ?? {}
    return {
      type: 'garment',
      garment: {
        category: String(g.category ?? ''),
        color_name: String(g.color_name ?? ''),
        color_hex: String(g.color_hex ?? ''),
        material: String(g.material ?? ''),
        style_tags: Array.isArray(g.style_tags) ? g.style_tags.map((t: unknown) => String(t)) : [],
        season: String(g.season ?? ''),
      },
    }
  }

  const p = data.person ?? {}
  return {
    type: 'person',
    person: {
      body_type: String(p.body_type ?? ''),
      color_season: String(p.color_season ?? ''),
      notes: String(p.notes ?? ''),
    },
  }
}
