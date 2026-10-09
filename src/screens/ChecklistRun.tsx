import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Ban, Camera, Check, CircleCheck, ClipboardCheck, Eye, Send, Undo2, UserPen,
} from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { BackLink } from '../components/BackLink'
import { RunStateChip } from '../components/Chips'
import { Segments } from '../components/Progress'
import { Sheet } from '../components/Sheet'
import { PhotoInput, PhotoThumb } from '../components/Photo'
import { useToast } from '../components/Toast'
import { readyToSubmit, runState, validInitials } from '../lib/checklists'
import type { ChecklistRun as Run, ItemEntry, TemplateItem } from '../types'

const QUICK_REASONS = ['cnd.reason1', 'cnd.reason2', 'cnd.reason3'] as const

export function ChecklistRun() {
  const { runId } = useParams()
  const { data, user, location, save } = useData()
  const { t, c, locName, itemText, userName, formatDate, formatTime } = useI18n()
  const { userId } = useAppState()
  const toast = useToast()
  const nav = useNavigate()

  const run = data?.checklistRuns.find((r) => r.id === runId)
  const me = user(userId)
  const myPastInitials = run?.entries.find((e) => e.by === userId && e.initials)?.initials ?? ''
  const [initials, setInitials] = useState<string>(myPastInitials)
  // When set, the initials sheet is open; `then` runs the tap that asked for it.
  const [askInitials, setAskInitials] = useState<null | { then?: (ini: string) => void }>(null)
  const [cndFor, setCndFor] = useState<TemplateItem | null>(null)
  const [sendBack, setSendBack] = useState(false)

  if (!data || !me) return null
  if (!run) return <p className="card state-box muted">{t('run.notFound')}</p>
  const tpl = data.checklistTemplates.find((x) => x.id === run.template)!
  const loc = location(run.location)!
  const state = runState(run)
  const sameTeam = me.department === loc.department

  // Who may do what on this screen.
  const canTick = me.role === 'employee' && sameTeam && (state === 'in-progress' || state === 'sent-back')
  const canCheck = me.role === 'supervisor' && sameTeam && state === 'done' && !run.check

  const write = async (next: Run, okMsg?: string) => {
    try {
      await save('checklistRuns', next)
      if (okMsg) toast(okMsg)
    } catch {
      toast(t('state.error'))
    }
  }

  const setEntry = (itemId: string, patch: Partial<ItemEntry>) =>
    write({ ...run, entries: run.entries.map((e) => (e.itemId === itemId ? { ...e, ...patch } : e)) })

  const withInitials = (fn: (ini: string) => void) => {
    if (validInitials(initials)) fn(initials.trim().toUpperCase())
    else setAskInitials({ then: fn })
  }

  const toggle = (item: TemplateItem, entry: ItemEntry) => {
    if (!canTick) return
    if (entry.done) {
      setEntry(item.id, { done: false, initials: undefined, at: undefined, by: undefined })
      return
    }
    withInitials((ini) =>
      setEntry(item.id, { done: true, initials: ini, at: new Date().toISOString(), by: userId, couldNotDo: undefined }))
  }

  const submit = () => {
    const next: Run = { ...run, submittedAt: new Date().toISOString() }
    if (run.check) {
      next.pastChecks = [...(run.pastChecks ?? []), run.check]
      delete next.check
    }
    write(next, t('run.sent')).then(() => nav('/'))
  }

  const doneCount = run.entries.filter((e) => e.done).length
  const ready = readyToSubmit(run)

  return (
    <div className="page-narrow">
      <BackLink to="/" />
      <header className="stack-sm">
        <span className="muted small">{c(`tpl.${tpl.id}`, tpl.name)}</span>
        <h1>{locName(loc)}</h1>
        <div className="row">
          <span className="muted small">{t(`shift.${run.shift}`)} · {formatDate(run.date)}</span>
          <RunStateChip state={state} />
        </div>
        <Segments done={run.entries.filter((e) => e.done).length}
          skipped={run.entries.filter((e) => !e.done && e.couldNotDo).length} total={tpl.items.length} />
      </header>

      {run.check && <CheckBanner run={run} />}
      {!run.check && run.submittedAt && (
        <div className="panel row small">
          <Send size={18} aria-hidden className="flip-rtl" />
          {t('run.sentAt', { time: formatTime(run.submittedAt) })}
        </div>
      )}

      {canTick && (
        <div className="row small">
          <UserPen size={18} aria-hidden />
          {validInitials(initials)
            ? <span>{t('run.tickingAs')} <strong>{initials.toUpperCase()}</strong></span>
            : <span>{t('run.tapToTick')}</span>}
          {validInitials(initials) && (
            <button type="button" className="btn-text" onClick={() => setAskInitials({})}>{t('home.change')}</button>
          )}
        </div>
      )}

      {canCheck && (
        <div className="panel row">
          <Eye size={22} aria-hidden />
          <span>{t('check.hint')}</span>
        </div>
      )}

      <ol className="cl-list">
        {tpl.items.map((item) => {
          const e = run.entries.find((x) => x.itemId === item.id) ?? { itemId: item.id, done: false }
          const cnd = !e.done && !!e.couldNotDo
          return (
            <li key={item.id} className={`cl-item ${e.done ? 'is-done' : ''} ${cnd ? 'is-cnd' : ''}`}>
              <button type="button" className="cl-tick" aria-pressed={e.done} disabled={!canTick}
                onClick={() => toggle(item, e)}>
                <span className="cl-circle" aria-hidden>
                  {e.done && <Check size={22} strokeWidth={3} />}
                  {cnd && <Ban size={20} />}
                </span>
                <span className="cl-text">
                  <span>{itemText(item)}</span>
                  {e.done && e.at && (
                    <span className="cl-meta">
                      <span className="visually-hidden">{t('sup.done')}: </span>
                      {e.initials} · {formatTime(e.at)}
                    </span>
                  )}
                  {cnd && <span className="cl-meta cl-cnd">{t('cnd.label')}: {e.couldNotDo}</span>}
                </span>
              </button>
              <div className="cl-actions">
                {canTick && !e.done && (
                  <button type="button" className="btn-text small" onClick={() => setCndFor(item)}>
                    <Ban size={16} aria-hidden />{t('cnd.label')}
                  </button>
                )}
                <Link className="btn-text small"
                  to={`/problems/new?location=${loc.id}&item=${item.id}&source=checklist`}>
                  <Camera size={16} aria-hidden />{t('emp.report')}
                </Link>
              </div>
            </li>
          )
        })}
      </ol>

      {canTick && (
        <div className="action-bar">
          <span className="small muted" aria-live="polite">
            {t('run.progress', { done: doneCount, total: tpl.items.length })}
            {!ready && <> · {t('run.notReady')}</>}
          </span>
          <button type="button" className="btn btn-primary btn-block" disabled={!ready} onClick={submit}>
            <Send size={20} aria-hidden className="flip-rtl" />{t('run.submit')}
          </button>
        </div>
      )}

      {canCheck && (
        <div className="action-bar action-bar-2">
          <button type="button" className="btn btn-secondary" onClick={() => setSendBack(true)}>
            <Undo2 size={20} aria-hidden />{t('check.sendBack')}
          </button>
          <button type="button" className="btn btn-primary"
            onClick={() => write({ ...run, check: { result: 'ok', by: userId, at: new Date().toISOString() } }, t('check.okDone'))}>
            <CircleCheck size={20} aria-hidden />{t('check.ok')}
          </button>
        </div>
      )}

      {askInitials && (
        <InitialsSheet
          value={initials}
          onClose={() => setAskInitials(null)}
          onSave={(v) => { setInitials(v); askInitials.then?.(v); setAskInitials(null) }}
        />
      )}
      {cndFor && (
        <CouldNotDoSheet
          current={run.entries.find((x) => x.itemId === cndFor.id)?.couldNotDo}
          title={itemText(cndFor)}
          onClose={() => setCndFor(null)}
          onSave={(reason) => {
            setEntry(cndFor.id, { done: false, couldNotDo: reason || undefined, by: userId, at: new Date().toISOString() })
            setCndFor(null)
          }}
        />
      )}
      {sendBack && (
        <SendBackSheet
          onClose={() => setSendBack(false)}
          onSend={(note, photo) => {
            setSendBack(false)
            write({ ...run, check: { result: 'sent-back', note, photo, by: userId, at: new Date().toISOString() } }, t('check.sentBackDone'))
          }}
        />
      )}
      {/* Keep the person's name in the page for screen readers when looking at someone else's checklist. */}
      {!canTick && run.startedBy && <p className="visually-hidden">{userName(user(run.startedBy))}</p>}
    </div>
  )
}

