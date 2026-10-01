import { bbox, lineString, nearestPointOnLine, point, pointToLineDistance } from '@turf/turf'
import { openState, type OpenState } from './hours'
import type { Route } from './routing'
import type { Place } from '../types'

export type ArrivalStatus = 'open' | 'closed' | 'unknown'

export interface RouteMatch {
  place: Place
  /** Straight-line distance from the spot to the route, km */
  offRouteKm: number
  /** Distance along the route to the point nearest the spot, km */
  alongKm: number
  arrival: Date
  arrivalState: OpenState
  arrivalStatus: ArrivalStatus
}

export interface MatchOptions {
  detourKm: number
  departure: Date
  onlyOpen?: boolean
}

/** Rough degrees of padding for a km distance (generous at Malaysian latitudes). */
const kmToDeg = (km: number) => km / 110

/**
 * Saved spots within `detourKm` of the route, in driving order, with an estimated arrival time
 * (proportional to the spot's position along the route) and whether it's open then.
 */
export function matchRoute(route: Route, places: Place[], opts: MatchOptions): RouteMatch[] {
  if (route.coordinates.length < 2) return []
  const line = lineString(route.coordinates)
  const [minX, minY, maxX, maxY] = bbox(line)
  const pad = kmToDeg(opts.detourKm) * 1.5
  const totalKm = route.distanceM / 1000
  const along0 = nearestPointOnLine(line, point(route.coordinates[route.coordinates.length - 1])).properties.totalDistance
  // Use turf's own line length for the proportion so units agree; fall back to the provider distance.
  const lineKm = along0 > 0 ? along0 : totalKm

  const out: RouteMatch[] = []
  for (const place of places) {
    // Cheap bounding-box reject before the per-segment maths.
    if (place.lng < minX - pad || place.lng > maxX + pad || place.lat < minY - pad || place.lat > maxY + pad) continue
    const pt = point([place.lng, place.lat])
    const offRouteKm = pointToLineDistance(pt, line, { units: 'kilometers' })
    if (offRouteKm > opts.detourKm) continue
    const alongKm = nearestPointOnLine(line, pt, { units: 'kilometers' }).properties.totalDistance
    const fraction = lineKm > 0 ? Math.min(1, Math.max(0, alongKm / lineKm)) : 0
    const arrival = new Date(opts.departure.getTime() + fraction * route.durationS * 1000)
    const arrivalState = openState(place.hours, arrival)
    out.push({ place, offRouteKm, alongKm, arrival, arrivalState, arrivalStatus: arrivalState.status })
  }
  out.sort((a, b) => a.alongKm - b.alongKm)
  return opts.onlyOpen ? out.filter((m) => m.arrivalStatus === 'open') : out
}

export function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} h ${rest} min` : `${h} h`
}
