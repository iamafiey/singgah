import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { db } from '../db'
import { goBack, navigate, useApp } from '../state'
import { uid } from '../lib/id'
import { compressImage, fetchImageBlob } from '../lib/image'
import { reverseGeocode, type LatLng } from '../lib/geo'
import { cleanTag, detectPlatform, enrichLink, isValidUrl, normaliseUrl, suggestTag, platformLabel } from '../lib/social'
import type { Place, SocialLink, WeekHours } from '../types'
import { HoursEditor } from '../components/HoursEditor'
import { LocationPicker } from '../components/LocationPicker'
import { LinkCard } from '../components/LinkCard'
import { PhotoViewer, Thumb } from '../components/PhotoViewer'
import { IconCamera, IconChevL, IconChevR, IconImage, IconX, PlatformIcon } from '../components/Icons'

interface Draft {
  name: string
  categoryId: string
  location: LatLng | null
  address: string
  notes: string
  hours: WeekHours | null
  photoIds: string[]
  links: SocialLink[]
  tags: string[]
}

export function PlaceEditor({ id }: { id?: string }) {
  const { t, lang, categories, catName, showToast } = useApp()
  const [original, setOriginal] = useState<Place | null | undefined>(id ? undefined : null)
  const [draft, setDraft] = useState<Draft>({
    name: '',
    categoryId: '',
    location: null,
    address: '',
    notes: '',
    hours: null,
    photoIds: [],
    links: [],
    tags: [],
  })
  const addedPhotos = useRef(new Set<string>())
  const [busyPhotos, setBusyPhotos] = useState(0)
  const [viewer, setViewer] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [linkInput, setLinkInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const addressTouched = useRef(false)

  useEffect(() => {
    if (!id) return
    db.places.get(id).then((p) => {
      setOriginal(p ?? null)
      if (p) {
        addressTouched.current = !!p.address
        setDraft({
          name: p.name,
          categoryId: p.categoryId,
          location: { lat: p.lat, lng: p.lng },
          address: p.address,
          notes: p.notes,
          hours: p.hours,
          photoIds: p.photoIds,
          links: p.links,
          tags: p.tags,
        })
      }
    })
  }, [id])

  // Leaving without saving (e.g. the browser back button) drops photos added in this session.
  useEffect(() => {
    const added = addedPhotos.current
    return () => {
      if (added.size) db.photos.bulkDelete([...added])
    }
  }, [])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }))

  // ---------- Photos ----------
  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const list = [...files].filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
    setBusyPhotos((n) => n + list.length)
    for (const f of list) {
      try {
        const { blob, thumb } = await compressImage(f)
        const pid = uid()
        await db.photos.add({ id: pid, blob, thumb })
        addedPhotos.current.add(pid)
        setDraft((d) => ({ ...d, photoIds: [...d.photoIds, pid] }))
      } catch {
        showToast(`Couldn’t read ${f.name}`)
      } finally {
        setBusyPhotos((n) => n - 1)
      }
    }
  }
  const movePhoto = (i: number, dir: -1 | 1) => {
    const ids = [...draft.photoIds]
    const j = i + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    set('photoIds', ids)
  }
  const removePhoto = (pid: string) => set('photoIds', draft.photoIds.filter((x) => x !== pid))

  // ---------- Links ----------
  const addLink = async () => {
    const raw = linkInput.trim()
    if (!raw) return
    if (!isValidUrl(raw)) {
      showToast(t('edit.invalidLink'))
      return
    }
    const url = normaliseUrl(raw)
    const link: SocialLink = { id: uid(), url, platform: detectPlatform(url) }
    setLinkInput('')
    setDraft((d) => ({ ...d, links: [...d.links, link] }))
    if (link.platform === 'tiktok') {
      const enriched = await enrichLink(link)
      setDraft((d) => ({ ...d, links: d.links.map((l) => (l.id === link.id ? enriched : l)) }))
    }
  }
  const addThumbToPhotos = async (link: SocialLink) => {
    if (!link.thumbnailUrl) return
    setBusyPhotos((n) => n + 1)
    try {
      const blob = await fetchImageBlob(link.thumbnailUrl)
      const { blob: big, thumb } = await compressImage(blob)
      const pid = uid()
      await db.photos.add({ id: pid, blob: big, thumb })
      addedPhotos.current.add(pid)
      setDraft((d) => ({ ...d, photoIds: [...d.photoIds, pid] }))
      showToast(t('edit.thumbAdded'))
    } catch {
      showToast(t('edit.thumbFailed'))
    } finally {
      setBusyPhotos((n) => n - 1)
    }
  }

  // ---------- Tags ----------
  const addTag = (raw: string) => {
    const tags = raw
      .split(/[\s,]+/)
      .map(cleanTag)
      .filter(Boolean)
    if (!tags.length) return
    setDraft((d) => ({ ...d, tags: [...new Set([...d.tags, ...tags])] }))
    setTagInput('')
  }
  const suggested = suggestTag(draft.name)

  // ---------- Location ----------
  const onLocation = async (p: LatLng, address?: string) => {
    set('location', p)
    if (address) {
      set('address', address)
      addressTouched.current = true
      return
    }
    if (!addressTouched.current) {
      const a = await reverseGeocode(p, lang)
      if (a && !addressTouched.current) set('address', a)
    }
  }

  // ---------- Save / cancel ----------
  const cleanupAdded = async (keep: string[]) => {
    const orphans = [...addedPhotos.current].filter((x) => !keep.includes(x))
    if (orphans.length) await db.photos.bulkDelete(orphans)
    addedPhotos.current.clear()
  }

  const cancel = async () => {
    await cleanupAdded([])
    goBack()
  }

  const save = async () => {
    if (!draft.name.trim() || !draft.categoryId || !draft.location) {
      setError(!draft.location && draft.name.trim() && draft.categoryId ? t('edit.needLocation') : t('edit.required'))
      return
    }
    setSaving(true)
    const now = Date.now()
    const pendingTag = cleanTag(tagInput)
    const place: Place = {
      id: original?.id ?? uid(),
      name: draft.name.trim(),
      categoryId: draft.categoryId,
      lat: draft.location.lat,
      lng: draft.location.lng,
      address: draft.address.trim(),
      notes: draft.notes.trim(),
      hours: draft.hours,
      photoIds: draft.photoIds,
      links: draft.links,
      tags: pendingTag && !draft.tags.includes(pendingTag) ? [...draft.tags, pendingTag] : draft.tags,
      visited: original?.visited ?? false,
      isSample: false,
      createdAt: original?.createdAt ?? now,
      updatedAt: now,
    }
    const removed = (original?.photoIds ?? []).filter((x) => !place.photoIds.includes(x))
    await db.transaction('rw', db.places, db.photos, async () => {
      await db.places.put(place)
      if (removed.length) await db.photos.bulkDelete(removed)
    })
    await cleanupAdded(place.photoIds)
    addedPhotos.current.clear()
    showToast(t('edit.saved'))
    if (original) goBack()
    else navigate(`place/${place.id}`, true)
  }

  if (id && original === undefined) return <div className="screen" />
  if (id && original === null) return <div className="screen page"><p className="empty">{t('place.notFound')}</p></div>

  const linkPlatform = linkInput.trim() && isValidUrl(linkInput) ? detectPlatform(linkInput) : null

  return (
    <div className="screen page editor">
      <header className="page-head sticky">
        <button type="button" className="btn btn-text" onClick={cancel}>
          {t('edit.cancel')}
        </button>
        <h1>{original ? t('edit.editTitle') : t('edit.newTitle')}</h1>
        <button type="button" className="btn btn-primary small" onClick={save} disabled={saving || busyPhotos > 0}>
          {t('edit.save')}
        </button>
      </header>

      <form
        className="page-body form"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        {error && <p className="form-error" role="alert">{error}</p>}

        <label className="field">
          <span className="label">{t('edit.name')} *</span>
          <input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder={t('edit.namePh')} autoFocus={!id} required enterKeyHint="next" />
        </label>

        <fieldset className="field">
          <legend className="label">{t('edit.category')} *</legend>
          <div className="cat-picker">
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`cat-option ${draft.categoryId === c.id ? 'on' : ''}`}
                style={{ '--c': c.color } as CSSProperties}
                aria-pressed={draft.categoryId === c.id}
                onClick={() => set('categoryId', c.id)}
              >
                <span className="cat-emoji">{c.emoji}</span>
                <span>{catName(c)}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <span className="label">{t('edit.location')} *</span>
          <LocationPicker value={draft.location} onChange={onLocation} />
        </div>

        <label className="field">
          <span className="label">{t('edit.address')}</span>
          <textarea
            rows={2}
            value={draft.address}
            onChange={(e) => {
              addressTouched.current = true
              set('address', e.target.value)
            }}
            placeholder={t('edit.addressPh')}
          />
        </label>

        <div className="field">
          <span className="label">{t('edit.photos')}</span>
          <div className="photo-edit-strip">
            {draft.photoIds.map((pid, i) => (
              <div className="photo-edit" key={pid}>
                <Thumb id={pid} onClick={() => setViewer(i)} />
                {i === 0 && <span className="cover-tag">{t('edit.cover')}</span>}
                <button type="button" className="photo-x" aria-label={t('common.remove')} onClick={() => removePhoto(pid)}>
                  <IconX size={14} />
                </button>
                <div className="photo-move">
                  <button type="button" aria-label="Move left" disabled={i === 0} onClick={() => movePhoto(i, -1)}>
                    <IconChevL size={16} />
                  </button>
                  <button type="button" aria-label="Move right" disabled={i === draft.photoIds.length - 1} onClick={() => movePhoto(i, 1)}>
                    <IconChevR size={16} />
                  </button>
                </div>
              </div>
            ))}
            {Array.from({ length: busyPhotos }, (_, i) => (
              <div className="photo-edit loading" key={`l${i}`} aria-label={t('edit.processing')} />
            ))}
            <label className="photo-add">
              <IconImage />
              <span>{t('edit.addPhotos')}</span>
              <input type="file" accept="image/*" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ''))} />
            </label>
            <label className="photo-add">
              <IconCamera />
              <span>Camera</span>
              <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ''))} />
            </label>
          </div>
        </div>

        <div className="field">
          <span className="label">{t('edit.links')}</span>
          <div className="link-list">
            {draft.links.map((l) => (
              <LinkCard key={l.id} link={l}>
                <div className="link-actions">
                  {l.platform === 'tiktok' && l.thumbnailUrl && (
                    <button type="button" className="link-btn" onClick={() => addThumbToPhotos(l)}>
                      <IconImage size={14} /> {t('edit.addThumb')}
                    </button>
                  )}
                  <button type="button" className="icon-btn small" aria-label={t('common.remove')} onClick={() => set('links', draft.links.filter((x) => x.id !== l.id))}>
                    <IconX size={16} />
                  </button>
                </div>
              </LinkCard>
            ))}
          </div>
          <div className="input-with-btn">
            {linkPlatform && (
              <span className="input-icon" title={platformLabel[linkPlatform]}>
                <PlatformIcon platform={linkPlatform} size={18} />
              </span>
            )}
            <input
              type="url"
              inputMode="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text')
                if (text && isValidUrl(text) && !linkInput) {
                  e.preventDefault()
                  setLinkInput(text.trim())
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addLink()
                }
              }}
              placeholder={t('edit.linkPh')}
              aria-label={t('edit.linkPh')}
            />
            <button type="button" className="btn btn-primary small" onClick={addLink} disabled={!linkInput.trim()}>
              {t('edit.addLink')}
            </button>
          </div>
        </div>

        <div className="field">
          <span className="label">{t('edit.tags')}</span>
          <div className="tag-input">
            {draft.tags.map((tag) => (
              <span className="tag" key={tag}>
                #{tag}
                <button type="button" aria-label={`${t('common.remove')} #${tag}`} onClick={() => set('tags', draft.tags.filter((x) => x !== tag))}>
                  <IconX size={12} />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => {
                const v = e.target.value
                if (/[\s,]$/.test(v)) addTag(v)
                else setTagInput(v)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag(tagInput)
                } else if (e.key === 'Backspace' && !tagInput && draft.tags.length) {
                  set('tags', draft.tags.slice(0, -1))
                }
              }}
              onBlur={() => tagInput && addTag(tagInput)}
              placeholder={draft.tags.length ? '' : t('edit.tagPh')}
              aria-label={t('edit.tagPh')}
              autoCapitalize="none"
            />
          </div>
          {suggested && !draft.tags.includes(suggested) && (
            <div className="row gap-s small">
              <span className="muted">{t('edit.suggested')}:</span>
              <button type="button" className="chip" onClick={() => addTag(suggested)}>
                + #{suggested}
              </button>
            </div>
          )}
        </div>

        <div className="field">
          <span className="label">{t('edit.hours')}</span>
          <HoursEditor value={draft.hours} onChange={(h) => set('hours', h)} />
        </div>

        <label className="field">
          <span className="label">{t('edit.notes')}</span>
          <textarea rows={4} value={draft.notes} onChange={(e) => set('notes', e.target.value)} placeholder={t('edit.notesPh')} />
        </label>

        <button type="submit" className="btn btn-primary full big" disabled={saving || busyPhotos > 0}>
          {busyPhotos > 0 ? t('edit.processing') : t('edit.save')}
        </button>
      </form>

      {viewer !== null && <PhotoViewer ids={draft.photoIds} start={viewer} onClose={() => setViewer(null)} closeLabel={t('common.close')} />}
    </div>
  )
}
