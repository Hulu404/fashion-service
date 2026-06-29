import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { colorDictionaryForPrompt } from '../../../lib/colors'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `Ты — Анна, персональный стилист ÉCLAT. Помогаешь собрать образ или подсказываешь, с чем носить вещь.

Правила:
- Отвечай тепло, по делу и кратко (2–4 предложения), без воды и без markdown-заголовков.
- Когда называешь цвета, опирайся на палитру ÉCLAT: ${colorDictionaryForPrompt()}.
- Давай конкретные сочетания (верх/низ/обувь/деталь) и короткое «почему».
- Пиши на русском.`

type ChatMessage = { role: 'user' | 'assistant'; content: string }

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
    return NextResponse.json({ error: 'Войдите, чтобы спросить стилиста.' }, { status: 401 })
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: 'Сессия недействительна.' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Некорректное тело запроса.' }, { status: 400 })
  }

  const incoming: unknown = body?.messages
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json({ error: 'Пустой запрос.' }, { status: 400 })
  }

  // Normalise + keep the last ~12 turns to bound the prompt.
  const messages: ChatMessage[] = incoming
    .filter(
      (m: any) =>
        m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )
    .slice(-12)
    .map((m: any) => ({ role: m.role, content: m.content }))

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Ожидается сообщение пользователя.' }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey })
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages,
    })
    const reply = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
    return NextResponse.json({ reply })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Не удалось получить ответ стилиста.', detail: err?.message },
      { status: 502 }
    )
  }
}
