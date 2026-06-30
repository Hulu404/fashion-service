// Options for the build form. Names match the prototype build screen.

export const OCCASIONS = ['Work', 'Date', 'Day out', 'Evening', 'Sport'] as const

export const STYLES = ['Minimal', 'Classic', 'Streetwear', 'Romantic', 'Casual'] as const
export const MAX_STYLES = 2

export type Palette = { id: string; name: string; shades: string[] }

// Each palette is a card-strip showing its characteristic shades.
export const PALETTES: Palette[] = [
  { id: 'neutral', name: 'Neutral', shades: ['#C9B79A', '#ABA197', '#EFE7D3'] },
  { id: 'warm', name: 'Warm', shades: ['#C19A6B', '#6F5240', '#9A5B34'] },
  { id: 'deep', name: 'Deep', shades: ['#3B2A20', '#222831', '#6E2A38'] },
  { id: 'pastel', name: 'Pastel', shades: ['#D9BFB7', '#C7B299', '#EFE7D3'] },
]

export const FITS = ['Straight', 'Fitted', 'Relaxed'] as const

export const BUDGETS = ['Under $100', '$100–300', 'No limit'] as const

export type BuildParams = {
  occasion: string | null
  styles: string[]
  palette: string | null
  fit: string | null
  budget: string | null
  has_photo: boolean
}

export const EMPTY_PARAMS: BuildParams = {
  occasion: null,
  styles: [],
  palette: null,
  fit: null,
  budget: null,
  has_photo: false,
}
