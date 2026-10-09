import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Check, ChevronLeft, ChevronRight, CircleCheck, CircleDot, CircleX, Flag, ListChecks, PlusCircle, Target,
} from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { BackLink } from '../components/BackLink'
import { PhotoInput } from '../components/Photo'
import { useToast } from '../components/Toast'
import { isComplete, totals } from '../lib/inspections'
import type { InspectionEntry, InspectionRun as Run, ResultMark, StepsMark } from '../types'

const STEPS: { v: StepsMark; icon: typeof Check; cls: string }[] = [
  { v: 'yes', icon: CircleCheck, cls: 'mark-good' },
  { v: 'partly', icon: CircleDot, cls: 'mark-warning' },
  { v: 'no', icon: CircleX, cls: 'mark-critical' },
]
const RESULTS: { v: ResultMark; icon: typeof Check; cls: string }[] = [
  { v: 'good', icon: CircleCheck, cls: 'mark-good' },
  { v: 'needs-work', icon: CircleDot, cls: 'mark-warning' },
  { v: 'not-acceptable', icon: CircleX, cls: 'mark-critical' },
]

/**
 * One item per screen on a phone; the item list beside the open item on a tablet.
 * Two separate marks per item: steps followed, and result (rule 4).
 */
export function InspectionRun() {
  const { runId, index } = useParams()
  const { data, location, save } = useData()
  const { t, c, locName, itemText } = useI18n()
  const { userId } = useAppState()
  const toast = useToast()
  const nav = useNavigate()
  const run = data?.inspectionRuns.find((r) => r.id === runId)
  const tpl = data?.inspectionTemplates.find((x) => x.id === run?.template)
  const i = Math.max(0, Math.min(Number(index ?? 0) || 0, (tpl?.items.length ?? 1) - 1))
  const [note, setNote] = useState('')

  const item = tpl?.items[i]
  const entry = run?.entries.find((e) => e.itemId === item?.id)
  useEffect(() => { setNote(entry?.note ?? '') }, [entry?.itemId, entry?.note])

  if (!data || !run || !tpl || !item) return <p className="card state-box muted">{t('run.notFound')}</p>
  const loc = location(run.location)!
  const readOnly = !!run.finishedAt || run.by !== userId
  const sum = totals(run)
  const last = i === tpl.items.length - 1

  const write = async (next: Run) => {
    try { await save('inspectionRuns', next) } catch { toast(t('state.error')) }
  }
  // Save the note first, so the problem form can pre-fill from it.
  const openProblem = async () => {
    if ((entry?.note ?? '') !== note) await setEntry({ note: note || undefined })
    nav(problemLink)
  }
  const setEntry = (patch: Partial<InspectionEntry>) =>
    write({ ...run, entries: run.entries.map((e) => (e.itemId === item.id ? { ...e, ...patch } : e)) })
  const saveNote = () => { if ((entry?.note ?? '') !== note) setEntry({ note: note || undefined }) }
  const go = (n: number) => { saveNote(); nav(`/inspection/${run.id}/${n}`, { replace: true }) }
  const finish = () => { saveNote(); nav(`/inspection/${run.id}/summary`) }

  const problemLink = entry?.problemId
    ? `/problems/${entry.problemId}`
    : `/problems/new?location=${loc.id}&item=${item.id}&source=inspection&inspection=${run.id}`

  return (
    <div className="insp">
      <aside className="insp-list" aria-label={t('insp.items')}>
        <ol className="insp-items">
          {tpl.items.map((it, n) => {
            const e = run.entries.find((x) => x.itemId === it.id)
            const done = !!(e?.steps && e?.result)
            return (
              <li key={it.id}>
                <button type="button" className={`insp-item ${n === i ? 'is-current' : ''} ${done ? 'is-done' : ''}`}
                  aria-current={n === i ? 'step' : undefined} onClick={() => go(n)}>
                  <span className="insp-num" aria-hidden>{done ? <Check size={16} strokeWidth={3} /> : n + 1}</span>
                  <span className="insp-item-text">{itemText(it)}</span>
                  {e?.problemId && <Flag size={16} aria-label={t('insp.hasProblem')} className="text-critical" />}
                </button>
              </li>
            )
          })}
        </ol>
      </aside>

      <section className="insp-main page-narrow" aria-labelledby="insp-item-title">
        <BackLink to="/" />
        <header className="stack-sm">
          <span className="muted small">{c(`tpl.${tpl.id}`, tpl.name)} · {locName(loc)}</span>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="eyebrow">{t('insp.itemOf', { n: i + 1, total: tpl.items.length })}</span>
            <span className="small muted">{t('insp.marked', { n: sum.marked, total: sum.total })}</span>
          </div>
          <h1 id="insp-item-title">{itemText(item)}</h1>
        </header>

        <MarkGroup
          label={t('insp.steps')} icon={ListChecks} value={entry?.steps} readOnly={readOnly}
          options={STEPS.map((o) => ({ ...o, label: t(`steps.${o.v}`) }))}
          onPick={(v) => setEntry({ steps: v as StepsMark })}
        />
        <MarkGroup
          label={t('insp.result')} icon={Target} value={entry?.result} readOnly={readOnly}
          options={RESULTS.map((o) => ({ ...o, label: t(`result.${o.v}`) }))}
          onPick={(v) => setEntry({ result: v as ResultMark })}
        />

        {!readOnly && (
          <div className="field">
            <span className="field-label">{t('new.photo')} <span className="muted">({t('insp.optional')})</span></span>
            <PhotoInput value={entry?.photo} onChange={(v) => setEntry({ photo: v })} />
          </div>
        )}
        {readOnly && entry?.photo && <img className="photo-large" src={entry.photo} alt={itemText(item)} />}

        <label className="field">
          <span className="field-label">{t('insp.note')} <span className="muted">({t('insp.optional')})</span></span>
          <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} onBlur={saveNote}
            readOnly={readOnly} rows={2} />
        </label>

        <button type="button" onClick={openProblem} className="btn btn-secondary btn-block">
          {entry?.problemId ? <Flag size={20} aria-hidden /> : <PlusCircle size={20} aria-hidden />}
          {entry?.problemId ? t('insp.seeProblem') : t('insp.addProblem')}
        </button>

        <div className="action-bar action-bar-2">
          <button type="button" className="btn btn-secondary" disabled={i === 0} onClick={() => go(i - 1)}>
            <ChevronLeft size={20} aria-hidden className="flip-rtl" />{t('insp.prev')}
          </button>
          {last || readOnly ? (
            <button type="button" className="btn btn-primary" onClick={finish}>
              <Check size={20} aria-hidden />{readOnly ? t('insp.summary') : t('insp.finish')}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => go(i + 1)}>
              {t('insp.next')}<ChevronRight size={20} aria-hidden className="flip-rtl" />
            </button>
          )}
        </div>
        {!readOnly && !isComplete(run) && last && (
          <p className="small muted">{t('insp.unmarkedHint', { n: sum.total - sum.marked })}</p>
        )}
      </section>
    </div>
  )
}

function MarkGroup({ label, icon: Icon, value, options, readOnly, onPick }: {
  label: string; icon: typeof Check; value?: string; readOnly: boolean
  options: { v: string; label: string; icon: typeof Check; cls: string }[]
  onPick: (v: string) => void
}) {
  return (
    <fieldset className="mark-group">
      <legend className="field-label row-inline"><Icon size={18} aria-hidden />{label}</legend>
      <div className="mark-options" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o.v} type="button" role="radio" aria-checked={value === o.v} disabled={readOnly && value !== o.v}
            className={`mark ${o.cls}`} onClick={() => !readOnly && onPick(o.v)}>
            <o.icon size={22} aria-hidden />{o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
