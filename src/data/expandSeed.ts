// Turns the readable seed file into the records the app stores.
import seed from './seed.json'
import type {
  ChecklistRun, ChecklistTemplate, InspectionTemplate, Location, Problem, User, HistoryEntry,
} from '../types'
import { addDays, dayKey } from '../lib/dates'

export interface SeedData {
  users: User[]
  locations: Location[]
  checklistTemplates: ChecklistTemplate[]
  inspectionTemplates: InspectionTemplate[]
  checklistRuns: ChecklistRun[]
  problems: Problem[]
}

function atHour(day: number, hour: number, minute = 0): string {
  const d = addDays(new Date(), day)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function buildLocations(): Location[] {
  const out: Location[] = []
  for (const l of seed.recreationLocations) {
    out.push({ ...l, department: 'recreation', type: l.type as Location['type'], area: null, qr: `DR-LOC:${l.id}` })
  }
  const hk = seed.housekeeping
  for (const b of hk.buildings) {
    const area = hk.oldBuildings.includes(b) ? 'old' : 'renovated'
    out.push({ id: `building-${b}`, name: `Building ${b}`, department: 'housekeeping', type: 'building', building: b, area, qr: `DR-LOC:building-${b}` })
    out.push({ id: `corridor-${b}`, name: `Building ${b} corridor`, department: 'housekeeping', type: 'corridor', building: b, area, qr: `DR-LOC:corridor-${b}` })
    for (const f of hk.floors) {
      for (let r = 1; r <= hk.roomsPerFloor; r++) {
        const n = b + f * 100 + r
        out.push({ id: `room-${n}`, name: `Room ${n}`, department: 'housekeeping', type: 'room', building: b, room: n, area, qr: `DR-LOC:room-${n}` })
      }
    }
  }
  for (const l of hk.otherLocations) {
    out.push({ id: l.id, name: l.name, department: 'housekeeping', type: l.type as Location['type'], area: l.old ? 'old' : 'renovated', qr: `DR-LOC:${l.id}` })
  }
  return out
}

export function expandSeed(): SeedData {
  const users = seed.users as User[]
  const locations = buildLocations()
  const locById = new Map(locations.map((l) => [l.id, l]))
  const checklistTemplates = seed.checklistTemplates as ChecklistTemplate[]
  const tplById = new Map(checklistTemplates.map((t) => [t.id, t]))
  const userById = new Map(users.map((u) => [u.id, u]))

  const checklistRuns: ChecklistRun[] = seed.checklistRuns.map((r) => {
    const tpl = tplById.get(r.template)!
    // Pick a demo person from the right team to have ticked the items.
    const doer = users.find((u) => u.role === 'employee' && u.department === tpl.department)!
    const entries = tpl.items.map((it, i) =>
      i < r.doneItems
        ? { itemId: it.id, done: true, initials: doer.initials, at: atHour(r.day, 6, 30 + i * 4) }
        : { itemId: it.id, done: false })
    const run: ChecklistRun = {
      id: r.id, template: r.template, location: r.location,
      date: dayKey(addDays(new Date(), r.day)), shift: tpl.shift, entries,
    }
    if (r.submittedHour !== undefined) run.submittedAt = atHour(r.day, r.submittedHour)
    if (r.state === 'sent-back') {
      run.check = { result: 'sent-back', note: r.sendBackNote, by: r.by, at: atHour(r.day, (r.submittedHour ?? 8) + 1) }
    }
    return run
  })

  const problems: Problem[] = seed.problems.map((p) => {
    const loc = locById.get(p.location)
    if (!loc) throw new Error(`Seed problem ${p.id}: unknown location ${p.location}`)
    const created = atHour(p.createdDay, 9, 15)
    const history: HistoryEntry[] = [
      { action: 'created', by: p.createdBy, at: created },
      { action: 'assigned', by: p.createdBy, at: created, to: p.owner },
    ]
    if (p.fixedDay !== undefined) history.push({ action: 'fixed', by: p.owner, at: atHour(p.fixedDay, 14) })
    if (p.confirmedBy) history.push({ action: 'confirmed', by: p.confirmedBy, at: atHour(p.confirmedDay ?? 0, 16) })
    if (p.status === 'capex') history.push({ action: 'capex', by: userById.get(p.owner)!.id, at: atHour(p.createdDay + 1, 11) })
    return {
      id: p.id, title: p.title, titleKey: `prob.${p.id}`, location: p.location,
      kind: p.kind as Problem['kind'], area: loc.area, safety: !!p.safety,
      interim: p.interim, interimKey: p.interim ? `interim.${p.id}` : undefined,
      owner: p.owner, due: dayKey(addDays(new Date(), p.dueDay)),
      status: p.status as Problem['status'], source: p.source as Problem['source'], history,
    }
  })

  return {
    users, locations, checklistTemplates,
    inspectionTemplates: seed.inspectionTemplates as InspectionTemplate[],
    checklistRuns, problems,
  }
}
