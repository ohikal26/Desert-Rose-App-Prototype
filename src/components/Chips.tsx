import {
  AlertTriangle, Archive, BadgeCheck, Building2, Circle, CircleDot, CircleCheck, Clock, Sparkles,
  Undo2, Wrench, History, Sprout,
} from 'lucide-react'
import type { ShownStatus } from '../types'
import { useI18n } from '../i18n/I18n'

const PROBLEM_CHIP: Record<ShownStatus, { cls: string; icon: typeof Circle; key: string }> = {
  open: { cls: 'chip-teal', icon: Circle, key: 'status.open' },
  overdue: { cls: 'chip-critical', icon: Clock, key: 'status.overdue' },
  fixed: { cls: 'chip-warning', icon: Wrench, key: 'status.fixed' },
  closed: { cls: 'chip-good', icon: BadgeCheck, key: 'status.closed' },
  capex: { cls: 'chip-neutral', icon: Archive, key: 'status.capex' },
}

export function ProblemStatusChip({ status }: { status: ShownStatus }) {
  const { t } = useI18n()
  const c = PROBLEM_CHIP[status]
  const Icon = c.icon
  return <span className={`chip ${c.cls}`}><Icon size={16} aria-hidden />{t(c.key)}</span>
}

export type RunState = 'done' | 'in-progress' | 'not-started' | 'sent-back'

const RUN_CHIP = {
  done: { cls: 'chip-good', icon: CircleCheck, key: 'sup.done' },
  'in-progress': { cls: 'chip-teal', icon: CircleDot, key: 'sup.inProgress' },
  'not-started': { cls: 'chip-neutral', icon: Circle, key: 'sup.notStarted' },
  'sent-back': { cls: 'chip-warning', icon: Undo2, key: 'sup.sentBack' },
} as const

export function RunStateChip({ state }: { state: RunState }) {
  const { t } = useI18n()
  const c = RUN_CHIP[state]
  const Icon = c.icon
  return <span className={`chip ${c.cls}`}><Icon size={16} aria-hidden />{t(c.key)}</span>
}

export const RUN_ICON = { done: CircleCheck, 'in-progress': CircleDot, 'not-started': Circle, 'sent-back': Undo2 }

export function SafetyChip() {
  const { t } = useI18n()
  return <span className="chip chip-safety"><AlertTriangle size={16} aria-hidden />{t('sum.safety')}</span>
}

export function KindTag({ kind }: { kind: 'condition' | 'care' }) {
  const { t } = useI18n()
  const Icon = kind === 'condition' ? Building2 : Sparkles
  return <span className="tag"><Icon size={14} aria-hidden />{t(kind === 'condition' ? 'tag.condition' : 'tag.care')}</span>
}

export function AreaTag({ area }: { area: 'old' | 'renovated' | null }) {
  const { t } = useI18n()
  if (!area) return null
  const Icon = area === 'old' ? History : Sprout
  return <span className="tag"><Icon size={14} aria-hidden />{t(area === 'old' ? 'tag.old' : 'tag.renovated')}</span>
}
