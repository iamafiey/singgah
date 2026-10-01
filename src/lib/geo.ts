export interface LatLng { lat: number; lng: number }

export const KLANG_VALLEY: LatLng = { lat: 3.139, lng: 101.6869 }

export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

export interface GeocodeResult {
  lat: number
  lng: number
  label: string
  short: string
}

const NOMINATIM = 'https://nominatim.openstreetmap.org'

/** Forward geocode, biased (not restricted) to Malaysia. */
export async function searchAddress(q: string, lang: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    q,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
    countrycodes: 'my',
    // Rough Peninsular + East Malaysia box; bounded=0 keeps it a bias.
    viewbox: '99.6,7.4,119.3,0.8',
    'accept-language': lang === 'ms' ? 'ms,en' : 'en,ms',
  })
  const res = await fetch(`${NOMINATIM}/search?${params}`)
  if (!res.ok) throw new Error('Search failed')
  const data: Array<{ lat: string; lon: string; display_name: string; name?: string }> = await res.json()
  return data.map((d) => ({
    lat: Number(d.lat),
    lng: Number(d.lon),
    label: d.display_name,
    short: d.name || d.display_name.split(',')[0],
  }))
}

export async function reverseGeocode(p: LatLng, lang: string): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(p.lat),
    lon: String(p.lng),
    format: 'jsonv2',
    zoom: '18',
    'accept-language': lang === 'ms' ? 'ms,en' : 'en,ms',
  })
  try {
    const res = await fetch(`${NOMINATIM}/reverse?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.display_name ?? null
  } catch {
    return null
  }
}

export function getCurrentPosition(timeout = 10000): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Geolocation unavailable'))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout, maximumAge: 60000 },
    )
  })
}

export const wazeUrl = (p: LatLng) => `https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`
export const googleMapsUrl = (p: LatLng) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`
