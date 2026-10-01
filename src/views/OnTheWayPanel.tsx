import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import L from 'leaflet'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, rememberRoute } from '../db'
import { navigate, useApp } from '../state'
import { formatTime, fromMinutes } from '../lib/hours'
import { formatDistance, googleMapsUrl, wazeUrl } from '../lib/geo'
import { getRoute, RoutingError, type Route } from '../lib/routing'
import { formatDuration, matchRoute, type ArrivalStatus } from '../lib/onTheWay'
import type { Place, RoutePoint, SavedRoute } from '../types'
import type { TKey } from '../i18n'
import { FilterChips } from '../components/FilterChips'
import { PlaceSearchField } from '../components/PlaceSearchField'
import { PracticalBadges } from '../components/PracticalBadges'
import { IconChevR, IconDown, IconEdit, IconNav, IconPin, IconUp, IconX } from '../components/Icons'

export const DETOUR_OPTIONS = [1, 3, 5, 10]

const pad = (n: number) => String(n).padStart(2, '0')
/** Local time in the format <input type="datetime-local"> expects. */
export const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

const statusKey: Record<ArrivalStatus, TKey> = { open: 'otw.arrOpen', closed: 'otw.arrClosed', unknown: 'otw.arrUnknown' }

export default function OnTheWayPanel({
  map,
  places,
  onHighlight,
  onClose,
}: {
  map: L.Map | null
  places: Place[]
  onHighlight: (ids: Set<string> | null) => void
  onClose: () => void
}) {
  const { t, userLocation, locate, categoryById, catName } = useApp()
  const [from, setFrom] = useState<RoutePoint | null | undefined>(null)
  const [to, setTo] = useState<RoutePoint | undefined>()
  const [detourKm, setDetourKm] = useState(3)
  const [departure, setDeparture] = useState(() => toLocalInput(new Date()))
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [route, setRoute] = useState<{ route: Route; fromLabel: string; toLabel: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'form' | 'results'>('form')
  const [collapsed, setCollapsed] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const recent = useLiveQuery(() => db.routes.orderBy('usedAt').reverse().toArray(), [], [] as SavedRoute[])

  const departureDate = useMemo(() => {
    const d = new Date(departure)
    return isNaN(d.getTime()) ? new Date() : d
  }, [departure])

  const matches = useMemo(
    () => (route ? matchRoute(route.route, places, { detourKm, departure: departureDate, onlyOpen }) : []),
    [route, places, detourKm, departureDate, onlyOpen],
  )

  // Highlight matching pins (and dim the rest) while a route is shown.
  useEffect(() => {
    onHighlight(route ? new Set(matches.map((m) => m.place.id)) : null)
  }, [route, matches, onHighlight])
  useEffect(() => () => onHighlight(null), [onHighlight])

  // Draw the route.
  useEffect(() => {
    if (!map || !route) return
    const latlngs = route.route.coordinates.map(([lng, lat]) => [lat, lng] as L.LatLngTuple)
    const casing = L.polyline(latlngs, { color: '#ffffff', weight: 9, opacity: 0.9, interactive: false })
    const line = L.polyline(latlngs, { color: '#1f9d63', weight: 5, opacity: 0.95, interactive: false, className: 'route-line' })
    const ends = L.layerGroup([
      L.circleMarker(latlngs[0], { radius: 7, color: '#fff', weight: 3, fillColor: '#1c1c1e', fillOpacity: 1, interactive: false }),
      L.circleMarker(latlngs[latlngs.length - 1], { radius: 7, color: '#fff', weight: 3, fillColor: '#1f9d63', fillOpacity: 1, interactive: false }),
    ])
    const group = L.layerGroup([casing, line, ends]).addTo(map)
    map.fitBounds(line.getBounds(), { paddingTopLeft: [24, 140], paddingBottomRight: [24, Math.round(window.innerHeight * 0.45)] })
    return () => {
      group.remove()
    }
  }, [map, route])

  useEffect(() => () => abortRef.current?.abort(), [])

  const find = async (opts?: { from: RoutePoint | null; to: RoutePoint; detourKm?: number; name?: string }) => {
    const f = opts ? opts.from : from
    const dest = opts ? opts.to : to
    if (opts?.detourKm) setDetourKm(opts.detourKm)
    if (opts) {
      setFrom(opts.from)
      setTo(opts.to)
    }
    setError('')
    if (!dest) return setError(t('otw.needTo'))
    if (f === undefined) return setError(t('otw.needFrom'))
    let start = f ? { lat: f.lat, lng: f.lng } : userLocation
    if (!f && !start) start = await locate()
    if (!start) return setError(t('otw.noLocation'))

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    try {
      const r = await getRoute(start, dest, { signal: ctrl.signal })
      setRoute({ route: r, fromLabel: f?.label ?? t('otw.currentLocation'), toLabel: dest.label })
      setView('results')
      setCollapsed(false)
      setActiveId(null)
      rememberRoute({
        from: f,
        to: dest,
        detourKm: opts?.detourKm ?? detourKm,
        name: opts?.name,
        defaultName: `${f?.label ?? t('otw.currentLocation')} → ${dest.label}`,
      }).catch(() => {})
    } catch (e) {
      const code = e instanceof RoutingError ? e.code : 'network'
      if (code !== 'aborted') setError(t(`otw.err.${code}` as TKey))
    } finally {
      if (abortRef.current === ctrl) setLoading(false)
    }
  }

  const sheetRef = useRef<HTMLDivElement>(null)
  const focus = (p: Place) => {
    setActiveId(p.id)
    if (!map) return
    // Centre the spot in the part of the map the sheet doesn't cover.
    const zoom = Math.max(map.getZoom(), 15)
    const covered = sheetRef.current?.offsetHeight ?? 0
    const target = map.unproject(map.project([p.lat, p.lng], zoom).add([0, covered / 2]), zoom)
    map.flyTo(target, zoom, { duration: 0.6 })
  }

  const arriveLabel = (d: Date) => {
    const time = formatTime(fromMinutes(d.getHours() * 60 + d.getMinutes()))
    const sameDay = d.toDateString() === departureDate.toDateString()
    return t('otw.arrive', { t: sameDay ? time : `${t(`dayShort.${(d.getDay() + 6) % 7}` as TKey)} ${time}` })
  }

  const detourControl = (
    <div className="segmented" role="radiogroup" aria-label={t('otw.detour')}>
      {DETOUR_OPTIONS.map((km) => (
        <button key={km} type="button" role="radio" aria-checked={detourKm === km} className={detourKm === km ? 'on' : ''} onClick={() => setDetourKm(km)}>
          {km} km
        </button>
      ))}
    </div>
  )

  const onlyOpenToggle = (
    <label className="switch-row">
      <span>{t('otw.onlyOpen')}</span>
      <input type="checkbox" role="switch" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
      <span className="switch" aria-hidden />
    </label>
  )

  return (
    <div ref={sheetRef} className={`otw ${collapsed ? 'collapsed' : ''} ${view === 'results' ? 'is-results' : ''}`} role="dialog" aria-label={t('otw.title')}>
      <div className="otw-head">
        <button type="button" className="otw-grab" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? t('otw.expand') : t('otw.collapse')}>
          <span className="sheet-handle" aria-hidden />
        </button>
        <div className="otw-title">
          {view === 'results' && route ? (
            <>
              <strong className="otw-route-name">{t('otw.toDest', { to: route.toLabel })}</strong>
              <small className="muted">
                {formatDistance(route.route.distanceM / 1000)} · {formatDuration(route.route.durationS)} · {t('otw.count', { n: matches.length })}
              </small>
            </>
          ) : (
            <strong>{t('otw.title')}</strong>
          )}
        </div>
        {view === 'results' && (
          <button type="button" className="icon-btn" aria-label={t('otw.edit')} title={t('otw.edit')} onClick={() => (setView('form'), setCollapsed(false))}>
            <IconEdit size={20} />
          </button>
        )}
        <button type="button" className="icon-btn" aria-label={collapsed ? t('otw.expand') : t('otw.collapse')} onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? <IconUp size={20} /> : <IconDown size={20} />}
        </button>
        <button type="button" className="icon-btn" aria-label={t('otw.close')} title={t('otw.close')} onClick={onClose}>
          <IconX size={20} />
        </button>
      </div>

      {!collapsed && view === 'form' && (
        <div className="otw-body">
          <PlaceSearchField label={t('otw.from')} value={from} onChange={setFrom} allowCurrent placeholder={t('otw.fromPh')} />
          <PlaceSearchField label={t('otw.to')} value={to} onChange={(p) => setTo(p ?? undefined)} placeholder={t('otw.toPh')} />

          <div className="otw-field">
            <span className="psf-label">{t('otw.detour')}</span>
            {detourControl}
          </div>
          <div className="otw-field">
            <span className="psf-label">{t('otw.departure')}</span>
            <div className="row gap-s">
              <input type="datetime-local" value={departure} onChange={(e) => setDeparture(e.target.value)} aria-label={t('otw.departure')} />
              <button type="button" className="btn btn-ghost small" onClick={() => setDeparture(toLocalInput(new Date()))}>
                {t('otw.now')}
              </button>
            </div>
          </div>
          <div className="otw-field">
            <span className="psf-label">{t('tab.categories')}</span>
            <FilterChips />
          </div>
          {onlyOpenToggle}

          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="button" className="btn btn-primary big full" onClick={() => find()} disabled={loading}>
            {loading ? t('otw.finding') : t('otw.find')}
          </button>
          {route && (
            <button type="button" className="btn btn-text full" onClick={() => setView('results')}>
              {t('otw.backToResults')}
            </button>
          )}

          {recent.length > 0 && (
            <div className="otw-recent">
              <span className="psf-label">{t('otw.recent')}</span>
              {recent.map((r) => (
                <div className="recent-row" key={r.id}>
                  <button type="button" className="recent-main" onClick={() => find({ from: r.from, to: r.to, detourKm: r.detourKm, name: r.name })} disabled={loading}>
                    <strong>{r.name}</strong>
                    <small className="muted">
                      {(r.from?.label ?? t('otw.currentLocation'))} → {r.to.label} · {r.detourKm} km
                    </small>
                  </button>
                  <button
                    type="button"
                    className="icon-btn small"
                    aria-label={t('otw.rename')}
                    onClick={() => {
                      const name = prompt(t('otw.renamePrompt'), r.name)?.trim()
                      if (name) db.routes.update(r.id, { name })
                    }}
                  >
                    <IconEdit size={16} />
                  </button>
                  <button type="button" className="icon-btn small" aria-label={t('otw.forget')} onClick={() => db.routes.delete(r.id)}>
                    <IconX size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!collapsed && view === 'results' && route && (
        <div className="otw-body">
          <div className="otw-controls">
            {detourControl}
            {onlyOpenToggle}
          </div>
          {matches.length === 0 ? (
            <div className="otw-empty">
              <p>{t(onlyOpen ? 'otw.noneOpen' : 'otw.none', { km: detourKm })}</p>
              {detourKm < 10 && (
                <button type="button" className="btn btn-ghost small" onClick={() => setDetourKm(DETOUR_OPTIONS.find((k) => k > detourKm) ?? 10)}>
                  {t('otw.widen')}
                </button>
              )}
            </div>
          ) : (
            <ol className="otw-list">
              {matches.map((m) => {
                const c = categoryById.get(m.place.categoryId)
                const active = activeId === m.place.id
                return (
                  <li key={m.place.id} className={`otw-item ${active ? 'active' : ''}`} style={{ '--c': c?.color } as CSSProperties}>
                    <button type="button" className="otw-item-main" onClick={() => focus(m.place)} aria-expanded={active}>
                      <span className="otw-dot" aria-hidden>{c?.emoji ?? '📍'}</span>
                      <span className="otw-item-text">
                        <strong>{m.place.name}</strong>
                        <span className="meta">
                          <span>{catName(c)}</span>
                          <span>{t('otw.offRoute', { d: formatDistance(m.offRouteKm) })}</span>
                        </span>
                        <span className="meta">
                          <span>{arriveLabel(m.arrival)}</span>
                          <span className={`badge badge-${m.arrivalStatus === 'unknown' ? 'muted' : m.arrivalStatus}`}>{t(statusKey[m.arrivalStatus])}</span>
                        </span>
                        <PracticalBadges info={m.place.practical} max={5} />
                      </span>
                    </button>
                    {active && (
                      <div className="otw-item-actions">
                        <a className="btn btn-primary small" href={wazeUrl(m.place)} target="_blank" rel="noopener noreferrer">
                          <IconNav size={16} /> Waze
                        </a>
                        <a className="btn btn-outline small" href={googleMapsUrl(m.place)} target="_blank" rel="noopener noreferrer">
                          <IconPin size={16} /> Google Maps
                        </a>
                        <button type="button" className="btn btn-text small" onClick={() => navigate(`place/${m.place.id}`)}>
                          {t('otw.details')} <IconChevR size={14} />
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
          <p className="muted small otw-note">{t('otw.estimateNote')}</p>
        </div>
      )}
    </div>
  )
}