function CheckBanner({ run }: { run: Run }) {
  const { t, userName, formatTime } = useI18n()
  const { user } = useData()
  const check = run.check!
  const who = `${userName(user(check.by))} · ${formatTime(check.at)}`
  if (check.result === 'ok') {
    return (
      <div className="banner banner-good" role="status">
        <ClipboardCheck size={22} aria-hidden />
        <div><strong>{t('check.ok')}</strong><div className="small">{who}</div></div>
      </div>
    )
  }
  return (
    <div className="banner banner-warning" role="status">
      <Undo2 size={22} aria-hidden />
      <div className="stack-sm">
        <div><strong>{t('check.sentBackTitle')}</strong> {check.note}</div>
        <div className="small">{who}</div>
        {check.photo && <PhotoThumb src={check.photo} alt={t('check.photoAlt')} />}
      </div>
    </div>
  )
}

function InitialsSheet({ value, onClose, onSave }: { value: string; onClose: () => void; onSave: (v: string) => void }) {
  const { t } = useI18n()
  const [v, setV] = useState(value)
  const ok = validInitials(v)
  return (
    <Sheet title={t('ini.title')} onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); if (ok) onSave(v.trim().toUpperCase()) }}>
        <label className="field">
          <span className="field-label">{t('ini.label')}</span>
          <input className="input ini-input" value={v} maxLength={3} autoFocus autoCapitalize="characters"
            autoComplete="off" onChange={(e) => setV(e.target.value)} aria-describedby="ini-hint" />
          <span id="ini-hint" className="field-hint">{t('ini.hint')}</span>
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={!ok}>
          <Check size={20} aria-hidden />{t('ini.save')}
        </button>
      </form>
    </Sheet>
  )
}

