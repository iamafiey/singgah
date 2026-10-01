import { useEffect, useRef, useState } from 'react'
import { usePhotoUrl } from '../hooks'
import { IconChevL, IconChevR, IconX } from './Icons'

function Slide({ id }: { id: string }) {
  const url = usePhotoUrl(id, 'blob')
  return url ? <img src={url} alt="" /> : <div className="viewer-loading" />
}

/** Full-screen swipeable photo viewer. */
export function PhotoViewer({ ids, start, onClose, closeLabel }: { ids: string[]; start: number; onClose: () => void; closeLabel: string }) {
  const [i, setI] = useState(start)
  const touchX = useRef<number | null>(null)
  const prev = () => setI((x) => (x - 1 + ids.length) % ids.length)
  const next = () => setI((x) => (x + 1) % ids.length)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!ids.length) return null
  return (
    <div
      className="viewer"
      role="dialog"
      aria-modal="true"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (dx > 50) prev()
        else if (dx < -50) next()
        touchX.current = null
      }}
    >
      <Slide id={ids[i]} key={ids[i]} />
      <button className="viewer-close icon-btn" aria-label={closeLabel} onClick={onClose}>
        <IconX />
      </button>
      {ids.length > 1 && (
        <>
          <button className="viewer-nav left icon-btn" aria-label="Previous" onClick={prev}>
            <IconChevL />
          </button>
          <button className="viewer-nav right icon-btn" aria-label="Next" onClick={next}>
            <IconChevR />
          </button>
          <div className="viewer-count">
            {i + 1} / {ids.length}
          </div>
        </>
      )}
    </div>
  )
}

export function Thumb({ id, onClick, label }: { id: string; onClick?: () => void; label?: string }) {
  const url = usePhotoUrl(id, 'thumb')
  return (
    <button type="button" className="thumb" onClick={onClick} aria-label={label}>
      {url && <img src={url} alt="" loading="lazy" />}
    </button>
  )
}
