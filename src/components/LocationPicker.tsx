import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { useApp } from '../state'
import { KLANG_VALLEY, getCurrentPosition, searchAddress, type GeocodeResult, type LatLng } from '../lib/geo'
import { IconLocate, IconSearch } from './Icons'

const pickIcon = () =>
  L.divIcon({ className: 'pin-wrap', html: '<div class="pin pin-pick" style="--c:var(--accent)"><span>📍</span></div>', iconSize: [40, 48], iconAnchor: [20, 46] })

export function LocationPicker({ value, onChange }: { value: LatLng | null; onChange: (p: LatLng, address?: string) => void }) {
  const { t, lang, userLocation, showToast } = useApp()
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [q, setQ] = useState('')
  const [results, setResults] = useState<GeocodeResult[] | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const start = value ?? userLocation ?? KLANG_VALLEY
    const map = L.map(elRef.current, { zoomControl: true, attributionControl: true }).setView([start.lat, start.lng], value ? 16 : userLocation ? 14 : 11)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map)
    map.attributionControl.setPrefix(false)
    map.on('click', (e: L.LeafletMouseEvent) => onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }))
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the marker in sync with the value
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!value) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }
    if (!markerRef.current) {
      const m = L.marker([value.lat, value.lng], { draggable: true, icon: pickIcon(), autoPan: true })
      m.on('dragend', () => {
        const ll = m.getLatLng()
        onChangeRef.current({ lat: ll.lat, lng: ll.lng })
      })
      m.addTo(map)
      markerRef.current = m
    } else markerRef.current.setLatLng([value.lat, value.lng])
    if (!map.getBounds().pad(-0.1).contains([value.lat, value.lng])) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 16))
  }, [value])

  const doSearch = async () => {
    if (!q.trim()) return
    setBusy(true)
    try {
      setResults(await searchAddress(q.trim(), lang))
    } catch {
      setResults([])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="loc-picker">
      <div className="row gap-s">
        <div className="input-with-btn grow">
          <input
            type="search"
            enterKeyHint="search"
            value={q}
            placeholder={t('edit.searchAddress')}
            aria-label={t('edit.searchAddress')}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                doSearch()
              }
            }}
          />
          <button type="button" className="icon-btn" aria-label={t('edit.search')} onClick={doSearch} disabled={busy}>
            <IconSearch size={20} />
          </button>
        </div>
      </div>
      {busy && <p className="muted small">{t('edit.searching')}</p>}
      {results && !busy && (
        <div className="geo-results">
          {results.length === 0 && <p className="muted small pad">{t('edit.noResults')}</p>}
          {results.map((r, i) => (
            <button
              type="button"
              key={i}
              className="result"
              onClick={() => {
                onChange({ lat: r.lat, lng: r.lng }, r.label)
                mapRef.current?.setView([r.lat, r.lng], 17)
                setResults(null)
              }}
            >
              <span className="result-main">
                <strong>{r.short}</strong>
                <small>{r.label}</small>
              </span>
            </button>
          ))}
        </div>
      )}
      <div ref={elRef} className="picker-map" />
      <div className="row between wrap gap-s">
        <p className="muted small grow">{t('edit.tapMap')}</p>
        <button
          type="button"
          className="btn btn-ghost small"
          onClick={async () => {
            try {
              const p = await getCurrentPosition()
              onChange(p)
              mapRef.current?.setView([p.lat, p.lng], 17)
            } catch {
              showToast(t('edit.locError'))
            }
          }}
        >
          <IconLocate size={18} /> {t('edit.useMyLocation')}
        </button>
      </div>
    </div>
  )
}
