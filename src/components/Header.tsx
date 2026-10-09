import { Cloud, CloudOff, Languages } from 'lucide-react'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'

// The brief asks for the horizontal lockup here (DR_logo_horizontal.png).
// That file was not supplied, so the header uses the icon on its own until it is.
// To switch: add assets/DR_logo_horizontal.png, run `npm run icons`, and change HEADER_LOGO.
const HEADER_LOGO = 'logo/DR_logo_icon.png'

export function Header() {
  const { t, toggleLang } = useI18n()
  const { online } = useAppState()
  return (
    <header className="header">
      <div className="header-row">
        <img className="header-logo" src={HEADER_LOGO} alt="Desert Rose" />
        <div className="header-meta">
          <span className="proto-label">{t('app.prototype')}</span>
          <span className={`conn ${online ? '' : 'is-offline'}`} role="status">
            {online ? <Cloud size={16} aria-hidden /> : <CloudOff size={16} aria-hidden />}
            {online ? t('conn.online') : t('conn.offline')}
          </span>
        </div>
        <button type="button" className="lang-btn" onClick={toggleLang} aria-label={t('lang.switchLabel')}>
          <Languages size={18} aria-hidden />
          <span lang={t('lang.switchTo') === 'English' ? 'en' : 'ar'}>{t('lang.switchTo')}</span>
        </button>
      </div>
    </header>
  )
}
