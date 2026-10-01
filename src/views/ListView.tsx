import { useMemo } from 'react'
import { navigate, useApp, type SortBy } from '../state'
import { useFilteredPlaces, useNow, usePlaces } from '../hooks'
import { distanceKm, formatDistance } from '../lib/geo'
import { search } from '../lib/search'
import { SearchBar } from '../components/SearchBar'
import { FilterChips } from '../components/FilterChips'
import { CategoryPill, Cover, StatusBadge } from '../components/common'
import { IconCheck, IconPlus } from '../components/Icons'
import { PracticalBadges } from '../components/PracticalBadges'

export function ListView() {
  const { t, categoryById, categories, catName, userLocation, sortBy, setSortBy, query, focusPlace } = useApp()
  const filtered = useFilteredPlaces()
  const total = usePlaces()?.length ?? 0
  const now = useNow()

  const items = useMemo(() => {
    if (!filtered) return undefined
    const base = query.trim() ? search(query, filtered, categories, catName).places : filtered
    const withDist = base.map((p) => ({ p, d: userLocation ? distanceKm(userLocation, p) : null }))
    const sorted = [...withDist]
    const effectiveSort: SortBy = sortBy === 'distance' && !userLocation ? 'recent' : sortBy
    if (effectiveSort === 'distance') sorted.sort((a, b) => (a.d ?? 0) - (b.d ?? 0))
    else if (effectiveSort === 'recent') sorted.sort((a, b) => b.p.createdAt - a.p.createdAt)
    else sorted.sort((a, b) => a.p.name.localeCompare(b.p.name))
    return sorted
  }, [filtered, query, categories, catName, userLocation, sortBy])

  return (
    <div className="screen list-screen">
      <div className="list-top">
        <SearchBar onPickPlace={focusPlace} keepQuery />
        <FilterChips />
        <div className="row between list-meta">
          <span className="muted small">{items ? t('list.count', { n: items.length }) : ''}</span>
          <div className="segmented" role="radiogroup" aria-label="Sort">
            {(['distance', 'recent', 'name'] as SortBy[]).map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={sortBy === s}
                className={sortBy === s ? 'on' : ''}
                onClick={() => setSortBy(s)}
                disabled={s === 'distance' && !userLocation}
              >
                {t(`list.sort.${s}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ul className="cards">
        {items?.map(({ p, d }) => {
          const c = categoryById.get(p.categoryId)
          return (
            <li key={p.id}>
              <button className="card" onClick={() => navigate(`place/${p.id}`)}>
                <div className="card-media">
                  <Cover place={p} category={c} className="card-cover" />
                  {p.visited && (
                    <span className="card-visited" aria-label={t('list.visited')} title={t('list.visited')}>
                      <IconCheck size={14} />
                    </span>
                  )}
                </div>
                <div className="card-body">
                  <strong className="card-title">{p.name}</strong>
                  <CategoryPill category={c} />
                  <span className="meta">
                    <StatusBadge place={p} now={now} />
                    {d !== null && <span>{formatDistance(d)}</span>}
                  </span>
                  <PracticalBadges info={p.practical} max={4} />
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      {items && items.length === 0 && <p className="empty">{total === 0 ? t('list.empty') : t('list.emptyFiltered')}</p>}

      <button className="fab fab-fixed" aria-label={t('map.add')} title={t('map.add')} onClick={() => navigate('new')}>
        <IconPlus size={28} />
      </button>
    </div>
  )
}
