// Canonical colour dictionary for ÉCLAT. The image-analysis model must pick
// colour names from this list so wardrobe items share a consistent palette.

export type ColorEntry = { name: string; hex: string }

export const COLORS: ColorEntry[] = [
  { name: 'Кэмел', hex: '#C19A6B' },
  { name: 'Крем', hex: '#EFE7D3' },
  { name: 'Эспрессо', hex: '#3B2A20' },
  { name: 'Коньяк', hex: '#9A5B34' },
  { name: 'Мокко', hex: '#6F5240' },
  { name: 'Стон', hex: '#ABA197' },
  { name: 'Белый', hex: '#F4EFE3' },
  { name: 'Чернила', hex: '#222831' },
  { name: 'Чёрный', hex: '#1A1714' },
  { name: 'Бордо', hex: '#6E2A38' },
  { name: 'Пудра', hex: '#D9BFB7' },
  { name: 'Олива', hex: '#73703F' },
  { name: 'Беж', hex: '#C9B79A' },
  { name: 'Графит', hex: '#3A3A3C' },
  { name: 'Экрю', hex: '#E4DAC4' },
  { name: 'Оникс', hex: '#1B1A1C' },
  { name: 'Шампань', hex: '#C7B299' },
  { name: 'Камень', hex: '#B7AE9E' },
]

export const COLOR_NAMES: string[] = COLORS.map((c) => c.name)

export function hexForColor(name: string | null | undefined): string | undefined {
  if (!name) return undefined
  return COLORS.find((c) => c.name === name)?.hex
}

/** Comma-separated "Name (#HEX)" list, embedded in the analysis system prompt. */
export function colorDictionaryForPrompt(): string {
  return COLORS.map((c) => `${c.name} (${c.hex})`).join(', ')
}
