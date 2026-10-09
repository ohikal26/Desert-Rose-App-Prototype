import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Archive, Camera, ChevronRight, ClipboardCheck, Clock, ListChecks, Play, QrCode, Search, Undo2, Users,
  Wrench,
} from 'lucide-react'
import { useData, type AppData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { RoleSheet } from './RoleSheet'
import { RunStateChip, RUN_ICON, type RunState } from '../components/Chips'
import { ProblemCard } from '../components/ProblemCard'
import { myChecklists, teamChecklists } from '../lib/checklists'
import { isActive, shownStatus, sortProblems } from '../lib/problems'
import { todayKey } from '../lib/dates'
import type { Problem, User } from '../types'

export function Home() {
  const { data, user } = useData()
  const { t, userName, jobName, formatDate } = useI18n()
  const { userId } = useAppState()
  const [sheet, setSheet] = useState(false)
  const me = user(userId)
  if (!data || !me) return <p className="state-box muted">{t('state.loading')}</p>

  return (
    <>
      <div className="hello">
        <span className="muted small">{formatDate(todayKey())} · {t('shift.morning')}</span>
        <h1>{t('home.hello', { name: userName(me) })}</h1>
      </div>

      <section className="card who" aria-label={t('home.youAre')}>
        <span className="avatar" aria-hidden>{me.initials}</span>
        <div className="who-text">
          <span className="muted small">{t('home.youAre')}</span>
          <div className="who-name">{t(`role.${me.role}`)}</div>
          <div className="muted small">
            {me.role === 'gm' ? t('dept.all') : `${jobName(me)} · ${t(`dept.${me.department}`)}`}
          </div>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setSheet(true)}>
          <Users size={20} aria-hidden />{t('home.change')}
        </button>
      </section>

      {me.role === 'employee' && <EmployeeHome me={me} data={data} />}
      {me.role === 'supervisor' && <SupervisorHome me={me} data={data} />}
      {me.role === 'auditor' && <AuditorHome me={me} data={data} />}
      {(me.role === 'head' || me.role === 'gm') && <SummaryHome me={me} data={data} />}

      {sheet && <RoleSheet onClose={() => setSheet(false)} />}
    </>
  )
}

function EmployeeHome({ me, data }: { me: User; data: AppData }) {
  const { t, c, locName } = useI18n()
  const slots = myChecklists(me, data)
  const mine = sortProblems(data.problems.filter((p) => p.owner === me.id && isActive(p)))
  return (
    <>
      <section className="stack" aria-labelledby="emp-title">
        <div className="section-head">
          <h2 id="emp-title">{t('emp.title')}</h2>
        </div>
        <Link to="/checklists/start" className="btn btn-secondary btn-block">
          <QrCode size={20} aria-hidden />{t('emp.scan')}
        </Link>
        <div className="grid-2">
          {slots.map((s) => (
            <article key={`${s.location.id}-${s.template.id}`} className="card task-card">
              <div className="task-card-head">
                <div>
                  <h3>{locName(s.location)}</h3>
                  <p className="muted small">
                    {c(`tpl.${s.template.id}`, s.template.name)} · {t(`shift.${s.template.shift}`)} ·{' '}
                    {t('emp.items', { n: s.template.items.length })}
                  </p>
                </div>
                <RunStateChip state={s.state} />
              </div>
              {s.state === 'sent-back' && s.run?.check?.note && (
                <p className="slot-note"><Undo2 size={18} aria-hidden />{t('check.sentBackTitle')} {s.run.check.note}</p>
              )}
              {s.state === 'done' ? (
                <Link to={`/checklist/${s.run!.id}`} className="btn btn-secondary btn-block">
                  <ChevronRight size={20} aria-hidden className="flip-rtl" />{t('emp.view')}
                </Link>
              ) : (
                <Link to={`/checklist/open/${s.location.id}/${s.template.id}`} className="btn btn-primary btn-block">
                  <Play size={20} aria-hidden />
                  {s.state === 'not-started' ? t('emp.start') : t('emp.continue')}
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <Link to="/problems/new" className="btn btn-secondary btn-block">
        <Camera size={20} aria-hidden />{t('emp.report')}
      </Link>

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
          <h2 id="sup-title">{t('sup.title')}</h2>
          </div>
        {toCheck > 0 && (
          <p className="banner banner-warning"><ClipboardCheck size={20} aria-hidden /><span>{t('sup.toCheck', { n: toCheck })}</span></p>
        )}
        <div className="tiles">
          {(['done', 'in-progress', 'not-started', 'sent-back'] as RunState[]).map((s) => {
            const Icon = RUN_ICON[s]
            return (
              <div key={s} className="tile">
                <span className="tile-number">{count(s)}</span>
                <span className="tile-label"><Icon size={18} aria-hidden />{labels[s]}</span>
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
  const { t, c } = useI18n()
  const found = sortProblems(data.problems.filter((p) => p.history[0]?.by === me.id && isActive(p)))
  return (
    <>
      <section className="stack" aria-labelledby="aud-title">
        <h2 id="aud-title">{t('aud.title')}</h2>
        <div className="grid-2">
          {data.inspectionTemplates.map((tpl) => (
            <article key={tpl.id} className="card task-card">
              <div>
                <h3>{c(`tpl.${tpl.id}`, tpl.name)}</h3>
                <p className="muted small">{t(`dept.${tpl.department}`)} · {t('aud.items', { n: tpl.items.length })}</p>
              </div>
              <Link to="/soon/4" className="btn btn-primary btn-block">
                <Search size={20} aria-hidden />{t('aud.start')}
              </Link>
            </article>
          ))}
        </div>
      </section>
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
          <h2 id="sum-title">{t('sum.title')}</h2>
          <span className="muted small">{t(`dept.${me.department}`)}</span>
        </div>
        <div className="tiles">
          {tiles.map((x) => (
            <Link key={x.label} to={`/problems?scope=${me.department === 'all' ? 'all' : 'area'}${x.q}`} className="tile">
              <span className={`tile-number ${x.cls}`}>{x.n}</span>
              <span className="tile-label"><x.icon size={18} aria-hidden />{x.label}</span>
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
        <h2>{title}</h2>
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
