import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { colorDictionaryForPrompt } from '../../../lib/colors'
import { LOOK_ICONS, SEED_CATALOG, parseLooks } from '../../../lib/looks'

// Uses the Anthropic SDK — keep this on the Node.js runtime.
export const runtime = 'nodejs'

const PROFILE_COLUMNS = 'occasion, styles, palette, fit, budget, body_type, color_season'
const WARDROBE_COLUMNS = 'category, color_name, material, style_tags, season'

function buildSystemPrompt(): string {
  return `You are the lead stylist at SB-fashion. From the client's profile and their wardrobe you assemble outfits.

Return STRICTLY valid JSON — no markdown, no \`\`\`, no text before or after. Only an array of EXACTLY 3 outfit objects:

[
  {
    "name": "...",
    "vibe": "...",
    "occasion": "...",
    "palette": ["<colour names from the dictionary>"],
    "items": [
      { "category": "...", "name": "...", "color_name": "<from dictionary>", "color_hex": "#......", "icon": "coat|jacket|top|shirt|pants|skirt|dress|shoe|bag|belt" }
    ],
    "rationale": "1–2 sentences on why the combination works"
  }
]

Rules:
- EXACTLY 3 outfits. Each outfit has 4–6 items.
- "color_name" MUST be chosen from the dictionary (exact name), "color_hex" — the matching code from the dictionary. Dictionary: ${colorDictionaryForPrompt()}.
- "icon" — strictly one of: ${LOOK_ICONS.join(', ')}. Pick the icon by the item's category.
- "palette" — 2–3 colour names from the dictionary that set the outfit's mood (the header gradient is built from them).
- Account for the palette, fit (silhouette) and budget from the profile; build on the wardrobe items, filling gaps with basic pieces.
- "rationale" — meaningfully explain why the combination works (colour/silhouette/occasion), 1–2 sentences.
- All text values must be in English. Return the JSON array only.`
}

function buildUserPrompt(opts: {
  profile: any
  occasion: string | null
  wardrobe: any[]
  usingSeed: boolean
  variety: number
}): string {
  const { profile, occasion, wardrobe, usingSeed, variety } = opts
  const lines: string[] = []

  lines.push('CLIENT PROFILE:')
  lines.push(`- Occasion: ${occasion || profile?.occasion || 'not specified'}`)
  lines.push(`- Styles: ${(profile?.styles ?? []).join(', ') || 'not specified'}`)
  lines.push(`- Palette: ${profile?.palette || 'not specified'}`)
  lines.push(`- Fit: ${profile?.fit || 'not specified'}`)
  lines.push(`- Budget: ${profile?.budget || 'not specified'}`)
  if (profile?.body_type) lines.push(`- Body type: ${profile.body_type}`)
  if (profile?.color_season) lines.push(`- Colour season: ${profile.color_season}`)

  lines.push('')
  if (usingSeed) {
    lines.push('WARDROBE IS EMPTY — use the basic seed catalogue as the available items:')
    SEED_CATALOG.forEach((it) => lines.push(`- ${it.category}, colour ${it.color_name}`))
  } else {
    lines.push("CLIENT'S WARDROBE (build on these items, filling gaps with basics):")
    wardrobe.forEach((it) => {
      const parts = [it.category, it.color_name, it.material, it.season].filter(Boolean)
      const tags = Array.isArray(it.style_tags) && it.style_tags.length ? ` [${it.style_tags.join(', ')}]` : ''
      lines.push(`- ${parts.join(', ')}${tags}`)
    })
  }

  lines.push('')
  lines.push(
    `Assemble 3 different outfits for the occasion and profile. Generation variant #${variety} — propose fresh combinations. Return a strict JSON array.`
  )
  return lines.join('\n')
}

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

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: 'Session is invalid.' }, { status: 401 })
  }
  const userId = userData.user.id

  let body: any = {}
  try {
    body = (await req.json()) ?? {}
  } catch {
    body = {}
  }
  const occasion: string | null = typeof body?.occasion === 'string' ? body.occasion : null
  const variety = Number.isFinite(body?.variety) ? Number(body.variety) : 1

  // --- Load profile + wardrobe under the caller's RLS scope ---
  const { data: profile } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle()

  const { data: wardrobeRows } = await supabase
    .from('wardrobe_items')
    .select(WARDROBE_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const wardrobe = wardrobeRows ?? []
  const usingSeed = wardrobe.length === 0

  // --- Generate via Claude ---
  const anthropic = new Anthropic({ apiKey })

  let rawText = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      temperature: 1,
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: buildUserPrompt({ profile, occasion, wardrobe, usingSeed, variety }),
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

  const looks = parseLooks(rawText)
  if (!looks) {
    return NextResponse.json(
      { error: 'The model returned an unreadable response.', raw: rawText },
      { status: 502 }
    )
  }

  // Keep exactly 3 for the results screen.
  const trimmed = looks.slice(0, 3)

  // --- Persist the generation (best-effort; don't fail the response on error) ---
  await supabase.from('looks').insert({
    user_id: userId,
    occasion: occasion || profile?.occasion || null,
    params: profile ?? null,
    looks: trimmed,
  })

  return NextResponse.json({ looks: trimmed, usingSeed })
}
