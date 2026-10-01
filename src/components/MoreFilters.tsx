import { useMemo, useState } from 'react'
import { useApp } from '../state'
import { applyFilters, usePlaces } from '../hooks'
import { PRACTICAL_FILTERS } from '../config/practicalTags'
import { text } from '../lib/practical'
import { Modal } from './common'
import { IconFilter } from './Icons'

/** "Filters" chip + sheet for the practical-tag filters. Used wherever FilterChips is. */
export function MoreFiltersButton() {
  const { t, practicalFilter } = useApp()
  const [open, setOpen] = useState(false)
  const n = practicalFilter.length
  return (
    <>
      <button type="button" className={`chip chip-filters ${n ? 'on' : ''}`} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={n ? `${t('filters.more')} (${n})` : t('filters.more')}>
        <IconFilter size={16} /> {t('filters.more')}
        {n > 0 && <span className="chip-count">{n}</span>}
      </button>
      {open && <MoreFiltersSheet onClose={() => setOpen(false)} />}
    </>
  )
}

function MoreFiltersSheet({ onClose }: { onClose: () => void }) {
  const { t, lang, practicalFilter, setPracticalFilter, catFilter, tagFilter } = useApp()
  const places = usePlaces() ?? []
  const [draft, setDraft] = useState<string[]>(practicalFilter)
  const count = useMemo(() => applyFilters(places, { catFilter, tagFilter, practicalFilter: draft }).length, [places, catFilter, tagFilter, draft])
  const toggle = (id: string) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))
  const apply = () => {
    setPracticalFilter(draft)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t('filters.title')}
      actions={
        <>
          <button type="button" className="btn btn-ghost" onClick={() => setDraft([])} disabled={!draft.length}>
            {t('filters.clear')}
          </button>
          <button type="button" className="btn btn-primary" onClick={apply}>
            {count === 1 ? t('filters.show1') : t('filters.show', { n: count })}
          </button>
        </>
      }
    >
      <p className="small">{t('filters.hint')}</p>
      <div className="filter-list">
        {PRACTICAL_FILTERS.map((f) => {
          const on = draft.includes(f.id)
          return (
            <label key={f.id} className="switch-row filter-row">
              <span>
                <span aria-hidden className="filter-icon">{f.icon}</span> {text(f.label, lang)}
              </span>
              <input type="checkbox" role="switch" checked={on} onChange={() => toggle(f.id)} />
              <span className="switch" aria-hidden />
            </label>
          )
        })}
      </div>
    </Modal>
  )
}
