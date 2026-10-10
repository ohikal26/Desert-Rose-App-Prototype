import { Link, Navigate, useParams } from 'react-router-dom'
import {
  AlertTriangle, Archive, CalendarClock, CircleCheck, Clock, Hourglass, ListChecks, MapPin, Repeat, Target, Undo2, Wrench,
} from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { LineChart } from '../components/LineChart'
import { Bars } from '../components/Bars'
import { RunStateChip } from '../components/Chips'
import { BackLink } from '../components/BackLink'
import { departmentView, type Dept } from '../lib/department'

/** Route wrapper: /department/:dept, for the GM and CEO; directors land here from home. */
export function DepartmentPage() {
  const { dept } = useParams()
  if (dept !== 'recreation' && dept !== 'housekeeping') return <Navigate to="/" replace />
  return <><BackLink /><DepartmentOverview dept={dept} /></>
}

/**
 * The director's department overview: today, what is stuck, where problems cluster,
 * and the 9-week trend. Counts by place and by kind, never by person.
 */
export function DepartmentOverview({ dept, embedded }: { dept: Dept; embedded?: boolean }) {
  const { data, location, user } = useData()
  const { t, c, locName, problemTitle, userName, formatDate } = useI18n()
  const { userId } = useAppState()
  const me = user(userId)
  if (!data || !me) return null
  const v = departmentView(data, dept)
  const q = (extra: string) => `/problems?scope=all${extra}`
  const weekLabels = [...v.weeks.map((w) => formatDate(w.start).replace(/^[^,،]+[,،]\s*/, '')), t('lead.thisWeek')]
  const first = v.weeks[0]
  const last = v.weeks[v.weeks.length - 1]

  return (
    <>
      {!embedded && (
        <header className="stack-sm">
          <span className="muted small">{t('dept.overview')} · {t('sum.asOfToday')}</span>
          <h1>{t(`dept.${dept}`)}</h1>
        </header>
      )}
      <p className="lead-cadence"><CalendarClock size={18} aria-hidden />{t('dept.cadence')}</p>

      <div className="tiles">
        <Link to={q(`&status=active`)} className="tile"><span className="tile-icon"><ListChecks size={18} aria-hidden /></span><span className="tile-number">{v.counts.open}</span><span className="tile-label">{t('sum.open')}</span></Link>
        <Link to={q(`&status=overdue`)} className="tile is-critical"><span className="tile-icon"><Clock size={18} aria-hidden /></span><span className="tile-number is-critical">{v.counts.overdue}</span><span className="tile-label">{t('sum.overdue')}</span></Link>
        <Link to={q(`&status=fixed`)} className="tile"><span className="tile-icon"><Wrench size={18} aria-hidden /></span><span className="tile-number">{v.counts.waiting}</span><span className="tile-label">{t('sum.fixedWaiting')}</span></Link>
        <Link to={q(`&status=capex`)} className="tile"><span className="tile-icon"><Archive size={18} aria-hidden /></span><span className="tile-number">{v.counts.capex}</span><span className="tile-label">{t('sum.capex')}</span></Link>
      </div>

      <section className="stack-sm" aria-labelledby="d-safety">
        <h2 id="d-safety" className="section-title">{t('lead.safetyNow')}</h2>
        {v.safety.length === 0 ? (
          <p className="banner banner-good"><CircleCheck size={22} aria-hidden /><strong>{t('lead.noSafety')}</strong></p>
        ) : (
          <ul className="list">
            {v.safety.map((p) => (
              <li key={p.id}>
                <Link to={`/problems/${p.id}`} className="card safety-row link-row">
                  <AlertTriangle size={20} aria-hidden className="text-critical" />
                  <div className="list-row-main">
                    <div className="list-row-title">{problemTitle(p)}</div>
                    <div className="muted small">{locName(location(p.location))} · {userName(user(p.owner))}</div>
                    <div className="small">{t('prob.interim')}: {p.interimKey ? c(p.interimKey, p.interim ?? '') : p.interim}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card stack" aria-labelledby="d-today">
        <h2 id="d-today" className="section-title">{t('dept.today')}</h2>
        <div className="today-strip" role="img" aria-label={t('dept.todayLine', { done: v.today.done, total: v.today.total })}>
          {Array.from({ length: v.today.total }, (_, i) => {
            const state = i < v.today.done ? 'done' : i < v.today.done + v.today.inProgress ? 'prog' : i < v.today.done + v.today.inProgress + v.today.sentBack.length ? 'back' : 'none'
            return <span key={i} className={`today-seg is-${state}`} />
          })}
        </div>
        <p className="small">{t('dept.todayLine', { done: v.today.done, total: v.today.total })} · {t('dept.checkedLine', { n: v.today.checked, w: v.today.waitingCheck })}</p>
        {v.today.sentBack.length > 0 && (
          <div className="stack-sm">
            <span className="field-label row-inline"><Undo2 size={16} aria-hidden />{t('sup.sentBack')}</span>
            <ul className="list">
              {v.today.sentBack.map((s) => (
                <li key={s.location.id}>
                  <Link to={`/checklist/${s.run!.id}`} className="list-row link-row">
                    <div className="list-row-main"><div className="list-row-title">{locName(s.location)}</div><div className="small muted">{s.run?.check?.note}</div></div>
                    <RunStateChip state="sent-back" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {v.today.notStarted.length > 0 && (
          <div className="stack-sm">
            <span className="field-label">{t('dept.notStarted', { n: v.today.notStarted.length })}</span>
            <p className="small muted">{v.today.notStarted.map((s) => `${locName(s.location)} (${c(`tpl.${s.template.id}`, s.template.name)})`).join(' · ')}</p>
          </div>
        )}
      </section>

      <section className="card stack" aria-labelledby="d-stuck">
        <h2 id="d-stuck" className="section-title row-inline"><Hourglass size={20} aria-hidden />{t('dept.stuckTitle')}</h2>
        <p className="muted small">{t('dept.stuckHint')}</p>
        {v.stuck.length === 0 ? <p className="small">{t('dept.noStuck')}</p> : (
          <ul className="list">
            {v.stuck.map((p) => (
              <li key={p.id}><Link to={`/problems/${p.id}`} className="list-row link-row">
                <div className="list-row-main"><div className="list-row-title">{problemTitle(p)}</div><div className="small muted">{locName(location(p.location))}</div></div>
                <span className="chip chip-warning"><Wrench size={14} aria-hidden />{t('status.fixed')}</span>
              </Link></li>
            ))}
          </ul>
        )}
        <h3 className="field-label">{t('dept.ageTitle')}</h3>
        <Bars bars={v.ageing.map((a) => ({ key: a.key, label: t(`age.${a.key}`), n: a.n, tone: a.key === '15+' ? 'critical' : a.key === '8-14' ? 'stone' : 'teal' }))} />
      </section>

      <section className="card stack" aria-labelledby="d-hot">
        <h2 id="d-hot" className="section-title row-inline"><MapPin size={20} aria-hidden />{t('dept.hotTitle')}</h2>
        <p className="muted small">{t('dept.hotHint')}</p>
        {v.hotspots.length === 0 ? <p className="small">{t('state.empty')}</p> : (
          <Bars bars={v.hotspots.map((h) => ({ key: h.place.id, label: locName(h.place), n: h.n, to: q('') }))} />
        )}
        <div className="row small" style={{ gap: 'var(--s2)' }}>
          <span>{t('tag.care')}: <strong>{v.byKind.care}</strong></span>
          <span>{t('tag.condition')}: <strong>{v.byKind.condition}</strong></span>
          {dept === 'housekeeping' && <><span>{t('tag.old')}: <strong>{v.byKind.old}</strong></span><span>{t('tag.renovated')}: <strong>{v.byKind.renovated}</strong></span></>}
        </div>
        {v.repeats.length > 0 && (
          <p className="banner banner-warning small"><Repeat size={18} aria-hidden /><span>{t('dept.repeatsLine', { n: v.repeats.length })} {v.repeats.map((r) => `${r.titleKey ? c(r.titleKey, r.title) : r.title} (${locName(location(r.location))})`).join(' · ')}</span></p>
        )}
      </section>

      <section className="card stack" aria-labelledby="d-trend">
        <h2 id="d-trend" className="section-title">{t('lead.trendTitle')}</h2>
        <LineChart title={t('lead.trendTitle')} xLabels={weekLabels} series={[
          { key: 'open', label: t('sum.open'), color: 'var(--teal)', values: [...v.weeks.map((w) => w.open), v.liveOpen] },
          { key: 'overdue', label: t('sum.overdue'), color: 'var(--stone)', values: [...v.weeks.map((w) => w.overdue), v.liveOverdue] },
        ]} />
        <div className="totals">
          <div className="total">
            <span className="total-label row-inline"><CircleCheck size={16} aria-hidden />{t('lead.closedOnTimeLast')}</span>
            <span className="total-number">{last.closedOnTime}<span className="total-of"> / {last.closed}</span></span>
          </div>
          <div className="total">
            <span className="total-label row-inline"><Clock size={16} aria-hidden />{t('lead.daysToFix')}</span>
            <span className="total-number">{last.daysToFix}<span className="total-of"> {t('lead.days')}</span></span>
            <span className="small muted">{t('lead.wasDays', { n: first.daysToFix })}</span>
          </div>
        </div>
      </section>

      <section className="card stack-sm" aria-labelledby="d-insp">
        <h2 id="d-insp" className="section-title row-inline"><Target size={20} aria-hidden />{t('lead.inspTitle')}</h2>
        <div className="totals">
          <div className="total"><span className="total-label">{t('insp.steps')}</span><span className="total-number">{last.stepsIn10}<span className="total-of"> {t('lead.in10')}</span></span><span className="small muted">{t('lead.wasIn10', { n: first.stepsIn10 })}</span></div>
          <div className="total"><span className="total-label">{t('insp.resultGood')}</span><span className="total-number">{last.resultGoodIn10}<span className="total-of"> {t('lead.in10')}</span></span><span className="small muted">{t('lead.wasIn10', { n: first.resultGoodIn10 })}</span></div>
        </div>
        {v.inspections.runs > 0 && <p className="small">{t('lead.inspThisWeek', { runs: v.inspections.runs, s: v.inspections.stepsIn10 ?? 0, r: v.inspections.resultGoodIn10 ?? 0 })}</p>}
      </section>

      {v.capex.length > 0 && (
        <section className="card stack-sm" aria-labelledby="d-capex">
          <h2 id="d-capex" className="section-title row-inline"><Archive size={20} aria-hidden />{t('lead.capexTitle')}</h2>
          <ul className="capex-items">
            {v.capex.map((p) => (
              <li key={p.id}><Link to={`/problems/${p.id}`}>{problemTitle(p)}</Link><span className="muted"> · {locName(location(p.location))} · {t('lead.since', { date: formatDate(p.history[0].at) })}</span></li>
            ))}
          </ul>
        </section>
      )}
      <p className="muted small">{t('dept.footnote')}</p>
    </>
  )
}
