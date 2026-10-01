import type { CSSProperties } from 'react'
import { useApp } from '../state'
import { IconX } from './Icons'
import { MoreFiltersButton } from './MoreFilters'

export function FilterChips() {
  const { t, categories, catName, catFilter, setCatFilter, tagFilter, setTagFilter } = useApp()
  const toggle = (id: string) => setCatFilter(catFilter.includes(id) ? catFilter.filter((x) => x !== id) : [...catFilter, id])
  return (
    <div className="chips" role="toolbar" aria-label="Filters">
      <MoreFiltersButton />
      <button className={`chip ${catFilter.length === 0 ? 'on' : ''}`} aria-pressed={catFilter.length === 0} onClick={() => setCatFilter([])}>
        {t('filter.all')}
      </button>
      {tagFilter && (
        <button className="chip on chip-tag" onClick={() => setTagFilter(null)} aria-label={`${t('filter.clear')}: #${tagFilter}`}>
          #{tagFilter} <IconX size={14} />
        </button>
      )}
      {categories.map((c) => {
        const on = catFilter.includes(c.id)
        return (
          <button key={c.id} className={`chip ${on ? 'on' : ''}`} style={{ '--c': c.color } as CSSProperties} aria-pressed={on} onClick={() => toggle(c.id)}>
            <span aria-hidden>{c.emoji}</span> {catName(c)}
          </button>
        )
      })}
    </div>
  )
}
