import Dexie, { type EntityTable } from 'dexie'
import type { Category, Photo, Place, SavedRoute } from './types'
import { presetCategories, samplePlaces } from './lib/seed'
import { uid } from './lib/id'

export const db = new Dexie('singgah') as Dexie & {
  categories: EntityTable<Category, 'id'>
  places: EntityTable<Place, 'id'>
  photos: EntityTable<Photo, 'id'>
  routes: EntityTable<SavedRoute, 'id'>
}

db.version(1).stores({
  categories: 'id, order',
  places: 'id, categoryId, createdAt, name, isSample',
  photos: 'id',
})

// v2: recent "On the way" routes. Existing tables are unchanged, so no data migration is needed.
db.version(2).stores({
  routes: 'id, usedAt',
})

db.on('populate', (tx) => {
  tx.table('categories').bulkAdd(presetCategories())
  tx.table('places').bulkAdd(samplePlaces())
})

export async function deletePlace(id: string) {
  await db.transaction('rw', db.places, db.photos, async () => {
    const p = await db.places.get(id)
    if (p) await db.photos.bulkDelete(p.photoIds)
    await db.places.delete(id)
  })
}

export async function clearSampleData(): Promise<number> {
  const samples = await db.places.filter((p) => !!p.isSample).toArray()
  await Promise.all(samples.map((p) => deletePlace(p.id)))
  return samples.length
}

/** Delete a category, either moving its places to another category or deleting them. */
export async function deleteCategory(id: string, moveTo: string | null) {
  await db.transaction('rw', db.categories, db.places, db.photos, async () => {
    const places = await db.places.where('categoryId').equals(id).toArray()
    if (moveTo) {
      await db.places.bulkUpdate(places.map((p) => ({ key: p.id, changes: { categoryId: moveTo, updatedAt: Date.now() } })))
    } else {
      await db.photos.bulkDelete(places.flatMap((p) => p.photoIds))
      await db.places.bulkDelete(places.map((p) => p.id))
    }
    await db.categories.delete(id)
  })
}

export const MAX_SAVED_ROUTES = 5

/** Save (or refresh) a recent route, keeping only the newest MAX_SAVED_ROUTES. */
export async function rememberRoute(
  route: Omit<SavedRoute, 'id' | 'usedAt' | 'name'> & { name?: string; defaultName?: string },
): Promise<SavedRoute> {
  return db.transaction('rw', db.routes, async () => {
    const all = await db.routes.toArray()
    const same = all.find(
      (r) =>
        sameish(r.to, route.to) && ((r.from === null && route.from === null) || (!!r.from && !!route.from && sameish(r.from, route.from))),
    )
    const saved: SavedRoute = {
      id: same?.id ?? uid(),
      name: route.name ?? same?.name ?? route.defaultName ?? `${route.from?.label ?? '📍'} → ${route.to.label}`,
      from: route.from,
      to: route.to,
      detourKm: route.detourKm,
      usedAt: Date.now(),
    }
    await db.routes.put(saved)
    const extra = (await db.routes.orderBy('usedAt').reverse().toArray()).slice(MAX_SAVED_ROUTES)
    if (extra.length) await db.routes.bulkDelete(extra.map((r) => r.id))
    return saved
  })
}

function sameish(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return Math.abs(a.lat - b.lat) < 0.0005 && Math.abs(a.lng - b.lng) < 0.0005
}
