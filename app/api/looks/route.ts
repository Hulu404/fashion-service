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
  return `Ты — ведущий стилист ÉCLAT. По профилю клиента и его гардеробу ты собираешь образы.

Верни СТРОГО валидный JSON — без markdown, без \`\`\`, без текста до или после. Только массив РОВНО из 3 объектов-образов:

[
  {
    "name": "...",
    "vibe": "...",
    "occasion": "...",
    "palette": ["<имена цветов из словаря>"],
    "items": [
      { "category": "...", "name": "...", "color_name": "<из словаря>", "color_hex": "#......", "icon": "coat|jacket|top|shirt|pants|skirt|dress|shoe|bag|belt" }
    ],
    "rationale": "1–2 предложения, почему сочетание работает"
  }
]

Правила:
- РОВНО 3 образа. В каждом образе 4–6 предметов.
- "color_name" ОБЯЗАТЕЛЬНО выбирай из словаря (точное название), "color_hex" — соответствующий код из словаря. Словарь: ${colorDictionaryForPrompt()}.
- "icon" — строго одно из значений: ${LOOK_ICONS.join(', ')}. Подбирай иконку по категории предмета.
- "palette" — 2–3 имени цветов из словаря, задающие настроение образа (по ним строится градиент шапки).
- Учитывай палитру, посадку (силуэт) и бюджет из профиля; опирайся на вещи гардероба, дополняя недостающее базовыми предметами.
- "rationale" — осмысленно объясни, почему сочетание работает (цвет/силуэт/повод), 1–2 предложения.
- Все текстовые значения — на русском. Возвращай только JSON-массив.`
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

  lines.push('ПРОФИЛЬ КЛИЕНТА:')
  lines.push(`- Повод: ${occasion || profile?.occasion || 'не указан'}`)
  lines.push(`- Стили: ${(profile?.styles ?? []).join(', ') || 'не указаны'}`)
  lines.push(`- Палитра: ${profile?.palette || 'не указана'}`)
  lines.push(`- Посадка: ${profile?.fit || 'не указана'}`)
  lines.push(`- Бюджет: ${profile?.budget || 'не указан'}`)
  if (profile?.body_type) lines.push(`- Тип фигуры: ${profile.body_type}`)
  if (profile?.color_season) lines.push(`- Цветотип: ${profile.color_season}`)

  lines.push('')
  if (usingSeed) {
    lines.push('ГАРДЕРОБ ПУСТ — используй базовый сид-каталог как доступные вещи:')
    SEED_CATALOG.forEach((it) => lines.push(`- ${it.category}, цвет ${it.color_name}`))
  } else {
    lines.push('ГАРДЕРОБ КЛИЕНТА (опирайся на эти вещи, дополняя недостающее базовыми):')
    wardrobe.forEach((it) => {
      const parts = [it.category, it.color_name, it.material, it.season].filter(Boolean)
      const tags = Array.isArray(it.style_tags) && it.style_tags.length ? ` [${it.style_tags.join(', ')}]` : ''
      lines.push(`- ${parts.join(', ')}${tags}`)
    })
  }

  lines.push('')
  lines.push(
    `Собери 3 разных образа под повод и профиль. Вариант генерации №${variety} — предложи свежие сочетания. Верни строго JSON-массив.`
  )
  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Supabase не настроен на сервере.' }, { status: 500 })
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY не настроен на сервере.' }, { status: 500 })
  }

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Не авторизовано.' }, { status: 401 })
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: 'Сессия недействительна.' }, { status: 401 })
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
      { error: 'Не удалось обратиться к модели.', detail: err?.message },
      { status: 502 }
    )
  }

  const looks = parseLooks(rawText)
  if (!looks) {
    return NextResponse.json(
      { error: 'Модель вернула неразборчивый ответ.', raw: rawText },
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
