import { Link, useNavigate, useParams } from 'react-router-dom'
import { CircleCheck, Flag, Home, ListChecks, Target } from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { ProblemCard } from '../components/ProblemCard'
import { useToast } from '../components/Toast'
import { totals } from '../lib/inspections'

/** Two totals side by side, never merged (rule 4), and the problems created. */
export function InspectionSummary() {
  const { runId } = useParams()
  const { data, location, user, save } = useData()
  const { t, c, locName, userName, formatDate, formatTime } = useI18n()
  const { userId } = useAppState()
  const toast = useToast()
  const nav = useNavigate()
  const run = data?.inspectionRuns.find((r) => r.id === runId)
  const tpl = data?.inspectionTemplates.find((x) => x.id === run?.template)
  if (!data || !run || !tpl) return <p className="card state-box muted">{t('run.notFound')}</p>
  const loc = location(run.location)!
  const s = totals(run)
  const problems = run.entries.map((e) => e.problemId && data.problems.find((p) => p.id === e.problemId)).filter(Boolean) as NonNullable<ReturnType<typeof data.problems.find>>[]
  const canFinish = !run.finishedAt && run.by === userId

  const finish = async () => {
    try {
      await save('inspectionRuns', { ...run, finishedAt: new Date().toISOString() })
      toast(t('insp.finished'))
      nav('/')
    } catch { toast(t('state.error')) }
  }

  return (
    <div className="page-narrow">
      <header className="stack-sm">
        <span className="muted small">{c(`tpl.${tpl.id}`, tpl.name)} · {userName(user(run.by))} · {formatDate(run.startedAt)} {formatTime(run.startedAt)}</span>
        <h1>{locName(loc)}</h1>
      </header>

      <div className="totals" role="group" aria-label={t('insp.totals')}>
        <div className="total card">
          <span className="tile-icon"><ListChecks size={18} aria-hidden /></span>
          <span className="total-label">{t('insp.steps')}</span>
          <span className="total-number">{s.stepsYes} <span className="total-of">{t('insp.of', { total: s.total })}</span></span>
          <ul className="total-breakdown">
            <li><span className="dot mark-good" />{t('steps.yes')}: {s.stepsYes}</li>
            <li><span className="dot mark-warning" />{t('steps.partly')}: {s.stepsPartly}</li>
            <li><span className="dot mark-critical" />{t('steps.no')}: {s.stepsNo}</li>
          </ul>
        </div>
        <div className="total card">
          <span className="tile-icon"><Target size={18} aria-hidden /></span>
          <span className="total-label">{t('insp.resultGood')}</span>
          <span className="total-number">{s.resultGood} <span className="total-of">{t('insp.of', { total: s.total })}</span></span>
          <ul className="total-breakdown">
            <li><span className="dot mark-good" />{t('result.good')}: {s.resultGood}</li>
            <li><span className="dot mark-warning" />{t('result.needs-work')}: {s.resultNeedsWork}</li>
            <li><span className="dot mark-critical" />{t('result.not-acceptable')}: {s.resultBad}</li>
          </ul>
        </div>
      </div>
      <p className="muted small">{t('insp.twoTotalsNote')}</p>
      {s.marked < s.total && <p className="banner banner-warning"><span>{t('insp.unmarkedHint', { n: s.total - s.marked })}</span></p>}

      <section className="stack-sm" aria-labelledby="insp-probs">
        <h2 id="insp-probs" className="section-title row-inline"><Flag size={20} aria-hidden />{t('insp.problemsCreated', { n: problems.length })}</h2>
        {problems.length === 0 ? (
          <p className="card state-box muted">{t('insp.noProblems')}</p>
        ) : (
          <ul className="list">{problems.map((p) => <li key={p.id}><ProblemCard p={p} to={`/problems/${p.id}`} /></li>)}</ul>
        )}
      </section>

      <div className="action-bar action-bar-2">
        <Link to={`/inspection/${run.id}/0`} className="btn btn-secondary">{t('insp.backToItems')}</Link>
        {canFinish ? (
          <button type="button" className="btn btn-primary" onClick={finish}><CircleCheck size={20} aria-hidden />{t('insp.finishSave')}</button>
        ) : (
          <Link to="/" className="btn btn-primary"><Home size={20} aria-hidden />{t('nav.home')}</Link>
        )}
      </div>
    </div>
  )
}
