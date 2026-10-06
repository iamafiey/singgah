import { type CSSProperties } from 'react'
import { useApp } from '../state'
import { openState } from '../lib/hours'
import { distanceKm, formatDistance } from '../lib/geo'
import { metaLabels } from '../lib/practical'
import type { Place } from '../types'
import { Cover } from './common'
import { CategoryIcon } from './CategoryIcon'

export function VisitedCheck({ size = 16 }: { size?: number }) {
  const { t } = useApp()
  return (
    <span className="vcheck" style={{ width: size, height: size }} role="img" aria-label={t('list.visited')} title={t('list.visited')}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  )
}

/** "Buka" / "Tutup" pill; nothing when hours are unknown. */
export function OpenPill({ place, now }: { place: Place; now: Date }) {
  const { t } = useApp()
  const s = openState(place.hours, now)
  if (s.status === 'unknown') return null
  return <span className={`opill ${s.status === 'open' ? 'opill-open' : 'opill-closed'}`}>{s.status === 'open' ? t('pill.open') : t('pill.closed')}</span>
}

export function Rating({ value }: { value?: number }) {
  const { t } = useApp()
  if (!value) return null
  return (
    <span className="rating" aria-label={t('rating.aria', { n: value })}>
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="#f5b301" />
      </svg>
      {value}
    </span>
  )
}

export function useDistanceLabel(place: Place): string | null {
  const { t, userLocation } = useApp()
  return userLocation ? t('dist.away', { d: formatDistance(distanceKm(userLocation, place)).replace(' ', '') }) : null
}

/** Photo with the category line icon in the bottom-right corner. */
export function CoverWithIcon({ place, className = '' }: { place: Place; className?: string }) {
  const { categoryById } = useApp()
  const c = categoryById.get(place.categoryId)
  return (
    <div className={`cwi ${className}`} style={{ '--c': c?.color } as CSSProperties}>
      <Cover place={place} category={c} className="cwi-img" />
      <span className="cwi-icon">
        <CategoryIcon icon={c?.icon} size={15} />
      </span>
    </div>
  )
}

/** Grid card (home "nearby" and the Singgahan tab). */
export function PlaceCard({ place, now, onClick }: { place: Place; now: Date; onClick: () => void }) {
  const dist = useDistanceLabel(place)
  return (
    <button type="button" className="pcard" onClick={onClick}>
      <CoverWithIcon place={place} className="pcard-media" />
      <span className="pcard-name">
        {place.visited && <VisitedCheck />}
        <span>{place.name}</span>
      </span>
      <span className="pcard-meta">
        <span className="pcard-meta-left">
          <OpenPill place={place} now={now} />
          {dist && <span className="dot-sep">{dist}</span>}
        </span>
        <Rating value={place.rating} />
      </span>
    </button>
  )
}

/** Compact row (search results). */
export function PlaceRow({ place, now, onClick }: { place: Place; now: Date; onClick: () => void }) {
  const { lang } = useApp()
  const dist = useDistanceLabel(place)
  const meta = metaLabels(place.practical, lang)
  return (
    <button type="button" className="prow" onClick={onClick}>
      <CoverWithIcon place={place} className="prow-media" />
      <span className="prow-body">
        <span className="prow-top">
          <span className="prow-name">
            {place.visited && <VisitedCheck />}
            <span>{place.name}</span>
          </span>
          {dist && <span className="prow-dist">{dist}</span>}
        </span>
        <span className="prow-meta">
          <OpenPill place={place} now={now} />
          {meta.map((m) => (
            <span key={m} className="dot-sep">{m}</span>
          ))}
          {place.rating ? (
            <span className="dot-sep">
              <Rating value={place.rating} />
            </span>
          ) : null}
        </span>
      </span>
    </button>
  )
}
