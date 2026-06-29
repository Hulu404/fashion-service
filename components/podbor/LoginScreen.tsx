'use client'

import { useState } from 'react'
import { getSupabaseBrowser } from '../../lib/supabaseClient'

type Mode = 'magic' | 'password'

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== 'undefined' ? `${window.location.origin}/podbor` : undefined,
        },
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      setError(err?.message ?? 'Не удалось отправить ссылку. Попробуйте ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      // Try to sign in; if the account doesn't exist yet, register it.
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        if (/invalid login credentials/i.test(signInError.message)) {
          const { error: signUpError } = await supabase.auth.signUp({ email, password })
          if (signUpError) throw signUpError
        } else {
          throw signInError
        }
      }
      // On success the parent's auth listener takes over and shows the form.
    } catch (err: any) {
      setError(err?.message ?? 'Не удалось войти. Проверьте данные.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="font-display text-3xl tracking-[0.14em] text-ink">ÉCLAT</div>
          <p className="eyebrow mt-3">AI-стилист</p>
          <p className="mt-4 text-sm text-ink-soft font-light leading-relaxed">
            Войдите, чтобы собрать образы под повод и сохранить свои параметры.
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <h2 className="font-display text-xl text-ink">Проверьте почту</h2>
            <p className="mt-3 text-sm text-ink-soft font-light leading-relaxed">
              Мы отправили ссылку для входа на <span className="text-ink">{email}</span>. Откройте её
              на этом устройстве.
            </p>
            <button
              className="mt-6 text-sm text-ink border-b border-mocha pb-0.5 hover:text-oxblood hover:border-oxblood"
              onClick={() => {
                setSent(false)
                setError(null)
              }}
            >
              Использовать другой адрес
            </button>
          </div>
        ) : (
          <>
            <form
              onSubmit={mode === 'magic' ? handleMagicLink : handlePassword}
              className="space-y-3"
            >
              <label className="field-label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                className="field-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {mode === 'password' && (
                <div>
                  <label className="field-label mt-1" htmlFor="login-password">
                    Пароль
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="current-password"
                    className="field-input"
                    placeholder="Минимум 6 символов"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}

              {error && <p className="text-sm text-oxblood font-light">{error}</p>}

              <button type="submit" className="btn full mt-2" disabled={busy}>
                {busy
                  ? 'Подождите…'
                  : mode === 'magic'
                    ? 'Отправить ссылку для входа'
                    : 'Войти'}
              </button>
            </form>

            <button
              className="mt-6 mx-auto block text-sm text-ink border-b border-mocha pb-0.5 hover:text-oxblood hover:border-oxblood"
              onClick={() => {
                setMode(mode === 'magic' ? 'password' : 'magic')
                setError(null)
              }}
            >
              {mode === 'magic' ? 'Войти по email и паролю' : 'Войти по ссылке на почту'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}
