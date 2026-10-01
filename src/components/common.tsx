import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { useApp } from '../state'
import { openState, formatTime } from '../lib/hours'
import { usePhotoUrl } from '../hooks'
import type { Category, Place } from '../types'
import { IconX } from './Icons'

export function StatusBadge({ place, now, long }: { place: Place; now: Date; long?: boolean }) {
  const { t } = useApp()
  const s = openState(place.hours, now)
  if (s.status === 'unknown') return long ? <span className="badge badge-muted">{t('status.unknown')}</span> : null
  if (s.status === 'open') {
    const detail = s.allDay ? t('status.open24') : s.closesAt ? t('status.closes', { t: formatTime(s.closesAt) }) : ''
    return (
      <span className="badge badge-open">
        {t('status.open')}
        {long && detail && (
        <>
          <span className="badge-sep"> · </span>
          <span className="badge-detail">{detail}</span>
        </>
      )}
      </span>
    )
  }
  const detail = s.opensAt
    ? s.opensDay !== undefined
      ? t('status.opensDay', { d: t(`dayShort.${s.opensDay}` as 'dayShort.0'), t: formatTime(s.opensAt) })
      : t('status.opens', { t: formatTime(s.opensAt) })
    : ''
  return (
    <span className="badge badge-closed">
      {t('status.closed')}
      {long && detail && (
        <>
          <span className="badge-sep"> · </span>
          <span className="badge-detail">{detail}</span>
        </>
      )}
    </span>
  )
}

export function CategoryPill({ category }: { category: Category | undefined }) {
  const { catName } = useApp()
  if (!category) return null
  return (
    <span className="cat-pill" style={{ '--c': category.color } as CSSProperties}>
      <span aria-hidden>{category.emoji}</span> {catName(category)}
    </span>
  )
}

/** Cover photo thumbnail, or a coloured placeholder with the category emoji. */
export function Cover({ place, category, className = '', kind = 'thumb' }: { place: Place; category?: Category; className?: string; kind?: 'thumb' | 'blob' }) {
  const url = usePhotoUrl(place.photoIds[0], kind)
  if (url) return <img className={`cover ${className}`} src={url} alt="" loading="lazy" decoding="async" />
  return (
    <div className={`cover cover-ph ${className}`} style={{ '--c': category?.color ?? '#c9a27e' } as CSSProperties} aria-hidden>
      <span>{category?.emoji ?? '📍'}</span>
    </div>
  )
}

export function Toast() {
  const { toast } = useApp()
  return (
    <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
      {toast}
    </div>
  )
}

export function Modal({ open, onClose, title, children, actions }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; actions?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} className="modal" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      {open && (
        <div className="modal-body">
          {title && <h2 className="modal-title">{title}</h2>}
          {children}
          {actions && <div className="modal-actions">{actions}</div>}
        </div>
      )}
    </dialog>
  )
}

export function IconButton({ label, onClick, children, className = '' }: { label: string; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" className={`icon-btn ${className}`} aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  )
}

export function CloseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <IconButton label={label} onClick={onClick}>
      <IconX />
    </IconButton>
  )
}
