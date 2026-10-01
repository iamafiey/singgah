import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { translate, type Lang, type TKey } from './i18n'
import { getCurrentPosition, type LatLng } from './lib/geo'
import type { Category } from './types'

// ---------- Routing (hash based, works on any static host) ----------
export type Route =
  | { name: 'map' }
  | { name: 'list' }
  | { name: 'categories' }
  | { name: 'settings' }
  | { name: 'place'; id: string }
  | { name: 'edit'; id?: string }

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  switch (parts[0]) {
    case 'list':
    case 'categories':
    case 'settings':
      return { name: parts[0] }
    case 'place':
      return parts[1] ? { name: 'place', id: parts[1] } : { name: 'map' }
    case 'new':
      return { name: 'edit' }
    case 'edit':
      return { name: 'edit', id: parts[1] }
    default:
      return { name: 'map' }
  }
}

let inAppDepth = 0
export function navigate(path: string, replace = false) {
  const hash = '#/' + path.replace(/^\//, '')
  if (replace) {
    history.replaceState(null, '', hash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    inAppDepth++
    location.hash = hash
  }
}
export function goBack(fallback = 'map') {
  if (inAppDepth > 0) {
    inAppDepth--
    history.back()
  } else navigate(fallback, true)
}

function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash))
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

// ---------- Persisted preferences ----------
export type Theme = 'system' | 'light' | 'dark'
export type SortBy = 'distance' | 'recent' | 'name'

function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage unavailable */
    }
  }, [key, value])
  return [value, setValue] as const
}

function defaultLang(): Lang {
  return typeof navigator !== 'undefined' && /^ms|^id/i.test(navigator.language) ? 'ms' : 'en'
}

// ---------- Context ----------
export type LocationStatus = 'pending' | 'granted' | 'denied'

interface AppState {
  route: Route
  lang: Lang
  setLang: (l: Lang) => void
  theme: Theme
  setTheme: (t: Theme) => void
  t: (key: TKey, vars?: Record<string, string | number>) => string
  categories: Category[]
  categoryById: Map<string, Category>
  catName: (c: Category | undefined) => string
  userLocation: LatLng | null
  locationStatus: LocationStatus
  locate: () => Promise<LatLng | null>
  /** Selected category ids; empty = all */
  catFilter: string[]
  setCatFilter: (ids: string[]) => void
  tagFilter: string | null
  setTagFilter: (t: string | null) => void
  /** Active "More filters" ids from config/practicalTags.ts (AND-combined with categories). */
  practicalFilter: string[]
  setPracticalFilter: (ids: string[]) => void
  query: string
  setQuery: (q: string) => void
  sortBy: SortBy
  setSortBy: (s: SortBy) => void
  focus: { id: string; n: number } | null
  focusPlace: (id: string) => void
  toast: string | null
  showToast: (msg: string) => void
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const route = useRoute()
  const [lang, setLang] = usePersisted<Lang>('singgah.lang', defaultLang())
  const [theme, setTheme] = usePersisted<Theme>('singgah.theme', 'system')
  const [sortBy, setSortBy] = usePersisted<SortBy>('singgah.sort', 'distance')
  const [catFilter, setCatFilter] = useState<string[]>([])
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [practicalFilter, setPracticalFilter] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('pending')

  const categories = useLiveQuery(() => db.categories.orderBy('order').toArray(), [], [] as Category[])
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const t = useCallback((key: TKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang])
  const catName = useCallback(
    (c: Category | undefined) => (!c ? '' : c.presetKey && !c.renamed ? translate(lang, `cat.${c.presetKey}` as TKey) ?? c.name : c.name),
    [lang],
  )

  const locate = useCallback(async () => {
    try {
      const p = await getCurrentPosition()
      setUserLocation(p)
      setLocationStatus('granted')
      return p
    } catch {
      setLocationStatus('denied')
      return null
    }
  }, [])

  useEffect(() => {
    locate()
    if (!('geolocation' in navigator)) return
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationStatus('granted')
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 30000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [locate])

  // Theme
  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      root.dataset.theme = dark ? 'dark' : 'light'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#121212' : '#ffffff')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // Drop filters pointing at deleted categories
  useEffect(() => {
    if (catFilter.some((id) => !categoryById.has(id)) && categories.length) setCatFilter(catFilter.filter((id) => categoryById.has(id)))
  }, [catFilter, categoryById, categories.length])

  useEffect(() => {
    if (!toast) return
    const h = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(h)
  }, [toast])

  const focusPlace = useCallback((id: string) => {
    setFocus((f) => ({ id, n: (f?.n ?? 0) + 1 }))
    navigate('map')
  }, [])

  const value: AppState = {
    route,
    lang,
    setLang,
    theme,
    setTheme,
    t,
    categories,
    categoryById,
    catName,
    userLocation,
    locationStatus,
    locate,
    catFilter,
    setCatFilter,
    tagFilter,
    setTagFilter,
    practicalFilter,
    setPracticalFilter,
    query,
    setQuery,
    sortBy,
    setSortBy,
    focus,
    focusPlace,
    toast,
    showToast: setToast,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp outside AppProvider')
  return v
}
