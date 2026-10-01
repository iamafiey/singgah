import { useState, type CSSProperties } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteCategory } from '../db'
import { useApp } from '../state'
import { uid } from '../lib/id'
import type { Category } from '../types'
import { Modal } from '../components/common'
import { IconDown, IconEdit, IconPlus, IconTrash, IconUp } from '../components/Icons'

const SWATCHES = ['#b0703c', '#e0593b', '#d99a14', '#3f9a5a', '#e5679a', '#2f7d74', '#8a5cd1', '#3a7bd5', '#c2410c', '#0e7490', '#65a30d', '#be123c', '#6b5b4e', '#475569']
const EMOJIS = ['☕', '🍽️', '🫓', '🍜', '🍰', '🍦', '🍢', '🥘', '🍔', '🍕', '🧋', '🌳', '🛝', '⛰️', '🏖️', '🏞️', '🛍️', '🎡', '🏛️', '🕌', '🎨', '🏊', '⚽', '🚴', '🏨', '⛺', '🎬', '📚', '💈', '🐾', '⭐', '📍']

export function CategoriesView() {
  const { t, categories, catName, showToast } = useApp()
  const counts = useLiveQuery(async () => {
    const m = new Map<string, number>()
    await db.places.each((p) => m.set(p.categoryId, (m.get(p.categoryId) ?? 0) + 1))
    return m
  }, [])
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= categories.length) return
    const list = [...categories]
    ;[list[i], list[j]] = [list[j], list[i]]
    await db.categories.bulkPut(list.map((c, k) => ({ ...c, order: k })))
  }

  const addNew = () => {
    setEditing({ id: '', name: '', emoji: '⭐', color: SWATCHES[categories.length % SWATCHES.length], order: categories.length })
  }

  return (
    <div className="screen page">
      <header className="page-head">
        <h1>{t('cat.title')}</h1>
        <button className="btn btn-primary small" onClick={addNew}>
          <IconPlus size={18} /> {t('cat.add')}
        </button>
      </header>
      <ul className="cat-list page-body">
        {categories.map((c, i) => (
          <li key={c.id} className="cat-row" style={{ '--c': c.color } as CSSProperties}>
            <button className="cat-row-main" onClick={() => setEditing(c)} aria-label={`${t('cat.edit')} ${catName(c)}`}>
              <span className="cat-badge">{c.emoji}</span>
              <span className="cat-row-text">
                <strong>{catName(c)}</strong>
                <small className="muted">{t('cat.places', { n: counts?.get(c.id) ?? 0 })}</small>
              </span>
              <IconEdit size={18} className="muted" />
            </button>
            <div className="cat-row-actions">
              <button className="icon-btn small" aria-label={t('cat.moveUp')} disabled={i === 0} onClick={() => move(i, -1)}>
                <IconUp size={18} />
              </button>
              <button className="icon-btn small" aria-label={t('cat.moveDown')} disabled={i === categories.length - 1} onClick={() => move(i, 1)}>
                <IconDown size={18} />
              </button>
              <button
                className="icon-btn small danger"
                aria-label={t('cat.delete')}
                onClick={() => (categories.length <= 1 ? showToast(t('cat.lastOne')) : setDeleting(c))}
              >
                <IconTrash size={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editing && <CategoryForm initial={editing} onClose={() => setEditing(null)} />}
      {deleting && <DeleteCategory category={deleting} count={counts?.get(deleting.id) ?? 0} onClose={() => setDeleting(null)} />}
    </div>
  )
}

function CategoryForm({ initial, onClose }: { initial: Category; onClose: () => void }) {
  const { t, catName } = useApp()
  const [name, setName] = useState(initial.id ? catName(initial) : '')
  const [emoji, setEmoji] = useState(initial.emoji)
  const [color, setColor] = useState(initial.color)

  const save = async () => {
    const n = name.trim() || t('cat.newName')
    if (initial.id) {
      const renamed = initial.renamed || n !== catName(initial)
      await db.categories.update(initial.id, { name: renamed ? n : initial.name, emoji, color, renamed })
    } else {
      await db.categories.add({ id: uid(), name: n, emoji, color, order: initial.order })
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={initial.id ? t('cat.edit') : t('cat.add')}
      actions={
        <>
          <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={save}>{t('cat.done')}</button>
        </>
      }
    >
      <div className="cat-preview" style={{ '--c': color } as CSSProperties}>
        <span className="cat-badge big">{emoji || '📍'}</span>
        <strong>{name || t('cat.newName')}</strong>
      </div>
      <label className="field">
        <span className="label">{t('cat.name')}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('cat.newName')} autoFocus onKeyDown={(e) => e.key === 'Enter' && save()} />
      </label>
      <div className="field">
        <span className="label">{t('cat.emoji')}</span>
        <div className="emoji-grid">
          {EMOJIS.map((e) => (
            <button key={e} type="button" className={`emoji-opt ${emoji === e ? 'on' : ''}`} onClick={() => setEmoji(e)} aria-pressed={emoji === e}>
              {e}
            </button>
          ))}
          <input className="emoji-custom" value={EMOJIS.includes(emoji) ? '' : emoji} onChange={(e) => setEmoji([...e.target.value].slice(-2).join('') || initial.emoji)} placeholder="✏️" aria-label="Custom emoji" maxLength={8} />
        </div>
      </div>
      <div className="field">
        <span className="label">{t('cat.color')}</span>
        <div className="swatches">
          {SWATCHES.map((s) => (
            <button key={s} type="button" className={`swatch ${color === s ? 'on' : ''}`} style={{ background: s }} onClick={() => setColor(s)} aria-label={s} aria-pressed={color === s} />
          ))}
          <label className="swatch swatch-custom" style={{ background: SWATCHES.includes(color) ? undefined : color }} aria-label="Custom colour">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
        </div>
      </div>
    </Modal>
  )
}

function DeleteCategory({ category, count, onClose }: { category: Category; count: number; onClose: () => void }) {
  const { t, categories, catName } = useApp()
  const others = categories.filter((c) => c.id !== category.id)
  const [choice, setChoice] = useState<string>(others[0]?.id ?? '__delete')

  const confirmDelete = async () => {
    await deleteCategory(category.id, count === 0 || choice === '__delete' ? null : choice)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t('cat.deleteTitle', { name: catName(category) })}
      actions={
        <>
          <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-danger" onClick={confirmDelete}>{t('common.delete')}</button>
        </>
      }
    >
      {count === 0 ? (
        <p>{t('cat.deleteEmpty')}</p>
      ) : (
        <>
          <p>{t('cat.deleteHas', { n: count })}</p>
          <div className="radio-list">
            {others.map((c) => (
              <label key={c.id} className="radio">
                <input type="radio" name="moveTo" checked={choice === c.id} onChange={() => setChoice(c.id)} />
                <span>
                  {t('cat.moveTo')} {c.emoji} <strong>{catName(c)}</strong>
                </span>
              </label>
            ))}
            <label className="radio danger">
              <input type="radio" name="moveTo" checked={choice === '__delete'} onChange={() => setChoice('__delete')} />
              <span>{t('cat.deleteAll')}</span>
            </label>
          </div>
        </>
      )}
    </Modal>
  )
}
