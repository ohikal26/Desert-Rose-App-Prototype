import { Link, Navigate, useParams } from 'react-router-dom'
import {
  AlertTriangle, CalendarClock, ChevronRight, CircleCheck, ClipboardList, Clock, Hourglass, ListChecks, MessageSquareWarning, Plus,
} from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { KrRow, Num, ScoreTile, StatusChip } from '../components/Kpi'
import {
  APP_DEPTS, PERSPECTIVES, allKeyResults, byStatus, dept as findDept, gateway, resortKeyResults, scoreStatus, type Concern,
} from '../lib/gateway'
import { departmentView, type Dept } from '../lib/department'
import { gmView } from '../lib/leadership'
import { addDays, dayKey } from '../lib/dates'
import { BackLink } from '../components/BackLink'
import { GatewayFrame, PERSPECTIVE_ICON } from './Gateway'

/**
 * One page per department for the morning briefing: the scores against target,
 * what happened yesterday (guest concerns, and live OE app numbers where the app runs),
 * and the issues to discuss. Opened on a tablet or a screen in the briefing room.
 */
export function GatewayDepartment() {
  const { id = '' } = useParams()
  const { data } = useData()
  const { t, c, formatDate } = useI18n()
  const isResort = id === 'resort'
  const d = isResort ? undefined : findDept(id)
  if (!data) return null
  if (!isResort && !d) return <Navigate to="/gateway/briefing" replace />

  const name = isResort ? t('gw.gmTile') : c(`gw.dept.${d!.id}`, d!.name)
  const who = isResort ? t('dept.all') : c(`gw.dir.${d!.id}`, d!.director)
  const overall = isResort ? gateway.resort.overall : d!.overall
  const persp = isResort ? gateway.resort.perspectives : d!.perspectives
  const krs = isResort ? resortKeyResults() : d ? allKeyResults(d) : []
  const issues = byStatus(krs).filter((k) => k.status === 'at-risk' || k.status === 'behind')
  const concerns = isResort
    ? gateway.departments.flatMap((x) => x.concerns ?? [])
    : d!.concerns ?? []
  const counts = isResort
    ? gateway.departments.reduce((a, x) => ({ y: a.y + (x.concernCounts?.yesterday ?? 0), m: a.m + (x.concernCounts?.mtd ?? 0) }), { y: 0, m: 0 })
    : { y: d!.concernCounts?.yesterday ?? 0, m: d!.concernCounts?.mtd ?? 0 }
  const inApp = isResort || APP_DEPTS.includes(id as Dept)

  return (
    <GatewayFrame>
      <BackLink to="/gateway/briefing" />
      <header className="stack-sm">
        <span className="muted small row-inline"><CalendarClock size={16} aria-hidden />{t('gw.briefingFor', { date: formatDate(dayKey()) })}</span>
        <h1>{name}</h1>
        <span className="muted">{who}</span>
      </header>

      <div className="gw-brief">
        <div className="stack">
          <section className="gw-overall card" aria-label={t('gw.overall')}>
            <div>
              <span className="field-label">{t('gw.overall')}</span>
              <div className="gw-big"><Num>{`${overall}%`}</Num></div>
              <StatusChip status={scoreStatus(overall)} />
            </div>
            <div className="tiles tiles-compact">
              {PERSPECTIVES.map((p) => <ScoreTile key={p} label={t(`gw.persp.${p}`)} score={persp[p]} Icon={PERSPECTIVE_ICON[p]} />)}
            </div>
          </section>

          {inApp && <LiveBlock dept={isResort ? undefined : (id as Dept)} />}

          <section className="card stack" aria-labelledby="gb-concerns">
            <h2 id="gb-concerns" className="section-title row-inline"><MessageSquareWarning size={20} aria-hidden />{t('gw.concernsTitle')}</h2>
            <p className="small">{t('gw.concernCounts', { y: counts.y, m: counts.m })}</p>
            {concerns.length === 0
              ? <p className="small muted">{inApp ? t('gw.noConcerns') : t('gw.concernsElsewhere')}</p>
              : <ConcernList list={concerns} />}
          </section>
        </div>

        <div className="stack">
          <section className="card stack" aria-labelledby="gb-issues">
            <h2 id="gb-issues" className="section-title row-inline"><AlertTriangle size={20} aria-hidden />{t('gw.issuesTitle')}</h2>
            {!isResort && d!.topIssue && <p className="banner banner-warning small"><AlertTriangle size={18} aria-hidden /><span>{c(`gw.issue.${d!.id}`, d!.topIssue)}</span></p>}
            {issues.length > 0
              ? <ul className="kr-list">{issues.map((k) => <KrRow key={k.id} k={k} />)}</ul>
              : krs.length > 0 && <p className="small">{t('gw.noIssues')}</p>}
          </section>

          {krs.length > 0 ? PERSPECTIVES.map((p) => {
            const list = isResort ? (p === 'finance' ? gateway.resort.headline : gateway.resort[p]) : d!.keyResults?.[p] ?? []
            if (!list.length) return null
            const Icon = PERSPECTIVE_ICON[p]
            return (
              <section key={p} className="stack-sm" aria-labelledby={`gb-${p}`}>
                <h2 id={`gb-${p}`} className="section-title row-inline"><Icon size={20} aria-hidden />{t(`gw.persp.${p}`)}</h2>
                <ul className="kr-list">{list.map((k) => <KrRow key={k.id} k={k} compact />)}</ul>
              </section>
            )
          }) : <p className="card small muted">{t('gw.krsElsewhere')}</p>}
        </div>
      </div>
    </GatewayFrame>
  )
}

