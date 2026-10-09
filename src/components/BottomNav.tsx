import { NavLink } from 'react-router-dom'
import { Home, ListChecks, Settings } from 'lucide-react'
import { useI18n } from '../i18n/I18n'

export function BottomNav({ problemBadge }: { problemBadge: number }) {
  const { t } = useI18n()
  return (
    <nav className="bottom-nav" aria-label={t('nav.main')}>
      <ul>
        <li><NavLink to="/" end><Home size={24} aria-hidden />{t('nav.home')}</NavLink></li>
        <li>
          <NavLink to="/problems">
            <ListChecks size={24} aria-hidden />
            {t('nav.problems')}
            {problemBadge > 0 && <span className="nav-badge" aria-label={`${problemBadge}`}>{problemBadge}</span>}
          </NavLink>
        </li>
        <li><NavLink to="/settings"><Settings size={24} aria-hidden />{t('nav.settings')}</NavLink></li>
      </ul>
    </nav>
  )
}
