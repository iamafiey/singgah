import { useApp } from '../state'
import { CategoryIllustration } from './CategoryIcon'

/** Horizontal row of category illustrations. Tap to filter (multi-select); none selected = all. */
export function CategoryRow({ size = 64 }: { size?: number }) {
  const { t, categories, catName, catFilter, setCatFilter } = useApp()
  const toggle = (id: string) => setCatFilter(catFilter.includes(id) ? catFilter.filter((x) => x !== id) : [...catFilter, id])
  return (
    <div className="cat-row-scroll" role="toolbar" aria-label={t('tab.categories')}>
      {categories.map((c) => {
        const on = catFilter.includes(c.id)
        return (
          <button key={c.id} type="button" className={`cat-tile ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggle(c.id)}>
            <CategoryIllustration category={c} size={size} />
            <span className="cat-tile-name">{catName(c)}</span>
          </button>
        )
      })}
    </div>
  )
}
