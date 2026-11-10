import { db } from '../db'
import { uid } from './id'
import { compressImage } from './image'
import type { Place } from '../types'

/**
 * Spots that ship with photos (public/kedai/*.png). They're added once per device — on new
 * installs and after an update — and never re-added after that, so deleting one sticks.
 * Locations are approximate; hours, halal status and ratings are left for the user to fill in.
 */
interface BundledSpot extends Omit<Place, 'photoIds' | 'createdAt' | 'updatedAt' | 'links' | 'hours' | 'practical'> {
  photo: string
}

const NOTE = 'Lokasi anggaran — tekan Sunting dan seret pin untuk betulkan.'

export const BUNDLED_SPOTS: BundledSpot[] = [
  {
    id: 'kedai-zus-seksyen-7',
    name: 'Zus Cafe - Seksyen 7',
    categoryId: 'cat-cafe',
    lat: 2.9555,
    lng: 101.781,
    address: 'Seksyen 7, 43650 Bandar Baru Bangi, Selangor',
    notes: NOTE,
    tags: ['bangispot', 'cafebangi', 'zuscoffee'],
    visited: true,
    photo: 'kedai/zus-cafe-seksyen-7.png',
  },
  {
    id: 'kedai-thinker-sg-ramal',
    name: 'Thinker Coffee - Sg Ramal Dalam',
    categoryId: 'cat-cafe',
    lat: 2.977,
    lng: 101.764,
    address: 'Sungai Ramal Dalam, 43000 Kajang, Selangor',
    notes: NOTE,
    tags: ['bangispot', 'cafebangi', 'thinkercoffee'],
    visited: true,
    photo: 'kedai/thinker-coffee-sg-ramal-dalam.png',
  },
  {
    id: 'kedai-cip-cip-sg-merab',
    name: 'Cip Cip Sg Merab',
    categoryId: 'cat-restaurant',
    lat: 2.9165,
    lng: 101.733,
    address: 'Sungai Merab, 43000 Kajang, Selangor',
    notes: NOTE,
    tags: ['bangispot', 'cipcipsgmerab'],
    visited: true,
    photo: 'kedai/cip-cip-sg-merab.png',
  },
  {
    id: 'kedai-playground-cempaka',
    name: 'Playground - Taman Tasik Cempaka',
    categoryId: 'cat-playground',
    lat: 2.9672,
    lng: 101.764,
    address: 'Seksyen 2, 43650 Bandar Baru Bangi, Selangor',
    notes: NOTE,
    tags: ['bangispot', 'tamantasikcempaka'],
    visited: false,
    photo: 'kedai/playground-taman-tasik-cempaka.png',
  },
]

const FLAG = 'singgah.bundledSpots.v1'
let running: Promise<number> | null = null

async function photoFor(path: string): Promise<string | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}${path}`)
    if (!res.ok) return null
    const { blob, thumb } = await compressImage(await res.blob())
    const id = uid()
    await db.photos.add({ id, blob, thumb })
    return id
  } catch {
    return null
  }
}

/** Add the bundled spots once. Returns how many were added. */
export function ensureBundledSpots(): Promise<number> {
  try {
    if (localStorage.getItem(FLAG)) return Promise.resolve(0)
  } catch {
    return Promise.resolve(0)
  }
  running ??= (async () => {
    const categories = await db.categories.toArray()
    const fallbackCat = [...categories].sort((a, b) => a.order - b.order)[0]?.id
    let added = 0
    const now = Date.now()
    for (const [i, s] of BUNDLED_SPOTS.entries()) {
      if (await db.places.get(s.id)) continue
      const photoId = await photoFor(s.photo)
      const { photo: _photo, ...rest } = s
      void _photo
      const place: Place = {
        ...rest,
        categoryId: categories.some((c) => c.id === s.categoryId) ? s.categoryId : (fallbackCat ?? s.categoryId),
        hours: null,
        links: [],
        practical: {},
        photoIds: photoId ? [photoId] : [],
        createdAt: now + i,
        updatedAt: now + i,
      }
      await db.places.add(place)
      added++
    }
    try {
      localStorage.setItem(FLAG, '1')
    } catch {
      /* ignore */
    }
    return added
  })()
  return running
}
