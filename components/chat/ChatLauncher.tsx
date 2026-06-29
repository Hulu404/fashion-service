'use client'

import { useEffect, useRef, useState } from 'react'
import { getSupabaseBrowser } from '../../lib/supabaseClient'
import Overlay from '../overlays/Overlay'

type Msg = { role: 'user' | 'assistant'; content: string }

const GREETING: Msg = {
  role: 'assistant',
  content: 'Здравствуйте! Я помогу собрать образ или подсказать, с чем носить вещь. О чём думаете?',
}

export default function ChatLauncher() {
  const [authed, setAuthed] = useState(false)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([GREETING])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (open && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, open])

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setError(null)
    const next: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const supabase = getSupabaseBrowser()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Войдите, чтобы спросить стилиста.')
        setBusy(false)
        return
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (!res.ok || !data?.reply) {
        setError(data?.error || 'Не удалось получить ответ стилиста.')
        setBusy(false)
        return
      }
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
    } catch {
      setError('Сбой соединения. Попробуйте ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  if (!authed) return null

  return (
    <>
      <button type="button" className="fab" onClick={() => setOpen(true)} aria-label="Спросить стилиста">
        <span className="fab-pulse" aria-hidden="true" /> Спросить стилиста
      </button>

      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        variant="dock"
        eyebrow="AI-стилист"
        title="Анна, ваш стилист"
        ariaLabel="Чат со стилистом"
      >
        <div className="chat-body" ref={bodyRef}>
          {messages.map((m, i) => (
            <div key={i} className={`bub ${m.role === 'user' ? 'me' : 'ai'}`}>
              {m.role === 'assistant' && <span className="who">Стилист</span>}
              {m.content}
            </div>
          ))}
          {busy && (
            <div className="bub ai">
              <span className="who">Стилист</span>…
            </div>
          )}
          {error && <p className="chat-err">{error}</p>}
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send()
            }}
            placeholder="Спросите стилиста…"
            aria-label="Сообщение стилисту"
          />
          <button
            type="button"
            className="chat-send"
            onClick={send}
            disabled={busy}
            aria-label="Отправить"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </Overlay>
    </>
  )
}
