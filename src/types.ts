export interface Category {
  id: string
  name: string
  emoji: string
  color: string
  order: number
  /** Preset categories keep a key so their name follows the UI language until renamed. */
  presetKey?: string
  renamed?: boolean
}

export interface TimeRange {
  /** "HH:MM", 24h */
  open: string
  /** "HH:MM", 24h. A close time earlier than (or equal to) open means it closes after midnight. */
  close: string
}

export interface DayHours {
  closed: boolean
  allDay: boolean
  ranges: TimeRange[]
}

/** Index 0 = Monday … 6 = Sunday */
export type WeekHours = DayHours[]

export type Platform = 'tiktok' | 'instagram' | 'threads' | 'facebook' | 'youtube' | 'other'

export interface SocialLink {
  id: string
  url: string
  platform: Platform
  title?: string
  author?: string
  thumbnailUrl?: string
}

export interface Place {
  id: string
  name: string
  categoryId: string
  lat: number
  lng: number
  address: string
  notes: string
  hours: WeekHours | null
  /** Ordered photo ids, first one is the cover. */
  photoIds: string[]
  links: SocialLink[]
  /** Stored without the leading # */
  tags: string[]
  visited: boolean
  /** Practical tags (halal, surau, parking…), keyed by tag id from config/practicalTags.ts. Missing = Unknown. */
  practical: PracticalInfo
  isSample?: boolean
  createdAt: number
  updatedAt: number
}

export interface PracticalEntry {
  /** Option id (single) or option ids (multi). Absent = Unknown. */
  value?: string | string[]
  note?: string
}

export type PracticalInfo = Record<string, PracticalEntry>

export interface Photo {
  id: string
  blob: Blob
  thumb: Blob
}

export interface RoutePoint {
  label: string
  lat: number
  lng: number
}

/** A recently used "On the way" route. `from: null` means "my current location". */
export interface SavedRoute {
  id: string
  name: string
  from: RoutePoint | null
  to: RoutePoint
  detourKm: number
  usedAt: number
}
