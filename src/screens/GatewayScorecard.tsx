import { Ban, CircleCheck, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18n'
import { KrRow } from '../components/Kpi'
import { allKeyResults, gateway, resortKeyResults } from '../lib/gateway'
import { GatewayFrame } from './Gateway'

const RULES = ['outcome', 'integrity', 'team', 'few'] as const
const NEVER = ['reported', 'checklists', 'inspections', 'people', 'speed'] as const

/**
 * Draft incentive scorecard: which key results could later count towards bonuses.
 * A proposal for leadership to decide. No money and no individuals on this page.
 */
export function GatewayScorecard() {
  const { t, c } = useI18n()
  const resort = resortKeyResults().filter((k) => k.scorecard)
  const depts = gateway.departments.filter((d) => d.keyResults)
  return (
    <GatewayFrame>
      <h1>{t('gw.scorecardTitle')}</h1>
      <p className="banner banner-warning small"><FileText size={18} aria-hidden /><span>{t('gw.scorecardDraft')}</span></p>

      <section className="card stack-sm" aria-labelledby="gs-rules">
        <h2 id="gs-rules" className="section-title">{t('gw.rulesTitle')}</h2>
        <ul className="stack-sm">
          {RULES.map((r) => <li key={r} className="gw-rule"><CircleCheck size={18} aria-hidden className="text-good" /><span>{t(`gw.rule.${r}`)}</span></li>)}
        </ul>
      </section>

      <section className="stack-sm" aria-labelledby="gs-resort">
        <h2 id="gs-resort" className="section-title">{t('gw.scorecardResort')}</h2>
        <ul className="kr-list kr-grid">{resort.map((k) => <KrRow key={k.id} k={k} compact />)}</ul>
      </section>

      {depts.map((d) => {
        const list = allKeyResults(d).filter((k) => k.scorecard && !resort.some((r) => r.id === k.id))
        return (
          <section key={d.id} className="stack-sm" aria-labelledby={`gs-${d.id}`}>
            <div className="section-head">
              <h2 id={`gs-${d.id}`} className="section-title">{c(`gw.dept.${d.id}`, d.name)}</h2>
              <Link to={`/gateway/dept/${d.id}`} className="btn-text small">{t('gw.openBriefing')}</Link>
            </div>
            <ul className="kr-list kr-grid">{list.map((k) => <KrRow key={k.id} k={k} compact />)}</ul>
          </section>
        )
      })}
      <p className="small muted">{t('gw.scorecardOthers')}</p>

      <section className="card stack-sm gw-never" aria-labelledby="gs-never">
        <h2 id="gs-never" className="section-title row-inline"><Ban size={20} aria-hidden />{t('gw.neverTitle')}</h2>
        <p className="small">{t('gw.neverHint')}</p>
        <ul className="stack-sm">
          {NEVER.map((r) => <li key={r} className="gw-rule"><Ban size={18} aria-hidden className="text-critical" /><span>{t(`gw.never.${r}`)}</span></li>)}
        </ul>
      </section>
    </GatewayFrame>
  )
}
