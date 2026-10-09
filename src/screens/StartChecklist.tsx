import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, QrCode, TriangleAlert } from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { QrScanner, locationIdFromQr } from '../components/QrScanner'
import { LocationPicker } from '../components/LocationPicker'
import { BackLink } from '../components/BackLink'
import { templatesFor } from '../lib/checklists'
import type { Location } from '../types'

/** Start a checklist: scan the code at the place, or pick it from a list. */
export function StartChecklist() {
  const { data, user, location } = useData()
  const { t, c, locName } = useI18n()
  const { userId } = useAppState()
  const nav = useNavigate()
  const [mode, setMode] = useState<'scan' | 'list'>('scan')
  const [problem, setProblem] = useState<string | null>(null)
  const [choose, setChoose] = useState<Location | null>(null)
  const me = user(userId)

  const go = useCallback((loc: Location) => {
    if (!data) return
    const tpls = templatesFor(loc, data.checklistTemplates)
    if (tpls.length === 0) { setProblem(t('start.noChecklist', { place: locName(loc) })); return }
    if (tpls.length === 1) { nav(`/checklist/open/${loc.id}/${tpls[0].id}`, { replace: true }); return }
    setChoose(loc)
  }, [data, nav, t, locName])

  const onCode = useCallback((text: string) => {
    const id = locationIdFromQr(text)
    const loc = id ? location(id) : undefined
    if (!loc) { setProblem(t('start.unknownCode')); return }
    go(loc)
  }, [go, location, t])

  if (!data || !me) return null
  const dept = me.department === 'recreation' || me.department === 'housekeeping' ? me.department : undefined
  const hasChecklist = (l: Location) => templatesFor(l, data.checklistTemplates).length > 0

  return (
    <div className="page-narrow">
      <BackLink />
      <h1>{t('start.title')}</h1>
      <div className="tabs" role="tablist" aria-label={t('start.how')}>
        <button type="button" role="tab" aria-selected={mode === 'scan'} onClick={() => { setMode('scan'); setProblem(null) }}>
          <QrCode size={20} aria-hidden />{t('start.scan')}
        </button>
        <button type="button" role="tab" aria-selected={mode === 'list'} onClick={() => { setMode('list'); setProblem(null) }}>
          <List size={20} aria-hidden />{t('start.pick')}
        </button>
      </div>

      {problem && (
        <div className="panel row" role="alert">
          <TriangleAlert size={22} aria-hidden />
          <span>{problem}</span>
        </div>
      )}

      {choose ? (
        <section className="stack" aria-label={locName(choose)}>
          <h2>{locName(choose)}</h2>
          {templatesFor(choose, data.checklistTemplates).map((tpl) => (
            <button key={tpl.id} type="button" className="btn btn-secondary btn-block"
              onClick={() => nav(`/checklist/open/${choose.id}/${tpl.id}`, { replace: true })}>
              {c(`tpl.${tpl.id}`, tpl.name)}
            </button>
          ))}
        </section>
      ) : mode === 'scan' ? (
        <div className="stack">
          <p className="muted">{t('start.scanHint')}</p>
          <QrScanner onCode={onCode} />
          <button type="button" className="btn-text" onClick={() => setMode('list')}>
            <List size={20} aria-hidden />{t('start.cantScan')}
          </button>
        </div>
      ) : (
        <LocationPicker department={dept} mine={me.locations} filter={hasChecklist} onPick={go} />
      )}
    </div>
  )
}
