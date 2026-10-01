import { describe, expect, it } from 'vitest'
import { PRACTICAL_FILTERS, PRACTICAL_TAGS } from '../../config/practicalTags'
import { badgeOptions, cleanPractical, matchesFilters, setValues } from '../practical'
import { search } from '../search'
import { presetCategories, samplePlaces } from '../seed'
import type { Place } from '../../types'

const places = samplePlaces()
const cats = presetCategories()
const ids = (ps: Place[]) => ps.map((p) => p.id).sort()
const filter = (...f: string[]) => ids(places.filter((p) => matchesFilters(p, f)))

describe('config', () => {
  it('has unique ids and every filter points at real options', () => {
    const tagIds = PRACTICAL_TAGS.map((t) => t.id)
    expect(new Set(tagIds).size).toBe(tagIds.length)
    for (const t of PRACTICAL_TAGS) expect(new Set(t.options.map((o) => o.id)).size).toBe(t.options.length)
    for (const f of PRACTICAL_FILTERS) {
      const tag = PRACTICAL_TAGS.find((t) => t.id === f.tag)
      expect(tag, f.id).toBeTruthy()
      for (const o of [...(f.anyOf ?? []), ...(f.allOf ?? [])]) expect(tag!.options.some((x) => x.id === o), `${f.id}:${o}`).toBe(true)
    }
  })
})

describe('filters', () => {
  it('match only set values, AND-combined', () => {
    expect(filter('halal-ok')).toEqual(['sample-kopikopi', 'sample-mamak', 'sample-sate'])
    expect(filter('halal-jakim')).toEqual(['sample-sate'])
    expect(filter('surau')).toEqual(['sample-cempaka', 'sample-kopikopi'])
    expect(filter('easy-parking')).toEqual(['sample-cempaka', 'sample-mamak'])
    expect(filter('stroller')).toEqual(['sample-cempaka', 'sample-kopikopi'])
    expect(filter('surau', 'stroller', 'easy-parking')).toEqual(['sample-cempaka'])
    expect(filter('indoor')).toEqual([])
    expect(filter('rain-safe')).toEqual(['sample-kopikopi', 'sample-mamak', 'sample-sate'])
    expect(filter()).toHaveLength(places.length)
  })

  it('unknown never matches, and missing practical is safe', () => {
    const bare = { ...places[0], practical: undefined } as unknown as Place
    expect(matchesFilters(bare, ['surau'])).toBe(false)
    expect(matchesFilters(bare, [])).toBe(true)
    expect(setValues(undefined)).toEqual([])
  })
})

describe('badges', () => {
  it('skip options marked badge:false and unknown values', () => {
    const p: Place = { ...places[0], practical: { surau: { value: 'no' }, parking: { value: 'easy' } } }
    expect(badgeOptions(p.practical).map((b) => b.option.id)).toEqual(['easy'])
    expect(badgeOptions({ halal: { value: 'not-in-config' } })).toEqual([])
  })
})

describe('search', () => {
  const s = (q: string, ps = places) => ids(search(q, ps, cats, (c) => c.name).places)
  it('finds practical values by label and keyword', () => {
    expect(s('halal')).toEqual(['sample-kopikopi', 'sample-mamak', 'sample-sate'])
    expect(s('surau')).toEqual(['sample-cempaka', 'sample-kopikopi'])
    expect(s('stroller')).toEqual(['sample-cempaka', 'sample-kopikopi'])
    expect(s('jakim')).toEqual(['sample-sate'])
    expect(s('mesra stroller')).toEqual(['sample-cempaka', 'sample-kopikopi'])
    expect(s('pay by app')).toEqual(['sample-kopikopi']) // notes are searchable
  })
  it('"halal" does not find non-halal spots, "surau" does not find "No surau"', () => {
    const extra: Place[] = [
      { ...places[0], id: 'pork', name: 'Pork Noodle', notes: '', tags: [], practical: { halal: { value: 'non-halal' }, surau: { value: 'no' } } },
    ]
    expect(s('halal', extra)).toEqual([])
    expect(s('surau', extra)).toEqual([])
    expect(s('non-halal', extra)).toEqual(['pork'])
    expect(s('tidak halal', extra)).toEqual(['pork'])
  })
})

describe('cleanPractical', () => {
  it('drops empty values and blank notes', () => {
    expect(
      cleanPractical({ halal: { value: undefined }, kids: { value: [] }, surau: { value: 'yes', note: '  ' }, parking: { note: ' level B1 ' } }),
    ).toEqual({ surau: { value: 'yes' }, parking: { note: 'level B1' } })
  })
})
