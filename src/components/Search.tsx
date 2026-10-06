import { useMemo } from 'react'
import { useApp } from '../state'
import { usePlaces, useNow } from '../hooks'
import { search } from '../lib/search'
import type { Place } from '../types'
import { IconSearch, IconTag, IconX } from './Icons'
import { PlaceRow } from './PlaceBits'
import { CategoryIllustration } from './CategoryIcon'

const NO_PLACES: Place[] = []

export function SearchField({ onSubmit }: { onSubmit?: () => void }) {
  const { t, query, setQuery } = useApp()
  return (
    <form
      className="search-box"
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        ;(document.activeElement as HTMLElement | null)?.blur()
        onSubmit?.()
      }}
    >
      <IconSearch size={20} />
      <input
        type="search"
        enterKeyHint="search"
        placeholder={t('search.placeholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={t('search.placeholder')}
        autoComplete="off"
      />
      {query && (
        <button type="button" className="search-clear" aria-label={t('search.clear')} onClick={() => setQuery('')}>
          <IconX size={18} />
        </button>
      )}
    </form>
  )
}

/** Grouped results for the current query: places, categories, hashtags. */
export function SearchResults({ onPickPlace }: { onPickPlace: (id: string) => void }) {
  const { t, query, setQuery, categories, catName, setCatFilter, setTagFilter } = useApp()
  const places = usePlaces() ?? NO_PLACES
  const now = useNow()
  const results = useMemo(() => search(query, places, categories, catName), [query, places, categories, catName])
  const total = results.places.length + results.categories.length + results.tags.length

  if (total === 0) return <p className="empty">{t('search.none', { q: query })}</p>
  return (
    <div className="results-card">
      {results.places.length > 0 && (
        <section>
          <h2 className="serif-h">{t('search.places')}</h2>
          {results.places.slice(0, 20).map((p) => (
            <PlaceRow key={p.id} place={p} now={now} onClick={() => onPickPlace(p.id)} />
          ))}
        </section>
      )}
      {results.categories.length > 0 && (
        <section>
          <h2 className="serif-h">{t('search.categories')}</h2>
          {results.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className="trow"
              onClick={() => {
                setCatFilter([c.id])
                setTagFilter(null)
                setQuery('')
              }}
            >
              <CategoryIllustration category={c} size={32} />
              <span className="trow-name">{catName(c)}</span>
              <span className="trow-count">{t('cat.places', { n: places.filter((p) => p.categoryId === c.id).length })}</span>
            </button>
          ))}
        </section>
      )}
      {results.tags.length > 0 && (
        <section>
          <h2 className="serif-h">{t('search.tags')}</h2>
          {results.tags.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              className="trow"
              onClick={() => {
                setTagFilter(tag)
                setQuery('')
              }}
            >
              <IconTag size={20} />
              <span className="trow-name">#{tag}</span>
              <span className="trow-count">{t('cat.places', { n: count })}</span>
            </button>
          ))}
        </section>
      )}
    </div>
  )
}
