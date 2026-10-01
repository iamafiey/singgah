import { describe, expect, it } from 'vitest'
import { areaFromAddress, cleanTag, detectPlatform, suggestTag, tagUrls, tiktokSearchUrl } from '../social'

describe('detectPlatform', () => {
  it.each([
    ['https://www.tiktok.com/@user/video/123', 'tiktok'],
    ['https://vt.tiktok.com/ZSabc/', 'tiktok'],
    ['instagram.com/p/abc', 'instagram'],
    ['https://www.threads.net/@x/post/1', 'threads'],
    ['https://www.threads.com/@x/post/1', 'threads'],
    ['https://m.facebook.com/story', 'facebook'],
    ['https://fb.watch/xyz', 'facebook'],
    ['https://youtu.be/abc', 'youtube'],
    ['https://example.com', 'other'],
    ['not a url', 'other'],
  ])('%s → %s', (url, p) => expect(detectPlatform(url)).toBe(p))
})

describe('tags', () => {
  it('suggests from name', () => {
    expect(suggestTag('Kopi Kopi Bangi')).toBe('kopikopibangi')
    expect(suggestTag("Ah Wah's Café & Bar")).toBe('ahwahscafeandbar')
    expect(cleanTag('##NasiLemak!')).toBe('nasilemak')
  })
  it('builds URLs', () => {
    expect(tagUrls.threads('kopi')).toBe('https://www.threads.net/search?q=%23kopi&serp_type=tags')
    expect(tagUrls.instagram('kopi')).toBe('https://www.instagram.com/explore/tags/kopi/')
    expect(tagUrls.tiktok('kopi')).toBe('https://www.tiktok.com/tag/kopi')
    expect(tiktokSearchUrl('Kopi Kopi Bangi')).toBe('https://www.tiktok.com/search?q=Kopi%20Kopi%20Bangi')
  })
  it('extracts area', () => {
    expect(areaFromAddress('Seksyen 9, 43650 Bandar Baru Bangi, Selangor')).toBe('Bandar Baru Bangi')
    expect(areaFromAddress('Jalan Reko, 43000 Kajang, Selangor, Malaysia')).toBe('Kajang')
  })
})
