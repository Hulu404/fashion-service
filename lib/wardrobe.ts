// Shared options + types for the "Гардероб" (wardrobe) screen.
// Categories/seasons mirror the vocabulary the analysis model is asked to use
// in app/api/analyze/route.ts so photo-recognised and manual items align.

export const CATEGORIES = [
  'Пальто',
  'Жакет',
  'Рубашка',
  'Футболка',
  'Свитер',
  'Платье',
  'Юбка',
  'Брюки',
  'Джинсы',
  'Обувь',
  'Сумка',
  'Аксессуар',
  'Ремень',
] as const

export const SEASONS = ['Демисезон', 'Лето', 'Зима', 'Всесезон'] as const

export type WardrobeItem = {
  id: string
  user_id: string
  source: string
  image_path: string | null
  category: string | null
  color_name: string | null
  color_hex: string | null
  material: string | null
  style_tags: string[]
  season: string | null
  created_at: string
}

/** The editable subset of a wardrobe item (everything the user can change). */
export type WardrobeDraft = {
  category: string
  color_name: string
  color_hex: string
  material: string
  style_tags: string[]
  season: string
}

export const EMPTY_DRAFT: WardrobeDraft = {
  category: '',
  color_name: '',
  color_hex: '',
  material: '',
  style_tags: [],
  season: '',
}

export function draftFromItem(item: WardrobeItem): WardrobeDraft {
  return {
    category: item.category ?? '',
    color_name: item.color_name ?? '',
    color_hex: item.color_hex ?? '',
    material: item.material ?? '',
    style_tags: item.style_tags ?? [],
    season: item.season ?? '',
  }
}
