import type { Category, Place } from '../types'

export interface SearchResults {
  places: Place[]
  categories: Category[]
  tags: { tag: string; count: number }[]
}

export function normalise(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** Every whitespace-separated term must match somewhere (name, category, address, notes or tags). */
export function search(query: string, places: Place[], categories: Category[], catName: (c: Category) => string): SearchResults {
  const terms = normalise(query).replace(/#/g, ' ').split(/\s+/).filter(Boolean)
  if (!terms.length) return { places: [], categories: [], tags: [] }
  const catMap = new Map(categories.map((c) => [c.id, c]))

  const scored = places
    .map((p) => {
      const name = normalise(p.name)
      const cat = catMap.get(p.categoryId)
      const hay = [name, cat ? normalise(catName(cat)) : '', normalise(p.address), normalise(p.notes), ...p.tags.map(normalise)].join(' \u0000 ')
      if (!terms.every((t) => hay.includes(t))) return null
      let score = 0
      for (const t of terms) {
        if (name.startsWith(t)) score += 4
        else if (name.includes(t)) score += 2
        if (p.tags.some((tag) => tag.startsWith(t))) score += 1
      }
      return { p, score }
    })
    .filter((x): x is { p: Place; score: number } => !!x)
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
    .map((x) => x.p)

  const matchedCats = categories.filter((c) => terms.every((t) => normalise(catName(c)).includes(t) || normalise(c.name).includes(t)))

  const tagCounts = new Map<string, number>()
  for (const p of places) for (const tag of p.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  const joined = terms.join('')
  const tags = [...tagCounts.entries()]
    .filter(([tag]) => normalise(tag).includes(joined) || terms.every((t) => normalise(tag).includes(t)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }))

  return { places: scored, categories: matchedCats, tags }
}
