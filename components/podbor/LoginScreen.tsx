'use client'

import { useState } from 'react'
import { getSupabaseBrowser } from '../../lib/supabaseClient'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
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
