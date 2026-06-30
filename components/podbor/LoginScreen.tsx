'use client'

import { useState } from 'react'
import { getSupabaseBrowser } from '../../lib/supabaseClient'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const supabase = getSupabaseBrowser()

      // Try to sign in first.
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInData.session) return // signed in — the parent's auth listener takes over
      if (signInError && !/invalid login credentials/i.test(signInError.message)) {
        throw signInError
      }

      // No such account (or not yet confirmed) — register it.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) throw signUpError
      if (signUpData.session) return // auto-confirmed — listener transitions into the app

      // No session means email confirmation is enabled on the project. Try one
      // immediate sign-in in case it's actually off; otherwise tell the user
      // plainly instead of silently doing nothing.
      const { data: retry } = await supabase.auth.signInWithPassword({ email, password })
      if (retry.session) return
      setNotice('Account created. Confirm your email from the link we sent, then sign in to continue.')
    } catch (err: any) {
      setError(err?.message ?? 'Could not sign in. Check your details.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="font-display text-3xl tracking-[0.14em] text-ink">SB-fashion</div>
          <p className="eyebrow mt-3">AI stylist</p>
          <p className="mt-4 text-sm text-ink-soft font-light leading-relaxed">
            Sign in with your email and password to build outfits for any occasion and save your profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
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

          <div>
            <label className="field-label mt-1" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              className="field-input"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-oxblood font-light">{error}</p>}
          {notice && <p className="text-sm text-ink-soft font-light leading-relaxed">{notice}</p>}

          <button type="submit" className="btn full mt-2" disabled={busy}>
            {busy ? 'Please wait…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-stone font-light leading-relaxed">
          No account? Enter your email and password — we’ll create one automatically.
        </p>
      </div>
    </main>
  )
}
