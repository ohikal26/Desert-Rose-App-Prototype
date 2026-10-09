import type { Problem, ShownStatus } from '../types'
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
  const rank = (p: Problem) => (p.safety && isActive(p) ? 0 : 1) * 10 + (shownStatus(p, today) === 'overdue' ? 0 : 1)
  return [...list].sort((a, b) => rank(a) - rank(b) || a.due.localeCompare(b.due))
}
