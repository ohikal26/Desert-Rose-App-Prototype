import { useEffect, useRef } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { emptyRun } from '../lib/checklists'
import { todayKey } from '../lib/dates'
import { useToast } from '../components/Toast'

/** Opens today's checklist for a place, or starts a new one. */
export function OpenChecklist() {
  const { locationId, templateId } = useParams()
  const { data, location, save } = useData()
  const { userId } = useAppState()
  const { t } = useI18n()
  const toast = useToast()
  const nav = useNavigate()
  const started = useRef(false)

  const loc = locationId ? location(locationId) : undefined
  const tpl = data?.checklistTemplates.find((x) => x.id === templateId)
  const existing = data?.checklistRuns.find((r) => r.location === locationId && r.template === templateId && r.date === todayKey())

  useEffect(() => {
    if (!data || existing || !loc || !tpl || started.current) return
    started.current = true
    const run = emptyRun(loc, tpl, userId)
    save('checklistRuns', run)
      .then(() => nav(`/checklist/${run.id}`, { replace: true }))
      .catch(() => { toast(t('state.error')); nav('/', { replace: true }) })
  }, [data, existing, loc, tpl, userId, save, nav, toast, t])

  if (!data) return null
  if (existing) return <Navigate to={`/checklist/${existing.id}`} replace />
  if (!loc || !tpl) return <Navigate to="/" replace />
  return <p className="state-box muted">{t('state.loading')}</p>
}
