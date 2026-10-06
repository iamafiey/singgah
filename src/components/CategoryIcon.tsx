import { useState, type CSSProperties } from 'react'
import { CATEGORY_ICONS, DEFAULT_ICON } from './categoryIcons'
import { usePhotoUrl } from '../hooks'
import type { Category } from '../types'

export function CategoryIcon({ icon, size = 18, strokeWidth = 1.8 }: { icon: string | undefined; size?: number; strokeWidth?: number }) {
  const paths = CATEGORY_ICONS[icon ?? ''] ?? CATEGORY_ICONS[DEFAULT_ICON]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}

/** SVG markup string for Leaflet divIcons (map labels). */
export function categoryIconSvg(icon: string | undefined, size = 15): string {
  const paths = CATEGORY_ICONS[icon ?? ''] ?? CATEGORY_ICONS[DEFAULT_ICON]
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths.map((d) => `<path d="${d}"/>`).join('')}</svg>`
}

/**
 * Bundled illustrations for preset categories, served from public/illustrations/<presetKey>.png.
 * Add a preset key here once its file is in place; until then the category emoji is shown.
 */
export const BUNDLED_ILLUSTRATIONS: string[] = []

/**
 * The colourful category illustration: a custom upload if there is one, then a bundled file for
 * preset categories, otherwise the category emoji on a soft circle.
 */
export function CategoryIllustration({ category, size = 64 }: { category: Category | undefined; size?: number }) {
  const custom = usePhotoUrl(category?.illustrationId, 'blob')
  const [bundledFailed, setBundledFailed] = useState(false)
  const bundled =
    category?.presetKey && BUNDLED_ILLUSTRATIONS.includes(category.presetKey) && !bundledFailed
      ? `${import.meta.env.BASE_URL}illustrations/${category.presetKey}.png`
      : undefined
  const src = custom ?? bundled
  return (
    <span className="illus" style={{ width: size, height: size, '--c': category?.color } as CSSProperties} aria-hidden>
      {src ? (
        <img src={src} alt="" loading="lazy" decoding="async" onError={() => !custom && setBundledFailed(true)} />
      ) : (
        <span className="illus-emoji" style={{ fontSize: size * 0.5 }}>{category?.emoji ?? '📍'}</span>
      )}
    </span>
  )
}
