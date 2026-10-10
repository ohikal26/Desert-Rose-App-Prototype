import { CircleCheck, CircleDot, Clock, TriangleAlert, Award } from 'lucide-react'
import { useI18n } from '../i18n/I18n'
import type { KeyResult, Status } from '../lib/gateway'

const STATUS = {
  met: { cls: 'chip-good', icon: CircleCheck, key: 'gw.status.met' },
  close: { cls: 'chip-teal', icon: CircleDot, key: 'gw.status.close' },
  behind: { cls: 'chip-warning', icon: Clock, key: 'gw.status.behind' },
  'at-risk': { cls: 'chip-critical', icon: TriangleAlert, key: 'gw.status.at-risk' },
} as const

export function StatusChip({ status }: { status: Status }) {
  const { t } = useI18n()
  const s = STATUS[status]
  return <span className={`chip ${s.cls}`}><s.icon size={16} aria-hidden />{t(s.key)}</span>
}

/** A number with its unit, kept in reading order inside Arabic text (so 100% never shows as %100). */
export function Num({ children }: { children: string }) {
  return <bdi dir={/[\u0600-\u06FF]/.test(children) ? 'rtl' : 'ltr'}>{children}</bdi>
}

/** Formats a value with its unit, in Western digits, in both languages. */
export function useFormat() {
  const { t, lang } = useI18n()
  const nf = (v: number, max = 2) =>
    new Intl.NumberFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { maximumFractionDigits: max }).format(v)
  return (v: number, unit: string) => {
    switch (unit) {
      case '%': return `${nf(v, 2)}%`
      case '/10': case '/5': case '/6': return `${nf(v, 2)}${unit}`
      case 'mEGP': return t('gw.unit.mEGP', { v: nf(v, 1) })
      case 'EGP': return t('gw.unit.EGP', { v: nf(v, 1) })
      case 'm3': return t('gw.unit.m3', { v: nf(v, 2) })
      case 'kWh': return t('gw.unit.kWh', { v: nf(v, 1) })
      case 'nps': return nf(v, 1)
      default: return nf(v, 1)
    }
  }
}

/** The key result's own name, in the reader's language. */
export function useKrName() {
  const { c } = useI18n()
  return (k: KeyResult) => c(`gw.kr.${k.id}`, k.name)
}

/**
 * One key result: name, actual against target, a bar for achievement, and a status chip
 * (word + icon + colour). The bar is the share of target reached, capped at 100%.
 */
export function KrRow({ k, compact }: { k: KeyResult; compact?: boolean }) {
  const { t, c } = useI18n()
  const fmt = useFormat()
  const name = useKrName()
  const limit = k.better === 'lower'
  return (
    <li className={`kr ${compact ? 'kr-compact' : ''}`}>
      <div className="kr-head">
        <span className="kr-name">{name(k)}</span>
        <StatusChip status={k.status} />
      </div>
      <div className="kr-values small">
        <span><strong><Num>{fmt(k.actual, k.unit)}</Num></strong></span>
        <span className="muted">{t(limit ? 'gw.limit' : 'gw.target')}: <Num>{fmt(k.target, k.unit)}</Num></span>
        <span className="muted">{t('gw.achievement', { n: k.achievement })}</span>
        {k.scorecard && <span className="kr-flag"><Award size={14} aria-hidden />{t('gw.inScorecard')}</span>}
      </div>
      <div className="kr-bar" role="img" aria-label={t('gw.achievement', { n: k.achievement })}>
        <span className={`kr-fill is-${k.status}`} style={{ width: `${Math.min(100, k.achievement)}%` }} />
      </div>
      {!compact && k.note && <p className="small muted">{c(`gw.note.${k.id}`, k.note)}</p>}
    </li>
  )
}

/** A big score against 100%, with a status chip. */
export function ScoreTile({ label, score, to, Icon }: { label: string; score: number | null; to?: string; Icon?: typeof Award }) {
  const { t } = useI18n()
  const status: Status = score === null ? 'met' : score >= 100 ? 'met' : score >= 95 ? 'close' : score >= 85 ? 'behind' : 'at-risk'
  const body = (
    <>
      {Icon && <span className="tile-icon"><Icon size={18} aria-hidden /></span>}
      <span className="tile-number"><Num>{score === null ? '—' : `${score}%`}</Num></span>
      <span className="tile-label">{label}</span>
      {score !== null ? <StatusChip status={status} /> : <span className="small muted">{t('gw.noKrs')}</span>}
    </>
  )
  return to ? <a href={`#${to}`} className="tile gw-tile">{body}</a> : <div className="tile gw-tile">{body}</div>
}
