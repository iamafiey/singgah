import { db } from '../db'
import type { Category, Photo, Place, SavedRoute } from '../types'

interface BackupPhoto { id: string; data: string; thumb: string }
interface BackupFile {
  app: 'singgah'
  /** 1: categories/places/photos. 2: adds routes. Older files still import. */
  version: number
  exportedAt: string
  categories: Category[]
  places: Place[]
  photos: BackupPhoto[]
  routes?: SavedRoute[]
}

export const BACKUP_VERSION = 2

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(b)
  })

const dataUrlToBlob = async (url: string) => (await fetch(url)).blob()

export async function exportBackup(): Promise<Blob> {
  const [categories, places, photos, routes] = await Promise.all([db.categories.toArray(), db.places.toArray(), db.photos.toArray(), db.routes.toArray()])
  const file: BackupFile = {
    app: 'singgah',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    categories,
    places,
    routes,
    photos: await Promise.all(photos.map(async (p) => ({ id: p.id, data: await blobToDataUrl(p.blob), thumb: await blobToDataUrl(p.thumb) }))),
  }
  return new Blob([JSON.stringify(file)], { type: 'application/json' })
}

export async function importBackup(file: File, mode: 'merge' | 'replace'): Promise<{ places: number; categories: number }> {
  const data = JSON.parse(await file.text()) as BackupFile
  if (data?.app !== 'singgah' || !Array.isArray(data.places) || !Array.isArray(data.categories)) {
    throw new Error('Not a Singgah backup file')
  }
  const photos: Photo[] = await Promise.all(
    (data.photos ?? []).map(async (p) => ({ id: p.id, blob: await dataUrlToBlob(p.data), thumb: await dataUrlToBlob(p.thumb) })),
  )
  await db.transaction('rw', [db.categories, db.places, db.photos, db.routes], async () => {
    if (mode === 'replace') {
      await Promise.all([db.categories.clear(), db.places.clear(), db.photos.clear(), db.routes.clear()])
    }
    await db.categories.bulkPut(data.categories)
    await db.places.bulkPut(data.places.map(normalisePlace))
    await db.photos.bulkPut(photos)
    if (Array.isArray(data.routes)) await db.routes.bulkPut(data.routes)
  })
  return { places: data.places.length, categories: data.categories.length }
}

/** Fill in fields that older backups (or older app versions) didn't have. */
export function normalisePlace(p: Place): Place {
  return {
    ...p,
    photoIds: p.photoIds ?? [],
    links: p.links ?? [],
    tags: p.tags ?? [],
    hours: p.hours ?? null,
    practical: p.practical && typeof p.practical === 'object' ? p.practical : {},
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
