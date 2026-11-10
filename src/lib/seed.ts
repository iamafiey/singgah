import type { Category, DayHours, Place, PracticalInfo, WeekHours } from '../types'

export const PRESETS: Array<Pick<Category, 'emoji' | 'color' | 'icon'> & { key: string; name: string }> = [
  { key: 'restaurant', name: 'Diner/Restaurant', emoji: '🍽️', color: '#e0593b', icon: 'utensils' },
  { key: 'cafe', name: 'Cafe', emoji: '☕', color: '#b0703c', icon: 'coffee' },
  { key: 'park', name: 'Recreational Park', emoji: '🌳', color: '#3f9a5a', icon: 'tree' },
  { key: 'zoo', name: 'Zoo', emoji: '🐯', color: '#e0912b', icon: 'paw' },
  { key: 'hiking', name: 'Hiking/Nature', emoji: '⛰️', color: '#2f7d74', icon: 'mountain' },
  { key: 'arcade', name: 'Arcade', emoji: '🕹️', color: '#d64545', icon: 'arcade' },
  { key: 'playground', name: 'Playground', emoji: '🛝', color: '#e5679a', icon: 'playground' },
  { key: 'mamak', name: 'Mamak', emoji: '🫓', color: '#d99a14', icon: 'teh' },
  { key: 'attraction', name: 'Attraction', emoji: '🎡', color: '#3a7bd5', icon: 'ferris' },
  { key: 'shopping', name: 'Shopping', emoji: '🛍️', color: '#8a5cd1', icon: 'bag' },
  { key: 'hotel', name: 'Hotel', emoji: '🏨', color: '#5b7a99', icon: 'bed' },
  { key: 'camping', name: 'Camping', emoji: '⛺', color: '#c98a2b', icon: 'tent' },
]

/** The preset order before v5 — used to tell whether someone has reordered their categories. */
export const PRESET_ORDER_V1 = ['cafe', 'restaurant', 'mamak', 'park', 'playground', 'hiking', 'shopping', 'attraction']

export const presetCategories = (): Category[] =>
  PRESETS.map((p, i) => ({ id: `cat-${p.key}`, name: p.name, emoji: p.emoji, color: p.color, icon: p.icon, order: i, presetKey: p.key }))

const d = (...ranges: [string, string][]): DayHours => ({ closed: false, allDay: false, ranges: ranges.map(([open, close]) => ({ open, close })) })
const closed: DayHours = { closed: true, allDay: false, ranges: [] }
const allDay: DayHours = { closed: false, allDay: true, ranges: [] }
const week = (mon: DayHours, rest?: Partial<Record<number, DayHours>>): WeekHours =>
  Array.from({ length: 7 }, (_, i) => structuredClone(rest?.[i] ?? mon))

/** Example practical tags for the sample spots (also applied to untouched samples when upgrading from v2). */
export const SAMPLE_PRACTICAL: Record<string, PracticalInfo> = {
  'sample-kopikopi': {
    halal: { value: 'muslim-owned' },
    surau: { value: 'yes', note: 'Surau di masjid dua kedai dari sini' },
    parking: { value: 'moderate', note: 'Parking tepi jalan, bayar guna app' },
    setting: { value: 'mixed' },
    kids: { value: ['highchair', 'stroller'] },
  },
  'sample-sate': {
    halal: { value: 'jakim' },
    parking: { value: 'hard', note: 'Sesak waktu malam — parking di tanah lapang belakang' },
    setting: { value: 'covered' },
  },
  'sample-mamak': {
    halal: { value: 'muslim-owned' },
    parking: { value: 'easy' },
    setting: { value: 'covered' },
  },
  'sample-cempaka': {
    surau: { value: 'yes', note: 'Surau kecil dekat tempat letak kereta utama' },
    parking: { value: 'easy' },
    setting: { value: 'outdoor' },
    kids: { value: ['stroller', 'shaded-play', 'fenced-play'] },
  },
  'sample-broga': {
    parking: { value: 'hard', note: 'Parking berbayar di kaki bukit penuh sebelum subuh hujung minggu' },
    setting: { value: 'outdoor' },
  },
}

export function samplePlaces(now = Date.now()): Place[] {
  const base = { photoIds: [], links: [], visited: false, isSample: true, updatedAt: now }
  return [
    {
      ...base,
      id: 'sample-kopikopi',
      rating: 4,
      visited: true,
      practical: structuredClone(SAMPLE_PRACTICAL['sample-kopikopi']),
      name: 'Kopi Kopi Bangi',
      categoryId: 'cat-cafe',
      lat: 2.9628,
      lng: 101.7569,
      address: 'Seksyen 9, 43650 Bandar Baru Bangi, Selangor',
      notes: 'Tempat contoh — nampak di TikTok. Cuba iced spanish latte dan burnt cheesecake.',
      hours: week(d(['08:00', '18:00']), { 1: closed, 5: d(['08:00', '22:00']), 6: d(['08:00', '22:00']) }),
      tags: ['kopikopibangi', 'bangicafe'],
      createdAt: now - 5000,
    },
    {
      ...base,
      id: 'sample-sate',
      rating: 5,
      visited: true,
      practical: structuredClone(SAMPLE_PRACTICAL['sample-sate']),
      name: 'Sate Kajang Haji Samuri',
      categoryId: 'cat-restaurant',
      lat: 2.9935,
      lng: 101.7885,
      address: 'Jalan Bukit, 43000 Kajang, Selangor',
      notes: 'Tempat contoh — sate Kajang yang terkenal. Waktu operasi di sini hanya contoh.',
      hours: week(d(['11:00', '15:00'], ['17:00', '23:00'])),
      tags: ['satekajang', 'satekajanghajisamuri'],
      createdAt: now - 4000,
    },
    {
      ...base,
      id: 'sample-mamak',
      rating: 4,
      practical: structuredClone(SAMPLE_PRACTICAL['sample-mamak']),
      name: 'Mamak Bistro 24 Jam Kajang',
      categoryId: 'cat-mamak',
      lat: 2.9876,
      lng: 101.7905,
      address: 'Jalan Reko, 43000 Kajang, Selangor',
      notes: 'Tempat contoh — roti canai dan teh tarik lewat malam.',
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
      notes: 'Tempat contoh — trek joging tepi tasik, sesuai untuk berjalan petang dengan anak-anak.',
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
      notes: 'Tempat contoh — pergi sebelum matahari terbit (mula ~5:30 pagi). Lebih kurang 30–45 minit naik.',
      hours: null,
      tags: ['bukitbroga', 'brogahill'],
      createdAt: now - 1000,
    },
  ]
}
