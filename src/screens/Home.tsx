import { Link } from 'react-router-dom'
import {
  AlertTriangle, Archive, Camera, ChevronRight, ClipboardCheck, Clock, ListChecks, Play, QrCode, Search, Undo2,
  Wrench,
} from 'lucide-react'
import { useData, type AppData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { RunStateChip, RUN_ICON, type RunState } from '../components/Chips'
import { ProblemCard } from '../components/ProblemCard'
import { Segments } from '../components/Progress'
import { myChecklists, teamChecklists } from '../lib/checklists'
import { isActive, shownStatus, sortProblems } from '../lib/problems'
import { todayKey } from '../lib/dates'
import type { Problem, User } from '../types'

export function Home() {
  const { data, user } = useData()
  const { t, userName, formatDate } = useI18n()
  const { userId } = useAppState()
  const me = user(userId)
  if (!data || !me) return <p className="state-box muted">{t('state.loading')}</p>

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <span className="hero-date">{formatDate(todayKey())} · {t('shift.morning')}</span>
          <h1>{t('home.hello', { name: userName(me) })}</h1>
          <p className="hero-sub">{heroLine(me, data, t)}</p>
        </div>
      </section>

      {me.role === 'employee' && <EmployeeHome me={me} data={data} />}
      {me.role === 'supervisor' && <SupervisorHome me={me} data={data} />}
      {me.role === 'auditor' && <AuditorHome me={me} data={data} />}
      {(me.role === 'head' || me.role === 'gm') && <SummaryHome me={me} data={data} />}
    </>
  )
}

/** One plain sentence under the greeting: what today looks like for this person. */
function heroLine(me: User, data: AppData, t: (k: string, v?: Record<string, string | number>) => string): string {
  const deptOf = (p: Problem) => data.locations.find((l) => l.id === p.location)?.department
  if (me.role === 'employee') {
    const left = myChecklists(me, data).filter((s) => s.state !== 'done').length
    const probs = data.problems.filter((p) => p.owner === me.id && p.status === 'open').length
    return t('hero.employee', { n: left, p: probs })
  }
  if (me.role === 'supervisor') {
    const waiting = teamChecklists(me.department as 'recreation', data).filter((s) => s.state === 'done' && !s.run?.check).length
    return t('hero.supervisor', { n: waiting })
  }
  if (me.role === 'auditor') return t('hero.auditor', { n: data.inspectionTemplates.length })
  const active = data.problems.filter((p) => isActive(p) && (me.department === 'all' || deptOf(p) === me.department))
  return t('hero.head', { n: active.length, o: active.filter((p) => shownStatus(p) === 'overdue').length })
}

