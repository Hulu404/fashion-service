// Options for the "Подбор" (build) form. Names match the prototype build screen.

export const OCCASIONS = ['Работа', 'Свидание', 'Прогулка', 'Вечер', 'Спорт'] as const

export const STYLES = ['Минимализм', 'Классика', 'Streetwear', 'Романтика', 'Casual'] as const
export const MAX_STYLES = 2

export type Palette = { id: string; name: string; shades: string[] }

// Each palette is a card-strip showing its characteristic shades.
export const PALETTES: Palette[] = [
  { id: 'neutral', name: 'Нейтральная', shades: ['#C9B79A', '#ABA197', '#EFE7D3'] },
  { id: 'warm', name: 'Тёплая', shades: ['#C19A6B', '#6F5240', '#9A5B34'] },
  { id: 'deep', name: 'Глубокая', shades: ['#3B2A20', '#222831', '#6E2A38'] },
  { id: 'pastel', name: 'Пастель', shades: ['#D9BFB7', '#C7B299', '#EFE7D3'] },
]

export const FITS = ['Прямой', 'Приталенный', 'Свободный'] as const

export const BUDGETS = ['До 5 000 ₽', '5–15 000 ₽', 'Без ограничений'] as const

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
