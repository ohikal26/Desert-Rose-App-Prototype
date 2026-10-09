import { useMemo, useState } from 'react'
import { Link, Outlet, useMatch, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Building2, ChevronDown, History, Plus, Sparkles, Sprout, MousePointerClick } from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { ProblemCard } from '../components/ProblemCard'
import { isActive, shownStatus, sortProblems } from '../lib/problems'
import type { Problem, User } from '../types'

export type Scope = 'mine' | 'area' | 'all'
const STATUSES = ['active', 'open', 'overdue', 'fixed', 'closed', 'capex', 'all'] as const
type StatusFilter = (typeof STATUSES)[number]

export function defaultScope(me: User): Scope {
  if (me.role === 'employee') return 'mine'
  if (me.department === 'all' || me.department === 'oe') return 'all'
  return 'area'
}

/** Problem list. On tablets the selected problem opens beside the list (flipped in Arabic by the layout direction). */
export function ProblemsLayout() {
  const { data, user, location } = useData()
  const { t } = useI18n()
  const { userId } = useAppState()
  const [params, setParams] = useSearchParams()
  const detail = useMatch('/problems/:id')
  const me = user(userId)

  const scope = (params.get('scope') as Scope) ?? (me ? defaultScope(me) : 'all')
  const status = (params.get('status') as StatusFilter) ?? 'active'
  const safety = params.get('safety') === '1'
  const kind = params.get('kind')
  const area = params.get('area')
  const extra = (kind ? 1 : 0) + (area ? 1 : 0)
  // Condition/care and old/renovated sit behind "More filters" to keep the list near the top on phones.
  const [moreOpen, setMoreOpen] = useState(extra > 0)

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v === null) next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }

  const list = useMemo(() => {
    if (!data || !me) return []
    const keep = (p: Problem) => {
      if (scope === 'mine' && p.owner !== me.id) return false
      if (scope === 'area' && me.department !== 'all' && me.department !== 'oe'
        && location(p.location)?.department !== me.department) return false
      const s = shownStatus(p)
      if (status === 'active' && !isActive(p)) return false
      if (status !== 'active' && status !== 'all' && s !== status) return false
      if (safety && !p.safety) return false
      if (kind && p.kind !== kind) return false
      if (area && p.area !== area) return false
      return true
    }
    return sortProblems(data.problems.filter(keep))
  }, [data, me, scope, status, safety, kind, area, location])

  if (!data || !me) return null
  const qs = params.toString() ? `?${params}` : ''
  const statusLabel: Record<StatusFilter, string> = {
    active: t('filter.active'), open: t('status.open'), overdue: t('status.overdue'), fixed: t('status.fixed'),
    closed: t('status.closed'), capex: t('status.capex'), all: t('filter.allStatuses'),
  }

  return (
    <div className={`split ${detail ? 'has-detail' : ''}`}>
      <section className="split-list stack" aria-labelledby="problems-title">
        <div className="section-head">
          <h1 id="problems-title">{t('problems.title')}</h1>
        </div>
        <Link to="/problems/new" className="btn btn-primary btn-block"><Plus size={20} aria-hidden />{t('emp.report')}</Link>

        <div className="filter-bar" role="group" aria-label={t('filter.label')}>
          <div className="scope">
            {(['mine', 'area', 'all'] as Scope[]).map((s) => (
              <button key={s} type="button" aria-pressed={scope === s} onClick={() => set('scope', s)}>{t(`filter.${s}`)}</button>
            ))}
          </div>
          <div className="filter-chips">
            <label className="visually-hidden" htmlFor="status-filter">{t('filter.status')}</label>
            <select id="status-filter" className="select" value={status}
              onChange={(e) => set('status', e.target.value === 'active' ? null : e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
            </select>
            <button type="button" className="fchip" aria-pressed={safety} onClick={() => set('safety', safety ? null : '1')}>
              <AlertTriangle size={16} aria-hidden />{t('sum.safety')}
            </button>
            <button type="button" className="fchip" aria-expanded={moreOpen} aria-controls="more-filters"
              onClick={() => setMoreOpen(!moreOpen)}>
              {t('filter.more')}{extra > 0 && ` (${extra})`}
              <ChevronDown size={16} aria-hidden style={{ transform: moreOpen ? 'rotate(180deg)' : undefined }} />
            </button>
          </div>
          <div className="filter-chips" id="more-filters" hidden={!moreOpen}>
            <button type="button" className="fchip" aria-pressed={kind === 'condition'}
              onClick={() => set('kind', kind === 'condition' ? null : 'condition')}>
              <Building2 size={16} aria-hidden />{t('tag.condition')}
            </button>
            <button type="button" className="fchip" aria-pressed={kind === 'care'}
              onClick={() => set('kind', kind === 'care' ? null : 'care')}>
              <Sparkles size={16} aria-hidden />{t('tag.care')}
            </button>
            <button type="button" className="fchip" aria-pressed={area === 'old'}
              onClick={() => set('area', area === 'old' ? null : 'old')}>
              <History size={16} aria-hidden />{t('tag.old')}
            </button>
            <button type="button" className="fchip" aria-pressed={area === 'renovated'}
              onClick={() => set('area', area === 'renovated' ? null : 'renovated')}>
              <Sprout size={16} aria-hidden />{t('tag.renovated')}
            </button>
          </div>
        </div>

        <p className="muted small" aria-live="polite">{t('problems.count', { n: list.length })}</p>
        {list.length === 0 ? (
          <p className="card state-box muted">{t('state.empty')}</p>
        ) : (
          <ul className="list">
            {list.map((p) => (
              <li key={p.id}><ProblemCard p={p} to={`/problems/${p.id}${qs}`} selected={detail?.params.id === p.id} /></li>
            ))}
          </ul>
        )}
      </section>
      <div className="split-detail">
        <Outlet />
      </div>
    </div>
  )
}

/** Shown beside the list on tablets before a problem is picked. */
export function NoProblemSelected() {
  const { t } = useI18n()
  return (
    <div className="card state-box split-detail-empty">
      <MousePointerClick size={32} aria-hidden className="muted" />
      <p className="muted">{t('problems.pick')}</p>
    </div>
  )
}
