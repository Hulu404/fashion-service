import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { colorDictionaryForPrompt } from '../../../lib/colors'
import { parseAnalyzeResult } from '../../../lib/analyze'

// Uses Buffer + the Anthropic SDK — keep this on the Node.js runtime.
export const runtime = 'nodejs'

const BUCKET = 'wardrobe'
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB — mirrors the client-side guard
const SUPPORTED_MEDIA = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type MediaType = (typeof SUPPORTED_MEDIA)[number]

function mediaTypeFromPath(path: string): MediaType | null {
  const ext = path.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    default:
      return null
  }
}

const SYSTEM_PROMPT = `You are an analyst-stylist at SB-fashion. You receive one image: either a garment/accessory, or a selfie of a person.

Decide what is shown and return STRICTLY valid JSON — no markdown, no \`\`\`, no text before or after. Only the object:

{
  "type": "garment" | "person",
  "garment": { "category": "...", "color_name": "<from dictionary>", "color_hex": "#......", "material": "...", "style_tags": ["..."], "season": "..." },
  "person":  { "body_type": "...", "color_season": "...", "notes": "..." }
}

If it is an item — fill only the "garment" field (omit "person"). If it is a person/selfie — fill only "person".

Rules:
- "color_name" MUST be chosen from the dictionary (exact name), "color_hex" — the matching code from the dictionary. Dictionary: ${colorDictionaryForPrompt()}.
- Account for lighting and white balance: pick the closest tone from the dictionary, do not invent shades outside the list.
- "category" — e.g.: Coat, Jacket, Shirt, Trousers, Skirt, Dress, Shoes, Bag, Belt.
- "style_tags" — 1–3 short tags in English (e.g.: Minimal, Classic, Casual).
- "season" — one of: Mid-season, Summer, Winter, All-season.
- For a person: "body_type" (e.g.: Rectangle, Hourglass, Pear, Inverted triangle), "color_season" (Spring, Summer, Autumn, Winter), "notes" — a short note.
- All text values must be in English. Return JSON only.`

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Supabase is not configured on the server.' }, { status: 500 })
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' }, { status: 500 })
  }

  // --- Authenticate the caller via their access token ---
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  }

  // User-scoped client: RLS will only let this user read their own objects.
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: 'Session is invalid.' }, { status: 401 })
  }
  const userId = userData.user.id

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 })
  }

  const path: unknown = body?.path
  if (typeof path !== 'string' || !path) {
    return NextResponse.json({ error: 'No file path provided.' }, { status: 400 })
  }
  // Defence in depth: the path must live under the caller's own prefix.
  if (!path.startsWith(`${userId}/`)) {
    return NextResponse.json({ error: 'No access to this file.' }, { status: 403 })
  }

  // --- Pull the image from private storage ---
  const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(path)
  if (dlErr || !blob) {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 })
  }

  // Server-side size guard — don't trust the client's check.
  if (blob.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File is too large — upload an image up to 8 MB.' },
      { status: 413 }
    )
  }

  let mediaType: MediaType | null =
    SUPPORTED_MEDIA.includes(blob.type as MediaType) ? (blob.type as MediaType) : null
  if (!mediaType) mediaType = mediaTypeFromPath(path)
  if (!mediaType) {
    return NextResponse.json(
      { error: 'Unsupported image format.' },
      { status: 415 }
    )
  }

  const base64 = Buffer.from(await blob.arrayBuffer()).toString('base64')

  // --- Multimodal analysis via Claude ---
  const anthropic = new Anthropic({ apiKey })

  let rawText = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: 'Analyze the image and return strict JSON.' },
          ],
        },
      ],
    })
    rawText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Could not reach the model.', detail: err?.message },
      { status: 502 }
    )
  }

  const result = parseAnalyzeResult(rawText)
  if (!result) {
    return NextResponse.json(
      { error: 'The model returned an unreadable response.', raw: rawText },
      { status: 502 }
    )
  }

  return NextResponse.json(result)
}
