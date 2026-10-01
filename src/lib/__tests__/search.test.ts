import { describe, expect, it } from 'vitest'
import { search } from '../search'
import { presetCategories, samplePlaces } from '../seed'

const cats = presetCategories()
const places = samplePlaces()
const name = (c: { name: string }) => c.name

describe('search', () => {
  it('matches name, address, notes, tags and category', () => {
    expect(search('kopi', places, cats, name).places.map((p) => p.id)).toEqual(['sample-kopikopi'])
    expect(search('kajang', places, cats, name).places.length).toBeGreaterThanOrEqual(2)
    expect(search('roti canai', places, cats, name).places.map((p) => p.id)).toEqual(['sample-mamak'])
    expect(search('#bukitbroga', places, cats, name).places.map((p) => p.id)).toEqual(['sample-broga'])
    expect(search('mamak', places, cats, name).categories.map((c) => c.id)).toEqual(['cat-mamak'])
    expect(search('bangi', places, cats, name).tags.map((t) => t.tag)).toContain('kopikopibangi')
  })
  it('empty query gives nothing', () => {
    expect(search('  ', places, cats, name).places).toEqual([])
  })
})
