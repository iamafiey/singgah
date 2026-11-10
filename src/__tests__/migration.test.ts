import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'

describe('Dexie migration from v1 to the current version', () => {
  it('keeps existing spots and adds routes (v2), practical tags (v3) and category icons (v4)', async () => {
    // Build a database exactly as v1 of the app created it.
    const old = new Dexie('singgah')
    old.version(1).stores({ categories: 'id, order', places: 'id, categoryId, createdAt, name, isSample', photos: 'id' })
    await old.open()
    await old.table('categories').add({ id: 'cat-cafe', name: 'Cafe', emoji: '☕', color: '#b0703c', order: 0, presetKey: 'cafe' })
    await old.table('places').bulkAdd([
      {
        id: 'mine',
        name: 'My Kopitiam',
        categoryId: 'cat-cafe',
        lat: 3.1,
        lng: 101.6,
        address: 'KL',
        notes: 'teh tarik',
        hours: null,
        photoIds: [],
        links: [],
        tags: ['kopitiam'],
        visited: true,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'sample-kopikopi',
        name: 'Kopi Kopi Bangi',
        categoryId: 'cat-cafe',
        lat: 2.96,
        lng: 101.75,
        address: '',
        notes: '',
        hours: null,
        photoIds: [],
        links: [],
        tags: [],
        visited: false,
        isSample: true,
        createdAt: 2,
        updatedAt: 2,
      },
    ])
    old.close()

    // Now open with the current app schema.
    const { db, rememberRoute, MAX_SAVED_ROUTES } = await import('../db')
    await db.open()
    expect(db.verno).toBe(5)

    const mine = await db.places.get('mine')
    expect(mine).toMatchObject({ name: 'My Kopitiam', notes: 'teh tarik', visited: true, tags: ['kopitiam'] })
    // v3: user spots get empty practical info (all Unknown) — never inferred
    expect(mine!.practical).toEqual({})
    // untouched sample spots get the example tags
    const sample = await db.places.get('sample-kopikopi')
    expect(sample!.practical.halal).toEqual({ value: 'muslim-owned' })
    // v4: untouched samples get Malay notes; user spots are never rewritten
    expect(sample!.notes).toMatch(/^Tempat contoh/)
    expect(mine!.notes).toBe('teh tarik')
    // v4: categories get a line icon (presets get their matching one)
    expect((await db.categories.get('cat-cafe'))!.icon).toBe('coffee')
    // populate must not run on upgrade: no duplicate seed data
    expect(await db.places.count()).toBe(2)
    // v5: missing presets are added after the user's own categories (custom order kept)
    const cats = await db.categories.orderBy('order').toArray()
    expect(cats[0].id).toBe('cat-cafe')
    expect(cats.map((c) => c.presetKey)).toEqual(expect.arrayContaining(['zoo', 'arcade', 'hotel', 'camping']))
    expect(cats).toHaveLength(12)

    // v2: recent routes, capped
    for (let i = 0; i < MAX_SAVED_ROUTES + 2; i++) {
      await rememberRoute({ from: null, to: { label: `Dest ${i}`, lat: 4 + i, lng: 101 }, detourKm: 3 })
    }
    expect(await db.routes.count()).toBe(MAX_SAVED_ROUTES)
    // re-using a route refreshes it instead of duplicating
    await rememberRoute({ from: null, to: { label: 'Dest 6', lat: 10, lng: 101 }, detourKm: 5 })
    expect(await db.routes.count()).toBe(MAX_SAVED_ROUTES)
    db.close()
  })
})

describe('v5 category reorder', () => {
  it('reorders untouched default categories to the new default order', async () => {
    const { default: Dexie } = await import('dexie')
    const name = 'singgah-reorder-test'
    const old = new Dexie(name)
    old.version(1).stores({ categories: 'id, order', places: 'id, categoryId, createdAt, name, isSample', photos: 'id' })
    await old.open()
    const v1 = ['cafe', 'restaurant', 'mamak', 'park', 'playground', 'hiking', 'shopping', 'attraction']
    await old.table('categories').bulkAdd(v1.map((k, i) => ({ id: `cat-${k}`, name: k, emoji: '•', color: '#000', order: i, presetKey: k })))
    old.close()
    // Re-open with the app's schema under the test name
    const { db } = await import('../db')
    const reopened = new Dexie(name)
    // Apply the app's own version definitions (schema + upgrades) to this test database
    for (const v of (db as unknown as { _versions: { _cfg: { version: number; storesSource: Record<string, string>; contentUpgrade?: (tx: unknown) => unknown } }[] })._versions) {
      const ver = reopened.version(v._cfg.version).stores(v._cfg.storesSource)
      if (v._cfg.contentUpgrade) ver.upgrade(v._cfg.contentUpgrade as never)
    }
    await reopened.open()
    const order = (await reopened.table('categories').orderBy('order').toArray()).map((c: { presetKey: string }) => c.presetKey)
    expect(order.slice(0, 6)).toEqual(['restaurant', 'cafe', 'park', 'zoo', 'hiking', 'arcade'])
    expect(order).toHaveLength(12)
    reopened.close()
  })
})
