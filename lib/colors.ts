// Canonical colour dictionary for SB-fashion. The image-analysis model must pick
// colour names from this list so wardrobe items share a consistent palette.

export type ColorEntry = { name: string; hex: string }

export const COLORS: ColorEntry[] = [
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Cream', hex: '#EFE7D3' },
  { name: 'Espresso', hex: '#3B2A20' },
  { name: 'Cognac', hex: '#9A5B34' },
  { name: 'Mocha', hex: '#6F5240' },
  { name: 'Stone', hex: '#ABA197' },
  { name: 'White', hex: '#F4EFE3' },
  { name: 'Ink', hex: '#222831' },
  { name: 'Black', hex: '#1A1714' },
  { name: 'Bordeaux', hex: '#6E2A38' },
  { name: 'Powder', hex: '#D9BFB7' },
  { name: 'Olive', hex: '#73703F' },
  { name: 'Beige', hex: '#C9B79A' },
  { name: 'Graphite', hex: '#3A3A3C' },
  { name: 'Ecru', hex: '#E4DAC4' },
  { name: 'Onyx', hex: '#1B1A1C' },
  { name: 'Champagne', hex: '#C7B299' },
  { name: 'Pebble', hex: '#B7AE9E' },
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
