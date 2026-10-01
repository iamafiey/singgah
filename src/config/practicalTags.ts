/**
 * Practical tags: structured info that people actually ask about.
 *
 * Everything here is config-driven — add or edit a tag, option or filter in this file and the
 * Add/Edit form, badges, place page, filters and search all pick it up. Values are only ever
 * set by the user; nothing is inferred. A tag with no value is "Unknown" and is never shown.
 */

export interface Text {
  en: string
  ms: string
}

export interface PracticalOption {
  id: string
  label: Text
  /** Shorter label for compact badges; falls back to label. */
  short?: Text
  icon: string
  /** Show as a badge on cards and previews (place page always shows it). Default true. */
  badge?: boolean
  /** Extra words that should find this value in search (both languages). */
  keywords?: string[]
}

export interface PracticalTagDef {
  id: string
  label: Text
  icon: string
  /** single: one option (or Unknown). multi: a checklist. */
  type: 'single' | 'multi'
  options: PracticalOption[]
  /** Offer a free-text note (e.g. "surau at level 2"). */
  note?: { placeholder: Text }
  keywords?: string[]
}

export interface PracticalFilterDef {
  id: string
  label: Text
  icon: string
  tag: string
  /** Matches when the spot's value is any of these option ids (single) or includes all of them (multi). */
  anyOf?: string[]
  allOf?: string[]
}

export const UNKNOWN_LABEL: Text = { en: 'Unknown', ms: 'Tidak pasti' }

export const PRACTICAL_TAGS: PracticalTagDef[] = [
  {
    id: 'halal',
    label: { en: 'Halal status', ms: 'Status halal' },
    icon: '🍽️',
    type: 'single',
    // No tag-level keywords here: "halal" must not find Non-halal spots. Option keywords cover it.
    options: [
      { id: 'jakim', icon: '✅', label: { en: 'Halal certified (JAKIM)', ms: 'Sijil halal (JAKIM)' }, short: { en: 'Halal (JAKIM)', ms: 'Halal (JAKIM)' }, keywords: ['halal', 'jakim', 'certified', 'sijil'] },
      { id: 'muslim-owned', icon: '🌙', label: { en: 'Muslim-owned', ms: 'Milik Muslim' }, keywords: ['halal', 'muslim', 'owned', 'milik'] },
      { id: 'muslim-friendly', icon: '🤝', label: { en: 'Muslim-friendly', ms: 'Mesra Muslim' }, keywords: ['muslim', 'friendly', 'mesra', 'pork-free', 'no-pork'] },
      { id: 'non-halal', icon: '🚫', label: { en: 'Non-halal', ms: 'Tidak halal' }, keywords: ['non-halal', 'nonhalal', 'tidak-halal'] },
    ],
  },
  {
    id: 'surau',
    label: { en: 'Surau nearby', ms: 'Surau berdekatan' },
    icon: '🕌',
    type: 'single',
    note: { placeholder: { en: 'e.g. surau at level 2', ms: 'cth. surau di aras 2' } },
    options: [
      { id: 'yes', icon: '🕌', label: { en: 'Yes', ms: 'Ada' }, short: { en: 'Surau', ms: 'Surau' }, keywords: ['surau', 'musolla', 'musalla', 'prayer', 'solat', 'masjid'] },
      { id: 'no', icon: '✖️', label: { en: 'No', ms: 'Tiada' }, short: { en: 'No surau', ms: 'Tiada surau' }, badge: false },
    ],
  },
  {
    id: 'parking',
    label: { en: 'Parking', ms: 'Parking' },
    icon: '🅿️',
    type: 'single',
    note: { placeholder: { en: 'e.g. street parking, pay by app', ms: 'cth. parking tepi jalan, bayar guna app' } },
    keywords: ['parking', 'park', 'letak kereta'],
    options: [
      { id: 'easy', icon: '🅿️', label: { en: 'Easy', ms: 'Senang' }, short: { en: 'Easy parking', ms: 'Parking senang' }, keywords: ['parking', 'easy', 'senang'] },
      { id: 'moderate', icon: '🅿️', label: { en: 'Moderate', ms: 'Sederhana' }, short: { en: 'Some parking', ms: 'Parking sederhana' }, keywords: ['parking'] },
      { id: 'hard', icon: '🚗', label: { en: 'Hard', ms: 'Susah' }, short: { en: 'Hard parking', ms: 'Parking susah' }, keywords: ['parking', 'hard', 'susah'] },
    ],
  },
  {
    id: 'setting',
    label: { en: 'Setting', ms: 'Suasana' },
    icon: '🏠',
    type: 'single',
    options: [
      { id: 'indoor', icon: '🏠', label: { en: 'Indoor', ms: 'Dalam bangunan' }, keywords: ['indoor', 'aircond', 'dalam'] },
      { id: 'outdoor', icon: '🌤️', label: { en: 'Outdoor', ms: 'Luar' }, keywords: ['outdoor', 'luar'] },
      { id: 'covered', icon: '⛱️', label: { en: 'Covered outdoor', ms: 'Luar berbumbung' }, short: { en: 'Covered', ms: 'Berbumbung' }, keywords: ['covered', 'shaded', 'berbumbung'] },
      { id: 'mixed', icon: '🔀', label: { en: 'Mixed', ms: 'Campuran' }, short: { en: 'Indoor + outdoor', ms: 'Dalam + luar' }, keywords: ['indoor', 'outdoor', 'mixed'] },
    ],
  },
  {
    id: 'kids',
    label: { en: 'Kid-friendly', ms: 'Mesra kanak-kanak' },
    icon: '👶',
    type: 'multi',
    keywords: ['kids', 'kid-friendly', 'family', 'budak', 'anak'],
    options: [
      { id: 'stroller', icon: '👶', label: { en: 'Stroller accessible', ms: 'Mesra stroller' }, short: { en: 'Stroller', ms: 'Stroller' }, keywords: ['stroller', 'pram', 'wheelchair'] },
      { id: 'changing', icon: '🚼', label: { en: 'Baby changing room', ms: 'Bilik tukar lampin' }, short: { en: 'Changing room', ms: 'Tukar lampin' }, keywords: ['baby', 'changing', 'diaper', 'lampin'] },
      { id: 'highchair', icon: '🪑', label: { en: 'High chairs', ms: 'Kerusi bayi' }, keywords: ['high-chair', 'highchair', 'kerusi'] },
      { id: 'kidsmenu', icon: '🧒', label: { en: 'Kids menu', ms: 'Menu kanak-kanak' }, keywords: ['kids', 'menu'] },
      { id: 'shaded-play', icon: '🌳', label: { en: 'Shaded play area', ms: 'Taman permainan teduh' }, short: { en: 'Shaded play', ms: 'Main teduh' }, keywords: ['play', 'playground', 'shaded'] },
      { id: 'fenced-play', icon: '🛝', label: { en: 'Fenced play area', ms: 'Taman permainan berpagar' }, short: { en: 'Fenced play', ms: 'Main berpagar' }, keywords: ['play', 'playground', 'fenced', 'pagar'] },
    ],
  },
]