/** Live numbers from the OE app: the same counts as the department overview, in the same words. */
function LiveBlock({ dept }: { dept?: Dept }) {
  const { data } = useData()
  const { t } = useI18n()
  const views = (dept ? [dept] : [...APP_DEPTS]).map((x) => departmentView(data!, x))
  const sum = (f: (v: ReturnType<typeof departmentView>) => number) => views.reduce((n, v) => n + f(v), 0)
  const safety = sum((v) => v.safety.length)
  const done = sum((v) => v.today.done)
  const total = sum((v) => v.today.total)
  const notStarted = sum((v) => v.today.notStarted.length)
  const sentBack = sum((v) => v.today.sentBack.length)
  const open = sum((v) => v.counts.open)
  const overdue = sum((v) => v.counts.overdue)
  const stuck = sum((v) => v.stuck.length)
  const push = dept ? null : gmView(data!).push.length
  const q = '/problems?scope=all'
  return (
    <section className="card stack gw-live" aria-labelledby="gb-live">
      <h2 id="gb-live" className="section-title row-inline"><ClipboardList size={20} aria-hidden />{t('gw.liveToday')}</h2>
      {safety > 0
        ? <Link to={`${q}&safety=1`} className="banner banner-critical link-row"><AlertTriangle size={20} aria-hidden /><strong>{t('gw.liveSafety', { n: safety })}</strong></Link>
        : <p className="banner banner-good"><CircleCheck size={20} aria-hidden /><strong>{t('lead.noSafety')}</strong></p>}
      <div className="tiles">
        <Link to="/summary" className="tile"><span className="tile-icon"><ClipboardList size={18} aria-hidden /></span><span className="tile-number">{done}/{total}</span><span className="tile-label">{t('sum.checklistsToday')}</span></Link>
        <Link to={`${q}&status=active`} className="tile"><span className="tile-icon"><ListChecks size={18} aria-hidden /></span><span className="tile-number">{open}</span><span className="tile-label">{t('sum.open')}</span></Link>
        <Link to={`${q}&status=overdue`} className="tile is-critical"><span className="tile-icon"><Clock size={18} aria-hidden /></span><span className="tile-number is-critical">{overdue}</span><span className="tile-label">{t('sum.overdue')}</span></Link>
        <Link to={`${q}&status=fixed`} className="tile"><span className="tile-icon"><Hourglass size={18} aria-hidden /></span><span className="tile-number">{stuck}</span><span className="tile-label">{t('gw.stuckShort')}</span></Link>
      </div>
      <p className="small">
        {t('dept.notStarted', { n: notStarted })}{sentBack > 0 && <> · {t('gw.sentBackN', { n: sentBack })}</>}
        {push !== null && <> · {t('gw.needsPushN', { n: push })}</>}
      </p>
      {dept
        ? <Link to={`/department/${dept}`} className="btn btn-secondary btn-block">{t('dept.open')}<ChevronRight size={18} aria-hidden className="flip-rtl" /></Link>
        : <Link to="/leadership?view=gm" className="btn btn-secondary btn-block">{t('gw.tab.views')}<ChevronRight size={18} aria-hidden className="flip-rtl" /></Link>}
    </section>
  )
}

/** Guest concerns. Each can become a problem in the OE app, with the place and kind filled in. */
export function ConcernList({ list }: { list: Concern[] }) {
  const { data, location } = useData()
  const { t, c, locName, formatDate } = useI18n()
  const sorted = [...list].sort((a, b) => b.day - a.day)
  return (
    <ul className="list">
      {sorted.map((x) => {
        const text = c(`gw.concern.${x.id}`, x.text)
        const added = data?.problems.find((p) => p.source === 'guest' && p.sourceItem === x.id)
        const loc = location(x.location)
        const when = x.day === -1 ? t('gw.yesterday') : formatDate(dayKey(addDays(new Date(), x.day)))
        const href = `/problems/new?source=guest&item=${x.id}&location=${encodeURIComponent(x.location)}&kind=${x.kind}&title=${encodeURIComponent(text.slice(0, 80))}`
        return (
          <li key={x.id} className="concern">
            <div className="list-row-main">
              <div className="list-row-title">“{text}”</div>
              <div className="small muted">{c(`gw.platform.${x.platform}`, platformName(x.platform))} · {locName(loc)} · {when}</div>
            </div>
            {added
              ? <Link to={`/problems/${added.id}`} className="chip chip-good"><CircleCheck size={14} aria-hidden />{t('gw.problemAdded')}</Link>
              : <Link to={href} className="btn btn-secondary btn-sm"><Plus size={16} aria-hidden />{t('gw.addProblem')}</Link>}
          </li>
        )
      })}
    </ul>
  )
}

export const platformName = (id: string) => gateway.platforms.find((p) => p.id === id)?.name ?? id
