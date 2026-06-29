'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowser } from '../lib/supabaseClient'

type Tab = 'home' | 'build' | 'fav'

const ITEMS: { tab: Tab; href: string; label: string }[] = [
  { tab: 'home', href: '/', label: 'Витрина' },
  { tab: 'build', href: '/podbor', label: 'Подбор' },
  { tab: 'fav', href: '/favorites', label: 'Избранное' },
]

function TabIcon({ tab }: { tab: Tab }) {
  if (tab === 'home') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 11l8-7 8 7" />
        <path d="M6 10v9h12v-9" />
      </svg>
    )
  }
  if (tab === 'build') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M5 3v4M3 5h4M6 17v3M5 18h3" />
        <path d="M14 4l2.5 5.5L22 12l-5.5 2.5L14 20l-2.5-5.5L6 12l5.5-2.5z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
    </svg>
  )
}

/** One source of truth for which screen is active, derived from the route. */
function activeFromPath(path: string): Tab | null {
  if (path === '/') return 'home'
  if (path.startsWith('/podbor')) return 'build'
  if (path.startsWith('/favorites')) return 'fav'
  return null // e.g. /wardrobe — secondary screen, no primary tab highlighted
}

export default function Navigation() {
  const pathname = usePathname() || '/'
  const active = activeFromPath(pathname)

  const [count, setCount] = useState(0)
  const [email, setEmail] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const supabase = getSupabaseBrowser()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    setEmail(session?.user.email ?? null)
    if (!session) {
      setCount(0)
      return
    }
    const { count: c } = await supabase
      .from('saved_looks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
    setCount(c ?? 0)
  }, [])

  useEffect(() => {
    void refresh()
    const supabase = getSupabaseBrowser()
    const { data: sub } = supabase.auth.onAuthStateChange(() => void refresh())
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      sub.subscription.unsubscribe()
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  // Keep the badge fresh when moving between screens (e.g. after (un)saving).
  useEffect(() => {
    void refresh()
  }, [pathname, refresh])

  async function signOut() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="side-brand">
          <div className="font-display text-2xl tracking-[0.14em] text-ink">ÉCLAT</div>
          <p className="eyebrow mt-1">AI-стилист</p>
        </div>

        <nav className="side-menu" aria-label="Основная навигация">
          {ITEMS.map((it) => (
            <Link
              key={it.tab}
              href={it.href}
              data-tab={it.tab}
              className={`side-item${active === it.tab ? ' on' : ''}`}
              aria-current={active === it.tab ? 'page' : undefined}
            >
              <span className="side-ico">
                <TabIcon tab={it.tab} />
              </span>
              <span>{it.label}</span>
              {it.tab === 'fav' && count > 0 && <span className="nav-badge">{count}</span>}
            </Link>
          ))}
          <Link href="/wardrobe" className="side-item-sub" data-tab="wardrobe">
            Гардероб
          </Link>
        </nav>

        <div className="side-foot">
          <Link href="/podbor" className="btn full">
            Подобрать образ
          </Link>
          <div className="side-user">
            {email ? (
              <>
                <span className="side-user-email" title={email}>
                  {email}
                </span>
                <button type="button" onClick={signOut} className="side-user-out">
                  Выйти
                </button>
              </>
            ) : (
              <Link href="/podbor" className="side-user-out">
                Войти
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <nav className="tabbar" aria-label="Основная навигация">
        {ITEMS.map((it) => (
          <Link
            key={it.tab}
            href={it.href}
            data-tab={it.tab}
            className={`tab${active === it.tab ? ' on' : ''}`}
            aria-current={active === it.tab ? 'page' : undefined}
          >
            <span className="tab-ico">
              <TabIcon tab={it.tab} />
              {it.tab === 'fav' && count > 0 && <span className="nav-badge tab-badge">{count}</span>}
            </span>
            {it.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