function EmployeeHome({ me, data }: { me: User; data: AppData }) {
  const { t, c, locName } = useI18n()
  const slots = myChecklists(me, data)
  const order: RunState[] = ['sent-back', 'in-progress', 'not-started', 'done']
  const sorted = [...slots].sort((a, b) => order.indexOf(a.state) - order.indexOf(b.state))
  const next = sorted.find((s) => s.state !== 'done')
  const rest = sorted.filter((s) => s !== next)
  const mine = sortProblems(data.problems.filter((p) => p.owner === me.id && isActive(p)))
  const count = (s: (typeof slots)[number]) => s.run?.entries.filter((e) => e.done).length ?? 0
  const skipped = (s: (typeof slots)[number]) => s.run?.entries.filter((e) => !e.done && e.couldNotDo).length ?? 0

  return (
    <>
      {next ? (
        <article className="card next-card" aria-labelledby="next-title">
          <div className="task-card-head">
            <span className="eyebrow">{t('home.nextUp')}</span>
            <RunStateChip state={next.state} />
          </div>
          <div>
            <h2 id="next-title" className="next-title">{locName(next.location)}</h2>
            <p className="muted small">{c(`tpl.${next.template.id}`, next.template.name)} · {t(`shift.${next.template.shift}`)}</p>
          </div>
          {next.state === 'sent-back' && next.run?.check?.note && (
            <p className="slot-note"><Undo2 size={18} aria-hidden />{t('check.sentBackTitle')} {next.run.check.note}</p>
          )}
          <div className="stack-sm">
            <Segments done={count(next)} skipped={skipped(next)} total={next.template.items.length} />
            <span className="small muted">{t('run.progress', { done: count(next), total: next.template.items.length })}</span>
          </div>
          <Link to={`/checklist/open/${next.location.id}/${next.template.id}`} className="btn btn-primary btn-block btn-lg">
            <Play size={20} aria-hidden />
            {next.state === 'not-started' ? t('emp.start') : t('emp.continue')}
          </Link>
        </article>
      ) : (
        <p className="card state-box"><ClipboardCheck size={28} aria-hidden className="text-good" />{t('home.allDone')}</p>
      )}

      <div className="quick-actions">
        <Link to="/checklists/start" className="quick-action">
          <span className="quick-icon"><QrCode size={22} aria-hidden /></span>{t('emp.scan')}
        </Link>
        <Link to="/problems/new" className="quick-action">
          <span className="quick-icon"><Camera size={22} aria-hidden /></span>{t('emp.report')}
        </Link>
      </div>

      {rest.length > 0 && (
        <section className="stack-sm" aria-labelledby="emp-title">
          <h2 id="emp-title" className="section-title">{t('emp.title')}</h2>
          <ul className="list">
            {rest.map((s) => (
              <li key={`${s.location.id}-${s.template.id}`}>
                <Link to={s.state === 'done' ? `/checklist/${s.run!.id}` : `/checklist/open/${s.location.id}/${s.template.id}`}
                  className="list-row link-row">
                  <div className="list-row-main">
                    <div className="list-row-title">{locName(s.location)}</div>
                    <div className="muted small">{c(`tpl.${s.template.id}`, s.template.name)} · {t('emp.items', { n: s.template.items.length })}</div>
                  </div>
                  <RunStateChip state={s.state} />
                  <ChevronRight size={20} aria-hidden className="flip-rtl muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ProblemPreview title={t('emp.myProblems')} problems={mine} listLink="/problems?scope=mine" />
    </>
  )
}

function SupervisorHome({ me, data }: { me: User; data: AppData }) {
  const { t, c, locName } = useI18n()
  const dept = me.department as 'recreation' | 'housekeeping'
  const slots = teamChecklists(dept, data)
  const count = (s: RunState) => slots.filter((x) => x.state === s).length
  const toCheck = slots.filter((s) => s.state === 'done' && !s.run?.check).length
  const order: RunState[] = ['sent-back', 'done', 'in-progress', 'not-started']
  const labels: Record<RunState, string> = {
    done: t('sup.done'), 'in-progress': t('sup.inProgress'), 'not-started': t('sup.notStarted'), 'sent-back': t('sup.sentBack'),
  }
  const sorted = [...slots].sort((a, b) => order.indexOf(a.state) - order.indexOf(b.state))
  const teamProblems = sortProblems(
    data.problems.filter((p) => isActive(p) && data.locations.find((l) => l.id === p.location)?.department === dept),
  )
  return (
    <>
      <section className="stack" aria-labelledby="sup-title">
        <div className="section-head">
          <h2 id="sup-title" className="section-title">{t('sup.title')}</h2>
          </div>
        {toCheck > 0 && (
          <p className="banner banner-warning"><ClipboardCheck size={20} aria-hidden /><span>{t('sup.toCheck', { n: toCheck })}</span></p>
        )}
        <div className="tiles">
          {(['done', 'in-progress', 'not-started', 'sent-back'] as RunState[]).map((s) => {
            const Icon = RUN_ICON[s]
            return (
              <div key={s} className={`tile tile-${s}`}>
                <span className="tile-icon"><Icon size={18} aria-hidden /></span>
                <span className="tile-number">{count(s)}</span>
                <span className="tile-label">{labels[s]}</span>
              </div>
            )
          })}
        </div>
        <ul className="list">
          {sorted.map((s) => {
            const body = (
              <>
                <div className="list-row-main">
                  <div className="list-row-title">{locName(s.location)}</div>
                  <div className="muted small">{c(`tpl.${s.template.id}`, s.template.name)}</div>
                  {s.state === 'done' && !s.run?.check && (
                    <div className="slot-note"><ClipboardCheck size={16} aria-hidden />{t('sup.waiting')}</div>
                  )}
                </div>
                <RunStateChip state={s.state} />
              </>
            )
            return (
              <li key={`${s.location.id}-${s.template.id}`}>
                {s.run ? (
                  <Link to={`/checklist/${s.run.id}`} className="list-row link-row">
                    {body}
                    <ChevronRight size={20} aria-hidden className="flip-rtl muted" />
                  </Link>
                ) : (
                  <div className="list-row">{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      </section>
      <ProblemPreview title={t('problems.title')} problems={teamProblems} />
    </>
  )
}

function AuditorHome({ me, data }: { me: User; data: AppData }) {
  const { t, c, locName } = useI18n()
  const found = sortProblems(data.problems.filter((p) => p.history[0]?.by === me.id && isActive(p)))
  return (
    <>
      <section className="stack" aria-labelledby="aud-title">
        <h2 id="aud-title" className="section-title">{t('aud.title')}</h2>
        <div className="grid-2">
          {data.inspectionTemplates.map((tpl) => (
            <article key={tpl.id} className="card task-card">
              <div>
                <h3>{c(`tpl.${tpl.id}`, tpl.name)}</h3>
                <p className="muted small">{t(`dept.${tpl.department}`)} · {t('aud.items', { n: tpl.items.length })}</p>
              </div>
              <Link to={`/inspections/start/${tpl.id}`} className="btn btn-primary btn-block">
                <Search size={20} aria-hidden />{t('aud.start')}
              </Link>
            </article>
          ))}
        </div>
      </section>
      {data.inspectionRuns.length > 0 && (
        <section className="stack-sm" aria-labelledby="aud-runs">
          <h2 id="aud-runs" className="section-title">{t('aud.myInspections')}</h2>
          <ul className="list">
            {[...data.inspectionRuns].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 5).map((r) => {
              const tpl = data.inspectionTemplates.find((x) => x.id === r.template)!
              const marked = r.entries.filter((e) => e.steps && e.result).length
              return (
                <li key={r.id}>
                  <Link to={r.finishedAt ? `/inspection/${r.id}/summary` : `/inspection/${r.id}/0`} className="list-row link-row">
                    <div className="list-row-main">
                      <div className="list-row-title">{locName(data.locations.find((l) => l.id === r.location))}</div>
                      <div className="muted small">{c(`tpl.${tpl.id}`, tpl.name)} · {t('insp.marked', { n: marked, total: r.entries.length })}</div>
                    </div>
                    <RunStateChip state={r.finishedAt ? 'done' : 'in-progress'} />
                    <ChevronRight size={20} aria-hidden className="flip-rtl muted" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      <ProblemPreview title={t('aud.recent')} problems={found} listLink="/problems?scope=all" />
    </>
  )
}

function SummaryHome({ me, data }: { me: User; data: AppData }) {
  const { t } = useI18n()
  const today = todayKey()
  const inScope = data.problems.filter((p) =>
    me.department === 'all' || data.locations.find((l) => l.id === p.location)?.department === me.department)
  const active = inScope.filter(isActive)
  const overdue = active.filter((p) => shownStatus(p, today) === 'overdue')
  const tiles = [
    { label: t('sum.open'), n: active.length, icon: ListChecks, cls: '', q: '' },
    { label: t('sum.overdue'), n: overdue.length, icon: Clock, cls: 'is-critical', q: '&status=overdue' },
    { label: t('sum.safety'), n: active.filter((p) => p.safety).length, icon: AlertTriangle, cls: 'is-critical', q: '&safety=1' },
    { label: t('sum.fixedWaiting'), n: inScope.filter((p) => p.status === 'fixed').length, icon: Wrench, cls: '', q: '&status=fixed' },
  ]
  return (
    <>
      <section className="stack" aria-labelledby="sum-title">
        <div className="section-head">
          <h2 id="sum-title" className="section-title">{t('sum.title')}</h2>
          <span className="muted small">{t(`dept.${me.department}`)}</span>
        </div>
        <div className="tiles">
          {tiles.map((x) => (
            <Link key={x.label} to={`/problems?scope=${me.department === 'all' ? 'all' : 'area'}${x.q}`} className="tile">
              <span className="tile-icon"><x.icon size={18} aria-hidden /></span>
              <span className={`tile-number ${x.cls}`}>{x.n}</span>
              <span className="tile-label">{x.label}</span>
            </Link>
          ))}
        </div>
        <div className="panel row">
          <Archive size={20} aria-hidden />
          <span>{t('sum.capex')}: <strong>{inScope.filter((p) => p.status === 'capex').length}</strong></span>
        </div>
        <Link to="/soon/5" className="btn btn-secondary btn-block">{t('sum.full')}</Link>
      </section>
      <ProblemPreview title={t('problems.title')} problems={sortProblems(active)} />
    </>
  )
}

/** Short read-only preview. The full problem list arrives in stage 3. */
function ProblemPreview({ title, problems, listLink = '/problems' }: { title: string; problems: Problem[]; listLink?: string }) {
  const { t } = useI18n()
  return (
    <section className="stack" aria-label={title}>
      <div className="section-head">
        <h2 className="section-title">{title}</h2>
        <Link to={listLink} className="btn-text">
          {t('problems.count', { n: problems.length })}
          <ChevronRight size={18} aria-hidden className="flip-rtl" />
        </Link>
      </div>
      {problems.length === 0 ? (
        <p className="card state-box muted">{t('state.empty')}</p>
      ) : (
        <ul className="list">
          {problems.slice(0, 3).map((p) => <li key={p.id}><ProblemCard p={p} to={`/problems/${p.id}`} /></li>)}
        </ul>
      )}
    </section>
  )
}
