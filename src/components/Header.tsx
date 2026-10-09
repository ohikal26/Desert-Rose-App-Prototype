import { useState } from 'react'
import { ChevronDown, Cloud, CloudOff } from 'lucide-react'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { useData } from '../data/DataContext'
import { RoleSheet } from '../screens/RoleSheet'

// The brief asks for the horizontal lockup here (DR_logo_horizontal.png).
// That file was not supplied, so the header uses the icon on its own until it is.
// To switch: add assets/DR_logo_horizontal.png, run `npm run icons`, and change HEADER_LOGO.
const HEADER_LOGO = 'logo/DR_logo_icon.png'

export function Header() {
  const { t, toggleLang, userName, jobName } = useI18n()
  const { online, userId } = useAppState()
  const { user } = useData()
  const me = user(userId)
  const [sheet, setSheet] = useState(false)
  return (
    <header className="header">
      {/* Slim strip: prototype label and connection, on every screen */}
      <div className="status-strip">
        <div className="status-strip-row">
          <span className="proto-label">{t('app.prototype')}</span>
          <span className={`conn ${online ? '' : 'is-offline'}`} role="status">
            {online ? <Cloud size={15} aria-hidden /> : <CloudOff size={15} aria-hidden />}
            {online ? t('conn.online') : t('conn.offline')}
          </span>
        </div>
      </div>
      <div className="header-row">
        <img className="header-logo" src={HEADER_LOGO} alt="Desert Rose" />
        {me && (
          // Role switcher on every screen, so a demo can jump between people anywhere.
          <button type="button" className="role-chip" onClick={() => setSheet(true)}
            aria-label={`${t('home.switchRole')} ${userName(me)}, ${jobName(me)}`}>
            <span className="avatar avatar-sm" aria-hidden>{me.initials}</span>
            <span className="role-chip-text">
              <span className="role-chip-name">{userName(me)}</span>
              <span className="role-chip-job">{jobName(me)}</span>
            </span>
            <ChevronDown size={18} aria-hidden />
          </button>
        )}
        <button type="button" className="lang-btn" onClick={toggleLang} aria-label={t('lang.switchLabel')}>
          <span lang={t('lang.switchTo') === 'English' ? 'en' : 'ar'}>{t('lang.switchTo')}</span>
        </button>
      </div>
      {sheet && <RoleSheet onClose={() => setSheet(false)} />}
    </header>
  )
}
