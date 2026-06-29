// Shared types + helpers for outfit generation (client + server).

import { COLORS, hexForColor } from './colors'

// Icon glyphs available in the prototype (see components/podbor/LookGlyphs.tsx).
export const LOOK_ICONS = [
  'coat',
  'jacket',
  'top',
  'shirt',
  'pants',
  'skirt',
  'dress',
  'shoe',
  'bag',
  'belt',
] as const

export type LookIcon = (typeof LOOK_ICONS)[number]

export type LookItem = {
  category: string
  name: string
  color_name: string
  color_hex: string
  icon: LookIcon
}

export type Look = {
  name: string
  vibe: string
  occasion: string
  palette: string[]
  items: LookItem[]
  rationale: string
}

/**
 * Seed catalogue of basic garments, used when the user's wardrobe is empty so
 * the model still has concrete pieces (and dictionary colours) to combine.
 */
export const SEED_CATALOG: { category: string; color_name: string }[] = [
  { category: 'Пальто', color_name: 'Кэмел' },
  { category: 'Жакет', color_name: 'Графит' },
  { category: 'Рубашка', color_name: 'Белый' },
  { category: 'Свитер', color_name: 'Крем' },
  { category: 'Брюки', color_name: 'Эспрессо' },
  { category: 'Джинсы', color_name: 'Чернила' },
  { category: 'Юбка', color_name: 'Олива' },
  { category: 'Платье', color_name: 'Бордо' },
  { category: 'Обувь', color_name: 'Коньяк' },
  { category: 'Сумка', color_name: 'Мокко' },
  { category: 'Ремень', color_name: 'Чёрный' },
]

/** Maps a free-form category to one of the prototype's icon glyphs. */
export function iconForCategory(category: string): LookIcon {
  const c = (category || '').toLowerCase()
  if (/пальт|шуб|плащ/.test(c)) return 'coat'
  if (/жакет|пиджак|блейзер|трен|куртк|кардиган/.test(c)) return 'jacket'
  if (/рубашк|блуз/.test(c)) return 'shirt'
  if (/брюк|джинс|штан|карго|легинс/.test(c)) return 'pants'
  if (/юбк/.test(c)) return 'skirt'
  if (/плать|сарафан/.test(c)) return 'dress'
  if (/обув|туфл|ботин|кроссов|кед|лофер|балетк|сапог|сандал/.test(c)) return 'shoe'
  if (/сумк|клатч|рюкзак|тоут/.test(c)) return 'bag'
  if (/рем(е|ё)н|пояс/.test(c)) return 'belt'
  if (/свитер|водолазк|джемпер|худи|топ|футболк|майк|лонгслив/.test(c)) return 'top'
  return 'top'
}

/**
 * Stable content key for a look, used to dedupe saved_looks and to toggle the
 * save state. Two identical looks (same name + items) map to the same key.
 */
export function lookKey(look: Look): string {
  const items = look.items
    .map((i) => `${i.category}:${i.name}:${i.color_name}`)
    .join('|')
  return `${look.name}#${items}`
}

/** CSS gradient for a look band, built from dictionary colour names. */
export function gradientFromColors(names: string[]): string {
  const hexes = (names.length ? names : ['Стон'])
    .map((n) => hexForColor(n) ?? '#999')
  const first = hexes[0]
  const mid = hexes[Math.min(1, hexes.length - 1)]
  const last = hexes[hexes.length - 1]
  return `linear-gradient(120deg, ${first}, ${mid} 55%, ${last})`
}

const COLOR_NAME_SET = new Set(COLORS.map((c) => c.name))

function coerceIcon(value: unknown, category: string): LookIcon {
  if (typeof value === 'string' && (LOOK_ICONS as readonly string[]).includes(value)) {
    return value as LookIcon
  }
  return iconForCategory(category)
}

function coerceItem(raw: any): LookItem {
  const category = String(raw?.category ?? '')
  const colorName = String(raw?.color_name ?? '')
  // Trust dictionary hex when the name is known; fall back to model's hex.
  const dictHex = COLOR_NAME_SET.has(colorName) ? hexForColor(colorName) : undefined
  return {
    category,
    name: String(raw?.name ?? category ?? ''),
    color_name: colorName,
    color_hex: dictHex ?? String(raw?.color_hex ?? '#999'),
    icon: coerceIcon(raw?.icon, category),
  }
}

function coerceLook(raw: any): Look | null {
  if (!raw || typeof raw !== 'object') return null
  const items = Array.isArray(raw.items) ? raw.items.map(coerceItem) : []
  if (items.length === 0) return null
  return {
    name: String(raw.name ?? 'Образ'),
    vibe: String(raw.vibe ?? ''),
    occasion: String(raw.occasion ?? ''),
    palette: Array.isArray(raw.palette) ? raw.palette.map((p: unknown) => String(p)) : [],
    items,
    rationale: String(raw.rationale ?? ''),
  }
}

/**
 * Safely turn a raw model response into an array of looks.
 * Strips ```json fences / stray prose and normalises each look — the model is
 * asked for a bare JSON array but we never trust that blindly.
 */
export function parseLooks(raw: string): Look[] | null {
  if (!raw) return null

  let text = raw.trim()
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()

  // Fall back to the first [...] block if there is leading/trailing prose.
  if (!text.startsWith('[')) {
    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    if (start !== -1 && end !== -1 && end > start) {
      text = text.slice(start, end + 1)
    }
  }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }

  if (!Array.isArray(data)) return null
  const looks = data.map(coerceLook).filter((l): l is Look => l !== null)
  return looks.length > 0 ? looks : null
}
