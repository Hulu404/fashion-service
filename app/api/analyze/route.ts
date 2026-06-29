import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { colorDictionaryForPrompt } from '../../../lib/colors'
import { parseAnalyzeResult } from '../../../lib/analyze'

// Uses Buffer + the Anthropic SDK — keep this on the Node.js runtime.
export const runtime = 'nodejs'

const BUCKET = 'wardrobe'
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

const SYSTEM_PROMPT = `Ты — стилист-аналитик ÉCLAT. Ты получаешь одно изображение: либо предмет одежды/аксессуар, либо селфи человека.

Определи, что на фото, и верни СТРОГО валидный JSON — без markdown, без \`\`\`, без какого-либо текста до или после. Только объект:

{
  "type": "garment" | "person",
  "garment": { "category": "...", "color_name": "<из словаря>", "color_hex": "#......", "material": "...", "style_tags": ["..."], "season": "..." },
  "person":  { "body_type": "...", "color_season": "...", "notes": "..." }
}

Если это вещь — заполни только поле "garment" (поле "person" опусти). Если это человек/селфи — заполни только "person".

Правила:
- "color_name" ОБЯЗАТЕЛЬНО выбирай из словаря (точное название), "color_hex" — соответствующий код из словаря. Словарь: ${colorDictionaryForPrompt()}.
- Учитывай освещение и баланс белого: выбирай ближайший по тону цвет из словаря, не угадывай оттенки вне списка.
- "category" — например: Пальто, Жакет, Рубашка, Брюки, Юбка, Платье, Обувь, Сумка, Ремень.
- "style_tags" — 1–3 коротких тега на русском (например: Минимализм, Классика, Casual).
- "season" — один из: Демисезон, Лето, Зима, Всесезон.
- Для человека: "body_type" (например: Прямоугольник, Песочные часы, Груша, Перевёрнутый треугольник), "color_season" (Весна, Лето, Осень, Зима), "notes" — короткая заметка.
- Все текстовые значения — на русском. Возвращай только JSON.`

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

  // --- Authenticate the caller via their access token ---
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Не авторизовано.' }, { status: 401 })
  }

  // User-scoped client: RLS will only let this user read their own objects.
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: 'Сессия недействительна.' }, { status: 401 })
  }
  const userId = userData.user.id

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Некорректное тело запроса.' }, { status: 400 })
  }

  const path: unknown = body?.path
  if (typeof path !== 'string' || !path) {
    return NextResponse.json({ error: 'Не передан путь к файлу.' }, { status: 400 })
  }
  // Defence in depth: the path must live under the caller's own prefix.
  if (!path.startsWith(`${userId}/`)) {
    return NextResponse.json({ error: 'Нет доступа к этому файлу.' }, { status: 403 })
  }

  // --- Pull the image from private storage ---
  const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(path)
  if (dlErr || !blob) {
    return NextResponse.json({ error: 'Файл не найден.' }, { status: 404 })
  }

  let mediaType: MediaType | null =
    SUPPORTED_MEDIA.includes(blob.type as MediaType) ? (blob.type as MediaType) : null
  if (!mediaType) mediaType = mediaTypeFromPath(path)
  if (!mediaType) {
    return NextResponse.json(
      { error: 'Неподдерживаемый формат изображения.' },
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
            { type: 'text', text: 'Проанализируй изображение и верни строго JSON.' },
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
      { error: 'Не удалось обратиться к модели.', detail: err?.message },
      { status: 502 }
    )
  }

  const result = parseAnalyzeResult(rawText)
  if (!result) {
    return NextResponse.json(
      { error: 'Модель вернула неразборчивый ответ.', raw: rawText },
      { status: 502 }
    )
  }

  return NextResponse.json(result)
}
