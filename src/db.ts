import Dexie, { type EntityTable } from 'dexie'
import type { Category, Photo, Place, SavedRoute } from './types'
import { DEFAULT_ICON } from './components/categoryIcons'
import { PRESETS, PRESET_ORDER_V1, SAMPLE_PRACTICAL, presetCategories, samplePlaces } from './lib/seed'
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

// v3: practical tags (halal, surau, parking…). Not indexed — filtering happens in memory.
// Every existing spot gets an empty `practical` (= all Unknown). Untouched sample spots get the example tags.
db.version(3)
  .stores({})
  .upgrade((tx) =>
    tx
      .table('places')
      .toCollection()
      .modify((p: Place) => {
        if (!p.practical || typeof p.practical !== 'object') {
          p.practical = p.isSample && SAMPLE_PRACTICAL[p.id] ? structuredClone(SAMPLE_PRACTICAL[p.id]) : {}
        }
      }),
  )

// v4: categories get a line icon (map labels, card corners) and may get a custom illustration.
// Preset categories get their matching icon; custom ones get a generic pin. Spots may get a rating (optional, no migration needed).
// Untouched sample spots (editing one clears isSample) get the Bahasa Melayu notes, ratings and visited examples.
db.version(4)
  .stores({})
  .upgrade(async (tx) => {
    await tx
      .table('categories')
      .toCollection()
      .modify((c: Category) => {
        if (!c.icon) c.icon = PRESETS.find((p) => p.key === c.presetKey)?.icon ?? DEFAULT_ICON
      })
    const samples = new Map(samplePlaces().map((p) => [p.id, p]))
    await tx
      .table('places')
      .toCollection()
      .modify((p: Place) => {
        const s = p.isSample ? samples.get(p.id) : undefined
        if (!s) return
        p.notes = s.notes
        p.practical = structuredClone(s.practical)
        if (p.rating === undefined && s.rating) p.rating = s.rating
      })
  })

// v5: new preset categories (Zoo, Arcade, Hotel, Camping) with bundled illustrations. They are added
// for existing users too. If the categories are still in the original default order, they're
// reordered to the new default (Restaurant, Cafe, Park, Zoo, Hiking, Arcade…); custom orders are kept.
db.version(5)
  .stores({})
  .upgrade(async (tx) => {
    const table = tx.table('categories')
    const cats = (await table.toArray()) as Category[]
    const haveKeys = new Set(cats.map((c) => c.presetKey).filter(Boolean))
    const sorted = [...cats].sort((a, b) => a.order - b.order)
    const untouched =
      sorted.length === PRESET_ORDER_V1.length && sorted.every((c, i) => c.presetKey === PRESET_ORDER_V1[i])
    const presets = presetCategories()
    if (untouched) {
      await table.bulkPut([
        ...sorted.map((c) => ({ ...c, order: PRESETS.findIndex((p) => p.key === c.presetKey) })),
        ...presets.filter((p) => !haveKeys.has(p.presetKey)),
      ])
    } else {
      let next = Math.max(-1, ...cats.map((c) => c.order)) + 1
      await table.bulkAdd(presets.filter((p) => !haveKeys.has(p.presetKey) && !cats.some((c) => c.id === p.id)).map((p) => ({ ...p, order: next++ })))
    }
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