function CouldNotDoSheet({ title, current, onClose, onSave }: {
  title: string; current?: string; onClose: () => void; onSave: (reason: string) => void
}) {
  const { t } = useI18n()
  const [v, setV] = useState(current ?? '')
  return (
    <Sheet title={t('cnd.label')} onClose={onClose}>
      <p className="muted">{title}</p>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); if (v.trim()) onSave(v.trim()) }}>
        <div className="row">
          {QUICK_REASONS.map((k) => (
            <button key={k} type="button" className="tag tag-btn" onClick={() => setV(t(k))}>{t(k)}</button>
          ))}
        </div>
        <label className="field">
          <span className="field-label">{t('cnd.why')}</span>
          <textarea className="input" value={v} onChange={(e) => setV(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={!v.trim()}>{t('cnd.save')}</button>
        {current && (
          <button type="button" className="btn-text" onClick={() => onSave('')}>{t('cnd.clear')}</button>
        )}
      </form>
    </Sheet>
  )
}

function SendBackSheet({ onClose, onSend }: { onClose: () => void; onSend: (note: string, photo?: string) => void }) {
  const { t } = useI18n()
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<string>()
  return (
    <Sheet title={t('check.sendBack')} onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); if (note.trim()) onSend(note.trim(), photo) }}>
        <label className="field">
          <span className="field-label">{t('check.noteLabel')}</span>
          <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={t('check.notePlaceholder')} />
        </label>
        <div className="field">
          <span className="field-label">{t('check.photoLabel')}</span>
          <PhotoInput value={photo} onChange={setPhoto} />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={!note.trim()}>
          <Undo2 size={20} aria-hidden />{t('check.sendBack')}
        </button>
      </form>
    </Sheet>
  )
}

