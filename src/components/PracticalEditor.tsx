import { useState } from 'react'
import { useApp } from '../state'
import { PRACTICAL_TAGS, UNKNOWN_LABEL } from '../config/practicalTags'
import { selected, text } from '../lib/practical'
import type { PracticalInfo } from '../types'
import { IconCheck, IconDown, IconUp } from './Icons'

/** Collapsible "Practical info" section, built entirely from config/practicalTags.ts. */
export function PracticalEditor({ value, onChange }: { value: PracticalInfo; onChange: (v: PracticalInfo) => void }) {
  const { t, lang } = useApp()
  const setCount = PRACTICAL_TAGS.filter((tag) => selected(value, tag).length > 0).length
  const [open, setOpen] = useState(setCount > 0)

  const setEntry = (tagId: string, patch: { value?: string | string[] | undefined; note?: string }) => {
    const cur = value[tagId] ?? {}
    onChange({ ...value, [tagId]: { ...cur, ...patch } })
  }

  return (
    <section className="practical-editor">
      <button type="button" className="collapse-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="label">{t('practical.title')}</span>
        <span className="muted small">{setCount ? t('practical.setCount', { n: setCount }) : t('practical.optional')}</span>
        {open ? <IconUp size={20} /> : <IconDown size={20} />}
      </button>
      {open && (
        <div className="practical-fields">
          <p className="muted small">{t('practical.hint')}</p>
          {PRACTICAL_TAGS.map((tag) => {
            const ids = selected(value, tag)
            return (
              <fieldset key={tag.id} className="pt-field">
                <legend>
                  <span aria-hidden>{tag.icon}</span> {text(tag.label, lang)}
                </legend>
                {tag.type === 'single' ? (
                  <div className="pt-options" role="radiogroup" aria-label={text(tag.label, lang)}>
                    <button type="button" role="radio" aria-checked={ids.length === 0} className={`pt-opt ${ids.length === 0 ? 'on unknown' : ''}`} onClick={() => setEntry(tag.id, { value: undefined })}>
                      {text(UNKNOWN_LABEL, lang)}
                    </button>
                    {tag.options.map((o) => {
                      const on = ids.includes(o.id)
                      return (
                        <button
                          type="button"
                          key={o.id}
                          role="radio"
                          aria-checked={on}
                          className={`pt-opt ${on ? 'on' : ''}`}
                          onClick={() => setEntry(tag.id, { value: on ? undefined : o.id })}
                        >
                          <span aria-hidden>{o.icon}</span> {text(o.label, lang)}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="pt-options">
                    {tag.options.map((o) => {
                      const on = ids.includes(o.id)
                      return (
                        <label key={o.id} className={`pt-opt pt-check ${on ? 'on' : ''}`}>
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => setEntry(tag.id, { value: on ? ids.filter((x) => x !== o.id) : [...ids, o.id] })}
                          />
                          <span className="pt-box" aria-hidden>{on && <IconCheck size={13} />}</span>
                          <span aria-hidden>{o.icon}</span> {text(o.label, lang)}
                        </label>
                      )
                    })}
                  </div>
                )}
                {tag.note && (
                  <input
                    className="pt-note"
                    value={value[tag.id]?.note ?? ''}
                    onChange={(e) => setEntry(tag.id, { note: e.target.value })}
                    placeholder={text(tag.note.placeholder, lang)}
                    aria-label={`${text(tag.label, lang)} — ${t('practical.note')}`}
                  />
                )}
              </fieldset>
            )
          })}
        </div>
      )}
    </section>
  )
}
