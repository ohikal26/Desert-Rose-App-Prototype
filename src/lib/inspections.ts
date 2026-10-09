import type { InspectionRun, InspectionTemplate, Location } from '../types'
import { newId } from './checklists'

export function inspectionTemplatesFor(loc: Location, templates: InspectionTemplate[]): InspectionTemplate[] {
  return templates.filter((t) => t.department === loc.department && t.locationTypes.includes(loc.type))
}

export function newInspection(loc: Location, tpl: InspectionTemplate, by: string): InspectionRun {
  return {
    id: newId('insp'), template: tpl.id, location: loc.id, by, startedAt: new Date().toISOString(),
    entries: tpl.items.map((i) => ({ itemId: i.id })),
  }
}

/** The two totals, kept apart (rule 4): steps followed and result good. Never merged. */
export function totals(run: InspectionRun) {
  const marked = run.entries.filter((e) => e.steps && e.result)
  return {
    marked: marked.length,
    total: run.entries.length,
    stepsYes: run.entries.filter((e) => e.steps === 'yes').length,
    stepsPartly: run.entries.filter((e) => e.steps === 'partly').length,
    stepsNo: run.entries.filter((e) => e.steps === 'no').length,
    resultGood: run.entries.filter((e) => e.result === 'good').length,
    resultNeedsWork: run.entries.filter((e) => e.result === 'needs-work').length,
    resultBad: run.entries.filter((e) => e.result === 'not-acceptable').length,
  }
}

export function isComplete(run: InspectionRun): boolean {
  return run.entries.every((e) => e.steps && e.result)
}
