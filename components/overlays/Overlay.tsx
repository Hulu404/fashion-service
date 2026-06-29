'use client'

import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  /** Desktop shape: centred dialog or right-hand full-height dock. Mobile is
   *  always a bottom sheet. */
  variant: 'dialog' | 'dock'
  eyebrow?: string
  title?: ReactNode
  children: ReactNode
  /** Accessible label when there is no visible title text. */
  ariaLabel?: string
}

/**
 * Responsive overlay: a bottom sheet on mobile; on desktop a centred dialog or
 * a right-side dock. Closes on backdrop click, the × button, and Escape.
 * The backdrop sits below the (z-raised) sidebar so the sidebar stays visible.
 */
export default function Overlay({ open, onClose, variant, eyebrow, title, children, ariaLabel }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const prevFocus = useRef<HTMLElement | null>(null)

  // Move focus into the dialog on open, trap Tab inside, restore focus on close.
  useEffect(() => {
    if (!open) return
    prevFocus.current = document.activeElement as HTMLElement | null

    const focusables = () =>
      Array.from(
        sheetRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)

    const items = focusables()
    ;(items[0] ?? sheetRef.current)?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const f = focusables()
      if (f.length === 0) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prevFocus.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={`overlay overlay--${variant}`} onClick={onClose}>
      <div
        ref={sheetRef}
        tabIndex={-1}
        className={`sheet sheet--${variant}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grab" aria-hidden="true" />
        <div className="sheet-head">
          <div className="sheet-ttl">
            {eyebrow && <span className="e">{eyebrow}</span>}
            {title}
          </div>
          <button type="button" className="sheet-x" onClick={onClose} aria-label="Закрыть">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
