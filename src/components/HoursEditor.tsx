import { useApp } from '../state'
import type { DayHours, WeekHours } from '../types'
import { emptyWeek } from '../lib/hours'
import { IconCopy, IconPlus, IconX } from './Icons'

export function HoursEditor({ value, onChange }: { value: WeekHours | null; onChange: (h: WeekHours | null) => void }) {
  const { t } = useApp()
  if (!value) {
    return (
      <button type="button" className="btn btn-ghost full" onClick={() => onChange(emptyWeek())}>
        <IconPlus size={18} /> {t('edit.addHours')}
      </button>
    )
  }
  const setDay = (i: number, d: DayHours) => onChange(value.map((x, j) => (j === i ? d : x)))
  const copyMonday = (days: number[]) => onChange(value.map((x, j) => (days.includes(j) ? structuredClone(value[0]) : x)))

  return (
    <div className="hours-editor">
      <div className="hours-tools">
        <button type="button" className="chip" onClick={() => copyMonday([1, 2, 3, 4])}>
          <IconCopy size={14} /> {t('hours.copyMon')}
        </button>
        <button type="button" className="chip" onClick={() => copyMonday([1, 2, 3, 4, 5, 6])}>
          <IconCopy size={14} /> {t('hours.copyMonAll')}
        </button>
        <button type="button" className="chip" onClick={() => onChange(value.map(() => ({ closed: false, allDay: true, ranges: [] })))}>
          {t('hours.set24')}
        </button>
      </div>

      {value.map((d, i) => (
        <div className={`day-row ${d.closed ? 'is-closed' : ''}`} key={i}>
          <div className="day-head">
            <strong>{t(`day.${i}` as 'day.0')}</strong>
            <div className="row gap-s">
              <label className="toggle">
                <input type="checkbox" checked={d.closed} onChange={(e) => setDay(i, { ...d, closed: e.target.checked, allDay: e.target.checked ? false : d.allDay })} />
                <span>{t('hours.closed')}</span>
              </label>
              <label className="toggle">
                <input type="checkbox" checked={d.allDay} disabled={d.closed} onChange={(e) => setDay(i, { ...d, allDay: e.target.checked })} />
                <span>24h</span>
              </label>
            </div>
          </div>
          {!d.closed && !d.allDay && (
            <div className="ranges">
              {d.ranges.map((r, ri) => (
                <div className="range" key={ri}>
                  <input
                    type="time"
                    aria-label={`${t(`day.${i}` as 'day.0')} ${t('hours.open')}`}
                    value={r.open}
                    onChange={(e) => setDay(i, { ...d, ranges: d.ranges.map((x, k) => (k === ri ? { ...x, open: e.target.value } : x)) })}
                  />
                  <span aria-hidden>–</span>
                  <input
                    type="time"
                    aria-label={`${t(`day.${i}` as 'day.0')} ${t('hours.close')}`}
                    value={r.close}
                    onChange={(e) => setDay(i, { ...d, ranges: d.ranges.map((x, k) => (k === ri ? { ...x, close: e.target.value } : x)) })}
                  />
                  <button type="button" className="icon-btn small" aria-label={t('common.remove')} onClick={() => setDay(i, { ...d, ranges: d.ranges.filter((_, k) => k !== ri) })}>
                    <IconX size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  const last = d.ranges[d.ranges.length - 1]
                  const next = last ? { open: last.close, close: '23:00' } : { open: '09:00', close: '18:00' }
                  setDay(i, { ...d, ranges: [...d.ranges, next] })
                }}
              >
                <IconPlus size={14} /> {t('hours.addRange')}
              </button>
            </div>
          )}
        </div>
      ))}

      <button type="button" className="btn btn-danger-ghost full" onClick={() => onChange(null)}>
        {t('edit.removeHours')}
      </button>
    </div>
  )
}
