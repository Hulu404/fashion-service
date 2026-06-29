'use client'

import { useEffect, type ReactNode } from 'react'

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
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={`overlay overlay--${variant}`} onClick={onClose}>
      <div
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
