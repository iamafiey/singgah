import { useEffect, useState } from 'react'
import { useApp } from '../state'
import type { LatLng } from '../lib/geo'

interface Weather { temp: number; code: number; day: boolean }

const CACHE_MS = 20 * 60 * 1000

async function fetchWeather(p: LatLng): Promise<Weather> {
  const key = `singgah.weather.${p.lat.toFixed(1)},${p.lng.toFixed(1)}`
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) ?? 'null') as { at: number; w: Weather } | null
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.w
  } catch {
    /* ignore */
  }
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat.toFixed(3)}&longitude=${p.lng.toFixed(3)}&current=temperature_2m,weather_code,is_day&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error('weather')
  const d = await res.json()
  const w: Weather = { temp: Math.round(d.current.temperature_2m), code: d.current.weather_code, day: d.current.is_day === 1 }
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), w }))
  } catch {
    /* ignore */
  }
  return w
}

type Kind = 'clear' | 'cloud' | 'rain' | 'storm' | 'fog'
const kindOf = (code: number): Kind => (code === 0 ? 'clear' : code <= 3 ? 'cloud' : code <= 48 ? 'fog' : code >= 95 ? 'storm' : 'rain')
const labelKey = { clear: 'weather.clear', cloud: 'weather.cloud', rain: 'weather.rain', storm: 'weather.storm', fog: 'weather.fog' } as const

function WeatherIcon({ kind, day }: { kind: Kind; day: boolean }) {
  const p = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  const cloud = <path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 11.1 3.5 3.5 0 0 0 7 18z" />
  if (kind === 'clear')
    return day ? (
      <svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></svg>
    ) : (
      <svg {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
    )
  if (kind === 'rain') return <svg {...p}>{cloud}<path d="M9 21l1-2M13 21l1-2" /></svg>
  if (kind === 'storm') return <svg {...p}>{cloud}<path d="M12.5 18.5l-2 3h3l-2 3" /></svg>
  if (kind === 'fog') return <svg {...p}><path d="M4 10h16M6 14h12M8 18h8" /></svg>
  return <svg {...p}>{cloud}</svg>
}

/** Small "☁ 29°" chip. Uses Open-Meteo (free, no key). Hidden if it can't load. */
export function WeatherChip({ fallback }: { fallback: LatLng }) {
  const { t, userLocation } = useApp()
  const at = userLocation ?? fallback
  const lat = Math.round(at.lat * 10) / 10
  const lng = Math.round(at.lng * 10) / 10
  const [w, setW] = useState<Weather | null>(null)
  useEffect(() => {
    let alive = true
    fetchWeather({ lat, lng })
      .then((x) => alive && setW(x))
      .catch(() => alive && setW(null))
    return () => {
      alive = false
    }
  }, [lat, lng])
  if (!w) return null
  const kind = kindOf(w.code)
  return (
    <span className="weather-chip" title={t(labelKey[kind])} aria-label={`${t(labelKey[kind])}, ${w.temp}°C`}>
      <WeatherIcon kind={kind} day={w.day} />
      {w.temp}°
    </span>
  )
}
