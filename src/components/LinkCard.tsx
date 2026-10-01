import type { CSSProperties, ReactNode } from 'react'
import type { SocialLink } from '../types'
import { platformLabel } from '../lib/social'
import { PlatformIcon, platformColor } from './Icons'

export function LinkCard({ link, children }: { link: SocialLink; children?: ReactNode }) {
  let host = ''
  try {
    host = new URL(link.url).hostname.replace(/^www\./, '')
  } catch {
    /* ignore */
  }
  return (
    <div className="link-card" style={{ '--pc': platformColor[link.platform] } as CSSProperties}>
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-card-main">
        {link.thumbnailUrl ? (
          <img className="link-thumb" src={link.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.display = 'none')} />
        ) : null}
        <span className="link-icon">
          <PlatformIcon platform={link.platform} />
        </span>
        <span className="link-text">
          <strong>{link.author ? `${platformLabel[link.platform]} · @${link.author.replace(/^@/, '')}` : platformLabel[link.platform]}</strong>
          <small>{link.title || host}</small>
        </span>
      </a>
      {children}
    </div>
  )
}
