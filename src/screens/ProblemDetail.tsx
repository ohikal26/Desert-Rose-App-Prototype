import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Archive, BadgeCheck, CalendarClock, CircleAlert, Hand, PlusCircle, RotateCcw, ShieldAlert, UserCheck, Wrench,
} from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { BackLink } from '../components/BackLink'
import { AreaTag, KindTag, ProblemStatusChip, SafetyChip } from '../components/Chips'
import { Sheet } from '../components/Sheet'
import { useToast } from '../components/Toast'
import { useDueText } from '../components/ProblemCard'
import { OwnerDueFields } from './NewProblem'
import {
  canAssign, canConfirm, canMarkFixed, canSendToCapex, isActive, shownStatus,
} from '../lib/problems'
import type { HistoryEntry, Problem } from '../types'

type SheetKind = null | 'fix' | 'reopen' | 'assign' | 'capex' | 'blocked'

export function ProblemDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { data, user, location, save } = useData()
  const { t, c, locName, problemTitle, userName, itemText } = useI18n()
  const { userId } = useAppState()
  const toast = useToast()
  const dueText = useDueText()
  const [sheet, setSheet] = useState<SheetKind>(null)
  const [blockedReason, setBlockedReason] = useState('')

  const p = data?.problems.find((x) => x.id === id)
  const me = user(userId)
  if (!data || !me) return null
  if (!p) return <p className="card state-box muted">{t('prob.notFound')}</p>

  const loc = location(p.location)
  const status = shownStatus(p)
  const now = () => new Date().toISOString()
  const write = async (next: Problem, msg: string) => {
    try {
      await save('problems', next)
      toast(msg)
    } catch {
      toast(t('state.error'))
    }
    setSheet(null)
  }
  const add = (h: Omit<HistoryEntry, 'by' | 'at'>, patch: Partial<Problem>): Problem =>
    ({ ...p, ...patch, history: [...p.history, { ...h, by: me.id, at: now() }] })

  const tryConfirm = () => {
    const v = canConfirm(p, me, loc)
    if (v.ok) {
      write(add({ action: 'confirmed' }, { status: 'closed' }), t('prob.confirmedDone'))
    } else {
      setBlockedReason(t(`block.${v.reason}`))
      setSheet('blocked')
    }
  }

  const sourceItem = p.sourceItem
    ? [...data.checklistTemplates, ...data.inspectionTemplates].flatMap((x) => x.items).find((i) => i.id === p.sourceItem)
    : undefined
  const interim = p.interim ? (p.interimKey ? c(p.interimKey, p.interim) : p.interim) : undefined
  const due = dueText(p)
  const listQs = params.toString() ? `?${params}` : ''

  // Actions allowed for this person on this problem.
  const showFix = canMarkFixed(p, me)
  const showConfirm = p.status === 'fixed' // always shown so the rule against self-confirming is visible
  const showAssign = canAssign(p, me, loc)
  const showCapex = canSendToCapex(p, me, loc)

  return (
    <div className="stack" style={{ gap: 'var(--s3)' }}>
      <div className="split-back"><BackLink to={`/problems${listQs}`} /></div>

      <header className="stack-sm">
        <div className="row">
          {p.safety && <SafetyChip />}
          <ProblemStatusChip status={status} />
        </div>
        <h1>{problemTitle(p)}</h1>
        <div className="row"><KindTag kind={p.kind} /><AreaTag area={p.area} /></div>
      </header>

      {p.safety && isActive(p) && (
        <div className="banner banner-critical" role="note">
          <ShieldAlert size={22} aria-hidden />
          <div><strong>{t('prob.interim')}</strong><div>{interim}</div></div>
        </div>
      )}

      {p.photo && <img className="photo-large" src={p.photo} alt={problemTitle(p)} />}

      <dl className="dl card">
        <dt>{t('prob.where')}</dt><dd>{locName(loc)}</dd>
        <dt>{t('prob.owner')}</dt><dd>{userName(user(p.owner))}</dd>
        {due && (<><dt>{t('prob.due')}</dt><dd className={status === 'overdue' ? 'text-critical' : ''}>{due}</dd></>)}
        <dt>{t('prob.source')}</dt>
        <dd>{t(`source.${p.source}`)}{sourceItem && <div className="muted small">{itemText(sourceItem)}</div>}</dd>
      </dl>

      {p.status === 'capex' && (
        <div className="panel row"><Archive size={20} aria-hidden /><span>{t('prob.capexNote')}</span></div>
      )}

      <section className="stack-sm" aria-labelledby="hist">
        <h2 id="hist">{t('prob.history')}</h2>
        <ol className="timeline">
          {p.history.map((h, i) => <HistoryRow key={i} h={h} />)}
        </ol>
      </section>

      {(showFix || showConfirm || showAssign || showCapex) && (
        <div className="action-bar">
          {showAssign && (
            <button type="button" className="btn btn-secondary btn-block" onClick={() => setSheet('assign')}>
              <UserCheck size={20} aria-hidden />{t('prob.assign')}
            </button>
          )}
          {showCapex && (
            <button type="button" className="btn btn-secondary btn-block" onClick={() => setSheet('capex')}>
              <Archive size={20} aria-hidden />{t('prob.toCapex')}
            </button>
          )}
          {showConfirm && canConfirm(p, me, loc).ok && (
            <button type="button" className="btn btn-secondary btn-block" onClick={() => setSheet('reopen')}>
              <RotateCcw size={20} aria-hidden />{t('prob.notFixed')}
            </button>
          )}
          {showConfirm && (
            <button type="button" className="btn btn-primary btn-block" onClick={tryConfirm}>
              <BadgeCheck size={20} aria-hidden />{t('prob.confirm')}
            </button>
          )}
          {showFix && (
            <button type="button" className="btn btn-primary btn-block" onClick={() => setSheet('fix')}>
              <Wrench size={20} aria-hidden />{t('prob.markFixed')}
            </button>
          )}
        </div>
      )}

      {sheet === 'fix' && (
        <NoteSheet title={t('prob.markFixed')} intro={t('prob.fixIntro')} label={t('prob.fixNote')} required={false}
          button={t('prob.markFixed')} onClose={() => setSheet(null)}
          onSave={(note) => write(add({ action: 'fixed', note: note || undefined }, { status: 'fixed' }), t('prob.fixedDone'))} />
      )}
      {sheet === 'reopen' && (
        <NoteSheet title={t('prob.notFixed')} intro="" label={t('prob.reopenNote')} required
          button={t('prob.notFixed')} onClose={() => setSheet(null)}
          onSave={(note) => write(add({ action: 'reopened', note }, { status: 'open' }), t('prob.reopenedDone'))} />
      )}
      {sheet === 'capex' && (
        <Sheet title={t('prob.toCapex')} onClose={() => setSheet(null)}>
          <p>{t('prob.capexConfirm')}</p>
          <button type="button" className="btn btn-primary btn-block"
            onClick={() => write(add({ action: 'capex' }, { status: 'capex' }), t('prob.capexDone'))}>
            <Archive size={20} aria-hidden />{t('prob.toCapex')}
          </button>
        </Sheet>
      )}
      {sheet === 'assign' && (
        <AssignSheet p={p} onClose={() => setSheet(null)}
          onSave={(owner, dueDay) => {
            const h: Omit<HistoryEntry, 'by' | 'at'> = { action: 'assigned', to: owner }
            if (dueDay !== p.due) h.due = dueDay
            write(add(h, { owner, due: dueDay }), t('prob.assignedDone', { name: userName(user(owner)) }))
          }} />
      )}
      {sheet === 'blocked' && (
        <Sheet title={t('prob.confirm')} onClose={() => setSheet(null)}>
          <div className="banner banner-warning" role="alert">
            <Hand size={22} aria-hidden />
            <div>{blockedReason}</div>
          </div>
          <button type="button" className="btn btn-secondary btn-block" onClick={() => setSheet(null)}>{t('common.ok')}</button>
        </Sheet>
      )}
    </div>
  )
}

