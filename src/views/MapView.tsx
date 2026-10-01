import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import { navigate, useApp } from '../state'
import { useFilteredPlaces, useNow, usePlaces } from '../hooks'
import { KLANG_VALLEY, distanceKm, formatDistance } from '../lib/geo'
import type { Category, Place } from '../types'
import { SearchBar } from '../components/SearchBar'
import { FilterChips } from '../components/FilterChips'
import { CategoryPill, Cover, StatusBadge } from '../components/common'
import { IconChevR, IconLocate, IconPlus, IconX } from '../components/Icons'

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function pinIcon(cat: Category | undefined, selected: boolean, visited: boolean) {
  const color = cat?.color ?? '#8a7768'
  return L.divIcon({
    className: 'pin-wrap',
    html: `<div class="pin${selected ? ' pin-sel' : ''}${visited ? ' pin-visited' : ''}" style="--c:${escapeHtml(color)}"><span>${escapeHtml(cat?.emoji ?? '📍')}</span></div>`,
    iconSize: [40, 48],
    iconAnchor: [20, 46],
  })
}

export function MapView({ active }: { active: boolean }) {
  const { t, categoryById, userLocation, locationStatus, locate, focus, catName } = useApp()
  const places = useFilteredPlaces()
  const allPlaces = usePlaces()
  const now = useNow()
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)
  const userMarkerRef = useRef<L.CircleMarker | null>(null)
  const centredRef = useRef(false)
  const markersRef = useRef(new Map<string, L.Marker>())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedRef = useRef<string | null>(null)
  selectedRef.current = selectedId

  // Init once
  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const map = L.map(elRef.current, { zoomControl: false, attributionControl: true }).setView([KLANG_VALLEY.lat, KLANG_VALLEY.lng], 11)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    map.attributionControl.setPrefix(false)
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (c) => {
        const n = c.getChildCount()
        const size = n < 10 ? 40 : n < 50 ? 48 : 56
        return L.divIcon({ className: 'cluster-wrap', html: `<div class="cluster" style="width:${size}px;height:${size}px">${n}</div>`, iconSize: [size, size] })
      },
    })
    map.addLayer(cluster)
    map.on('click', () => setSelectedId(null))
    mapRef.current = map
    clusterRef.current = cluster
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (active) setTimeout(() => mapRef.current?.invalidateSize(), 0)
  }, [active])

  // Centre on user once, when location first arrives (unless we're already focusing a place)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !userLocation) return
    if (!userMarkerRef.current) {
      userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8,
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
      map.setView([userLocation.lat, userLocation.lng], 13)
    }
  }, [userLocation, focus])

  // Markers
  useEffect(() => {
    const cluster = clusterRef.current
    if (!cluster || !places) return
    cluster.clearLayers()
    const markers = new Map<string, L.Marker>()
    const list = places.map((p) => {
      const m = L.marker([p.lat, p.lng], {
        icon: pinIcon(categoryById.get(p.categoryId), p.id === selectedRef.current, p.visited),
        title: p.name,
        keyboard: true,
        riseOnHover: true,
      })
      m.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        if (selectedRef.current === p.id) navigate(`place/${p.id}`)
        else setSelectedId(p.id)
      })
      markers.set(p.id, m)
      return m
    })
    cluster.addLayers(list)
    markersRef.current = markers
  }, [places, categoryById])

  // Highlight the selected pin without rebuilding everything
  useEffect(() => {
    for (const [id, m] of markersRef.current) {
      const p = places?.find((x) => x.id === id)
      if (p) m.setIcon(pinIcon(categoryById.get(p.categoryId), id === selectedId, p.visited))
      if (id === selectedId) m.setZIndexOffset(1000)
      else m.setZIndexOffset(0)
    }
  }, [selectedId, places, categoryById])

  // Fly to a focused place (from search or the place page)
  useEffect(() => {
    if (!focus || !allPlaces) return
    const p = allPlaces.find((x) => x.id === focus.id)
    const map = mapRef.current
    if (!p || !map) return
    centredRef.current = true
    setSelectedId(p.id)
    setTimeout(() => {
      map.invalidateSize()
      map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 16), { duration: 0.8 })
    }, 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.n, allPlaces === undefined])

  const selected = useMemo(() => allPlaces?.find((p) => p.id === selectedId) ?? null, [allPlaces, selectedId])

  function flyToPlace(id: string) {
    // Search inside the map: same flow as focusPlace without a route change.
    const p = allPlaces?.find((x) => x.id === id)
    const map = mapRef.current
    if (!p || !map) return
    setSelectedId(id)
    map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 16), { duration: 0.8 })
  }

  return (
    <div className="map-screen" hidden={!active}>
      <div ref={elRef} className="map" />
      <div className="map-top">
        <SearchBar onPickPlace={flyToPlace} />
        <FilterChips />
      </div>

      <div className={`map-fabs ${selected ? 'raised' : ''}`}>
        <button
          className="fab fab-small"
          aria-label={t('map.locate')}
          title={t('map.locate')}
          onClick={async () => {
            const p = userLocation ?? (await locate())
            if (p) mapRef.current?.flyTo([p.lat, p.lng], 15, { duration: 0.6 })
          }}
          data-denied={locationStatus === 'denied' || undefined}
        >
          <IconLocate />
        </button>
        <button className="fab" aria-label={t('map.add')} title={t('map.add')} onClick={() => navigate('new')}>
          <IconPlus size={28} />
        </button>
      </div>

      {selected && (
        <PreviewSheet
          place={selected}
          category={categoryById.get(selected.categoryId)}
          now={now}
          distance={userLocation ? formatDistance(distanceKm(userLocation, selected)) : null}
          onClose={() => setSelectedId(null)}
          awayLabel={t('map.away')}
          catLabel={catName(categoryById.get(selected.categoryId))}
          openLabel={t('map.openPlace')}
          closeLabel={t('common.close')}
        />
      )}
    </div>
  )

}

function PreviewSheet(props: {
  place: Place
  category?: Category
  now: Date
  distance: string | null
  onClose: () => void
  awayLabel: string
  catLabel: string
  openLabel: string
  closeLabel: string
}) {
  const { place, category, now, distance, onClose } = props
  const startY = useRef<number | null>(null)
  const [dy, setDy] = useState(0)
  return (
    <div
      className="sheet"
      style={{ transform: dy > 0 ? `translateY(${dy}px)` : undefined, '--c': category?.color } as CSSProperties}
      onTouchStart={(e) => (startY.current = e.touches[0].clientY)}
      onTouchMove={(e) => startY.current !== null && setDy(Math.max(0, e.touches[0].clientY - startY.current))}
      onTouchEnd={() => {
        if (dy > 70) onClose()
        setDy(0)
        startY.current = null
      }}
    >
      <div className="sheet-handle" aria-hidden />
      <button className="sheet-close icon-btn" aria-label={props.closeLabel} onClick={onClose}>
        <IconX size={20} />
      </button>
      <button className="sheet-content" onClick={() => navigate(`place/${place.id}`)} aria-label={`${place.name} — ${props.openLabel}`}>
        <Cover place={place} category={category} className="sheet-cover" />
        <div className="sheet-info">
          <h2>{place.name}</h2>
          <div className="row wrap gap-s">
            <CategoryPill category={category} />
            <StatusBadge place={place} now={now} />
          </div>
          {distance && <p className="muted small">{distance} {props.awayLabel}</p>}
          <span className="sheet-more">
            {props.openLabel} <IconChevR size={16} />
          </span>
        </div>
      </button>
    </div>
  )
}
