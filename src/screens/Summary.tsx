import { Link } from 'react-router-dom'
import {
  AlertTriangle, Archive, BarChart3, CircleCheck, Clock, ListChecks, Repeat, Undo2, Wrench, CalendarCheck,
} from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { summarise } from '../lib/summary'

/** One page for heads of department and the GM (brief 7.5). Every number opens the list behind it. */
export function Summary() {
  const { data, user, location } = useData()
  const { t, c, locName } = useI18n()
  const { userId } = useAppState()
  const me = user(userId)
  if (!data || !me) return null
  const s = summarise(me, data)
  const scope = s.scope === 'all' ? 'all' : 'area'
  const q = (extra: string) => `/problems?scope=${scope}${extra}`

  const tiles = [
    { key: 'open', label: t('sum.open'), n: s.open, icon: ListChecks, to: q(''), cls: '' },
    { key: 'overdue', label: t('sum.overdue'), n: s.overdue, icon: Clock, to: q('&status=overdue'), cls: 'is-critical' },
    { key: 'safety', label: t('sum.safety'), n: s.safety, icon: AlertTriangle, to: q('&safety=1'), cls: 'is-critical' },
    { key: 'fixed', label: t('sum.fixedWaiting'), n: s.fixedWaiting, icon: Wrench, to: q('&status=fixed'), cls: '' },
    { key: 'ontime', label: t('sum.closedOnTime'), n: s.closedOnTimeWeek, icon: CircleCheck, to: q('&status=closed'), cls: 'is-good' },
    { key: 'repeats', label: t('sum.repeats'), n: s.repeats.length, icon: Repeat, to: '#repeats', cls: s.repeats.length ? 'is-warning' : '' },
  ]
  const max = Math.max(1, ...s.byArea.flatMap((a) => [a.condition, a.care]))
  const areaLabel = (a: 'old' | 'renovated' | 'none') =>
    a === 'old' ? t('tag.old') : a === 'renovated' ? t('tag.renovated') : t('sum.noArea')

  return (
    <>
      <header className="stack-sm">
        <span className="muted small">{t(`dept.${me.department}`)} · {t('sum.asOfToday')}</span>
        <h1>{t('sum.title')}</h1>
      </header>

      <div className="tiles tiles-3" role="list">
        {tiles.map((x) => (
          <Link key={x.key} to={x.to} className={`tile ${x.cls}`} role="listitem">
            <span className="tile-icon"><x.icon size={18} aria-hidden /></span>
            <span className={`tile-number ${x.cls}`}>{x.n}</span>
            <span className="tile-label">{x.label}</span>
          </Link>
        ))}
      </div>

      <section className="card stack" aria-labelledby="sum-areas">
        <h2 id="sum-areas" className="section-title row-inline"><BarChart3 size={20} aria-hidden />{t('sum.byArea')}</h2>
        <p className="muted small">{t('sum.byAreaHint')}</p>
        <div className="bars">
          {s.byArea.map((a) => (
            <div key={a.area} className="bar-group">
              <span className="bar-title">{areaLabel(a.area)}</span>
              {([['condition', a.condition], ['care', a.care]] as const).map(([kind, n]) => (
                <Link key={kind} to={q(`&kind=${kind}${a.area === 'none' ? '' : `&area=${a.area}`}`)} className="bar-row"
                  aria-label={`${areaLabel(a.area)}, ${t(`tag.${kind}`)}: ${n}`}>
                  <span className="bar-label">{t(`tag.${kind}`)}</span>
                  <span className="bar-track"><span className={`bar-fill bar-${kind}`} style={{ width: `${(n / max) * 100}%` }} /></span>
                  <span className="bar-n">{n}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="card stack-sm" aria-labelledby="sum-cl">
        <h2 id="sum-cl" className="section-title row-inline"><CalendarCheck size={20} aria-hidden />{t('sum.checklistsToday')}</h2>
        <div className="row" style={{ gap: 'var(--s3)' }}>
          <span className="row-inline"><CircleCheck size={18} aria-hidden className="text-good" /><strong>{s.checklistsDoneToday}</strong>&nbsp;{t('sup.done')}</span>
          <span className="row-inline"><Undo2 size={18} aria-hidden style={{ color: 'var(--warning)' }} /><strong>{s.checklistsSentBackToday}</strong>&nbsp;{t('sup.sentBack')}</span>
          <span className="muted small">{t('sum.ofStarted', { n: s.checklistsToday })}</span>
        </div>
      </section>

      <section className="card stack-sm" id="repeats" aria-labelledby="sum-rep">
        <h2 id="sum-rep" className="section-title row-inline"><Repeat size={20} aria-hidden />{t('sum.repeats')}</h2>
        <p className="muted small">{t('sum.repeatsHint')}</p>
        {s.repeats.length === 0 ? (
          <p className="muted">{t('sum.noRepeats')}</p>
        ) : (
          <ul className="list">
            {s.repeats.map((r) => (
              <li key={r.ids.join()} className="list-row">
                <div className="list-row-main">
                  <div className="list-row-title">{r.titleKey ? c(r.titleKey, r.title) : r.title}</div>
                  <div className="muted small">{locName(location(r.location))} · {t('sum.times', { n: r.count })}</div>
                </div>
                <Link to={`/problems/${r.ids[r.ids.length - 1]}`} className="btn-text">{t('sum.open1')}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link to={q('&status=capex')} className="panel row link-row">
        <Archive size={20} aria-hidden />
        <span>{t('sum.capex')}: <strong>{s.capex}</strong></span>
        <span className="muted small" style={{ marginInlineStart: 'auto' }}>{t('sum.capexHint')}</span>
      </Link>
    </>
  )
}
