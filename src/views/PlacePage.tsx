import { useState, type CSSProperties } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deletePlace } from '../db'
import { goBack, navigate, useApp } from '../state'
import { useNow } from '../hooks'
import { dayIndex, formatDay, formatTime, hasHours, openState } from '../lib/hours'
import { distanceKm, formatDistance, googleMapsUrl, wazeUrl } from '../lib/geo'
import { areaFromAddress, suggestTag, tagUrls, tiktokSearchUrl } from '../lib/social'
import type { Place } from '../types'
import { Cover, StatusBadge } from '../components/common'
import { PhotoViewer, Thumb } from '../components/PhotoViewer'
import { LinkCard } from '../components/LinkCard'
import { PracticalDetails } from '../components/PracticalBadges'
import { setValues } from '../lib/practical'
import { IconBack, IconCheck, IconClock, IconEdit, IconExternal, IconMap, IconNav, IconNote, IconPin, IconShare, IconTrash, PlatformIcon } from '../components/Icons'

export function PlacePage({ id }: { id: string }) {
  const { t, categoryById, catName, userLocation, showToast, focusPlace } = useApp()
  const place = useLiveQuery(() => db.places.get(id).then((p) => p ?? null), [id])
  const now = useNow()
  const [viewer, setViewer] = useState<number | null>(null)

  if (place === undefined) return <div className="screen" />
  if (place === null)
    return (
      <div className="screen page">
        <header className="page-head">
          <button className="icon-btn" aria-label={t('place.back')} onClick={() => goBack()}>
            <IconBack />
          </button>
        </header>
        <p className="empty">{t('place.notFound')}</p>
      </div>
    )

  const category = categoryById.get(place.categoryId)
  const today = dayIndex(now)
  const area = areaFromAddress(place.address)
  const suggested = suggestTag(place.name)

  const update = (changes: Partial<Place>) => db.places.update(place.id, { ...changes, updatedAt: Date.now() })

  const share = async () => {
    const s = openState(place.hours, now)
    const status =
      s.status === 'open' ? `${t('status.open')}${s.closesAt ? ' · ' + t('status.closes', { t: formatTime(s.closesAt) }) : ''}` : s.status === 'closed' ? t('status.closed') : ''
    const text = [
      `${category?.emoji ?? '📍'} ${place.name}${category ? ` (${catName(category)})` : ''}`,
      place.address && `📍 ${place.address}`,
      status && `🕒 ${status}`,
      place.notes && `📝 ${place.notes}`,
      place.tags.length ? place.tags.map((x) => '#' + x).join(' ') : '',
      `Waze: ${wazeUrl(place)}`,
      `Google Maps: ${googleMapsUrl(place)}`,
      ...place.links.map((l) => l.url),
    ]
      .filter(Boolean)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      showToast(t('place.copied'))
    } catch {
      showToast(t('place.copyFailed'))
    }
  }

  return (
    <div className="screen page place-page" style={{ '--c': category?.color } as CSSProperties}>
      <div className="hero">
        <button className="hero-btn" onClick={() => place.photoIds.length && setViewer(0)} aria-label={place.photoIds.length ? t('edit.photos') : undefined} disabled={!place.photoIds.length}>
          <Cover place={place} category={category} className="hero-img" kind="blob" />
        </button>
        <div className="hero-bar">
          <button className="icon-btn glass" aria-label={t('place.back')} onClick={() => goBack()}>
            <IconBack />
          </button>
        </div>
      </div>

      <div className="page-body">
        <h1 className="place-title">{place.name}</h1>
        {place.address && <p className="place-sub">{place.address}</p>}

        <div className="stats">
          <div className="stat">
            <span className="stat-icon" aria-hidden>{category?.emoji ?? '📍'}</span>
            <span className="stat-label">{catName(category)}</span>
          </div>
          <div className="stat">
            <IconClock size={22} className="stat-svg" />
            <StatusBadge place={place} now={now} long />
          </div>
          <div className="stat">
            <IconPin size={22} className="stat-svg" />
            <span className="stat-label">{userLocation ? formatDistance(distanceKm(userLocation, place)) : '—'}</span>
          </div>
        </div>

        {place.photoIds.length > 1 && (
          <div className="thumb-strip">
            {place.photoIds.map((pid, i) => (
              <Thumb key={pid} id={pid} onClick={() => setViewer(i)} />
            ))}
          </div>
        )}

        <div className="directions">
          <a className="btn btn-primary" href={wazeUrl(place)} target="_blank" rel="noopener noreferrer">
            <IconNav size={18} /> {t('place.waze')}
          </a>
          <a className="btn btn-outline" href={googleMapsUrl(place)} target="_blank" rel="noopener noreferrer">
            <IconPin size={18} /> {t('place.gmaps')}
          </a>
        </div>

        <div className="quick-actions">
          <button className={`qa ${place.visited ? 'on' : ''}`} onClick={() => update({ visited: !place.visited })} aria-pressed={place.visited}>
            <span className="qa-icon"><IconCheck size={20} /></span>
            {place.visited ? t('place.visited') : t('place.markVisited')}
          </button>
          <button className="qa" onClick={() => focusPlace(place.id)}>
            <span className="qa-icon"><IconMap size={20} /></span>
            {t('tab.map')}
          </button>
          <button className="qa" onClick={share}>
            <span className="qa-icon"><IconShare size={20} /></span>
            {t('place.share')}
          </button>
          <button className="qa" onClick={() => navigate(`edit/${place.id}`)}>
            <span className="qa-icon"><IconEdit size={20} /></span>
            {t('place.edit')}
          </button>
        </div>

        <section className="block">
          <h2 className="block-title">
            <IconClock size={18} /> {t('place.hours')}
          </h2>
          {hasHours(place.hours) ? (
            <table className="hours-table">
              <tbody>
                {place.hours.map((d, i) => (
                  <tr key={i} className={i === today ? 'today' : ''}>
                    <th>{t(`day.${i}` as 'day.0')}</th>
                    <td>
                      {formatDay(d, t('hours.closed'), t('hours.allDay'))
                        .split(', ')
                        .map((r, k) => (
                          <span key={k} className="nowrap">{r}</span>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">{t('status.unknown')}</p>
          )}
        </section>

        {setValues(place.practical).length > 0 && (
          <section className="block">
            <h2 className="block-title">{t('practical.title')}</h2>
            <PracticalDetails info={place.practical} />
          </section>
        )}

        {place.notes && (
          <section className="block">
            <h2 className="block-title">
              <IconNote size={18} /> {t('place.notes')}
            </h2>
            <p className="notes">{place.notes}</p>
          </section>
        )}

        <section className="block">
          <h2 className="block-title">{t('place.seeWhatPeopleSay')}</h2>
          {place.tags.length === 0 && (
            <div className="hint">
              <p className="muted small">{t('place.noTags')}</p>
              {suggested && (
                <button className="chip on" onClick={() => update({ tags: [suggested] })}>
                  + #{suggested}
                </button>
              )}
            </div>
          )}
          {place.tags.map((tag) => (
            <div className="tag-group" key={tag}>
              <div className="tag-name">#{tag}</div>
              <div className="social-buttons">
                <a className="social-btn" style={{ '--pc': '#000' } as CSSProperties} href={tagUrls.threads(tag)} target="_blank" rel="noopener noreferrer">
                  <PlatformIcon platform="threads" size={18} /> Threads
                </a>
                <a className="social-btn" style={{ '--pc': '#d62976' } as CSSProperties} href={tagUrls.instagram(tag)} target="_blank" rel="noopener noreferrer">
                  <PlatformIcon platform="instagram" size={18} /> Instagram
                </a>
                <a className="social-btn" style={{ '--pc': '#111' } as CSSProperties} href={tagUrls.tiktok(tag)} target="_blank" rel="noopener noreferrer">
                  <PlatformIcon platform="tiktok" size={18} /> TikTok
                </a>
              </div>
            </div>
          ))}
          <a className="social-btn wide" style={{ '--pc': '#111' } as CSSProperties} href={tiktokSearchUrl([place.name, area].filter(Boolean).join(' '))} target="_blank" rel="noopener noreferrer">
            <PlatformIcon platform="tiktok" size={18} /> {t('place.searchTikTok')} <IconExternal size={16} />
          </a>
        </section>

        {place.links.length > 0 && (
          <section className="block">
            <h2 className="block-title">{t('place.originalPosts')}</h2>
            <div className="link-list">
              {place.links.map((l) => (
                <LinkCard key={l.id} link={l} />
              ))}
            </div>
          </section>
        )}

        <button
          className="btn btn-danger-ghost full"
          onClick={async () => {
            if (!confirm(t('place.deleteConfirm', { name: place.name }))) return
            await deletePlace(place.id)
            goBack()
          }}
        >
          <IconTrash size={18} /> {t('place.delete')}
        </button>
      </div>

      {viewer !== null && <PhotoViewer ids={place.photoIds} start={viewer} onClose={() => setViewer(null)} closeLabel={t('common.close')} />}
    </div>
  )
}
