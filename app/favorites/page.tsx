'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseBrowser } from '../../lib/supabaseClient'
import LoginScreen from '../../components/podbor/LoginScreen'
import FavoritesScreen from '../../components/favorites/FavoritesScreen'

type Phase = 'checking' | 'signed-out' | 'ready'

export default function FavoritesPage() {
  const supabase = getSupabaseBrowser()
  const [phase, setPhase] = useState<Phase>('checking')
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setPhase(data.session ? 'ready' : 'signed-out')
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setPhase(nextSession ? 'ready' : 'signed-out')
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  if (phase === 'checking') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="eyebrow">Загрузка…</div>
      </main>
    )
  }

  if (phase === 'signed-out' || !session) {
    return <LoginScreen />
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-oat">
      <FavoritesScreen userId={session.user.id} />
    </main>
  )
}
