import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import { navigate, useApp } from '../state'
import { useFilteredPlaces, useNow, usePlaces } from '../hooks'
import { KLANG_VALLEY, distanceKm } from '../lib/geo'
import { addBasemap } from '../lib/basemap'
import type { Category, Place } from '../types'
import { SearchField, SearchResults } from '../components/Search'
import { CategoryRow } from '../components/CategoryRow'
import { MoreFiltersButton } from '../components/MoreFilters'
import { WeatherChip } from '../components/WeatherChip'
import { CoverWithIcon, OpenPill, PlaceCard, Rating, VisitedCheck, useDistanceLabel } from '../components/PlaceBits'
import { categoryIconSvg } from '../components/CategoryIcon'
import { PracticalBadges } from '../components/PracticalBadges'
import { IconChevR, IconLocate, IconRoute, IconX } from '../components/Icons'

// Loaded on demand so turf.js isn't part of the initial bundle.
const OnTheWayPanel = lazy(() => import('./OnTheWayPanel'))

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const CHECK_SVG =
  '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'

/** Map label: place name + category line icon, with a check when visited. */
function labelIcon(place: Place, cat: Category | undefined, selected: boolean, dimmed: boolean) {
  const cls = ['plabel', selected && 'is-sel', dimmed && 'is-dim', place.visited && 'is-visited'].filter(Boolean).join(' ')
  return L.divIcon({
    className: 'plabel-wrap',
    html: `<div class="${cls}"><span class="plabel-name">${escapeHtml(place.name)}</span><span class="plabel-icon">${categoryIconSvg(cat?.icon)}</span>${place.visited ? `<span class="plabel-check">${CHECK_SVG}</span>` : ''}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

type Mode = 'half' | 'strip' | 'full'

export function HomeView({ active }: { active: boolean }) {
  const { t, categoryById, userLocation, locationStatus, locate, focus, query, setQuery, tagFilter, setTagFilter, dark } = useApp()
  const places = useFilteredPlaces()
  const allPlaces = usePlaces()
  const now = useNow()
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [mapReady, setMapReady] = useState<L.Map | null>(null)
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)
  /** Unclustered layer for "On the way" matches, so they stay visible at any zoom. */
  const matchLayerRef = useRef<L.LayerGroup | null>(null)
  const userMarkerRef = useRef<L.CircleMarker | null>(null)
  const centredRef = useRef(false)
  const markersRef = useRef(new Map<string, L.Marker>())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [otwOpen, setOtwOpen] = useState(false)
  /** Matching place ids while "On the way" shows a route; null = no route, nothing dimmed. */
  const [highlight, setHighlight] = useState<Set<string> | null>(null)
  const onHighlight = useCallback((ids: Set<string> | null) => setHighlight(ids), [])
  const selectedRef = useRef<string | null>(null)
  selectedRef.current = selectedId

  const searching = query.trim().length > 0
  const mode: Mode = otwOpen ? 'full' : searching ? 'strip' : 'half'

  // Init once
  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const map = L.map(elRef.current, { zoomControl: false, attributionControl: true, minZoom: 4, maxZoom: 19 }).setView([KLANG_VALLEY.lat, KLANG_VALLEY.lng], 12)
    map.attributionControl.setPrefix(false)
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (c) => {
        const n = c.getChildCount()
        const size = n < 10 ? 36 : n < 50 ? 42 : 50
        return L.divIcon({ className: 'cluster-wrap', html: `<div class="cluster" style="width:${size}px;height:${size}px">${n}</div>`, iconSize: [size, size] })
      },
    })
    map.addLayer(cluster)
    matchLayerRef.current = L.layerGroup().addTo(map)
    map.on('click', () => setSelectedId(null))
    mapRef.current = map
    clusterRef.current = cluster
    setMapReady(map)
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Styled basemap (re-added when the theme changes)
  useEffect(() => {
    if (!mapReady) return
    return addBasemap(mapReady, dark ? 'dark' : 'light')
  }, [mapReady, dark])

  // Keep Leaflet's size in sync with layout changes (tab switch, half/strip/full)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !active) return
    const tick = () => map.invalidateSize({ pan: false })
    const timers = [0, 150, 320].map((ms) => setTimeout(tick, ms))
    return () => timers.forEach(clearTimeout)
  }, [active, mode])

  // Centre on user once, when location first arrives (unless we're already focusing a place)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !userLocation) return
    if (!userMarkerRef.current) {
      userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 7,
        color: '#fff',
        weight: 3,
        fillColor: '#2f80ed',
        fillOpacity: 1,
        interactive: false,
        className: 'user-dot',
      }).addTo(map)
    } else userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng])
    if (!centredRef.current && !focus) {
      centredRef.current = true
      map.setView([userLocation.lat, userLocation.lng], 14)
    }
  }, [userLocation, focus])

  // Labels. While "On the way" shows a route, matches move to an unclustered layer and the rest stay clustered (dimmed).
  useEffect(() => {
    const cluster = clusterRef.current
    const matchLayer = matchLayerRef.current
    if (!cluster || !matchLayer || !places) return
    cluster.clearLayers()
    matchLayer.clearLayers()
    const markers = new Map<string, L.Marker>()
    const clustered: L.Marker[] = []
    for (const p of places) {
      const isMatch = !!highlight?.has(p.id)
      const m = L.marker([p.lat, p.lng], {
        icon: labelIcon(p, categoryById.get(p.categoryId), p.id === selectedRef.current, !!highlight && !isMatch),
        title: p.name,
        keyboard: true,
        riseOnHover: true,
        zIndexOffset: isMatch ? 500 : 0,
      })
      m.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        if (selectedRef.current === p.id) navigate(`place/${p.id}`)
        else setSelectedId(p.id)
      })
      markers.set(p.id, m)
      if (isMatch) m.addTo(matchLayer)
      else clustered.push(m)
    }
    cluster.addLayers(clustered)
    markersRef.current = markers
    elRef.current?.classList.toggle('otw-active', !!highlight)
  }, [places, categoryById, highlight])

  // Highlight the selected label without rebuilding everything
  useEffect(() => {
    for (const [id, m] of markersRef.current) {
      const p = places?.find((x) => x.id === id)
      const isMatch = !!highlight?.has(id)
      if (p) m.setIcon(labelIcon(p, categoryById.get(p.categoryId), id === selectedId, !!highlight && !isMatch))
      m.setZIndexOffset(id === selectedId ? 1000 : isMatch ? 500 : 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const flyToPlace = useCallback(
    (id: string) => {
      const p = allPlaces?.find((x) => x.id === id)
      const map = mapRef.current
      if (!p || !map) return
      setQuery('')
      setSelectedId(id)
      // Wait for the map to grow back from the search strip before flying.
      setTimeout(() => {
        map.invalidateSize({ pan: false })
        map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 16), { duration: 0.8 })
      }, 340)
    },
    [allPlaces, setQuery],
  )

  // Fly to a focused place (from the place page's "Map" button)
  useEffect(() => {
    if (focus && allPlaces) {
      centredRef.current = true
      flyToPlace(focus.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.n, allPlaces === undefined])

  const selected = useMemo(() => allPlaces?.find((p) => p.id === selectedId) ?? null, [allPlaces, selectedId])

  const nearby = useMemo(() => {
    if (!places) return undefined
    const list = [...places]
    if (userLocation) list.sort((a, b) => distanceKm(userLocation, a) - distanceKm(userLocation, b))
    else list.sort((a, b) => b.createdAt - a.createdAt)
    return list
  }, [places, userLocation])

  return (
    <div className={`home home-${mode}`} hidden={!active}>
      <div className="home-map">
        <div ref={elRef} className="map" />

        {!otwOpen && (
          <>
            <button type="button" className="otw-pill" onClick={() => (setOtwOpen(true), setSelectedId(null), setQuery(''))}>
              <IconRoute size={18} /> {t('otw.button')}
            </button>
            <div className="map-rounds">
              <MoreFiltersButton variant="icon" />
              {mode === 'half' && (
                <button
                  type="button"
                  className="map-round"
                  aria-label={t('map.locate')}
                  title={t('map.locate')}
                  data-denied={locationStatus === 'denied' || undefined}
                  onClick={async () => {
                    const p = userLocation ?? (await locate())
                    if (p) mapRef.current?.flyTo([p.lat, p.lng], 15, { duration: 0.6 })
                  }}
                >
                  <IconLocate size={20} />
                </button>
              )}
            </div>
            {mode === 'half' && !selected && (
              <div className="map-weather">
                <WeatherChip fallback={KLANG_VALLEY} />
              </div>
            )}
          </>
        )}

        {otwOpen && (
          <Suspense fallback={null}>
            <OnTheWayPanel map={mapRef.current} places={places ?? []} onHighlight={onHighlight} onClose={() => setOtwOpen(false)} />
          </Suspense>
        )}

        {selected && mode !== 'strip' && <PreviewCard place={selected} now={now} onClose={() => setSelectedId(null)} />}
      </div>

      {!otwOpen && (
        <div className="home-panel">
          <SearchField />
          <CategoryRow />
          {tagFilter && (
            <div className="active-filters">
              <button type="button" className="chip on chip-tag" onClick={() => setTagFilter(null)} aria-label={`${t('filter.clear')}: #${tagFilter}`}>
                #{tagFilter} <IconX size={14} />
              </button>
            </div>
          )}
          {searching ? (
            <SearchResults onPickPlace={flyToPlace} />
          ) : (
            <>
              <h2 className="serif-h section-h">{userLocation ? t('home.nearby') : t('home.yourSpots')}</h2>
              {nearby && nearby.length === 0 && <p className="empty">{allPlaces?.length ? t('list.emptyFiltered') : t('list.empty')}</p>}
              <div className="pgrid">
                {nearby?.map((p) => (
                  <PlaceCard key={p.id} place={p} now={now} onClick={() => navigate(`place/${p.id}`)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function PreviewCard({ place, now, onClose }: { place: Place; now: Date; onClose: () => void }) {
  const { t } = useApp()
  const dist = useDistanceLabel(place)
  const startY = useRef<number | null>(null)
  const [dy, setDy] = useState(0)
  return (
    <div
      className="preview"
      style={{ transform: dy > 0 ? `translateY(${dy}px)` : undefined }}
      onTouchStart={(e) => (startY.current = e.touches[0].clientY)}
      onTouchMove={(e) => startY.current !== null && setDy(Math.max(0, e.touches[0].clientY - startY.current))}
      onTouchEnd={() => {
        if (dy > 60) onClose()
        setDy(0)
        startY.current = null
      }}
    >
      <button type="button" className="preview-close icon-btn small" aria-label={t('common.close')} onClick={onClose}>
        <IconX size={18} />
      </button>
      <button type="button" className="preview-main" onClick={() => navigate(`place/${place.id}`)} aria-label={`${place.name} — ${t('map.openPlace')}`}>
        <CoverWithIcon place={place} className="preview-media" />
        <span className="preview-body">
          <span className="prow-name">
            {place.visited && <VisitedCheck />}
            <strong>{place.name}</strong>
          </span>
          <span className="prow-meta">
            <OpenPill place={place} now={now} />
            {dist && <span className="dot-sep">{dist}</span>}
            {place.rating ? (
              <span className="dot-sep">
                <Rating value={place.rating} />
              </span>
            ) : null}
          </span>
          <PracticalBadges info={place.practical} variant="labels" max={3} />
          <span className="preview-more">
            {t('map.openPlace')} <IconChevR size={14} />
          </span>
        </span>
      </button>
    </div>
  )
}
