'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSupabaseBrowser } from '../../lib/supabaseClient'
import {
  CATEGORIES,
  SEASONS,
  draftFromItem,
  type WardrobeItem,
  type WardrobeDraft,
} from '../../lib/wardrobe'
import ItemCard from './ItemCard'
import ItemEditor from './ItemEditor'

const BUCKET = 'wardrobe'
const SELECT_COLUMNS =
  'id, user_id, source, image_path, category, color_name, color_hex, material, style_tags, season, created_at'

type Props = { userId: string }
type Editing =
  | { mode: 'add' }
  | { mode: 'edit'; item: WardrobeItem }
  | null

export default function WardrobeScreen({ userId }: Props) {
  const supabase = getSupabaseBrowser()

  const [items, setItems] = useState<WardrobeItem[]>([])
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [seasonFilter, setSeasonFilter] = useState<string | null>(null)

  const [editing, setEditing] = useState<Editing>(null)
  const [saving, setSaving] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)

  // --- Load items + signed thumbnail URLs for photo-backed items ---
  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select(SELECT_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      setLoadError('Не удалось загрузить гардероб.')
      setLoading(false)
      return
    }

    const rows = (data ?? []) as WardrobeItem[]
    setItems(rows)
    setLoading(false)

    const paths = rows.map((r) => r.image_path).filter((p): p is string => !!p)
    if (paths.length === 0) {
      setThumbs({})
      return
    }
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60)
    if (signed) {
      const map: Record<string, string> = {}
      signed.forEach((s) => {
        if (s.path && s.signedUrl) map[s.path] = s.signedUrl
      })
      setThumbs(map)
    }
  }, [supabase, userId])

  useEffect(() => {
    void load()
  }, [load])

  // --- Filtering ---
  const filtered = useMemo(
    () =>
      items.filter(
        (it) =>
          (!categoryFilter || it.category === categoryFilter) &&
          (!seasonFilter || it.season === seasonFilter)
      ),
    [items, categoryFilter, seasonFilter]
  )

  // Only offer filter chips for values actually present in the wardrobe.
  const usedCategories = useMemo(
    () => CATEGORIES.filter((c) => items.some((it) => it.category === c)),
    [items]
  )
  const usedSeasons = useMemo(
    () => SEASONS.filter((s) => items.some((it) => it.season === s)),
    [items]
  )

  // --- CRUD ---
  async function saveDraft(draft: WardrobeDraft) {
    setSaving(true)
    setEditorError(null)

    const fields = {
      category: draft.category || null,
      color_name: draft.color_name || null,
      color_hex: draft.color_hex || null,
      material: draft.material || null,
      style_tags: draft.style_tags,
      season: draft.season || null,
    }

    if (editing?.mode === 'edit') {
      const { error } = await supabase
        .from('wardrobe_items')
        .update(fields)
        .eq('id', editing.item.id)
      if (error) {
        setEditorError('Не удалось сохранить изменения.')
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('wardrobe_items')
        .insert({ user_id: userId, source: 'manual', image_path: null, ...fields })
      if (error) {
        setEditorError('Не удалось добавить вещь.')
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setEditing(null)
    await load()
  }

  async function deleteItem(item: WardrobeItem) {
    if (typeof window !== 'undefined' && !window.confirm('Удалить вещь из гардероба?')) return
    // Optimistic removal; reload on failure to resync.
    setItems((prev) => prev.filter((it) => it.id !== item.id))
    const { error } = await supabase.from('wardrobe_items').delete().eq('id', item.id)
    if (error) {
      await load()
      return
    }
    // Best-effort cleanup of the private object.
    if (item.image_path) {
      await supabase.storage.from(BUCKET).remove([item.image_path])
    }
  }

  // ---------- Render ----------
  return (
    <div className="pb-12">
      {/* Topbar */}
      <div className="flex items-center gap-3.5 px-5 pt-6 pb-2 sticky top-0 bg-oat z-10">
        <a
          href="/podbor"
          aria-label="Назад"
          className="w-9 h-9 rounded-full border border-[color:var(--hair)] bg-porcelain-2 grid place-items-center text-ink hover:bg-porcelain lg:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </a>
        <h1 className="font-display text-2xl text-ink">Гардероб</h1>
        <button
          type="button"
          className="ml-auto text-[11px] tracking-[0.08em] uppercase text-mocha hover:text-oxblood"
          onClick={() => {
            setEditorError(null)
            setEditing({ mode: 'add' })
          }}
        >
          + Вручную
        </button>
      </div>

      {/* Filters — only shown once there is something to filter */}
      {!loading && items.length > 0 && (
        <div className="px-[var(--gut)] pt-3 space-y-3">
          {usedCategories.length > 0 && (
            <div className="chips">
              <button
                type="button"
                className="chip"
                aria-pressed={categoryFilter === null}
                onClick={() => setCategoryFilter(null)}
              >
                Все
              </button>
              {usedCategories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="chip"
                  aria-pressed={categoryFilter === c}
                  onClick={() => setCategoryFilter(categoryFilter === c ? null : c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          {usedSeasons.length > 0 && (
            <div className="chips">
              {usedSeasons.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="chip"
                  aria-pressed={seasonFilter === s}
                  onClick={() => setSeasonFilter(seasonFilter === s ? null : s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="px-[var(--gut)] pt-5">
        {loading ? (
          <p className="eyebrow">Загрузка…</p>
        ) : loadError ? (
          <div className="text-center py-10">
            <p className="text-sm text-oxblood font-light">{loadError}</p>
            <button type="button" className="btn mt-4" onClick={() => void load()}>
              Повторить
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-ink-soft font-light">По выбранным фильтрам ничего нет.</p>
            <button
              type="button"
              className="mt-3 text-sm text-ink border-b border-mocha pb-0.5 hover:text-oxblood hover:border-oxblood"
              onClick={() => {
                setCategoryFilter(null)
                setSeasonFilter(null)
              }}
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                thumbUrl={item.image_path ? thumbs[item.image_path] : undefined}
                onEdit={(it) => {
                  setEditorError(null)
                  setEditing({ mode: 'edit', item: it })
                }}
                onDelete={deleteItem}
              />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <ItemEditor
          title={editing.mode === 'edit' ? 'Изменить вещь' : 'Добавить вещь'}
          initial={editing.mode === 'edit' ? draftFromItem(editing.item) : undefined}
          busy={saving}
          error={editorError}
          onCancel={() => setEditing(null)}
          onSave={saveDraft}
        />
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mt-4 rounded-2xl border border-[color:var(--hair-soft)] bg-porcelain-2 p-8 text-center">
      <div className="text-mocha flex justify-center mb-4" aria-hidden="true">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M4 16l4-5 3 3 4-5 5 7" />
          <circle cx="9" cy="9" r="1.4" />
        </svg>
      </div>
      <h2 className="font-display text-xl text-ink">Гардероб пока пуст</h2>
      <p className="mt-3 text-sm text-ink-soft font-light leading-relaxed max-w-[32ch] mx-auto">
        Сфотографируйте вещь — ИИ распознает категорию, цвет и материал, а вы подтвердите. Так образы
        будут точнее.
      </p>
      <a href="/podbor" className="btn mt-6 inline-block">
        Добавить первую вещь по фото
      </a>
    </div>
  )
}
