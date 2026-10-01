import type { Platform, SocialLink } from '../types'

export function detectPlatform(url: string): Platform {
  let host = ''
  try {
    host = new URL(normaliseUrl(url)).hostname.toLowerCase()
  } catch {
    return 'other'
  }
  if (/(^|\.)tiktok\.com$/.test(host)) return 'tiktok'
  if (/(^|\.)instagram\.com$/.test(host) || host === 'instagr.am') return 'instagram'
  if (/(^|\.)threads\.(net|com)$/.test(host)) return 'threads'
  if (/(^|\.)(facebook\.com|fb\.com|fb\.watch)$/.test(host)) return 'facebook'
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(host)) return 'youtube'
  return 'other'
}

export function normaliseUrl(url: string): string {
  const u = url.trim()
  if (!u) return u
  return /^https?:\/\//i.test(u) ? u : `https://${u}`
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(normaliseUrl(url))
    return u.hostname.includes('.')
  } catch {
    return false
  }
}

export const platformLabel: Record<Platform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  threads: 'Threads',
  facebook: 'Facebook',
  youtube: 'YouTube',
  other: 'Link',
}

export interface TikTokOEmbed {
  title?: string
  author_name?: string
  thumbnail_url?: string
}

export async function fetchTikTokOEmbed(url: string): Promise<TikTokOEmbed> {
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(normaliseUrl(url))}`)
  if (!res.ok) throw new Error(`TikTok oEmbed failed (${res.status})`)
  return res.json()
}

export async function enrichLink(link: SocialLink): Promise<SocialLink> {
  if (link.platform !== 'tiktok') return link
  try {
    const data = await fetchTikTokOEmbed(link.url)
    return { ...link, title: data.title || link.title, author: data.author_name || link.author, thumbnailUrl: data.thumbnail_url || link.thumbnailUrl }
  } catch {
    return link
  }
}

/** "Kopi Kopi Bangi!" → "kopikopibangi" */
export function cleanTag(tag: string): string {
  return tag
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_]/gu, '')
}

export function suggestTag(name: string): string {
  return cleanTag(name.replace(/&/g, 'and'))
}

export const tagUrls = {
  threads: (tag: string) => `https://www.threads.net/search?q=${encodeURIComponent('#' + tag)}&serp_type=tags`,
  instagram: (tag: string) => `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`,
  tiktok: (tag: string) => `https://www.tiktok.com/tag/${encodeURIComponent(tag)}`,
}

export const tiktokSearchUrl = (q: string) => `https://www.tiktok.com/search?q=${encodeURIComponent(q)}`

/** Best guess at the area (town/city) from a free-text Malaysian address. */
export function areaFromAddress(address: string): string {
  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !/^\d{5}$/.test(p) && !/^(malaysia|selangor|wilayah persekutuan.*|kuala lumpur)$/i.test(p))
    .map((p) => p.replace(/^\d{5}\s+/, ''))
  return parts[parts.length - 1] ?? ''
}
