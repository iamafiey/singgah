import { useApp } from '../state'
import { badgeOptions, setValues, text } from '../lib/practical'
import type { PracticalInfo } from '../types'

/** Compact badges for set practical values (Unknown is never shown). */
export function PracticalBadges({ info, variant = 'icons', max }: { info: PracticalInfo | undefined; variant?: 'icons' | 'labels'; max?: number }) {
  const { lang } = useApp()
  const items = badgeOptions(info)
  if (!items.length) return null
  const shown = max ? items.slice(0, max) : items
  const extra = items.length - shown.length
  return (
    <span className={`pbadges pbadges-${variant}`}>
      {shown.map(({ tag, option }) => {
        const label = text(option.short ?? option.label, lang)
        const full = `${text(tag.label, lang)}: ${text(option.label, lang)}`
        return (
          <span key={`${tag.id}:${option.id}`} className={`pbadge pbadge-${tag.id}-${option.id}`} title={full} aria-label={full} role="img">
            <span aria-hidden>{option.icon}</span>
            {variant === 'labels' && <span aria-hidden>{label}</span>}
          </span>
        )
      })}
      {extra > 0 && <span className="pbadge pbadge-more">+{extra}</span>}
    </span>
  )
}

/** Full list for the place page, with notes. */
export function PracticalDetails({ info }: { info: PracticalInfo | undefined }) {
  const { lang } = useApp()
  const values = setValues(info)
  if (!values.length) return null
  return (
    <dl className="practical-list">
      {values.map(({ tag, options, note }) => (
        <div key={tag.id} className="practical-row">
          <dt>
            <span aria-hidden>{tag.icon}</span> {text(tag.label, lang)}
          </dt>
          <dd>
            {tag.type === 'multi' ? (
              <ul className="practical-multi">
                {options.map((o) => (
                  <li key={o.id}>
                    <span aria-hidden>{o.icon}</span> {text(o.label, lang)}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="practical-value">
                <span aria-hidden>{options[0].icon}</span> {text(options[0].label, lang)}
              </span>
            )}
            {note && <span className="practical-note">{note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
