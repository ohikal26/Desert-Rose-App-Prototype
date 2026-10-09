import type { ChecklistRun, ChecklistTemplate, Location, User } from '../types'
import type { AppData } from '../data/DataContext'
import type { RunState } from '../components/Chips'
import { todayKey } from './dates'

export interface ChecklistSlot {
  location: Location
  template: ChecklistTemplate
  run?: ChecklistRun
  state: RunState
}

export function templatesFor(loc: Location, templates: ChecklistTemplate[]): ChecklistTemplate[] {
  return templates.filter((t) => t.department === loc.department && t.locationTypes.includes(loc.type))
}

/** Checklists never get a score: only done or not done (rule 1). */
export function runState(run?: ChecklistRun): RunState {
  if (!run) return 'not-started'
  if (run.check?.result === 'sent-back') return 'sent-back'
  if (run.submittedAt) return 'done'
  return 'in-progress'
}

function slot(loc: Location, tpl: ChecklistTemplate, runs: ChecklistRun[], today: string): ChecklistSlot {
  const run = runs.find((r) => r.location === loc.id && r.template === tpl.id && r.date === today)
  return { location: loc, template: tpl, run, state: runState(run) }
}

export function myChecklists(user: User, data: AppData): ChecklistSlot[] {
  const today = todayKey()
  const out: ChecklistSlot[] = []
  for (const id of user.locations ?? []) {
    const loc = data.locations.find((l) => l.id === id)
    if (!loc) continue
    for (const tpl of templatesFor(loc, data.checklistTemplates)) out.push(slot(loc, tpl, data.checklistRuns, today))
  }
  return out
}

/**
 * Today's checklists a supervisor looks after: every recreation area, or for
 * housekeeping the areas staff are assigned to plus anything already started today.
 */
export function teamChecklists(department: 'recreation' | 'housekeeping', data: AppData): ChecklistSlot[] {
  const today = todayKey()
  const ids = new Set<string>()
  if (department === 'recreation') {
    data.locations.filter((l) => l.department === 'recreation').forEach((l) => ids.add(l.id))
  } else {
    data.users.filter((u) => u.department === department).forEach((u) => u.locations?.forEach((id) => ids.add(id)))
    data.locations.filter((l) => l.type === 'hk-area').forEach((l) => ids.add(l.id))
  }
  data.checklistRuns.filter((r) => r.date === today).forEach((r) => ids.add(r.location))
  const out: ChecklistSlot[] = []
  for (const id of ids) {
    const loc = data.locations.find((l) => l.id === id)
    if (!loc || loc.department !== department) continue
    for (const tpl of templatesFor(loc, data.checklistTemplates)) out.push(slot(loc, tpl, data.checklistRuns, today))
  }
  return out
}
