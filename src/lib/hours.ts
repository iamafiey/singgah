import type { DayHours, WeekHours } from '../types'

export const emptyDay = (): DayHours => ({ closed: false, allDay: false, ranges: [{ open: '09:00', close: '18:00' }] })
export const emptyWeek = (): WeekHours => Array.from({ length: 7 }, emptyDay)

export function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** JS getDay() (0=Sun) → our index (0=Mon) */
export const dayIndex = (d: Date) => (d.getDay() + 6) % 7

export type OpenState =
  | { status: 'unknown' }
  | { status: 'open'; closesAt?: string; allDay?: boolean }
  | { status: 'closed'; opensAt?: string; opensDay?: number }

interface Interval { start: number; end: number; open: string; close: string }

/** Intervals for a day in minutes from that day's midnight; overnight ranges extend past 1440. */
function intervals(day: DayHours): Interval[] {
  if (day.closed) return []
  if (day.allDay) return [{ start: 0, end: 1440, open: '00:00', close: '24:00' }]
  return day.ranges
    .filter((r) => r.open && r.close)
    .map((r) => {
      const start = toMinutes(r.open)
      let end = toMinutes(r.close)
      if (end <= start) end += 1440
      return { start, end, open: r.open, close: r.close }
    })
}

export function hasHours(hours: WeekHours | null | undefined): hours is WeekHours {
  return !!hours && hours.length === 7 && hours.some((d) => d.closed || d.allDay || d.ranges.length > 0)
}

export function openState(hours: WeekHours | null | undefined, now = new Date()): OpenState {
  if (!hasHours(hours)) return { status: 'unknown' }
  const today = dayIndex(now)
  const yesterday = (today + 6) % 7
  const mins = now.getHours() * 60 + now.getMinutes()

  // Everything as minutes relative to today's midnight, covering yesterday's overnight spill.
  const all: Interval[] = [
    ...intervals(hours[yesterday]).map((i) => ({ ...i, start: i.start - 1440, end: i.end - 1440 })),
    ...intervals(hours[today]),
  ]
  const current = all.filter((i) => mins >= i.start && mins < i.end)
  if (current.length) {
    // Follow back-to-back intervals (e.g. all-day Mon then all-day Tue) to find the real closing time.
    let end = Math.max(...current.map((i) => i.end))
    const later: Interval[] = []
    for (let d = 1; d <= 7; d++) {
      later.push(...intervals(hours[(today + d) % 7]).map((i) => ({ ...i, start: i.start + 1440 * d, end: i.end + 1440 * d })))
    }
    const everything = [...all, ...later]
    let extended = true
    let guard = 0
    while (extended && guard++ < 20) {
      extended = false
      for (const i of everything) {
        if (i.start <= end && i.end > end) {
          end = i.end
          extended = true
        }
      }
    }
    if (end - mins >= 7 * 1440) return { status: 'open', allDay: true }
    return { status: 'open', closesAt: fromMinutes(end % 1440) }
  }

  // Find the next opening within a week.
  for (let d = 0; d <= 7; d++) {
    const idx = (today + d) % 7
    const starts = intervals(hours[idx])
      .map((i) => i.start + d * 1440)
      .filter((s) => s > mins)
      .sort((a, b) => a - b)
    if (starts.length) return { status: 'closed', opensAt: fromMinutes(starts[0] % 1440), opensDay: d === 0 ? undefined : idx }
  }
  return { status: 'closed' }
}

export function fromMinutes(m: number): string {
  const h = Math.floor(m / 60) % 24
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/** "17:30" → "5:30 pm" */
export function formatTime(t: string): string {
  if (t === '24:00') return '12 am'
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`
}

export function formatDay(day: DayHours, closedLabel: string, allDayLabel: string): string {
  if (day.closed) return closedLabel
  if (day.allDay) return allDayLabel
  if (!day.ranges.length) return '—'
  return day.ranges.map((r) => `${formatTime(r.open)} – ${formatTime(r.close)}`).join(', ')
}
