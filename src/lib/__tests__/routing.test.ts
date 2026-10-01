import { afterEach, describe, expect, it, vi } from 'vitest'
import { getRoute, osrmProvider, RoutingError, setRoutingProvider, type RoutingProvider } from '../routing'

const A = { lat: 2.96, lng: 101.76 }
const B = { lat: 4.6, lng: 101.08 }
const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  setRoutingProvider(osrmProvider())
})

describe('osrmProvider', () => {
  it('parses a route and builds the right URL', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      json({ code: 'Ok', routes: [{ distance: 205000, duration: 8400, geometry: { coordinates: [[101.76, 2.96], [101.08, 4.6]] } }] }),
    )
    const r = await osrmProvider().route(A, B)
    expect(spy.mock.calls[0][0]).toBe('https://router.project-osrm.org/route/v1/driving/101.76,2.96;101.08,4.6?overview=full&geometries=geojson')
    expect(r).toEqual({ coordinates: [[101.76, 2.96], [101.08, 4.6]], distanceM: 205000, durationS: 8400, provider: 'osrm' })
  })

  it('maps NoRoute to a no-route error', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => json({ code: 'NoRoute', message: 'Impossible route' }, 400))
    await expect(osrmProvider().route(A, B)).rejects.toMatchObject({ code: 'no-route' })
  })

  it('maps HTTP errors to server errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(new Response('busy', { status: 503 })))
    await expect(osrmProvider().route(A, B)).rejects.toMatchObject({ code: 'server' })
  })

  it('maps fetch failures to network errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')))
    await expect(osrmProvider().route(A, B)).rejects.toMatchObject({ code: 'network' })
  })

  it('times out', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_url, init) =>
        new Promise((_res, rej) => {
          init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))
        }),
    )
    const err = await osrmProvider().route(A, B, { timeoutMs: 20 }).catch((e) => e)
    expect(err).toBeInstanceOf(RoutingError)
    expect(err.code).toBe('timeout')
  })

  it('reports caller aborts separately', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_url, init) =>
        new Promise((_res, rej) => {
          init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))
        }),
    )
    const ctrl = new AbortController()
    const p = osrmProvider().route(A, B, { signal: ctrl.signal })
    ctrl.abort()
    await expect(p).rejects.toMatchObject({ code: 'aborted' })
  })
})

describe('provider swapping', () => {
  it('getRoute uses the configured provider', async () => {
    const fake: RoutingProvider = { name: 'fake', route: async () => ({ coordinates: [[0, 0], [1, 1]], distanceM: 1, durationS: 1, provider: 'fake' }) }
    setRoutingProvider(fake)
    expect((await getRoute(A, B)).provider).toBe('fake')
  })
})
