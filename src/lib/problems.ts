import type { Location, Problem, ShownStatus, User } from '../types'
import { todayKey } from './dates'

/** Overdue is automatic: an open problem past its due date (rule 7). */
export function shownStatus(p: Problem, today = todayKey()): ShownStatus {
  if (p.status === 'open' && p.due < today) return 'overdue'
  return p.status
}

/** Counts toward the team's open work. Capex and closed problems leave the count (rule 6). */
export function isActive(p: Problem): boolean {
  return p.status === 'open' || p.status === 'fixed'
}

/** Safety first, then overdue, then by due date (rule 9). */
export function sortProblems(list: Problem[]): Problem[] {
  const today = todayKey()
  const rank = (p: Problem) =>
    (p.safety && isActive(p) ? 0 : 2) + (shownStatus(p, today) === 'overdue' ? 0 : 1) + (isActive(p) ? 0 : 4)
  return [...list].sort((a, b) => rank(a) - rank(b) || a.due.localeCompare(b.due))
}

/** The person who last marked it fixed. */
export function fixerOf(p: Problem): string | undefined {
  return [...p.history].reverse().find((h) => h.action === 'fixed')?.by
}

export type Verdict = { ok: true } | { ok: false; reason: 'self-fix' | 'role' | 'team' }

const MANAGERS = ['supervisor', 'head', 'gm', 'auditor']

function sameArea(me: User, loc?: Location): boolean {
  return me.department === 'all' || me.department === 'oe' || me.department === loc?.department
}

/**
 * Rule 8: the person who fixed a problem (or owns it) cannot confirm it.
 * Someone else, a supervisor, manager or auditor for that area, must do it.
 */
export function canConfirm(p: Problem, me: User, loc?: Location): Verdict {
  if (fixerOf(p) === me.id || p.owner === me.id) return { ok: false, reason: 'self-fix' }
  if (!MANAGERS.includes(me.role)) return { ok: false, reason: 'role' }
  if (!sameArea(me, loc)) return { ok: false, reason: 'team' }
  return { ok: true }
}

/** The owner marks their own problem fixed. */
export function canMarkFixed(p: Problem, me: User): boolean {
  return p.status === 'open' && p.owner === me.id
}

/** Supervisors, managers and auditors assign owners and due dates. */
export function canAssign(p: Problem, me: User, loc?: Location): boolean {
  return isActive(p) && MANAGERS.includes(me.role) && sameArea(me, loc)
}

/** Rule 6: only condition problems in an old area can go to the capex list. */
export function capexAllowed(p: Problem): boolean {
  return p.kind === 'condition' && p.area === 'old'
}
export function canSendToCapex(p: Problem, me: User, loc?: Location): boolean {
  return isActive(p) && capexAllowed(p) && MANAGERS.includes(me.role) && sameArea(me, loc)
}

/** Problems waiting on this person: theirs to fix, or fixes for them to confirm. Used for the in-app badge. */
export function needsMe(p: Problem, me: User, loc?: Location): boolean {
  if (p.status === 'open' && p.owner === me.id) return true
  if (p.status === 'fixed' && canConfirm(p, me, loc).ok && me.role !== 'auditor') return true
  return false
}
