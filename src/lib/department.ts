import seed from '../data/seed.json'
import type { AppData } from '../data/DataContext'
import type { Location, Problem } from '../types'
import { addDays, dayKey, todayKey } from './dates'
import { isActive, shownStatus } from './problems'
import { teamChecklists } from './checklists'
import { totals } from './inspections'
import { summarise } from './summary'

export type Dept = 'recreation' | 'housekeeping'
const history = seed.leadershipHistory.weeks

const ageDays = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))

/** Age bands for open problems: how long they have been waiting. */
export const AGE_BANDS = [
  { key: '0-2', min: 0, max: 2 },
  { key: '3-7', min: 3, max: 7 },
  { key: '8-14', min: 8, max: 14 },
  { key: '15+', min: 15, max: Infinity },
] as const

export function ageing(list: Problem[]) {
  return AGE_BANDS.map((b) => ({
    key: b.key,
    n: list.filter((p) => { const a = ageDays(p.history[0].at); return a >= b.min && a <= b.max }).length,
  }))
}

/** Where problems cluster. Rooms count toward their building, so 576 rooms don't scatter the picture. */
export function hotspots(data: AppData, list: Problem[], top = 5) {
  const loc = (id: string) => data.locations.find((l) => l.id === id)
  const groups = new Map<string, { place: Location; n: number }>()
  for (const p of list) {
    const l = loc(p.location)
    if (!l) continue
    const place = (l.type === 'room' || l.type === 'corridor') && l.building ? loc(`building-${l.building}`) ?? l : l
    const g = groups.get(place.id) ?? { place, n: 0 }
    g.n++
    groups.set(place.id, g)
  }
  return [...groups.values()].sort((a, b) => b.n - a.n).slice(0, top)
}

/** Fixes marked done more than a day ago that nobody has confirmed yet. */
export function stuckChecks(list: Problem[]) {
  return list.filter((p) => {
    if (p.status !== 'fixed') return false
    const fixed = [...p.history].reverse().find((h) => h.action === 'fixed')
    return !!fixed && ageDays(fixed.at) >= 1
  })
}

/** The director's overview of one department (also opened by the GM and CEO). */
export function departmentView(data: AppData, dept: Dept) {
  const today = todayKey()
  const inDept = data.problems.filter((p) => data.locations.find((l) => l.id === p.location)?.department === dept)
  const active = inDept.filter(isActive)
  const slots = teamChecklists(dept, data)
  const weekAgo = dayKey(addDays(new Date(), -6))
  const runs = data.inspectionRuns.filter((r) => r.finishedAt && r.finishedAt.slice(0, 10) >= weekAgo
    && data.locations.find((l) => l.id === r.location)?.department === dept)
  const insp = runs.reduce((acc, r) => { const t = totals(r); return { items: acc.items + t.total, steps: acc.steps + t.stepsYes, good: acc.good + t.resultGood } }, { items: 0, steps: 0, good: 0 })
  const summary = summarise({ id: '', name: '', initials: '', role: 'head', department: dept, job: '' }, data)
  const weeks = history.map((w) => ({ start: dayKey(addDays(new Date(), w.week * 7 - 6)), ...w.byDept[dept] }))

  return {
    safety: active.filter((p) => p.safety),
    today: {
      total: slots.length,
      done: slots.filter((s) => s.state === 'done').length,
      inProgress: slots.filter((s) => s.state === 'in-progress').length,
      notStarted: slots.filter((s) => s.state === 'not-started'),
      sentBack: slots.filter((s) => s.state === 'sent-back'),
      waitingCheck: slots.filter((s) => s.state === 'done' && !s.run?.check).length,
      checked: slots.filter((s) => s.run?.check?.result === 'ok').length,
    },
    counts: {
      open: active.length,
      overdue: active.filter((p) => shownStatus(p, today) === 'overdue').length,
      waiting: active.filter((p) => p.status === 'fixed').length,
      capex: inDept.filter((p) => p.status === 'capex').length,
    },
    stuck: stuckChecks(active),
    ageing: ageing(active),
    hotspots: hotspots(data, active),
    byKind: {
      condition: active.filter((p) => p.kind === 'condition').length,
      care: active.filter((p) => p.kind === 'care').length,
      old: active.filter((p) => p.area === 'old').length,
      renovated: active.filter((p) => p.area === 'renovated').length,
    },
    repeats: summary.repeats,
    capex: inDept.filter((p) => p.status === 'capex'),
    weeks,
    liveOpen: active.length,
    liveOverdue: active.filter((p) => shownStatus(p, today) === 'overdue').length,
    inspections: {
      runs: runs.length,
      stepsIn10: insp.items ? Math.round((insp.steps / insp.items) * 100) / 10 : null,
      resultGoodIn10: insp.items ? Math.round((insp.good / insp.items) * 100) / 10 : null,
    },
  }
}
