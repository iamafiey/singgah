import Dexie, { type EntityTable } from 'dexie'
import type { Category, Photo, Place } from './types'
import { presetCategories, samplePlaces } from './lib/seed'

export const db = new Dexie('singgah') as Dexie & {
  categories: EntityTable<Category, 'id'>
  places: EntityTable<Place, 'id'>
  photos: EntityTable<Photo, 'id'>
}

db.version(1).stores({
  categories: 'id, order',
  places: 'id, categoryId, createdAt, name, isSample',
  photos: 'id',
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
