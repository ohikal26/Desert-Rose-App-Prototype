import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useI18n } from '../i18n/I18n'

export function BackLink({ to }: { to?: string }) {
  const { t } = useI18n()
  const nav = useNavigate()
  return (
    <button type="button" className="btn-text back-link"
      onClick={() => (to ? nav(to) : window.history.length > 1 ? nav(-1) : nav('/'))}>
      <ChevronLeft size={20} aria-hidden className="flip-rtl" />{t('nav.back')}
    </button>
  )
}
