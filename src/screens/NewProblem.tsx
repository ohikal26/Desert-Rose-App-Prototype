import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, Info, MapPin, Send, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { BackLink } from '../components/BackLink'
import { AreaTag } from '../components/Chips'
import { LocationPicker } from '../components/LocationPicker'
import { PhotoInput } from '../components/Photo'
import { Sheet } from '../components/Sheet'
import { useToast } from '../components/Toast'
import { newId } from '../lib/checklists'
import { addDays, dayKey, todayKey } from '../lib/dates'
import type { Problem, ProblemKind, User } from '../types'

/** Who can own a problem at a place: people in that place's team. */
export function ownersFor(users: User[], department?: string): User[] {
  return users.filter((u) => u.department === department && u.role !== 'gm')
}

/** Default owner: the supervisor for that place, who can then hand it on. */
export function defaultOwner(users: User[], department?: string): string | undefined {
  return users.find((u) => u.role === 'supervisor' && u.department === department)?.id
}

export function OwnerDueFields({ locationId, owner, setOwner, due, setDue }: {
  locationId?: string; owner?: string; setOwner: (v: string) => void; due: string; setDue: (v: string) => void
}) {
  const { data, location } = useData()
  const { t, userName, jobName } = useI18n()
  const dept = locationId ? location(locationId)?.department : undefined
  const owners = ownersFor(data?.users ?? [], dept)
  return (
    <>
      <label className="field">
        <span className="field-label">{t('prob.owner')}</span>
        <select className="input" value={owner ?? ''} onChange={(e) => setOwner(e.target.value)} disabled={!locationId}>
          {!locationId && <option value="">{t('new.pickPlaceFirst')}</option>}
          {owners.map((u) => <option key={u.id} value={u.id}>{userName(u)} · {jobName(u)}</option>)}
        </select>
      </label>
      <label className="field">
        <span className="field-label">{t('prob.due')}</span>
        <input type="date" className="input" value={due} min={todayKey()} onChange={(e) => e.target.value && setDue(e.target.value)} />
        <span className="field-hint">{t('new.dueHint')}</span>
      </label>
    </>
  )
}

