import { useMemo, useState, type CSSProperties } from 'react'
import { navigate, useApp, type SortBy } from '../state'
import { useFilteredPlaces, useNow, usePlaces } from '../hooks'
import { distanceKm } from '../lib/geo'
import { search } from '../lib/search'
import { SearchField } from '../components/Search'
import { CategoryRow } from '../components/CategoryRow'
import { MoreFiltersButton } from '../components/MoreFilters'
import { PlaceCard } from '../components/PlaceBits'
import { BUNDLED_ILLUSTRATIONS } from '../components/CategoryIcon'
import { IconX } from '../components/Icons'

type VisitTab = 'want' | 'visited'

function readTab(): VisitTab {
  try {
    return localStorage.getItem('singgah.visitTab') === 'visited' ? 'visited' : 'want'
  } catch {
    return 'want'
  }
}

/** Tab illustration: public/illustrations/<want|visited>.png once added (see BUNDLED_ILLUSTRATIONS), else an emoji. */
function TabIllustration({ kind }: { kind: VisitTab }) {
  const [failed, setFailed] = useState(false)
  const src = BUNDLED_ILLUSTRATIONS.includes(kind) && !failed ? `${import.meta.env.BASE_URL}illustrations/${kind}.png` : null
  return (
    <span className="illus" style={{ width: 44, height: 44, '--c': kind === 'visited' ? '#5b7a5e' : '#d9822b' } as CSSProperties} aria-hidden>
      {src ? <img src={src} alt="" onError={() => setFailed(true)} /> : <span className="illus-emoji" style={{ fontSize: 22 }}>{kind === 'visited' ? '✅' : '🚩'}</span>}
    </span>
  )
}

export function ListView() {
  const { t, categories, catName, userLocation, sortBy, setSortBy, query, tagFilter, setTagFilter } = useApp()
  const filtered = useFilteredPlaces()
  const total = usePlaces()?.length ?? 0
  const now = useNow()
  const [tab, setTabState] = useState<VisitTab>(readTab)
  const setTab = (v: VisitTab) => {
    setTabState(v)
    try {
      localStorage.setItem('singgah.visitTab', v)
    } catch {
      /* ignore */
    }
  }

  const base = useMemo(() => {
    if (!filtered) return undefined
    return query.trim() ? search(query, filtered, categories, catName).places : filtered
  }, [filtered, query, categories, catName])

  const counts = useMemo(() => ({ want: base?.filter((p) => !p.visited).length ?? 0, visited: base?.filter((p) => p.visited).length ?? 0 }), [base])

  const items = useMemo(() => {
    if (!base) return undefined
    const list = base.filter((p) => (tab === 'visited' ? p.visited : !p.visited))
    const effectiveSort: SortBy = sortBy === 'distance' && !userLocation ? 'recent' : sortBy
    if (effectiveSort === 'distance' && userLocation) list.sort((a, b) => distanceKm(userLocation, a) - distanceKm(userLocation, b))
    else if (effectiveSort === 'recent') list.sort((a, b) => b.createdAt - a.createdAt)
    else list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [base, tab, sortBy, userLocation])

  return (
    <div className="screen list-screen">
      <div className="list-head">
        <h1 className="serif-h page-title">{t('list.title')}</h1>
        <div className="visit-tabs" role="tablist" aria-label={t('list.title')}>
          {(['want', 'visited'] as VisitTab[]).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={`visit-tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
              <TabIllustration kind={k} />
              <span className="visit-tab-text">
                <strong>{k === 'visited' ? t('list.tabVisited') : t('list.tabWant')}</strong>
                <small>{t('list.count', { n: counts[k] })}</small>
              </span>
            </button>
          ))}
        </div>
        <SearchField />
      </div>
      <CategoryRow size={56} />
      <div className="list-tools">
        <MoreFiltersButton />
        {tagFilter && (
          <button type="button" className="chip on chip-tag" onClick={() => setTagFilter(null)} aria-label={`${t('filter.clear')}: #${tagFilter}`}>
            #{tagFilter} <IconX size={14} />
          </button>
        )}
        <div className="segmented" role="radiogroup" aria-label={t('list.sort')}>
          {(['distance', 'recent', 'name'] as SortBy[]).map((s) => (
            <button key={s} role="radio" aria-checked={sortBy === s} className={sortBy === s ? 'on' : ''} onClick={() => setSortBy(s)} disabled={s === 'distance' && !userLocation}>
              {t(`list.sort.${s}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="pgrid list-grid">
        {items?.map((p) => (
          <PlaceCard key={p.id} place={p} now={now} onClick={() => navigate(`place/${p.id}`)} />
        ))}
      </div>
      {items && items.length === 0 && (
        <p className="empty">{total === 0 ? t('list.empty') : (base?.length ?? 0) === 0 ? t('list.emptyFiltered') : tab === 'visited' ? t('list.emptyVisited') : t('list.emptyWant')}</p>
      )}
    </div>
  )
}
