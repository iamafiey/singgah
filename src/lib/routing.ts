import type { LatLng } from './geo'

/** A driving route. Coordinates are GeoJSON order: [lng, lat]. */
export interface Route {
  coordinates: [number, number][]
  distanceM: number
  durationS: number
  provider: string
}

export type RoutingErrorCode = 'timeout' | 'no-route' | 'network' | 'server' | 'aborted'

export class RoutingError extends Error {
  readonly code: RoutingErrorCode
  constructor(code: RoutingErrorCode, message?: string) {
    super(message ?? code)
    this.code = code
    this.name = 'RoutingError'
  }
}

export interface RouteOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

/**
 * Anything that can turn two points into a driving route.
 * To switch to OpenRouteService or Google later, implement this and call setRoutingProvider().
 */
export interface RoutingProvider {
  name: string
  route(from: LatLng, to: LatLng, opts?: RouteOptions): Promise<Route>
}

const DEFAULT_TIMEOUT = 15000

/** fetch with a timeout and an optional caller abort signal, mapped to RoutingError. */
export async function fetchJson(url: string, opts: RouteOptions = {}): Promise<unknown> {
  const ctrl = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    ctrl.abort()
  }, opts.timeoutMs ?? DEFAULT_TIMEOUT)
  const onAbort = () => ctrl.abort()
  opts.signal?.addEventListener('abort', onAbort)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      /* non-JSON error page */
    }
    if (!res.ok) {
      // OSRM answers 400 with { code: 'NoRoute' | 'NoSegment' } when the points can't be connected.
      const code = (body as { code?: string } | null)?.code
      if (code === 'NoRoute' || code === 'NoSegment') throw new RoutingError('no-route')
      throw new RoutingError('server', `HTTP ${res.status}`)
    }
    return body
  } catch (e) {
    if (e instanceof RoutingError) throw e
    if (timedOut) throw new RoutingError('timeout')
    if (opts.signal?.aborted) throw new RoutingError('aborted')
    throw new RoutingError('network', e instanceof Error ? e.message : String(e))
  } finally {
    clearTimeout(timer)
    opts.signal?.removeEventListener('abort', onAbort)
  }
}

interface OsrmResponse {
  code: string
  routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[]
}

/** OSRM. The public demo server is for development only — point baseUrl at your own instance for production. */
export function osrmProvider(baseUrl = 'https://router.project-osrm.org'): RoutingProvider {
  return {
    name: 'osrm',
    async route(from, to, opts) {
      const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
      const url = `${baseUrl}/route/v1/driving/${coords}?overview=full&geometries=geojson`
      const data = (await fetchJson(url, opts)) as OsrmResponse | null
      if (!data || data.code !== 'Ok' || !data.routes?.length) {
        if (data?.code === 'NoRoute' || data?.code === 'NoSegment' || data?.code === 'Ok') throw new RoutingError('no-route')
        throw new RoutingError('server', data?.code)
      }
      const r = data.routes[0]
      if (!r.geometry?.coordinates?.length || r.geometry.coordinates.length < 2) throw new RoutingError('no-route')
      return { coordinates: r.geometry.coordinates, distanceM: r.distance, durationS: r.duration, provider: 'osrm' }
    },
  }
}

let provider: RoutingProvider = osrmProvider()

export function setRoutingProvider(p: RoutingProvider) {
  provider = p
}

export function getRoute(from: LatLng, to: LatLng, opts?: RouteOptions): Promise<Route> {
  return provider.route(from, to, opts)
}
