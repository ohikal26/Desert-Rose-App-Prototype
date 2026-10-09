import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { BackLink } from '../components/BackLink'
import { LocationPicker } from '../components/LocationPicker'
import { useToast } from '../components/Toast'
import { inspectionTemplatesFor, newInspection } from '../lib/inspections'
import type { Location } from '../types'

/** Pick the place for an inspection template, then start it (brief 7.3). */
export function StartInspection() {
  const { templateId } = useParams()
  const { data, save } = useData()
  const { t, c } = useI18n()
  const { userId } = useAppState()
  const toast = useToast()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const tpl = data?.inspectionTemplates.find((x) => x.id === templateId)
  if (!data || !tpl) return null

  const fits = (l: Location) => inspectionTemplatesFor(l, [tpl]).length > 0
  const start = async (loc: Location) => {
    if (busy) return
    setBusy(true)
    const run = newInspection(loc, tpl, userId)
    try {
      await save('inspectionRuns', run)
      nav(`/inspection/${run.id}`, { replace: true })
    } catch {
      toast(t('state.error'))
      setBusy(false)
    }
  }

  return (
    <div className="page-narrow">
      <BackLink to="/" />
      <header className="stack-sm">
        <span className="muted small">{c(`tpl.${tpl.id}`, tpl.name)} · {t('aud.items', { n: tpl.items.length })}</span>
        <h1>{t('insp.where')}</h1>
      </header>
      <LocationPicker department={tpl.department} filter={fits} onPick={start} />
    </div>
  )
}
