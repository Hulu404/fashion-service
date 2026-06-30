'use client'

import { useRef, useState } from 'react'
import { getSupabaseBrowser } from '../../lib/supabaseClient'
import { COLOR_NAMES, hexForColor } from '../../lib/colors'
import {
  EMPTY_GARMENT,
  EMPTY_PERSON,
  type AnalyzeResult,
  type GarmentAttributes,
  type PersonAttributes,
} from '../../lib/analyze'

type Phase = 'idle' | 'uploading' | 'analyzing' | 'confirm' | 'saving' | 'saved' | 'error'

type Props = {
  userId: string
  /** Called after a successful save so the parent can mark a photo as present. */
  onSaved?: (kind: 'garment' | 'person') => void
}

const MAX_BYTES = 8 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export default function PhotoZone({ userId, onSaved }: Props) {
  const supabase = getSupabaseBrowser()
  const inputRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<'garment' | 'person'>('garment')
  const [garment, setGarment] = useState<GarmentAttributes>(EMPTY_GARMENT)
  const [person, setPerson] = useState<PersonAttributes>(EMPTY_PERSON)
  const [imagePath, setImagePath] = useState<string | null>(null)

  function reset() {
    setPhase('idle')
    setError(null)
    setGarment(EMPTY_GARMENT)
    setPerson(EMPTY_PERSON)
    setImagePath(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleFile(file: File) {
    setError(null)
    if (!ACCEPTED.includes(file.type)) {
      setError('JPG, PNG, WEBP or GIF are supported.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('File is too large — up to 8 MB.')
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${userId}/${crypto.randomUUID()}.${ext}`

    setPhase('uploading')
    const { error: upErr } = await supabase.storage
      .from('wardrobe')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (upErr) {
      setError('Could not upload the photo. Please try again.')
      setPhase('error')
      return
    }
    setImagePath(path)

    setPhase('analyzing')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('no session')

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ path }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Could not analyze the photo.')
        setPhase('error')
        return
      }

      const result = data as AnalyzeResult
      setKind(result.type)
      if (result.type === 'garment') {
        setGarment({ ...EMPTY_GARMENT, ...(result.garment ?? {}) })
      } else {
        setPerson({ ...EMPTY_PERSON, ...(result.person ?? {}) })
      }
      setPhase('confirm')
    } catch {
      setError('Image analysis failed. Check your connection.')
      setPhase('error')
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
  }

  async function saveGarment() {
    setPhase('saving')
    setError(null)
    const { error: insErr } = await supabase.from('wardrobe_items').insert({
      user_id: userId,
      source: 'photo',
      image_path: imagePath,
      category: garment.category || null,
      color_name: garment.color_name || null,
      color_hex: garment.color_hex || null,
      material: garment.material || null,
      style_tags: garment.style_tags,
      season: garment.season || null,
    })
    if (insErr) {
      setError('Could not save the item to the wardrobe.')
      setPhase('confirm')
      return
    }
    setPhase('saved')
    onSaved?.('garment')
  }

  async function savePerson() {
    setPhase('saving')
    setError(null)
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ body_type: person.body_type || null, color_season: person.color_season || null })
      .eq('id', userId)
    if (updErr) {
      setError('Could not save profile data.')
      setPhase('confirm')
      return
    }
    setPhase('saved')
    onSaved?.('person')
  }

  // ---------- Render ----------

  if (phase === 'confirm' || phase === 'saving') {
    const busy = phase === 'saving'
    return (
      <div className="rounded-xl border border-[color:var(--hair)] bg-porcelain-2 p-4">
        <p className="eyebrow mb-1">Check the recognised details</p>
        <p className="text-xs text-stone font-light mb-4">
          The AI may have erred due to lighting — adjust the values before saving.
        </p>

        {kind === 'garment' ? (
          <div className="space-y-3">
            <Labeled label="Category">
              <input
                className="field-input"
                value={garment.category}
                onChange={(e) => setGarment({ ...garment, category: e.target.value })}
              />
            </Labeled>
            <Labeled label="Color">
              <select
                className="field-input"
                value={COLOR_NAMES.includes(garment.color_name) ? garment.color_name : ''}
                onChange={(e) => {
                  const name = e.target.value
                  setGarment({ ...garment, color_name: name, color_hex: hexForColor(name) || garment.color_hex })
                }}
              >
                <option value="">— select —</option>
                {COLOR_NAMES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {garment.color_hex && (
                <span
                  className="inline-block w-4 h-4 rounded-full border border-[color:var(--hair)] align-middle ml-2"
                  style={{ background: garment.color_hex }}
                  aria-hidden="true"
                />
              )}
            </Labeled>
            <Labeled label="Material">
              <input
                className="field-input"
                value={garment.material}
                onChange={(e) => setGarment({ ...garment, material: e.target.value })}
              />
            </Labeled>
            <Labeled label="Style tags (comma-separated)">
              <input
                className="field-input"
                value={garment.style_tags.join(', ')}
                onChange={(e) =>
                  setGarment({
                    ...garment,
                    style_tags: e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Labeled>
            <Labeled label="Season">
              <input
                className="field-input"
                value={garment.season}
                onChange={(e) => setGarment({ ...garment, season: e.target.value })}
              />
            </Labeled>
          </div>
        ) : (
          <div className="space-y-3">
            <Labeled label="Body type">
              <input
                className="field-input"
                value={person.body_type}
                onChange={(e) => setPerson({ ...person, body_type: e.target.value })}
              />
            </Labeled>
            <Labeled label="Color season">
              <input
                className="field-input"
                value={person.color_season}
                onChange={(e) => setPerson({ ...person, color_season: e.target.value })}
              />
            </Labeled>
            <Labeled label="Note">
              <input
                className="field-input"
                value={person.notes}
                onChange={(e) => setPerson({ ...person, notes: e.target.value })}
              />
            </Labeled>
          </div>
        )}

        {error && <p className="text-sm text-oxblood font-light mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={kind === 'garment' ? saveGarment : savePerson}
          >
            {busy ? 'Saving…' : kind === 'garment' ? 'Save to wardrobe' : 'Save to profile'}
          </button>
          <button
            type="button"
            className="text-sm text-ink border-b border-mocha pb-0.5 hover:text-oxblood hover:border-oxblood"
            disabled={busy}
            onClick={reset}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'saved') {
    return (
      <div className="rounded-xl border border-oxblood bg-[rgba(196,59,114,0.06)] p-5 text-center">
        <p className="text-oxblood font-medium text-sm">
          {kind === 'garment' ? 'Item added to your wardrobe.' : 'Details saved to your profile.'}
        </p>
        <button
          type="button"
          className="mt-3 text-sm text-ink border-b border-mocha pb-0.5 hover:text-oxblood hover:border-oxblood"
          onClick={reset}
        >
          Add another photo
        </button>
      </div>
    )
  }

  const busyDrop = phase === 'uploading' || phase === 'analyzing'
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={onPick}
      />
      <button
        type="button"
        className="drop"
        onClick={() => inputRef.current?.click()}
        disabled={busyDrop}
        aria-busy={busyDrop}
      >
        <div className="text-mocha mb-2 flex justify-center">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M4 16l4-5 3 3 4-5 5 7" />
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="9" cy="9" r="1.4" />
          </svg>
        </div>
        <div className="t">
          {phase === 'uploading'
            ? 'Uploading photo…'
            : phase === 'analyzing'
              ? 'AI is recognising the image…'
              : 'Add a photo of yourself or an item'}
        </div>
        <div className="s">
          {busyDrop ? 'This takes a few seconds' : 'AI detects body shape, colour and category'}
        </div>
      </button>
      {error && <p className="text-sm text-oxblood font-light mt-2">{error}</p>}
    </>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}
