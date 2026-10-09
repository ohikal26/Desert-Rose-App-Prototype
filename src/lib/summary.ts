import type { AppData } from '../data/DataContext'
import type { Problem, User } from '../types'
import { addDays, dayKey, todayKey } from './dates'
import { isActive, shownStatus } from './problems'
import { runState } from './checklists'

export interface Summary {
  scope: 'all' | 'recreation' | 'housekeeping'
  open: number
  overdue: number
  safety: number
  fixedWaiting: number
  closedOnTimeWeek: number
  closedLateWeek: number
  capex: number
  repeats: { title: string; titleKey?: string; location: string; count: number; ids: string[] }[]
  byArea: { area: 'old' | 'renovated' | 'none'; condition: number; care: number }[]
  checklistsToday: number
  checklistsDoneToday: number
  checklistsSentBackToday: number
}

/** The one-page summary (brief 7.5), for one department or the whole resort. */
export function summarise(me: User, data: AppData): Summary {
  const scope = me.department === 'recreation' || me.department === 'housekeeping' ? me.department : 'all'
  const dept = (p: Problem) => data.locations.find((l) => l.id === p.location)?.department
  const inScope = data.problems.filter((p) => scope === 'all' || dept(p) === scope)
  const today = todayKey()
  const weekAgo = dayKey(addDays(new Date(), -7))
  const active = inScope.filter(isActive)

  // Closed this week: on time if the confirm came on or before the due date.
  let closedOnTimeWeek = 0
  let closedLateWeek = 0
  for (const p of inScope.filter((x) => x.status === 'closed')) {
    const confirmed = [...p.history].reverse().find((h) => h.action === 'confirmed')
    if (!confirmed || confirmed.at.slice(0, 10) < weekAgo) continue
    if (confirmed.at.slice(0, 10) <= p.due) closedOnTimeWeek++
    else closedLateWeek++
  }

  // Repeats: the same item (by title) at the same place twice in 30 days.
  const monthAgo = dayKey(addDays(new Date(), -30))
  const groups = new Map<string, Problem[]>()
  for (const p of inScope) {
    if (p.history[0].at.slice(0, 10) < monthAgo) continue
    const key = `${p.location}|${p.title.trim().toLowerCase()}`
    groups.set(key, [...(groups.get(key) ?? []), p])
  }
  const repeats = [...groups.values()].filter((g) => g.length > 1)
    .map((g) => ({ title: g[0].title, titleKey: g[0].titleKey, location: g[0].location, count: g.length, ids: g.map((p) => p.id) }))

  const byArea = (['old', 'renovated', 'none'] as const).map((area) => {
    const list = active.filter((p) => (p.area ?? 'none') === area)
    return { area, condition: list.filter((p) => p.kind === 'condition').length, care: list.filter((p) => p.kind === 'care').length }
  }).filter((x) => x.condition + x.care > 0 || x.area !== 'none')

  const runsToday = data.checklistRuns.filter((r) => r.date === today
    && (scope === 'all' || data.locations.find((l) => l.id === r.location)?.department === scope))

  return {
    scope,
    open: active.length,
    overdue: active.filter((p) => shownStatus(p, today) === 'overdue').length,
    safety: active.filter((p) => p.safety).length,
    fixedWaiting: inScope.filter((p) => p.status === 'fixed').length,
    closedOnTimeWeek, closedLateWeek,
    capex: inScope.filter((p) => p.status === 'capex').length,
    repeats,
    byArea,
    checklistsToday: runsToday.length,
    checklistsDoneToday: runsToday.filter((r) => runState(r) === 'done').length,
    checklistsSentBackToday: runsToday.filter((r) => runState(r) === 'sent-back' || (r.pastChecks?.length ?? 0) > 0).length,
  }
}
