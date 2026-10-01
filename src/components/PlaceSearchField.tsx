import { useState } from 'react'
import { useApp } from '../state'
import { usePlaces } from '../hooks'
import { searchAddress, type GeocodeResult } from '../lib/geo'
import { normalise } from '../lib/search'
import type { RoutePoint } from '../types'
import { IconLocate, IconSearch, IconX } from './Icons'

/**
 * Pick a point by searching saved spots + Nominatim (biased to Malaysia).
 * With `allowCurrent`, `null` means "my current location".
 */
export function PlaceSearchField({
  label,
  value,
  onChange,
  allowCurrent,
  placeholder,
}: {
  label: string
  value: RoutePoint | null | undefined
  onChange: (p: RoutePoint | null | undefined) => void
  allowCurrent?: boolean
  placeholder: string
}) {
  const { t, lang, categoryById } = useApp()
  const places = usePlaces() ?? []
  const [editing, setEditing] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<GeocodeResult[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const showInput = editing || value === undefined || (value === null && !allowCurrent)
  const savedMatches = q.trim()
    ? places.filter((p) => normalise(p.name).includes(normalise(q.trim()))).slice(0, 4)
    : []

  const run = async () => {
    if (!q.trim()) return
    setBusy(true)
    setFailed(false)
    try {
      setResults(await searchAddress(q.trim(), lang))
    } catch {
      setResults([])
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const pick = (p: RoutePoint | null) => {
    onChange(p)
    setEditing(false)
    setQ('')
    setResults(null)
  }

  return (
    <div className="psf">
      <span className="psf-label">{label}</span>
      {!showInput ? (
        <button type="button" className="psf-value" onClick={() => setEditing(true)}>
          {value === null ? (
            <>
              <IconLocate size={18} /> <span>{t('otw.currentLocation')}</span>
            </>
          ) : (
            <span>{value?.label}</span>
          )}
          <small>{t('otw.change')}</small>
        </button>
      ) : (
        <div className="psf-edit">
          <div className="input-with-btn">
            <input
              type="search"
              enterKeyHint="search"
              value={q}
              autoFocus={editing}
              placeholder={placeholder}
              aria-label={label}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  run()
                }
                if (e.key === 'Escape' && value !== undefined) setEditing(false)
              }}
            />
            <button type="button" className="icon-btn" aria-label={t('edit.search')} onClick={run} disabled={busy}>
              <IconSearch size={20} />
            </button>
          </div>
          <div className="psf-results">
            {allowCurrent && (
              <button type="button" className="result" onClick={() => pick(null)}>
                <span className="result-icon"><IconLocate size={18} /></span>
                <span className="result-main"><strong>{t('otw.currentLocation')}</strong></span>
              </button>
            )}
            {savedMatches.map((p) => {
              const c = categoryById.get(p.categoryId)
              return (
                <button type="button" key={p.id} className="result" onClick={() => pick({ label: p.name, lat: p.lat, lng: p.lng })}>
                  <span className="result-icon">{c?.emoji ?? '📍'}</span>
                  <span className="result-main">
                    <strong>{p.name}</strong>
                    <small>{t('otw.savedSpot')}</small>
                  </span>
                </button>
              )
            })}
            {busy && <p className="muted small pad">{t('edit.searching')}</p>}
            {failed && <p className="muted small pad">{t('otw.searchFailed')}</p>}
            {results && !busy && !failed && results.length === 0 && <p className="muted small pad">{t('edit.noResults')}</p>}
            {results?.map((r, i) => (
              <button type="button" key={i} className="result" onClick={() => pick({ label: r.short, lat: r.lat, lng: r.lng })}>
                <span className="result-main">
                  <strong>{r.short}</strong>
                  <small>{r.label}</small>
                </span>
              </button>
            ))}
            {value !== undefined && (
              <button type="button" className="link-btn psf-cancel" onClick={() => setEditing(false)}>
                <IconX size={14} /> {t('common.cancel')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
