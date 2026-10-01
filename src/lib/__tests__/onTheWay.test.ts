import { describe, expect, it } from 'vitest'
import { matchRoute } from '../onTheWay'
import type { Route } from '../routing'
import type { DayHours, Place } from '../../types'

// A straight-ish northbound route: Bangi → Ipoh (~205 km, 2h20m)
const route: Route = {
  coordinates: [
    [101.76, 2.96],
    [101.6, 3.3],
    [101.45, 3.7],
    [101.3, 4.1],
    [101.08, 4.6],
  ],
  distanceM: 205000,
  durationS: 8400,
  provider: 'test',
}

const d = (open: string, close: string): DayHours => ({ closed: false, allDay: false, ranges: [{ open, close }] })
const place = (id: string, lat: number, lng: number, hours: Place['hours'] = null): Place => ({
  id,
  name: id,
  categoryId: 'cat-cafe',
  lat,
  lng,
  address: '',
  notes: '',
  hours,
  photoIds: [],
  links: [],
  tags: [],
  visited: false,
  createdAt: 0,
  updatedAt: 0,
})

// Monday 2026-10-05 09:00
const departure = new Date(2026, 9, 5, 9, 0)

describe('matchRoute', () => {
  const places = [
    place('near-ipoh', 4.55, 101.12, Array.from({ length: 7 }, () => d('10:00', '22:00'))),
    place('start', 2.965, 101.765, Array.from({ length: 7 }, () => d('10:00', '22:00'))),
    place('midway-1km-off', 3.7, 101.46),
    place('melaka-far', 2.19, 102.25),
  ]

  it('keeps spots within the detour, in driving order', () => {
    const m = matchRoute(route, places, { detourKm: 3, departure })
    expect(m.map((x) => x.place.id)).toEqual(['start', 'midway-1km-off', 'near-ipoh'])
    expect(m[1].offRouteKm).toBeLessThan(3)
    expect(m[0].alongKm).toBeLessThan(m[1].alongKm)
  })

  it('a smaller detour drops further spots', () => {
    const m = matchRoute(route, places, { detourKm: 1, departure })
    expect(m.map((x) => x.place.id)).toEqual(['start'])
  })

  it('estimates arrival proportionally and checks hours then', () => {
    const m = matchRoute(route, places, { detourKm: 3, departure })
    const start = m.find((x) => x.place.id === 'start')!
    const ipoh = m.find((x) => x.place.id === 'near-ipoh')!
    // Start: right at departure (09:00) → before 10:00 opening
    expect(start.arrival.getTime() - departure.getTime()).toBeLessThan(5 * 60 * 1000)
    expect(start.arrivalStatus).toBe('closed')
    // Near Ipoh: ~2h+ later → open
    expect(ipoh.arrival.getHours()).toBeGreaterThanOrEqual(11)
    expect(ipoh.arrivalStatus).toBe('open')
    expect(m.find((x) => x.place.id === 'midway-1km-off')!.arrivalStatus).toBe('unknown')
  })

  it('onlyOpen keeps spots open on arrival', () => {
    const m = matchRoute(route, places, { detourKm: 3, departure, onlyOpen: true })
    expect(m.map((x) => x.place.id)).toEqual(['near-ipoh'])
  })
})
