import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'

describe('Dexie migration from v1 to the current version', () => {
  it('keeps existing spots and adds routes (v2) and practical tags (v3)', async () => {
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
    expect(db.verno).toBe(3)

    const mine = await db.places.get('mine')
    expect(mine).toMatchObject({ name: 'My Kopitiam', notes: 'teh tarik', visited: true, tags: ['kopitiam'] })
    // v3: user spots get empty practical info (all Unknown) — never inferred
    expect(mine!.practical).toEqual({})
    // untouched sample spots get the example tags
    const sample = await db.places.get('sample-kopikopi')
    expect(sample!.practical.halal).toEqual({ value: 'muslim-owned' })
    // populate must not run on upgrade: no duplicate seed data
    expect(await db.places.count()).toBe(2)
    expect(await db.categories.count()).toBe(1)

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
