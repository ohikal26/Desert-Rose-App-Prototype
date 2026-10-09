import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Hammer } from 'lucide-react'
import { useI18n } from '../i18n/I18n'

/** Placeholder for screens built in later stages. */
export function Soon({ stageOverride }: { stageOverride?: string }) {
  const stage = useParams().stage ?? stageOverride
  const { t } = useI18n()
  return (
    <div className="card state-box">
      <Hammer size={32} aria-hidden className="muted" />
      <h1>{t('soon.title')}</h1>
      <p className="muted">{t('soon.text', { n: stage ?? '' })}</p>
      <Link to="/" className="btn btn-secondary"><ChevronLeft size={20} aria-hidden className="flip-rtl" />{t('nav.home')}</Link>
    </div>
  )
}
