import { Link } from 'react-router-dom'
import { CalendarClock, ImageOff, User as UserIcon } from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { AreaTag, KindTag, ProblemStatusChip, SafetyChip } from './Chips'
import { PhotoThumb } from './Photo'
import { shownStatus } from '../lib/problems'
import { addDays, dayKey, todayKey } from '../lib/dates'
import type { Problem } from '../types'

/** "Due today", "Due tomorrow", "Was due Wed 7 Oct", "Due Mon 12 Oct". */
export function useDueText() {
  const { t, formatDate } = useI18n()
  return (p: Problem) => {
    if (p.status === 'capex') return null
    if (p.status === 'closed') return null
    const today = todayKey()
    if (p.due === today) return t('due.today')
    if (p.due === dayKey(addDays(new Date(), 1))) return t('due.tomorrow')
    if (p.due < today) return t('due.was', { date: formatDate(p.due) })
    return t('due.on', { date: formatDate(p.due) })
  }
}

export function ProblemCard({ p, to, selected }: { p: Problem; to: string; selected?: boolean }) {
  const { locName, problemTitle, userName, t } = useI18n()
  const { location, user } = useData()
  const due = useDueText()(p)
  const status = shownStatus(p)
  return (
    <article className={`card problem-card ${p.safety ? 'is-safety' : ''} ${selected ? 'is-selected' : ''}`}>
      <div className="problem-card-body">
        <div className="row">
          {p.safety && <SafetyChip />}
          <ProblemStatusChip status={status} />
        </div>
        <h3 className="problem-title">
          <Link to={to} className="stretched" aria-current={selected ? 'true' : undefined}>{problemTitle(p)}</Link>
        </h3>
        <div className="muted small">{locName(location(p.location))}</div>
        <div className="problem-meta small">
          <span className="row-inline"><UserIcon size={16} aria-hidden /><span className="visually-hidden">{t('prob.owner')}: </span>{userName(user(p.owner))}</span>
          {due && (
            <span className={`row-inline ${status === 'overdue' ? 'text-critical' : ''}`}>
              <CalendarClock size={16} aria-hidden />{due}
            </span>
          )}
        </div>
        <div className="row"><KindTag kind={p.kind} /><AreaTag area={p.area} /></div>
      </div>
      {p.photo ? (
        <div className="problem-card-thumb"><PhotoThumb src={p.photo} alt={problemTitle(p)} size={72} /></div>
      ) : (
        <div className="problem-card-thumb no-photo" title={t('prob.noPhoto')}>
          <ImageOff size={22} aria-hidden /><span className="visually-hidden">{t('prob.noPhoto')}</span>
        </div>
      )}
    </article>
  )
}
