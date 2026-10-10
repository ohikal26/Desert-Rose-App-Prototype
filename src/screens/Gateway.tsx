import { NavLink, Link, Navigate } from 'react-router-dom'
import {
  AlertTriangle, Award, Banknote, ChevronRight, ClipboardList, Gauge, HeartHandshake, LayoutGrid, ListChecks,
  MessageSquareWarning, Search, Smile, Users, Wrench,
} from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { KrRow, Num, ScoreTile, StatusChip } from '../components/Kpi'
import {
  APP_DEPTS, GATEWAY_ROLES, PERSPECTIVES, byStatus, gateway, resortKeyResults, scoreStatus, type Perspective,
} from '../lib/gateway'
import { departmentView } from '../lib/department'
import { isActive, shownStatus } from '../lib/problems'
import type { ReactNode } from 'react'

export const PERSPECTIVE_ICON: Record<Perspective, typeof Gauge> = {
  finance: Banknote, guest: Smile, operations: ClipboardList, people: Users,
}

/** Shared frame for every Gateway page: title, period, and the section tabs. */
export function GatewayFrame({ children }: { children: ReactNode }) {
  const { t, c } = useI18n()
  const { user } = useData()
  const { userId } = useAppState()
  const me = user(userId)
  if (me && !GATEWAY_ROLES.includes(me.role)) return <Navigate to="/" replace />
  return (
    <>
      <header className="stack-sm">
        <span className="eyebrow">{t('gw.title')}</span>
        <span className="muted small">{t('gw.period', { p: c('gw.periodLabel', gateway.periodLabel) })} · {t('gw.demoNote')}</span>
      </header>
      <nav className="gw-tabs" aria-label={t('gw.title')}>
        <NavLink to="/gateway" end>{t('gw.tab.dashboard')}</NavLink>
        <NavLink to="/gateway/briefing">{t('gw.tab.briefing')}</NavLink>
        <NavLink to="/gateway/guest">{t('gw.tab.guest')}</NavLink>
        <NavLink to="/gateway/scorecard">{t('gw.tab.scorecard')}</NavLink>
        <NavLink to="/leadership">{t('gw.tab.views')}</NavLink>
      </nav>
      {children}
    </>
  )
}

