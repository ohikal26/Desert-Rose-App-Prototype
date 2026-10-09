import seed from '../data/seed.json'
import type { AppData } from '../data/DataContext'
import type { Problem } from '../types'
import { addDays, dayKey, todayKey } from './dates'
import { isActive, shownStatus } from './problems'
import { runState } from './checklists'
import { totals } from './inspections'

export interface Week {
  /** First day of the 7-day week, counting back from today. */
  start: string
  open: number
  overdue: number
  safetyOpen: number
  closed?: number
  closedOnTime?: number
  stepsIn10?: number
  resultGoodIn10?: number
  oldPer100: number
  renovatedPer100: number
  live?: boolean
}

const history = seed.leadershipHistory.weeks
const ROOMS_PER_BUILDING = seed.housekeeping.floors.length * seed.housekeeping.roomsPerFloor
const OLD_ROOMS = seed.housekeeping.oldBuildings.length * ROOMS_PER_BUILDING
const RENOVATED_ROOMS = (seed.housekeeping.buildings.length - seed.housekeeping.oldBuildings.length) * ROOMS_PER_BUILDING

const deptOf = (data: AppData, p: Problem) => data.locations.find((l) => l.id === p.location)?.department
const ageDays = (p: Problem) =>
  Math.max(0, Math.round((Date.now() - new Date(p.history[0].at).getTime()) / 86_400_000))

/** Past weeks come from the seed; this week is worked out live from the data in the app. */
export function weeklySeries(data: AppData): Week[] {
  const today = todayKey()
  const active = data.problems.filter(isActive)
  const rooms = (area: 'old' | 'renovated') =>
    active.filter((p) => p.area === area && data.locations.find((l) => l.id === p.location)?.type === 'room').length
  const now: Week = {
    start: dayKey(addDays(new Date(), -6)),
    open: active.length,
    overdue: active.filter((p) => shownStatus(p, today) === 'overdue').length,
    safetyOpen: active.filter((p) => p.safety).length,
    oldPer100: round1((rooms('old') / OLD_ROOMS) * 100),
    renovatedPer100: round1((rooms('renovated') / RENOVATED_ROOMS) * 100),
    live: true,
  }
  const past: Week[] = history.map((w) => ({ ...w, start: dayKey(addDays(new Date(), w.week * 7 - 6)) }))
  return [...past, now]
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Inspection marks finished this week, as "x in 10 items". Null when there are none yet. */
export function inspectionsThisWeek(data: AppData) {
  const since = dayKey(addDays(new Date(), -6))
  const runs = data.inspectionRuns.filter((r) => r.finishedAt && r.finishedAt.slice(0, 10) >= since)
  if (!runs.length) return null
  let items = 0, steps = 0, good = 0
  for (const r of runs) {
    const t = totals(r)
    items += t.total; steps += t.stepsYes; good += t.resultGood
  }
  return { runs: runs.length, stepsIn10: round1((steps / items) * 10), resultGoodIn10: round1((good / items) * 10) }
}

/** What the GM looks at every morning. */
export function gmView(data: AppData) {
  const today = todayKey()
  const active = data.problems.filter(isActive)
  const depts = ['recreation', 'housekeeping'] as const
  const runsToday = data.checklistRuns.filter((r) => r.date === today)
  return {
    safety: active.filter((p) => p.safety).sort((a, b) => ageDays(b) - ageDays(a)).map((p) => ({ p, days: ageDays(p) })),
    byDept: depts.map((d) => {
      const list = active.filter((p) => deptOf(data, p) === d)
      const runs = runsToday.filter((r) => data.locations.find((l) => l.id === r.location)?.department === d)
      return {
        dept: d,
        open: list.length,
        overdue: list.filter((p) => shownStatus(p, today) === 'overdue').length,
        waiting: list.filter((p) => p.status === 'fixed').length,
        done: runs.filter((r) => runState(r) === 'done').length,
        inProgress: runs.filter((r) => runState(r) === 'in-progress').length,
        sentBack: runs.filter((r) => runState(r) === 'sent-back').length,
      }
    }),
    push: active.filter((p) => shownStatus(p, today) === 'overdue').sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5),
  }
}

/** What the CEO glances at daily: exceptions, plus the weekly trend. */
export function ceoView(data: AppData) {
  const weeks = weeklySeries(data)
  const now = weeks[weeks.length - 1]
  const last = weeks[weeks.length - 2]
  const first = weeks[0]
  const active = data.problems.filter(isActive)
  const lastFull = history[history.length - 1]
  // Exceptions: safety open more than 2 days, or overdue by more than 7 days.
  const today = todayKey()
  const weekAgo = dayKey(addDays(new Date(), -7))
  const exceptions = active.filter((p) => (p.safety && ageDays(p) > 2) || (shownStatus(p, today) === 'overdue' && p.due < weekAgo))
  return {
    weeks, now, last, first,
    closedLastWeek: { onTime: lastFull.closedOnTime, total: lastFull.closed },
    condition: active.filter((p) => p.kind === 'condition').length,
    care: active.filter((p) => p.kind === 'care').length,
    exceptions,
    inspections: { firstWeek: history[0], lastWeek: lastFull, thisWeek: inspectionsThisWeek(data) },
  }
}

/** What the owner looks at weekly: safety, the capex list, and whether renovated areas hold up. */
export function ownerView(data: AppData) {
  const weeks = weeklySeries(data)
  const capex = data.problems.filter((p) => p.status === 'capex')
  const byBuilding = new Map<string, Problem[]>()
  for (const p of capex) {
    const loc = data.locations.find((l) => l.id === p.location)
    const key = loc?.building ? String(loc.building) : loc?.id ?? 'other'
    byBuilding.set(key, [...(byBuilding.get(key) ?? []), p])
  }
  const active = data.problems.filter(isActive)
  return {
    weeks,
    safety: active.filter((p) => p.safety).map((p) => ({ p, days: ageDays(p) })),
    capex: [...byBuilding.entries()].map(([b, list]) => ({ building: b, list: list.sort((x, y) => x.history[0].at.localeCompare(y.history[0].at)) }))
      .sort((a, b) => b.list.length - a.list.length),
    capexNewThisWeek: capex.filter((p) => ageDays(p) <= 7).length,
    firstWeek: history[0], lastWeek: history[history.length - 1],
  }
}

export { ageDays }
