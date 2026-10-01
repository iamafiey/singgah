import type { SVGProps } from 'react'
import type { Platform } from '../types'

type P = SVGProps<SVGSVGElement> & { size?: number }
const base = ({ size = 22, ...rest }: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...rest,
})

export const IconMap = (p: P) => (<svg {...base(p)}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>)
export const IconList = (p: P) => (<svg {...base(p)}><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" /></svg>)
export const IconTag = (p: P) => (<svg {...base(p)}><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>)
export const IconGrid = (p: P) => (<svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>)
export const IconSettings = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>)
export const IconSearch = (p: P) => (<svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>)
export const IconX = (p: P) => (<svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>)
export const IconPlus = (p: P) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>)
export const IconLocate = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="7" /></svg>)
export const IconBack = (p: P) => (<svg {...base(p)}><path d="M15 18 9 12l6-6" /></svg>)
export const IconEdit = (p: P) => (<svg {...base(p)}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>)
export const IconTrash = (p: P) => (<svg {...base(p)}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>)
export const IconShare = (p: P) => (<svg {...base(p)}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>)
export const IconCheck = (p: P) => (<svg {...base(p)}><path d="M20 6 9 17l-5-5" /></svg>)
export const IconClock = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>)
export const IconPin = (p: P) => (<svg {...base(p)}><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>)
export const IconNote = (p: P) => (<svg {...base(p)}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></svg>)
export const IconCamera = (p: P) => (<svg {...base(p)}><path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="3.5" /></svg>)
export const IconLink = (p: P) => (<svg {...base(p)}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>)
export const IconChevL = (p: P) => (<svg {...base(p)}><path d="m15 18-6-6 6-6" /></svg>)
export const IconChevR = (p: P) => (<svg {...base(p)}><path d="m9 18 6-6-6-6" /></svg>)
export const IconUp = (p: P) => (<svg {...base(p)}><path d="m18 15-6-6-6 6" /></svg>)
export const IconDown = (p: P) => (<svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>)
export const IconCopy = (p: P) => (<svg {...base(p)}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>)
export const IconExternal = (p: P) => (<svg {...base(p)}><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>)
export const IconDownload = (p: P) => (<svg {...base(p)}><path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16" /></svg>)
export const IconUpload = (p: P) => (<svg {...base(p)}><path d="M12 21V9m0 0-4 4m4-4 4 4M4 3h16" /></svg>)
export const IconNav = (p: P) => (<svg {...base(p)}><path d="m3 11 19-9-9 19-2-8z" /></svg>)
export const IconImage = (p: P) => (<svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>)

/** Simplified platform glyphs (filled). */
export function PlatformIcon({ platform, size = 20 }: { platform: Platform; size?: number }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true }
  switch (platform) {
    case 'tiktok':
      return (<svg {...s}><path d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .8.1V9a6.2 6.2 0 1 0 5.4 6.2V8.6a7.6 7.6 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.4z" /></svg>)
    case 'instagram':
      return (<svg {...s} fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>)
    case 'threads':
      return (<svg {...s}><path d="M17.3 11.2c-.1 0-.2-.1-.3-.1-.2-3.2-2-5-4.9-5h-.1c-1.8 0-3.2.8-4.1 2.1l1.6 1.1c.7-1 1.7-1.2 2.5-1.2 1 0 1.8.3 2.3.9.4.4.6 1 .7 1.7a12 12 0 0 0-2.7-.1c-2.7.2-4.4 1.7-4.3 3.9.1 1.1.6 2 1.5 2.6.8.5 1.8.8 2.8.7 1.4-.1 2.5-.6 3.2-1.6.6-.7.9-1.7 1-2.9.7.4 1.2.9 1.4 1.5.5 1.1.5 2.8-.9 4.2-1.2 1.2-2.7 1.7-4.9 1.7-2.4 0-4.3-.8-5.5-2.3C6.4 17.7 5.8 15.6 5.8 13s.6-4.7 1.8-6.2C8.8 5.3 10.7 4.5 13 4.5c2.4 0 4.3.8 5.5 2.3.6.7 1.1 1.7 1.4 2.8l1.9-.5c-.4-1.4-1-2.6-1.8-3.6C18.5 3.6 16.1 2.6 13 2.6c-3 0-5.4 1-7 3C4.6 7.3 3.9 9.8 3.9 13s.7 5.7 2.1 7.4c1.6 2 4 3 7 3 2.7 0 4.6-.7 6.2-2.3 2.1-2.1 2-4.7 1.3-6.3-.5-1.1-1.4-2-2.6-2.6zm-4.5 4.4c-1.1.1-2.3-.4-2.3-1.5-.1-.8.6-1.7 2.4-1.8h.6c.6 0 1.2.1 1.8.2-.2 2.6-1.4 3-2.5 3.1z" /></svg>)
    case 'facebook':
      return (<svg {...s}><path d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H7.6v3.6h2.7V22H14v-9.9h2.8l.4-3.6z" /></svg>)
    case 'youtube':
      return (<svg {...s}><path d="M22 7.5a3 3 0 0 0-2.1-2.1C18 5 12 5 12 5s-6 0-7.9.4A3 3 0 0 0 2 7.5 31 31 0 0 0 1.7 12 31 31 0 0 0 2 16.5a3 3 0 0 0 2.1 2.1C6 19 12 19 12 19s6 0 7.9-.4a3 3 0 0 0 2.1-2.1c.3-1.5.4-3 .4-4.5s-.1-3-.4-4.5zM10 15V9l5.2 3z" /></svg>)
    default:
      return <IconLink size={size} />
  }
}

export const platformColor: Record<Platform, string> = {
  tiktok: '#111111',
  instagram: '#d62976',
  threads: '#000000',
  facebook: '#1877f2',
  youtube: '#ff0000',
  other: '#6b5b4e',
}
export const IconRoute = (p: P) => (<svg {...base(p)}><circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="5" r="2.5" /><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5" /></svg>)
export const IconFilter = (p: P) => (<svg {...base(p)}><path d="M4 6h16M7 12h10M10 18h4" /></svg>)