/** Report a problem (brief 7.4). Opened from home, the problem list, or a checklist task. */
export function NewProblem() {
  const [params] = useSearchParams()
  const { data, user, location, save } = useData()
  const { t, locName, itemText } = useI18n()
  const { userId } = useAppState()
  const toast = useToast()
  const nav = useNavigate()
  const me = user(userId)

  const itemId = params.get('item') ?? undefined
  const source = (params.get('source') as Problem['source']) ?? 'reported'
  const inspectionId = params.get('inspection') ?? undefined
  const inspection = inspectionId ? data?.inspectionRuns.find((r) => r.id === inspectionId) : undefined
  const inspEntry = inspection?.entries.find((e) => e.itemId === itemId)
  const [title, setTitle] = useState(inspEntry?.note ?? '')
  const [locId, setLocId] = useState<string | undefined>(params.get('location') ?? undefined)
  const [photo, setPhoto] = useState<string | undefined>(inspEntry?.photo)
  const [kind, setKind] = useState<ProblemKind>()
  const [safety, setSafety] = useState(false)
  const [interim, setInterim] = useState('')
  const loc = locId ? location(locId) : undefined
  const [ownerPick, setOwner] = useState<string>()
  const [due, setDue] = useState(dayKey(addDays(new Date(), 1)))
  const [picking, setPicking] = useState(false)
  const [tried, setTried] = useState(false)

  const item = useMemo(() => itemId
    ? [...(data?.checklistTemplates ?? []), ...(data?.inspectionTemplates ?? [])].flatMap((x) => x.items).find((i) => i.id === itemId)
    : undefined, [data, itemId])

  if (!data || !me) return null
  const owner = ownerPick ?? defaultOwner(data.users, loc?.department)

  const missing = {
    title: !title.trim(), loc: !loc, kind: !kind, interim: safety && !interim.trim(), owner: !owner,
  }
  const ok = !Object.values(missing).some(Boolean)

  const submit = async () => {
    setTried(true)
    if (!ok || !loc || !kind || !owner) return
    const at = new Date().toISOString()
    const p: Problem = {
      id: newId('p'), title: title.trim(), location: loc.id, photo, kind, area: loc.area, safety,
      interim: safety ? interim.trim() : undefined, owner, due, status: 'open', source, sourceItem: itemId,
      history: [
        { action: 'created', by: me.id, at },
        { action: 'assigned', by: me.id, at, to: owner },
      ],
    }
    try {
      await save('problems', p)
      if (inspection && inspEntry) {
        // Remember which problem this inspection item created.
        await save('inspectionRuns', {
          ...inspection, entries: inspection.entries.map((e) => (e.itemId === itemId ? { ...e, problemId: p.id } : e)),
        })
      }
      toast(t('new.saved'))
      // Back to the checklist or inspection the person came from, otherwise to the new problem.
      if (source === 'checklist' || inspection) nav(-1)
      else nav(`/problems/${p.id}`, { replace: true })
    } catch {
      toast(t('state.error'))
    }
  }

  return (
    <div className="page-narrow">
      <BackLink />
      <h1>{t('emp.report')}</h1>
      {item && (
        <div className="panel row small"><Info size={18} aria-hidden /><span>{t('new.fromTask')} {itemText(item)}</span></div>
      )}

      <form className="stack" style={{ gap: 'var(--s3)' }} noValidate onSubmit={(e) => { e.preventDefault(); submit() }}>
        <label className="field">
          <span className="field-label">{t('new.what')}</span>
          <input className="input" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)}
            placeholder={t('new.whatPlaceholder')} aria-invalid={tried && missing.title} />
          {tried && missing.title && <span className="field-error">{t('new.needWhat')}</span>}
        </label>

        <div className="field">
          <span className="field-label">{t('prob.where')}</span>
          {loc ? (
            <div className="card row">
              <MapPin size={20} aria-hidden />
              <strong style={{ flex: 1 }}>{locName(loc)}</strong>
              <AreaTag area={loc.area} />
              <button type="button" className="btn-text" onClick={() => setPicking(true)}>{t('home.change')}</button>
            </div>
          ) : (
            <button type="button" className="btn btn-secondary btn-block" onClick={() => setPicking(true)}>
              <MapPin size={20} aria-hidden />{t('new.pickPlace')}
            </button>
          )}
          {loc?.area && <span className="field-hint">{t('new.areaAuto')}</span>}
          {tried && missing.loc && <span className="field-error">{t('new.needPlace')}</span>}
        </div>

        <div className="field">
          <span className="field-label">{t('new.photo')}</span>
          <PhotoInput value={photo} onChange={setPhoto} />
        </div>

        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field-label">{t('new.kind')}</legend>
          <div className="radio-cards" role="radiogroup" aria-label={t('new.kind')}>
            <button type="button" role="radio" aria-checked={kind === 'condition'} className="radio-card" onClick={() => setKind('condition')}>
              <Building2 size={22} aria-hidden />
              <span>{t('tag.condition')}<small>{t('new.conditionHint')}</small></span>
            </button>
            <button type="button" role="radio" aria-checked={kind === 'care'} className="radio-card" onClick={() => setKind('care')}>
              <Sparkles size={22} aria-hidden />
              <span>{t('tag.care')}<small>{t('new.careHint')}</small></span>
            </button>
          </div>
          {tried && missing.kind && <span className="field-error">{t('new.needKind')}</span>}
        </fieldset>

        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field-label">{t('new.safety')}</legend>
          <div className="radio-cards" role="radiogroup" aria-label={t('new.safety')}>
            <button type="button" role="radio" aria-checked={!safety} className="radio-card" onClick={() => setSafety(false)}>
              <ShieldCheck size={22} aria-hidden />{t('new.safetyNo')}
            </button>
            <button type="button" role="radio" aria-checked={safety} className="radio-card" onClick={() => setSafety(true)}>
              <ShieldAlert size={22} aria-hidden />{t('new.safetyYes')}
            </button>
          </div>
        </fieldset>
        {safety && (
          <label className="field">
            <span className="field-label">{t('prob.interim')}</span>
            <textarea className="input" value={interim} onChange={(e) => setInterim(e.target.value)}
              placeholder={t('new.interimPlaceholder')} aria-invalid={tried && missing.interim} />
            {tried && missing.interim && <span className="field-error">{t('new.needInterim')}</span>}
          </label>
        )}

        <OwnerDueFields locationId={locId} owner={owner} setOwner={setOwner} due={due} setDue={setDue} />

        <div className="action-bar">
          {tried && !ok && <span className="field-error" role="alert">{t('new.fixFields')}</span>}
          <button type="submit" className="btn btn-primary btn-block"><Send size={20} aria-hidden className="flip-rtl" />{t('new.send')}</button>
        </div>
      </form>

      {picking && (
        <Sheet title={t('new.pickPlace')} onClose={() => setPicking(false)}>
          <LocationPicker
            mine={me.locations}
            onPick={(l) => {
              setLocId(l.id)
              setOwner(defaultOwner(data.users, l.department))
              setPicking(false)
            }}
          />
        </Sheet>
      )}
    </div>
  )
}
