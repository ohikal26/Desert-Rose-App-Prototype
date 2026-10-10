import { Award, BadgeCheck, Lock, MessageSquareWarning, Globe } from 'lucide-react'
import { useI18n } from '../i18n/I18n'
import { LineChart } from '../components/LineChart'
import { StatusChip, useFormat } from '../components/Kpi'
import { gateway, type Platform, type Status } from '../lib/gateway'
import { GatewayFrame } from './Gateway'
import { ConcernList } from './GatewayDepartment'

const INTEGRITY = {
  'own-guests': { icon: Lock, cls: 'chip-good' },
  'booking-required': { icon: BadgeCheck, cls: 'chip-teal' },
  open: { icon: Globe, cls: 'chip-neutral' },
} as const

const status = (p: Platform): Status => {
  const a = (p.score / p.target) * 100
  return a >= 100 ? 'met' : a >= 95 ? 'close' : a >= 85 ? 'behind' : 'at-risk'
}

/**
 * Guest feedback across platforms, labelled by how far each one can be trusted:
 * our own guests (survey, in-house app), a stay is required (Booking.com, TUI, Check24),
 * or anyone can post. Only the first two kinds, plus HolidayCheck, are proposed for the scorecard.
 */
export function GatewayGuest() {
  const { t, c } = useI18n()
  const fmt = useFormat()
  const ty = gateway.platforms.find((p) => p.id === 'trustyou')!
  const concerns = gateway.departments.flatMap((d) => d.concerns ?? [])
  return (
    <GatewayFrame>
      <h1>{t('gw.tab.guest')}</h1>
      <p className="muted">{t('gw.guestHint')}</p>

      <section className="card stack-sm" aria-labelledby="gg-int">
        <h2 id="gg-int" className="section-title">{t('gw.integrityTitle')}</h2>
        <ul className="stack-sm">
          {(Object.keys(INTEGRITY) as (keyof typeof INTEGRITY)[]).map((k) => {
            const I = INTEGRITY[k]
            return (
              <li key={k} className="row-inline gw-int-row">
                <span className={`chip ${I.cls}`}><I.icon size={14} aria-hidden />{t(`gw.integrity.${k}`)}</span>
                <span className="small muted">{t(`gw.integrityHint.${k}`)}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="gw-table-wrap">
        <table className="gw-table">
          <thead>
            <tr>
              <th scope="col">{t('gw.platform')}</th>
              <th scope="col">{t('gw.score')}</th>
              <th scope="col" className="hide-narrow">{t('gw.reviews')}</th>
              <th scope="col" className="hide-narrow">{t('gw.integrity')}</th>
            </tr>
          </thead>
          <tbody>
            {gateway.platforms.map((p) => {
              const I = INTEGRITY[p.integrity]
              return (
                <tr key={p.id}>
                  <th scope="row">
                    {c(`gw.platform.${p.id}`, p.name)}
                    {p.scorecard && <span className="kr-flag"><Award size={14} aria-hidden />{t('gw.inScorecard')}</span>}
                  </th>
                  <td>
                    <div><bdi dir="ltr"><strong>{fmt(p.score, p.unit)}</strong> <span className="muted small">/ {fmt(p.target, p.unit)}</span></bdi></div>
                    <StatusChip status={status(p)} />
                  </td>
                  <td className="hide-narrow">{p.volume}{p.volumeTarget ? <span className="muted small"> / {p.volumeTarget}</span> : null}</td>
                  <td className="hide-narrow"><span className={`chip ${I.cls}`}><I.icon size={14} aria-hidden />{t(`gw.integrity.${p.integrity}`)}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <section className="card stack" aria-labelledby="gg-trend">
        <h2 id="gg-trend" className="section-title">{t('gw.surveyTrend')}</h2>
        <LineChart title={t('gw.surveyTrend')} unit="%" xLabels={gateway.months.map((m) => t(`gw.month.${m}`))} series={[
          { key: 'ty', label: c('gw.platform.trustyou', ty.name), color: 'var(--teal)', values: ty.monthly ?? [] },
          { key: 'target', label: t('gw.target'), color: 'var(--stone)', values: gateway.months.map(() => ty.target) },
        ]} />
      </section>

      <section className="card stack" aria-labelledby="gg-concerns">
        <h2 id="gg-concerns" className="section-title row-inline"><MessageSquareWarning size={20} aria-hidden />{t('gw.concernsTitle')}</h2>
        <p className="small muted">{t('gw.concernsHint')}</p>
        <ConcernList list={concerns} />
      </section>
    </GatewayFrame>
  )
}
