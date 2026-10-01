import { PRACTICAL_FILTERS, PRACTICAL_TAGS, type PracticalFilterDef, type PracticalOption, type PracticalTagDef, type Text } from '../config/practicalTags'
import type { Lang } from '../i18n'
import type { Place, PracticalInfo } from '../types'

export const tagById = new Map(PRACTICAL_TAGS.map((t) => [t.id, t]))
export const filterById = new Map(PRACTICAL_FILTERS.map((f) => [f.id, f]))

export const text = (t: Text, lang: Lang) => t[lang] ?? t.en

/** Selected option ids for a tag (empty = Unknown). Ignores ids no longer in the config. */
export function selected(info: PracticalInfo | undefined, tag: PracticalTagDef): string[] {
  const v = info?.[tag.id]?.value
  const ids = Array.isArray(v) ? v : v ? [v] : []
  return ids.filter((id) => tag.options.some((o) => o.id === id))
}

export function note(info: PracticalInfo | undefined, tagId: string): string {
  return info?.[tagId]?.note?.trim() ?? ''
}

export interface SetValue {
  tag: PracticalTagDef
  options: PracticalOption[]
  note: string
}

/** All tags that have a value, in config order. */
export function setValues(info: PracticalInfo | undefined): SetValue[] {
  const out: SetValue[] = []
  for (const tag of PRACTICAL_TAGS) {
    const ids = selected(info, tag)
    if (!ids.length) continue
    out.push({ tag, options: tag.options.filter((o) => ids.includes(o.id)), note: note(info, tag.id) })
  }
  return out
}

/** Options worth showing as compact badges on cards/previews. */
export function badgeOptions(info: PracticalInfo | undefined): { tag: PracticalTagDef; option: PracticalOption }[] {
  return setValues(info).flatMap(({ tag, options }) => options.filter((o) => o.badge !== false).map((option) => ({ tag, option })))
}

export function matchesFilter(info: PracticalInfo | undefined, f: PracticalFilterDef): boolean {
  const tag = tagById.get(f.tag)
  if (!tag) return true
  const ids = selected(info, tag)
  if (f.anyOf && !f.anyOf.some((id) => ids.includes(id))) return false
  if (f.allOf && !f.allOf.every((id) => ids.includes(id))) return false
  return true
}

/** All active filters must match (filters combine with AND, like categories + tags). */
export function matchesFilters(place: Place, filterIds: string[]): boolean {
  for (const id of filterIds) {
    const f = filterById.get(id)
    if (f && !matchesFilter(place.practical, f)) return false
  }
  return true
}

/**
 * Searchable phrases for a place's practical values: option labels (both languages), short labels and
 * keywords. Search matches these on the start of the phrase, so "halal" finds "Halal certified (JAKIM)"
 * but not "Non-halal" / "Tidak halal". Notes are returned separately as free text.
 */
export function practicalSearchPhrases(info: PracticalInfo | undefined): { phrases: string[]; notes: string } {
  const phrases: string[] = []
  const notes: string[] = []
  for (const { tag, options, note } of setValues(info)) {
    for (const o of options) phrases.push(o.label.en, o.label.ms, o.short?.en ?? '', o.short?.ms ?? '', ...(o.keywords ?? []))
    // Tag-level keywords ("parking", "kids") only for positive values, so "No surau" isn't found by "surau".
    if (options.some((o) => o.badge !== false)) phrases.push(...(tag.keywords ?? []))
    if (note) notes.push(note)
  }
  return { phrases: phrases.filter(Boolean), notes: notes.join(' ') }
}

/** Normalise a PracticalInfo: drop empty values and blank notes so storage stays tidy. */
export function cleanPractical(info: PracticalInfo): PracticalInfo {
  const out: PracticalInfo = {}
  for (const [id, entry] of Object.entries(info)) {
    const value = Array.isArray(entry.value) ? (entry.value.length ? entry.value : undefined) : entry.value || undefined
    const n = entry.note?.trim() || undefined
    if (value !== undefined || n) out[id] = { ...(value !== undefined ? { value } : {}), ...(n ? { note: n } : {}) }
  }
  return out
}
