import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { useApp } from './state'
import type { Place } from './types'
import { matchesFilters } from './lib/practical'

export function usePlaces(): Place[] | undefined {
  return useLiveQuery(() => db.places.toArray(), [])
}

export interface PlaceFilters {
  catFilter: string[]
  tagFilter: string | null
  practicalFilter: string[]
}

export function applyFilters(places: Place[], f: PlaceFilters): Place[] {
  return places.filter(
    (p) =>
      (f.catFilter.length === 0 || f.catFilter.includes(p.categoryId)) &&
      (!f.tagFilter || p.tags.includes(f.tagFilter)) &&
      matchesFilters(p, f.practicalFilter),
  )
}

/** Places after applying the shared category, hashtag and practical filters. */
export function useFilteredPlaces(): Place[] | undefined {
  const places = usePlaces()
  const { catFilter, tagFilter, practicalFilter } = useApp()
  return useMemo(() => places && applyFilters(places, { catFilter, tagFilter, practicalFilter }), [places, catFilter, tagFilter, practicalFilter])
}

const urlCache = new Map<string, { url: string; refs: number }>()

/** Object URL for a stored photo (or its thumbnail); revoked when nobody uses it anymore. */
export function usePhotoUrl(id: string | undefined, kind: 'blob' | 'thumb' = 'thumb'): string | undefined {
  const photo = useLiveQuery(() => (id ? db.photos.get(id) : undefined), [id])
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!photo || !id) {
      setUrl(undefined)
      return
    }
    const key = `${id}:${kind}`
    let entry = urlCache.get(key)
    if (!entry) {
      entry = { url: URL.createObjectURL(photo[kind]), refs: 0 }
      urlCache.set(key, entry)
    }
    entry.refs++
    setUrl(entry.url)
    return () => {
      const e = urlCache.get(key)
      if (!e) return
      if (--e.refs <= 0) {
        // Delay so quick remounts (e.g. route changes) reuse the URL.
        setTimeout(() => {
          const cur = urlCache.get(key)
          if (cur && cur.refs <= 0) {
            URL.revokeObjectURL(cur.url)
            urlCache.delete(key)
          }
        }, 5000)
      }
    }
  }, [photo, id, kind])
  return url
}

/** Re-render every minute so open/closed badges stay current. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const h = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(h)
  }, [])
  return now
}
