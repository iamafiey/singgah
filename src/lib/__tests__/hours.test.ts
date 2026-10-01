import { describe, expect, it } from 'vitest'
import { emptyWeek, openState, formatTime } from '../hours'
import type { DayHours, WeekHours } from '../../types'

const d = (...r: [string, string][]): DayHours => ({ closed: false, allDay: false, ranges: r.map(([open, close]) => ({ open, close })) })
const week = (day: DayHours, over: Record<number, DayHours> = {}): WeekHours => Array.from({ length: 7 }, (_, i) => over[i] ?? day)
// 2026-10-05 is a Monday
const at = (day: number, hh: number, mm = 0) => new Date(2026, 9, 5 + day, hh, mm)

describe('openState', () => {
  it('unknown without hours', () => {
    expect(openState(null).status).toBe('unknown')
  })

  it('handles simple hours', () => {
    const h = week(d(['09:00', '18:00']))
    expect(openState(h, at(0, 10))).toEqual({ status: 'open', closesAt: '18:00' })
    expect(openState(h, at(0, 18))).toMatchObject({ status: 'closed', opensDay: 1, opensAt: '09:00' })
    expect(openState(h, at(0, 8))).toMatchObject({ status: 'closed', opensAt: '09:00', opensDay: undefined })
  })

  it('handles split hours', () => {
    const h = week(d(['07:00', '11:00'], ['17:00', '23:00']))
    expect(openState(h, at(2, 8)).status).toBe('open')
    expect(openState(h, at(2, 13))).toMatchObject({ status: 'closed', opensAt: '17:00' })
    expect(openState(h, at(2, 22, 59))).toMatchObject({ status: 'open', closesAt: '23:00' })
  })

  it('handles overnight ranges from the previous day', () => {
    const h = week(d(['18:00', '03:00']), { 1: { closed: true, allDay: false, ranges: [] } })
    // Monday 18:00 → Tuesday 03:00, even though Tuesday itself is closed
    expect(openState(h, at(1, 2))).toMatchObject({ status: 'open', closesAt: '03:00' })
    expect(openState(h, at(1, 4))).toMatchObject({ status: 'closed', opensDay: 2 })
  })

  it('treats every-day 24h as always open', () => {
    const h = week({ closed: false, allDay: true, ranges: [] })
    expect(openState(h, at(3, 4))).toEqual({ status: 'open', allDay: true })
  })

  it('finds closing time across consecutive 24h days', () => {
    const h = week({ closed: false, allDay: true, ranges: [] }, { 6: d(['00:00', '20:00']) })
    expect(openState(h, at(5, 12))).toMatchObject({ status: 'open', closesAt: '20:00' })
  })

  it('closed days', () => {
    const h = week({ closed: true, allDay: false, ranges: [] })
    expect(openState(h, at(0, 12))).toEqual({ status: 'closed' })
  })

  it('default week works', () => {
    expect(openState(emptyWeek(), at(0, 12)).status).toBe('open')
  })
})

describe('formatTime', () => {
  it('formats', () => {
    expect(formatTime('00:00')).toBe('12 am')
    expect(formatTime('12:30')).toBe('12:30 pm')
    expect(formatTime('23:00')).toBe('11 pm')
  })
})
