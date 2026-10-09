import { useState } from 'react'
import { BarChart3, Info, RotateCcw } from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { useToast } from '../components/Toast'

export function Settings() {
  const { t, lang, setLang } = useI18n()
  const { textSize, setTextSize } = useAppState()
  const { data, resetDemo } = useData()
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <h1>{t('settings.title')}</h1>

      <section className="card stack" aria-labelledby="set-lang">
        <h2 id="set-lang">{t('settings.language')}</h2>
        <div className="segmented">
          <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')} lang="en">English</button>
          <button type="button" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')} lang="ar">العربية</button>
        </div>
      </section>

      <section className="card stack" aria-labelledby="set-size">
        <h2 id="set-size">{t('settings.textSize')}</h2>
        <div className="segmented">
          <button type="button" aria-pressed={textSize === 'normal'} onClick={() => setTextSize('normal')}>{t('settings.textNormal')}</button>
          <button type="button" aria-pressed={textSize === 'large'} onClick={() => setTextSize('large')}>{t('settings.textLarge')}</button>
        </div>
      </section>

      <section className="card stack" aria-labelledby="set-demo">
        <h2 id="set-demo">{t('settings.demo')}</h2>
        {data && (
          <p className="muted">
            {t('settings.demoLoaded', {
              locations: data.locations.length, problems: data.problems.length, checklists: data.checklistTemplates.length,
            })}
          </p>
        )}
        {!confirming ? (
          <button type="button" className="btn-text btn-danger-text" onClick={() => setConfirming(true)}>
            <RotateCcw size={20} aria-hidden />{t('settings.reset')}
          </button>
        ) : (
          <div className="panel stack" role="alertdialog" aria-labelledby="reset-q">
            <p id="reset-q">{t('settings.resetConfirm')}</p>
            <div className="row">
              <button
                type="button" className="btn-text btn-danger-text"
                onClick={async () => { await resetDemo(); setConfirming(false); toast(t('settings.resetDone')) }}
              >
                <RotateCcw size={20} aria-hidden />{t('settings.resetYes')}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirming(false)}>{t('settings.cancel')}</button>
            </div>
          </div>
        )}
        <div className="stack-sm">
          <button type="button" className="btn btn-secondary btn-block" disabled aria-describedby="export-note">
            <BarChart3 size={20} aria-hidden />{t('settings.export')}
          </button>
          <span id="export-note" className="muted small">{t('settings.exportNote')}</span>
        </div>
      </section>

      <section className="card stack" aria-labelledby="set-about">
        <h2 id="set-about" className="row"><Info size={22} aria-hidden />{t('settings.about')}</h2>
        <img src="logo/DR_logo_primary.png" alt="Desert Rose, Hurghada Red Sea" style={{ width: 200, maxWidth: '60%', margin: '24px auto' }} />
        <p>{t('settings.aboutText')}</p>
      </section>
    </>
  )
}
