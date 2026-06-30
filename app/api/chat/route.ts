import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { colorDictionaryForPrompt } from '../../../lib/colors'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `You are Anna, a personal stylist at SB-fashion. You help put together an outfit or suggest what to wear with a piece.

Rules:
- Reply warmly, to the point and briefly (2–4 sentences), no fluff and no markdown headings.
- When you name colours, draw on the SB-fashion palette: ${colorDictionaryForPrompt()}.
- Give concrete combinations (top/bottom/shoes/detail) and a short "why".
- Write in English.`

type ChatMessage = { role: 'user' | 'assistant'; content: string }

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
    return NextResponse.json({ error: 'Sign in to ask the stylist.' }, { status: 401 })
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: 'Session is invalid.' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 })
  }

  const incoming: unknown = body?.messages
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json({ error: 'Empty request.' }, { status: 400 })
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
    return NextResponse.json({ error: 'A user message is expected.' }, { status: 400 })
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
      { error: 'Could not get a reply from the stylist.', detail: err?.message },
      { status: 502 }
    )
  }
}