/** Leadership dashboard: the resort's main KPIs against target, what needs attention, and live OE app numbers. */
export function GatewayHome() {
  const { data } = useData()
  const { t, c } = useI18n()
  if (!data) return null
  const r = gateway.resort
  const attention = byStatus(resortKeyResults()).filter((k) => k.status === 'at-risk' || k.status === 'behind')
  const deptIssues = gateway.departments.filter((d) => d.overall < 97)

  // Live from the OE app: the same numbers the app shows elsewhere.
  const active = data.problems.filter(isActive)
  const live = {
    open: active.length,
    overdue: active.filter((p) => shownStatus(p) === 'overdue').length,
    safety: active.filter((p) => p.safety).length,
    capex: data.problems.filter((p) => p.status === 'capex').length,
  }
  const today = APP_DEPTS.map((d) => departmentView(data, d).today)
  const done = today.reduce((n, x) => n + x.done, 0)
  const total = today.reduce((n, x) => n + x.total, 0)

  return (
    <GatewayFrame>
      <h1>{t('gw.dashboardTitle')}</h1>

      <section className="gw-overall card" aria-labelledby="gw-overall">
        <div>
          <span id="gw-overall" className="field-label">{t('gw.overall')}</span>
          <div className="gw-big"><Num>{`${r.overall}%`}</Num></div>
          <StatusChip status={scoreStatus(r.overall)} />
        </div>
        <p className="small muted">{t('gw.overallHint')}</p>
      </section>

      <div className="tiles">
        {PERSPECTIVES.map((p) => (
          <ScoreTile key={p} label={t(`gw.persp.${p}`)} score={r.perspectives[p]} Icon={PERSPECTIVE_ICON[p]} />
        ))}
      </div>

      <section className="card stack" aria-labelledby="gw-attn">
        <h2 id="gw-attn" className="section-title row-inline"><AlertTriangle size={20} aria-hidden />{t('gw.attention')}</h2>
        <ul className="kr-list">{attention.map((k) => <KrRow key={k.id} k={k} />)}</ul>
        {deptIssues.length > 0 && (
          <div className="stack-sm">
            <span className="field-label">{t('gw.deptBehind')}</span>
            <ul className="list">
              {deptIssues.map((d) => (
                <li key={d.id}>
                  <Link to={`/gateway/dept/${d.id}`} className="list-row link-row">
                    <div className="list-row-main">
                      <div className="list-row-title">{c(`gw.dept.${d.id}`, d.name)} · <Num>{`${d.overall}%`}</Num></div>
                      <div className="small muted">{d.topIssue ? c(`gw.issue.${d.id}`, d.topIssue) : ''}</div>
                    </div>
                    <ChevronRight size={20} aria-hidden className="flip-rtl muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="stack-sm" aria-labelledby="gw-fin">
        <h2 id="gw-fin" className="section-title row-inline"><Banknote size={20} aria-hidden />{t('gw.persp.finance')}</h2>
        <ul className="kr-list kr-grid">{r.headline.map((k) => <KrRow key={k.id} k={k} compact />)}</ul>
      </section>

      <section className="stack-sm" aria-labelledby="gw-guest">
        <div className="section-head">
          <h2 id="gw-guest" className="section-title row-inline"><Smile size={20} aria-hidden />{t('gw.persp.guest')}</h2>
          <Link to="/gateway/guest" className="btn-text small">{t('gw.tab.guest')}<ChevronRight size={16} aria-hidden className="flip-rtl" /></Link>
        </div>
        <ul className="kr-list kr-grid">{r.guest.map((k) => <KrRow key={k.id} k={k} compact />)}</ul>
      </section>

      <section className="stack-sm" aria-labelledby="gw-ops">
        <h2 id="gw-ops" className="section-title row-inline"><ClipboardList size={20} aria-hidden />{t('gw.persp.operations')}</h2>
        <ul className="kr-list kr-grid">{r.operations.map((k) => <KrRow key={k.id} k={k} compact />)}</ul>
      </section>

      <section className="stack-sm" aria-labelledby="gw-people">
        <h2 id="gw-people" className="section-title row-inline"><Users size={20} aria-hidden />{t('gw.persp.people')}</h2>
        <ul className="kr-list kr-grid">{r.people.map((k) => <KrRow key={k.id} k={k} compact />)}</ul>
      </section>

      <section className="card stack" aria-labelledby="gw-live">
        <h2 id="gw-live" className="section-title row-inline"><HeartHandshake size={20} aria-hidden />{t('gw.liveTitle')}</h2>
        <p className="small muted">{t('gw.liveHint')}</p>
        <div className="tiles">
          <Link to="/problems?scope=all" className="tile"><span className="tile-icon"><ListChecks size={18} aria-hidden /></span><span className="tile-number">{live.open}</span><span className="tile-label">{t('sum.open')}</span></Link>
          <Link to="/problems?scope=all&status=overdue" className="tile is-critical"><span className="tile-icon"><Wrench size={18} aria-hidden /></span><span className="tile-number is-critical">{live.overdue}</span><span className="tile-label">{t('sum.overdue')}</span></Link>
          <Link to="/problems?scope=all&safety=1" className="tile is-critical"><span className="tile-icon"><AlertTriangle size={18} aria-hidden /></span><span className="tile-number is-critical">{live.safety}</span><span className="tile-label">{t('sum.safety')}</span></Link>
          <Link to="/summary" className="tile"><span className="tile-icon"><ClipboardList size={18} aria-hidden /></span><span className="tile-number">{done}/{total}</span><span className="tile-label">{t('sum.checklistsToday')}</span></Link>
        </div>
        <p className="small">{t('gw.liveCapex', { n: live.capex })}</p>
      </section>

      <section className="stack-sm" aria-labelledby="gw-depts">
        <div className="section-head">
          <h2 id="gw-depts" className="section-title row-inline"><LayoutGrid size={20} aria-hidden />{t('gw.deptsTitle')}</h2>
          <Link to="/gateway/briefing" className="btn-text small">{t('gw.tab.briefing')}<ChevronRight size={16} aria-hidden className="flip-rtl" /></Link>
        </div>
        <DeptTable />
        <p className="small muted">{t('gw.deptsHint')}</p>
      </section>
    </GatewayFrame>
  )
}

/** Departments in a fixed order (as in the OKR report), not ranked: each score with its four perspectives. */
export function DeptTable() {
  const { t, c } = useI18n()
  return (
    <div className="gw-table-wrap">
      <table className="gw-table">
        <thead>
          <tr>
            <th scope="col">{t('gw.department')}</th>
            <th scope="col">{t('gw.overallShort')}</th>
            {PERSPECTIVES.map((p) => <th key={p} scope="col" className="hide-narrow">{t(`gw.persp.${p}`)}</th>)}
          </tr>
        </thead>
        <tbody>
          {gateway.departments.map((d) => (
            <tr key={d.id}>
              <th scope="row"><Link to={`/gateway/dept/${d.id}`}>{c(`gw.dept.${d.id}`, d.name)}</Link>{d.inApp && <span className="tag gw-app-tag"><Search size={12} aria-hidden />{t('gw.inApp')}</span>}</th>
              <td><span className={`gw-score is-${scoreStatus(d.overall)}`}><Num>{`${d.overall}%`}</Num></span></td>
              {PERSPECTIVES.map((p) => {
                const v = d.perspectives[p]
                return <td key={p} className="hide-narrow">{v === null ? <span className="muted">—</span> : <span className={`gw-score is-${scoreStatus(v)}`}><Num>{`${v}%`}</Num></span>}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Morning briefing: GM and every department, with yesterday's and this month's guest concerns. */
export function GatewayBriefing() {
  const { t, c } = useI18n()
  return (
    <GatewayFrame>
      <h1>{t('gw.tab.briefing')}</h1>
      <p className="muted">{t('gw.briefingHint')}</p>
      <ul className="gw-grid">
        <li>
          <Link to="/gateway/dept/resort" className="card gw-brief-tile link-row">
            <span className="list-row-title">{t('gw.gmTile')}</span>
            <span className="small muted">{t('dept.all')}</span>
            <span className={`gw-score is-${scoreStatus(gateway.resort.overall)}`}><Num>{`${gateway.resort.overall}%`}</Num></span>
          </Link>
        </li>
        {gateway.departments.map((d) => (
          <li key={d.id}>
            <Link to={`/gateway/dept/${d.id}`} className="card gw-brief-tile link-row">
              <span className="list-row-title">{c(`gw.dept.${d.id}`, d.name)}</span>
              <span className="small muted">{c(`gw.dir.${d.id}`, d.director)}</span>
              <span className="row small">
                <span className={`gw-score is-${scoreStatus(d.overall)}`}><Num>{`${d.overall}%`}</Num></span>
                {d.concernCounts && (
                  <span className="row-inline muted"><MessageSquareWarning size={14} aria-hidden />{t('gw.concernCounts', { y: d.concernCounts.yesterday, m: d.concernCounts.mtd })}</span>
                )}
              </span>
              {d.inApp && <span className="tag gw-app-tag"><Award size={12} aria-hidden />{t('gw.inApp')}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </GatewayFrame>
  )
}
