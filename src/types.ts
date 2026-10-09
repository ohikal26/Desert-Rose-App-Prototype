export type Lang = 'en' | 'ar'
export type Role = 'employee' | 'supervisor' | 'auditor' | 'head' | 'gm'
export type Department = 'recreation' | 'housekeeping' | 'oe' | 'all'
export type Shift = 'morning' | 'evening' | 'night'
export type LocationType =
  | 'pool' | 'aquapark' | 'beach' | 'towel'
  | 'building' | 'corridor' | 'room' | 'hk-area'

export interface User {
  id: string
  name: string
  initials: string
  role: Role
  department: Department
  job: string
  locations?: string[]
}

export interface Location {
  id: string
  name: string // English; Arabic comes from ar.json
  department: 'recreation' | 'housekeeping'
  type: LocationType
  building?: number
  room?: number
  /** Old or renovated area. Recreation areas have no old/renovated split. */
  area: 'old' | 'renovated' | null
  qr: string
}

export interface TemplateItem { id: string; text: string }

export interface ChecklistTemplate {
  id: string
  department: 'recreation' | 'housekeeping'
  locationTypes: LocationType[]
  shift: Shift
  name: string
  items: TemplateItem[]
}

export interface InspectionTemplate {
  id: string
  department: 'recreation' | 'housekeeping'
  locationTypes: LocationType[]
  name: string
  items: TemplateItem[]
}

export interface ItemEntry {
  itemId: string
  done: boolean
  initials?: string
  at?: string // ISO time
  /** The demo user who was signed in when the item was ticked. */
  by?: string
  couldNotDo?: string
}

export interface SupervisorCheck {
  result: 'ok' | 'sent-back'
  note?: string
  photo?: string
  by: string
  at: string
}

export interface ChecklistRun {
  id: string
  template: string
  location: string
  date: string // YYYY-MM-DD
  shift: Shift
  entries: ItemEntry[]
  startedBy?: string
  submittedAt?: string
  check?: SupervisorCheck
  /** Earlier "send back" checks, kept when the checklist is sent again. */
  pastChecks?: SupervisorCheck[]
}

export type StepsMark = 'yes' | 'partly' | 'no'
export type ResultMark = 'good' | 'needs-work' | 'not-acceptable'

export interface InspectionEntry {
  itemId: string
  steps?: StepsMark
  result?: ResultMark
  photo?: string
  note?: string
  problemId?: string
}

export interface InspectionRun {
  id: string
  template: string
  location: string
  by: string
  startedAt: string
  finishedAt?: string
  entries: InspectionEntry[]
}

/** Stored status. "Overdue" is never stored: it is worked out from the due date. */
export type ProblemStatus = 'open' | 'fixed' | 'closed' | 'capex'
export type ShownStatus = ProblemStatus | 'overdue'
export type ProblemKind = 'condition' | 'care'

export interface HistoryEntry {
  action: 'created' | 'assigned' | 'fixed' | 'confirmed' | 'reopened' | 'capex' | 'note'
  by: string
  at: string
  note?: string
  /** For 'assigned': the new owner. */
  to?: string
  /** For 'assigned': the new due date, when it changed. */
  due?: string
}

export interface Problem {
  id: string
  title: string
  /** Set for seed problems so the title shows in Arabic too. */
  titleKey?: string
  location: string
  photo?: string
  kind: ProblemKind
  area: 'old' | 'renovated' | null
  safety: boolean
  interim?: string
  interimKey?: string
  owner: string
  due: string // YYYY-MM-DD
  status: ProblemStatus
  source: 'checklist' | 'inspection' | 'reported'
  sourceItem?: string
  history: HistoryEntry[]
}
