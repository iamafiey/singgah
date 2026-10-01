import { useMemo, useRef, useState } from 'react'
import { useApp } from '../state'
import { usePlaces } from '../hooks'
import { search } from '../lib/search'
import { IconSearch, IconTag, IconX } from './Icons'
import { distanceKm, formatDistance } from '../lib/geo'
import type { Place } from '../types'

const NO_PLACES: Place[] = []

/** Persistent search with grouped results (Places / Categories / Tags). */
export function SearchBar({ onPickPlace, keepQuery }: { onPickPlace: (id: string) => void; keepQuery?: boolean }) {
  const { t, query, setQuery, categories, catName, categoryById, setCatFilter, setTagFilter, userLocation } = useApp()
  const places = usePlaces() ?? NO_PLACES
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => search(query, places, categories, catName), [query, places, categories, catName])
  const open = focused && query.trim().length > 0
  const total = results.places.length + results.categories.length + results.tags.length

  const done = (clear = !keepQuery) => {
    if (clear) setQuery('')
    setFocused(false)
    inputRef.current?.blur()
  }

  return (
    <div className="search">
      <form
        className="search-box"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          if (results.places[0] && !keepQuery) {
            onPickPlace(results.places[0].id)
            done(true)
          } else done(false)
        }}
      >
        <IconSearch size={20} />
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          aria-label={t('search.placeholder')}
          autoComplete="off"
        />
        {query && (
          <button type="button" className="search-clear" aria-label={t('search.clear')} onClick={() => setQuery('')}>
            <IconX size={18} />
          </button>
        )}
      </form>

      {open && (
        <div className="search-results" onMouseDown={(e) => e.preventDefault()}>
          {total === 0 && <p className="muted pad">{t('search.none', { q: query })}</p>}
          {results.places.length > 0 && (
            <section>
              <h3>{t('search.places')}</h3>
              {results.places.slice(0, 8).map((p) => {
                const c = categoryById.get(p.categoryId)
                return (
                  <button
                    key={p.id}
                    className="result"
                    onClick={() => {
                      onPickPlace(p.id)
                      done(true)
                    }}
                  >
                    <span className="result-icon" style={{ background: c?.color }}>{c?.emoji ?? '📍'}</span>
                    <span className="result-main">
                      <strong>{p.name}</strong>
                      <small>{[catName(c), p.address.split(',').slice(-3, -1).join(',').trim()].filter(Boolean).join(' · ')}</small>
                    </span>
                    {userLocation && <small className="muted">{formatDistance(distanceKm(userLocation, p))}</small>}
                  </button>
                )
              })}
            </section>
          )}
          {results.categories.length > 0 && (
            <section>
              <h3>{t('search.categories')}</h3>
              {results.categories.map((c) => (
                <button
                  key={c.id}
                  className="result"
                  onClick={() => {
                    setCatFilter([c.id])
                    setTagFilter(null)
                    done(true)
                  }}
                >
                  <span className="result-icon" style={{ background: c.color }}>{c.emoji}</span>
                  <span className="result-main">
                    <strong>{catName(c)}</strong>
                    <small>{t('cat.places', { n: places.filter((p) => p.categoryId === c.id).length })}</small>
                  </span>
                </button>
              ))}
            </section>
          )}
          {results.tags.length > 0 && (
            <section>
              <h3>{t('search.tags')}</h3>
              {results.tags.map(({ tag, count }) => (
                <button
                  key={tag}
                  className="result"
                  onClick={() => {
                    setTagFilter(tag)
                    done(true)
                  }}
                >
                  <span className="result-icon tag-icon"><IconTag size={18} /></span>
                  <span className="result-main">
                    <strong>#{tag}</strong>
                    <small>{t('cat.places', { n: count })}</small>
                  </span>
                </button>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
