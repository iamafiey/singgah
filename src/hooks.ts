import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { useApp } from './state'
import type { Place } from './types'

export function usePlaces(): Place[] | undefined {
  return useLiveQuery(() => db.places.toArray(), [])
}

/** Places after applying the shared category + tag filters. */
export function useFilteredPlaces(): Place[] | undefined {
  const places = usePlaces()
  const { catFilter, tagFilter } = useApp()
  return useMemo(
    () =>
      places?.filter(
        (p) => (catFilter.length === 0 || catFilter.includes(p.categoryId)) && (!tagFilter || p.tags.includes(tagFilter)),
      ),
    [places, catFilter, tagFilter],
  )
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
