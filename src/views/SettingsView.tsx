import { useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, clearSampleData } from '../db'
import { useApp, type Theme } from '../state'
import { downloadBlob, exportBackup, importBackup } from '../lib/backup'
import type { Lang } from '../i18n'
import { IconDownload, IconTrash, IconUpload } from '../components/Icons'

export function SettingsView() {
  const { t, theme, setTheme, lang, setLang, showToast } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const stats = useLiveQuery(async () => ({
    p: await db.places.count(),
    c: await db.categories.count(),
    ph: await db.photos.count(),
    samples: await db.places.filter((p) => !!p.isSample).count(),
  }))

  return (
    <div className="screen page">
      <header className="page-head">
        <h1>{t('settings.title')}</h1>
      </header>
      <div className="page-body">
        <section className="block">
          <h2 className="block-title">{t('settings.appearance')}</h2>
          <div className="setting">
            <span>{t('settings.theme')}</span>
            <div className="segmented">
              {(['system', 'light', 'dark'] as Theme[]).map((th) => (
                <button key={th} className={theme === th ? 'on' : ''} aria-pressed={theme === th} onClick={() => setTheme(th)}>
                  {t(`settings.theme${th[0].toUpperCase()}${th.slice(1)}` as 'settings.themeSystem')}
                </button>
              ))}
            </div>
          </div>
          <div className="setting">
            <span>{t('settings.language')}</span>
            <div className="segmented">
              {([['en', 'English'], ['ms', 'Bahasa Melayu']] as [Lang, string][]).map(([l, label]) => (
                <button key={l} className={lang === l ? 'on' : ''} aria-pressed={lang === l} onClick={() => setLang(l)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="block">
          <h2 className="block-title">{t('settings.data')}</h2>
          {stats && <p className="muted small">{t('settings.stats', stats)}</p>}
          <p className="muted small">{t('settings.dataNote')}</p>
          <div className="stack">
            <button
              className="btn btn-ghost full"
              onClick={async () => {
                const blob = await exportBackup()
                downloadBlob(blob, `singgah-backup-${new Date().toISOString().slice(0, 10)}.json`)
                showToast(t('settings.exported'))
              }}
            >
              <IconDownload size={18} /> {t('settings.export')}
            </button>
            <button className="btn btn-ghost full" onClick={() => fileRef.current?.click()}>
              <IconUpload size={18} /> {t('settings.import')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                const merge = confirm(t('settings.importMode'))
                if (!merge && !confirm(t('settings.replaceConfirm'))) return
                try {
                  const r = await importBackup(file, merge ? 'merge' : 'replace')
                  showToast(t('settings.imported', { n: r.places }))
                } catch (err) {
                  showToast(t('settings.importFailed', { e: err instanceof Error ? err.message : String(err) }))
                }
              }}
            />
            <button
              className="btn btn-danger-ghost full"
              disabled={!stats?.samples}
              onClick={async () => {
                const n = await clearSampleData()
                showToast(n ? t('settings.sampleCleared', { n }) : t('settings.noSample'))
              }}
            >
              <IconTrash size={18} /> {t('settings.clearSample')}
              {stats?.samples ? ` (${stats.samples})` : ''}
            </button>
          </div>
        </section>

        <p className="muted small about">{t('settings.about')}</p>
      </div>
    </div>
  )
}