function HistoryRow({ h }: { h: HistoryEntry }) {
  const { t, userName, formatDate, formatTime } = useI18n()
  const { user } = useData()
  const icons = {
    created: PlusCircle, assigned: UserCheck, fixed: Wrench, confirmed: BadgeCheck,
    reopened: RotateCcw, capex: Archive, note: CircleAlert,
  }
  const Icon = icons[h.action]
  const vars = { name: userName(user(h.by)), to: h.to ? userName(user(h.to)) : '' }
  return (
    <li>
      <span className="timeline-dot" aria-hidden><Icon size={16} /></span>
      <div>
        <div>{t(`hist.${h.action}`, vars)}</div>
        {h.due && <div className="small row-inline"><CalendarClock size={14} aria-hidden />{t('hist.due', { date: formatDate(h.due) })}</div>}
        {h.note && <div className="small">“{h.note}”</div>}
        <div className="muted small">{formatDate(h.at)} · {formatTime(h.at)}</div>
      </div>
    </li>
  )
}

function NoteSheet({ title, intro, label, required, button, onClose, onSave }: {
  title: string; intro: string; label: string; required: boolean; button: string
  onClose: () => void; onSave: (note: string) => void
}) {
  const [note, setNote] = useState('')
  const ok = !required || note.trim().length > 0
  return (
    <Sheet title={title} onClose={onClose}>
      {intro && <p>{intro}</p>}
      <form className="stack" onSubmit={(e) => { e.preventDefault(); if (ok) onSave(note.trim()) }}>
        <label className="field">
          <span className="field-label">{label}</span>
          <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={!ok}>{button}</button>
      </form>
    </Sheet>
  )
}

function AssignSheet({ p, onClose, onSave }: { p: Problem; onClose: () => void; onSave: (owner: string, due: string) => void }) {
  const { t } = useI18n()
  const [owner, setOwner] = useState(p.owner)
  const [due, setDue] = useState(p.due)
  return (
    <Sheet title={t('prob.assign')} onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); onSave(owner, due) }}>
        <OwnerDueFields locationId={p.location} owner={owner} setOwner={setOwner} due={due} setDue={setDue} />
        <button type="submit" className="btn btn-primary btn-block"><UserCheck size={20} aria-hidden />{t('prob.assignSave')}</button>
      </form>
    </Sheet>
  )
}

