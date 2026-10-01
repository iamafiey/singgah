import type { Category, DayHours, Place, PracticalInfo, WeekHours } from '../types'

export const PRESETS: Array<Pick<Category, 'emoji' | 'color'> & { key: string; name: string }> = [
  { key: 'cafe', name: 'Cafe', emoji: '☕', color: '#b0703c' },
  { key: 'restaurant', name: 'Diner/Restaurant', emoji: '🍽️', color: '#e0593b' },
  { key: 'mamak', name: 'Mamak', emoji: '🫓', color: '#d99a14' },
  { key: 'park', name: 'Recreational Park', emoji: '🌳', color: '#3f9a5a' },
  { key: 'playground', name: 'Playground', emoji: '🛝', color: '#e5679a' },
  { key: 'hiking', name: 'Hiking/Nature', emoji: '⛰️', color: '#2f7d74' },
  { key: 'shopping', name: 'Shopping', emoji: '🛍️', color: '#8a5cd1' },
  { key: 'attraction', name: 'Attraction', emoji: '🎡', color: '#3a7bd5' },
]

export const presetCategories = (): Category[] =>
  PRESETS.map((p, i) => ({ id: `cat-${p.key}`, name: p.name, emoji: p.emoji, color: p.color, order: i, presetKey: p.key }))

const d = (...ranges: [string, string][]): DayHours => ({ closed: false, allDay: false, ranges: ranges.map(([open, close]) => ({ open, close })) })
const closed: DayHours = { closed: true, allDay: false, ranges: [] }
const allDay: DayHours = { closed: false, allDay: true, ranges: [] }
const week = (mon: DayHours, rest?: Partial<Record<number, DayHours>>): WeekHours =>
  Array.from({ length: 7 }, (_, i) => structuredClone(rest?.[i] ?? mon))

/** Example practical tags for the sample spots (also applied to untouched samples when upgrading from v2). */
export const SAMPLE_PRACTICAL: Record<string, PracticalInfo> = {
  'sample-kopikopi': {
    halal: { value: 'muslim-owned' },
    surau: { value: 'yes', note: 'Surau at the masjid two shops down' },
    parking: { value: 'moderate', note: 'Street parking, pay by app' },
    setting: { value: 'mixed' },
    kids: { value: ['highchair', 'stroller'] },
  },
  'sample-sate': {
    halal: { value: 'jakim' },
    parking: { value: 'hard', note: 'Busy at night — park at the open lot behind' },
    setting: { value: 'covered' },
  },
  'sample-mamak': {
    halal: { value: 'muslim-owned' },
    parking: { value: 'easy' },
    setting: { value: 'covered' },
  },
  'sample-cempaka': {
    surau: { value: 'yes', note: 'Small surau near the main car park' },
    parking: { value: 'easy' },
    setting: { value: 'outdoor' },
    kids: { value: ['stroller', 'shaded-play', 'fenced-play'] },
  },
  'sample-broga': {
    parking: { value: 'hard', note: 'Paid parking at the base fills up before sunrise on weekends' },
    setting: { value: 'outdoor' },
  },
}

export function samplePlaces(now = Date.now()): Place[] {
  const base = { photoIds: [], links: [], visited: false, isSample: true, updatedAt: now }
  return [
    {
      ...base,
      id: 'sample-kopikopi',
      practical: structuredClone(SAMPLE_PRACTICAL['sample-kopikopi']),
      name: 'Kopi Kopi Bangi',
      categoryId: 'cat-cafe',
      lat: 2.9628,
      lng: 101.7569,
      address: 'Seksyen 9, 43650 Bandar Baru Bangi, Selangor',
      notes: 'Sample spot — saw this on TikTok. Try the iced spanish latte and the burnt cheesecake.',
      hours: week(d(['08:00', '18:00']), { 1: closed, 5: d(['08:00', '22:00']), 6: d(['08:00', '22:00']) }),
      tags: ['kopikopibangi', 'bangicafe'],
      createdAt: now - 5000,
    },
    {
      ...base,
      id: 'sample-sate',
      practical: structuredClone(SAMPLE_PRACTICAL['sample-sate']),
      name: 'Sate Kajang Haji Samuri',
      categoryId: 'cat-restaurant',
      lat: 2.9935,
      lng: 101.7885,
      address: 'Jalan Bukit, 43000 Kajang, Selangor',
      notes: 'Sample spot — the classic Kajang satay. Hours here are only an example.',
      hours: week(d(['11:00', '15:00'], ['17:00', '23:00'])),
      tags: ['satekajang', 'satekajanghajisamuri'],
      createdAt: now - 4000,
    },
    {
      ...base,
      id: 'sample-mamak',
      practical: structuredClone(SAMPLE_PRACTICAL['sample-mamak']),
      name: 'Mamak Bistro 24 Jam Kajang',
      categoryId: 'cat-mamak',
      lat: 2.9876,
      lng: 101.7905,
      address: 'Jalan Reko, 43000 Kajang, Selangor',
      notes: 'Sample spot — late-night roti canai and teh tarik.',
      hours: week(allDay),
      tags: ['mamakkajang'],
      createdAt: now - 3000,
    },
    {
      ...base,
      id: 'sample-cempaka',
      practical: structuredClone(SAMPLE_PRACTICAL['sample-cempaka']),
      name: 'Taman Tasik Cempaka',
      categoryId: 'cat-park',
      lat: 2.9667,
      lng: 101.7632,
      address: 'Seksyen 2, 43650 Bandar Baru Bangi, Selangor',
      notes: 'Sample spot — lakeside jogging track, good for evening walks with the kids.',
      hours: week(d(['06:00', '22:00'])),
      tags: ['tamantasikcempaka', 'bangi'],
      createdAt: now - 2000,
    },
    {
      ...base,
      id: 'sample-broga',
      practical: structuredClone(SAMPLE_PRACTICAL['sample-broga']),
      name: 'Bukit Broga',
      categoryId: 'cat-hiking',
      lat: 2.9433,
      lng: 101.9042,
      address: 'Broga, 43500 Semenyih, Selangor',
      notes: 'Sample spot — go before sunrise (start ~5:30am). About 30–45 min up.',
      hours: null,
      tags: ['bukitbroga', 'brogahill'],
      createdAt: now - 1000,
    },
  ]
}