export const PRACTICAL_FILTERS: PracticalFilterDef[] = [
  { id: 'halal-ok', icon: '✅', tag: 'halal', anyOf: ['jakim', 'muslim-owned'], label: { en: 'Halal certified or Muslim-owned', ms: 'Sijil halal atau milik Muslim' } },
  { id: 'halal-jakim', icon: '✅', tag: 'halal', anyOf: ['jakim'], label: { en: 'Halal certified (JAKIM) only', ms: 'Sijil halal (JAKIM) sahaja' } },
  { id: 'muslim-friendly', icon: '🤝', tag: 'halal', anyOf: ['jakim', 'muslim-owned', 'muslim-friendly'], label: { en: 'Muslim-friendly or better', ms: 'Mesra Muslim atau lebih' } },
  { id: 'surau', icon: '🕌', tag: 'surau', anyOf: ['yes'], label: { en: 'Has surau', ms: 'Ada surau' } },
  { id: 'easy-parking', icon: '🅿️', tag: 'parking', anyOf: ['easy'], label: { en: 'Easy parking', ms: 'Parking senang' } },
  { id: 'indoor', icon: '🏠', tag: 'setting', anyOf: ['indoor'], label: { en: 'Indoor only', ms: 'Dalam bangunan sahaja' } },
  { id: 'rain-safe', icon: '☔', tag: 'setting', anyOf: ['indoor', 'covered', 'mixed'], label: { en: 'OK when it rains (indoor/covered)', ms: 'OK bila hujan (dalam/berbumbung)' } },
  { id: 'stroller', icon: '👶', tag: 'kids', allOf: ['stroller'], label: { en: 'Stroller accessible', ms: 'Mesra stroller' } },
  { id: 'changing', icon: '🚼', tag: 'kids', allOf: ['changing'], label: { en: 'Baby changing room', ms: 'Bilik tukar lampin' } },
  { id: 'highchair', icon: '🪑', tag: 'kids', allOf: ['highchair'], label: { en: 'High chairs', ms: 'Kerusi bayi' } },
  { id: 'kidsmenu', icon: '🧒', tag: 'kids', allOf: ['kidsmenu'], label: { en: 'Kids menu', ms: 'Menu kanak-kanak' } },
  { id: 'shaded-play', icon: '🌳', tag: 'kids', allOf: ['shaded-play'], label: { en: 'Shaded play area', ms: 'Taman permainan teduh' } },
  { id: 'fenced-play', icon: '🛝', tag: 'kids', allOf: ['fenced-play'], label: { en: 'Fenced play area', ms: 'Taman permainan berpagar' } },
]
