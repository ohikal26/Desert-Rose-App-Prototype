// Excellence Gateway: demo KPI data shaped like Desert Rose's OKR report, plus helpers.
import gw from '../data/gateway.json'

export type Status = 'met' | 'close' | 'behind' | 'at-risk'
export type Perspective = 'finance' | 'guest' | 'operations' | 'people'
export const PERSPECTIVES: Perspective[] = ['finance', 'guest', 'operations', 'people']

export interface KeyResult {
  id: string
  name: string
  actual: number
  target: number
  unit: string
  better: 'higher' | 'lower'
  achievement: number
  status: Status
  source?: string
  /** Proposed for the incentive scorecard (a draft for leadership to decide). */
  scorecard?: boolean
  /** Shared by several departments (for example water use, or Booking.com rating). */
  shared?: boolean
  note?: string
  monthly?: number[]
}

export interface Concern {
  id: string
  day: number
  platform: string
  text: string
  location: string
  kind: 'condition' | 'care'
}

export interface GwDepartment {
  id: string
  name: string
  director: string
  overall: number
  perspectives: Record<Perspective, number | null>
  keyResults?: Partial<Record<Perspective | 'finance', KeyResult[]>>
  concerns?: Concern[]
  concernCounts?: { yesterday: number; mtd: number }
  inApp?: boolean
  topIssue?: string
}

export interface Platform {
  id: string
  name: string
  integrity: 'own-guests' | 'booking-required' | 'open'
  score: number
  target: number
  unit: string
  volume: number
  volumeTarget?: number
  scorecard: boolean
  monthly?: number[]
}

export const gateway = gw as unknown as {
  months: string[]
  periodLabel: string
  resort: {
    overall: number
    perspectives: Record<Perspective, number>
    headline: KeyResult[]
    guest: KeyResult[]
    operations: KeyResult[]
    people: KeyResult[]
  }
  departments: GwDepartment[]
  platforms: Platform[]
}

export const dept = (id: string) => gateway.departments.find((d) => d.id === id)

/** All key results for a department, worst first: at risk, behind, close, met. */
const ORDER: Status[] = ['at-risk', 'behind', 'close', 'met']
export function byStatus(list: KeyResult[]): KeyResult[] {
  return [...list].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.achievement - b.achievement)
}

export function allKeyResults(d: GwDepartment): KeyResult[] {
  return PERSPECTIVES.flatMap((p) => d.keyResults?.[p] ?? [])
}

export function resortKeyResults(): KeyResult[] {
  const r = gateway.resort
  return [...r.headline, ...r.guest, ...r.operations, ...r.people]
}

/** Score to status, for perspective and overall scores (same rule as key results). */
export function scoreStatus(score: number): Status {
  return score >= 100 ? 'met' : score >= 95 ? 'close' : score >= 85 ? 'behind' : 'at-risk'
}

/** Departments that roles in the OE app belong to. */
export const APP_DEPTS = ['recreation', 'housekeeping'] as const

/** Who can open the Gateway: leaders and the OE team, not line staff (it shows money). */
export const GATEWAY_ROLES = ['head', 'director', 'gm', 'ceo', 'owner', 'auditor']
