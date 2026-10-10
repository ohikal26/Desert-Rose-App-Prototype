import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, Archive, ArrowDown, ArrowUp, Building2, CalendarClock, ChevronRight, CircleCheck, Clock, Eye, Hourglass,
  ListChecks, MapPin, Minus, Search, ShieldCheck, Target, Wrench,
} from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import { LineChart } from '../components/LineChart'
import { Bars } from '../components/Bars'
import { ceoView, gmView, ownerView } from '../lib/leadership'
import type { Problem, Role } from '../types'

type View = 'gm' | 'ceo' | 'owner'
const VIEWS: View[] = ['gm', 'ceo', 'owner']
const defaultView = (role: Role): View => (role === 'ceo' ? 'ceo' : role === 'owner' ? 'owner' : 'gm')

/**
 * Leadership page: three views of the same data, sized to how often each person looks.
 * GM daily (what needs a push), CEO a daily glance plus the weekly trend,
 * Owner weekly (safety, capex list, whether renovated areas hold up). No money, no staff ranking.
 */
export function Leadership() {
  const { data, user } = useData()
  const { t } = useI18n()
  const { userId } = useAppState()
  const [params, setParams] = useSearchParams()
  const me = user(userId)
  if (!data || !me) return null
  const view = (params.get('view') as View) ?? defaultView(me.role)

  return (
    <>
      <header className="stack-sm">
        <span className="muted small">{t('dept.all')} · {t('sum.asOfToday')}</span>
        <h1>{t('lead.title')}</h1>
      </header>
      <div className="scope" role="tablist" aria-label={t('lead.title')}>
        {VIEWS.map((v) => (
          <button key={v} type="button" role="tab" aria-selected={view === v} aria-pressed={view === v}
            onClick={() => setParams({ view: v }, { replace: true })}>{t(`lead.tab.${v}`)}</button>
        ))}
      </div>
      <p className="lead-cadence"><CalendarClock size={18} aria-hidden />{t(`lead.cadence.${view}`)}</p>
      {view === 'gm' && <GmView />}
      {view === 'ceo' && <CeoView />}
      {view === 'owner' && <OwnerView />}
      <p className="muted small">{t('lead.footnote')}</p>
    </>
  )
}

function useWeekLabels(starts: string[]) {
  const { t, formatDate } = useI18n()
  return starts.map((s, i) => (i === starts.length - 1 ? t('lead.thisWeek') : formatDate(s).replace(/^[^,،]+[,،]\s*/, '')))
}

function Change({ now, before, goodWhen }: { now: number; before: number; goodWhen: 'down' | 'up' }) {
  const { t } = useI18n()
  const diff = Math.round((now - before) * 10) / 10
  if (diff === 0) return <span className="change"><Minus size={14} aria-hidden />{t('lead.same')}</span>
  const up = diff > 0
  const good = goodWhen === 'up' ? up : !up
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <span className={`change ${good ? 'is-good' : 'is-bad'}`}>
      <Icon size={14} aria-hidden />{t(up ? 'lead.up' : 'lead.down', { n: Math.abs(diff) })}
    </span>
  )
}

function SafetyList({ items }: { items: { p: Problem; days: number }[] }) {
  const { t, c, locName, problemTitle, userName } = useI18n()
  const { location, user } = useData()
  if (!items.length) {
    return <div className="banner banner-good"><ShieldCheck size={22} aria-hidden /><div><strong>{t('lead.noSafety')}</strong></div></div>
  }
  return (
    <ul className="list">
      {items.map(({ p, days }) => (
        <li key={p.id}>
          <Link to={`/problems/${p.id}`} className="card safety-row link-row">
            <AlertTriangle size={20} aria-hidden className="text-critical" />
            <div className="list-row-main">
              <div className="list-row-title">{problemTitle(p)}</div>
              <div className="muted small">{locName(location(p.location))} · {userName(user(p.owner))} · {t('lead.openDays', { n: days })}</div>
              <div className="small">{t('prob.interim')}: {p.interimKey ? c(p.interimKey, p.interim ?? '') : p.interim}</div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function GmView() {
  const { data, location, user } = useData()
  const { t, locName, problemTitle, userName, formatDate } = useI18n()
  const v = gmView(data!)
  return (
    <>
      <section className="stack-sm" aria-labelledby="gm-safety">
        <h2 id="gm-safety" className="section-title">{t('lead.safetyNow')}</h2>
        <SafetyList items={v.safety} />
      </section>

      <section className="stack-sm" aria-labelledby="gm-dept">
        <h2 id="gm-dept" className="section-title">{t('lead.byDept')}</h2>
        <div className="dept-grid">
          {v.byDept.map((d) => (
            <div key={d.dept} className="card stack-sm">
              <h3 className="dept-name">{t(`dept.${d.dept}`)}</h3>
              <dl className="dept-stats">
                <div><dt><ListChecks size={16} aria-hidden />{t('sum.open')}</dt><dd>{d.open}</dd></div>
                <div><dt><Clock size={16} aria-hidden />{t('sum.overdue')}</dt><dd className={d.overdue ? 'text-critical' : ''}>{d.overdue}</dd></div>
                <div><dt><Wrench size={16} aria-hidden />{t('sum.fixedWaiting')}</dt><dd>{d.waiting}</dd></div>
              </dl>
              <p className="small muted">{t('lead.checklistsLine', { done: d.done, prog: d.inProgress, back: d.sentBack })}</p>
              {(() => {
                const ns = v.notStarted.find((x) => x.dept === d.dept)!.slots
                return ns.length > 0 && <p className="small">{t('dept.notStarted', { n: ns.length })}: <span className="muted">{ns.map((x) => locName(x.location)).join(', ')}</span></p>
              })()}
              <Link to={`/department/${d.dept}`} className="btn btn-secondary btn-block">{t('dept.open')}<ChevronRight size={18} aria-hidden className="flip-rtl" /></Link>
            </div>
          ))}
        </div>
      </section>

      <section className="stack-sm" aria-labelledby="gm-push">
        <h2 id="gm-push" className="section-title">{t('lead.needsPush')}</h2>
        <p className="muted small">{t('lead.needsPushHint')}</p>
        {v.push.length === 0 ? <p className="card state-box muted">{t('state.empty')}</p> : (
          <ul className="list">
            {v.push.map((p) => (
              <li key={p.id}>
                <Link to={`/problems/${p.id}`} className="list-row link-row">
                  <div className="list-row-main">
                    <div className="list-row-title">{problemTitle(p)}</div>
                    <div className="muted small">{locName(location(p.location))} · {userName(user(p.owner))}</div>
                  </div>
                  <span className="small text-critical">{t('due.was', { date: formatDate(p.due) })}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card stack" aria-labelledby="gm-stuck">
        <h2 id="gm-stuck" className="section-title row-inline"><Hourglass size={20} aria-hidden />{t('dept.stuckTitle')}</h2>
        <p className="muted small">{t('dept.stuckHint')}</p>
        {v.stuck.length === 0 ? <p className="small">{t('dept.noStuck')}</p> : (
          <ul className="list">{v.stuck.map((p) => (
            <li key={p.id}><Link to={`/problems/${p.id}`} className="list-row link-row">
              <div className="list-row-main"><div className="list-row-title">{problemTitle(p)}</div><div className="small muted">{locName(location(p.location))}</div></div>
            </Link></li>))}
          </ul>
        )}
        <h3 className="field-label">{t('dept.ageTitle')}</h3>
        <Bars bars={v.ageing.map((a) => ({ key: a.key, label: t(`age.${a.key}`), n: a.n, tone: a.key === '15+' ? 'critical' : a.key === '8-14' ? 'stone' : 'teal' }))} />
      </section>

      <section className="card stack" aria-labelledby="gm-hot">
        <h2 id="gm-hot" className="section-title row-inline"><MapPin size={20} aria-hidden />{t('dept.hotTitle')}</h2>
        <p className="muted small">{t('dept.hotHint')}</p>
        <Bars bars={v.hotspots.map((h) => ({ key: h.place.id, label: locName(h.place), n: h.n, to: '/problems?scope=all' }))} />
      </section>

      <section className="card stack-sm" aria-labelledby="gm-insp">
        <h2 id="gm-insp" className="section-title row-inline"><Search size={20} aria-hidden />{t('lead.inspWeek')}</h2>
        {v.inspections
          ? <p>{t('lead.inspThisWeek', { runs: v.inspections.runs, s: v.inspections.stepsIn10, r: v.inspections.resultGoodIn10 })}</p>
          : <p className="small muted">{t('lead.inspNone')}</p>}
      </section>

      <Link to="/summary" className="btn btn-secondary btn-block">{t('sum.full')}</Link>
    </>
  )
}

function CeoView() {
  const { data } = useData()
  const { t } = useI18n()
  const v = ceoView(data!)
  const labels = useWeekLabels(v.weeks.map((w) => w.start))
  const pastLabels = useWeekLabels([...v.pastWeeks.map((w) => w.start), '']).slice(0, -1)
  const insp = v.inspections
  return (
    <>
      <div className="tiles tiles-3">
        <div className="tile">
          <span className="tile-icon"><AlertTriangle size={18} aria-hidden /></span>
          <span className="tile-number is-critical">{v.now.safetyOpen}</span>
          <span className="tile-label">{t('lead.safetyOpen')}</span>
          <Change now={v.now.safetyOpen} before={v.last.safetyOpen} goodWhen="down" />
        </div>
        <div className="tile">
          <span className="tile-icon"><Clock size={18} aria-hidden /></span>
          <span className="tile-number">{v.now.overdue}</span>
          <span className="tile-label">{t('sum.overdue')}</span>
          <Change now={v.now.overdue} before={v.last.overdue} goodWhen="down" />
        </div>
        <div className="tile">
          <span className="tile-icon"><CircleCheck size={18} aria-hidden /></span>
          <span className="tile-number">{v.closedLastWeek.onTime}<span className="total-of"> / {v.closedLastWeek.total}</span></span>
          <span className="tile-label">{t('lead.closedOnTimeLast')}</span>
        </div>
      </div>

      {v.exceptions.length > 0 && (
        <section className="banner banner-warning" aria-label={t('lead.exceptions')}>
          <Eye size={22} aria-hidden />
          <div>
            <strong>{t('lead.exceptions')}</strong>
            <div>{t('lead.exceptionsLine')}: <strong>{v.exceptions.length}</strong></div>
            <Link to="/leadership?view=gm" className="btn-text small">{t('lead.seeGm')}</Link>
          </div>
        </section>
      )}

      <section className="card stack" aria-labelledby="ceo-trend">
        <h2 id="ceo-trend" className="section-title">{t('lead.trendTitle')}</h2>
        <p className="muted small">{t('lead.trendHint', { from: v.first.open, to: v.now.open })}</p>
        <LineChart title={t('lead.trendTitle')} xLabels={labels} series={[
          { key: 'open', label: t('sum.open'), color: 'var(--teal)', values: v.weeks.map((w) => w.open) },
          { key: 'overdue', label: t('sum.overdue'), color: 'var(--stone)', values: v.weeks.map((w) => w.overdue) },
        ]} />
      </section>

      <section className="card stack" aria-labelledby="ceo-insp">
        <h2 id="ceo-insp" className="section-title">{t('lead.inspTitle')}</h2>
        <p className="muted small">{t('insp.twoTotalsNote')}</p>
        <div className="totals">
          <div className="total">
            <span className="tile-icon"><ListChecks size={18} aria-hidden /></span>
            <span className="total-label">{t('insp.steps')}</span>
            <span className="total-number">{insp.lastWeek.stepsIn10}<span className="total-of"> {t('lead.in10')}</span></span>
            <Change now={insp.lastWeek.stepsIn10} before={insp.firstWeek.stepsIn10} goodWhen="up" />
          </div>
          <div className="total">
            <span className="tile-icon"><Target size={18} aria-hidden /></span>
            <span className="total-label">{t('insp.resultGood')}</span>
            <span className="total-number">{insp.lastWeek.resultGoodIn10}<span className="total-of"> {t('lead.in10')}</span></span>
            <Change now={insp.lastWeek.resultGoodIn10} before={insp.firstWeek.resultGoodIn10} goodWhen="up" />
          </div>
        </div>
        <p className="muted small">{t('lead.inspCompare')}</p>
        {insp.thisWeek && (
          <p className="small">{t('lead.inspThisWeek', { runs: insp.thisWeek.runs, s: insp.thisWeek.stepsIn10, r: insp.thisWeek.resultGoodIn10 })}</p>
        )}
      </section>

      <section className="card stack-sm" aria-labelledby="ceo-kind">
        <h2 id="ceo-kind" className="section-title">{t('lead.kindTitle')}</h2>
        <div className="split-bar" role="img" aria-label={`${t('tag.care')}: ${v.care}, ${t('tag.condition')}: ${v.condition}`}>
          <span className="bar-care" style={{ flex: v.care }} />
          <span className="bar-condition" style={{ flex: v.condition }} />
        </div>
        <div className="row small" style={{ justifyContent: 'space-between' }}>
          <span className="legend-item"><span className="legend-key bar-care" />{t('tag.care')}: <strong>{v.care}</strong></span>
          <span className="legend-item"><span className="legend-key bar-condition" />{t('tag.condition')}: <strong>{v.condition}</strong></span>
        </div>
        <p className="muted small">{t('lead.kindHint')}</p>
      </section>

      <section className="card stack" aria-labelledby="ceo-depts">
        <h2 id="ceo-depts" className="section-title">{t('lead.deptTrend')}</h2>
        <p className="muted small">{t('lead.deptTrendHint')}</p>
        <LineChart title={t('lead.deptTrend')} xLabels={labels} series={[
          { key: 'rec', label: t('dept.recreation'), color: 'var(--teal)', values: [...v.pastWeeks.map((w) => w.byDept.recreation.open), v.deptNow[0].open] },
          { key: 'hk', label: t('dept.housekeeping'), color: 'var(--stone)', values: [...v.pastWeeks.map((w) => w.byDept.housekeeping.open), v.deptNow[1].open] },
        ]} />
        <div className="row">
          <Link to="/department/recreation" className="btn-text small">{t('dept.recreation')}<ChevronRight size={16} aria-hidden className="flip-rtl" /></Link>
          <Link to="/department/housekeeping" className="btn-text small">{t('dept.housekeeping')}<ChevronRight size={16} aria-hidden className="flip-rtl" /></Link>
        </div>
      </section>

      <section className="card stack" aria-labelledby="ceo-speed">
        <h2 id="ceo-speed" className="section-title">{t('lead.speedTitle')}</h2>
        <p className="muted small">{t('lead.speedHint')}</p>
        <LineChart title={t('lead.speedTitle')} unit="" xLabels={pastLabels} series={[
          { key: 'days', label: t('lead.daysToFix'), color: 'var(--teal)', values: v.pastWeeks.map((w) => w.daysToFix) },
        ]} />
        <p className="small">{t('lead.speedRead', { from: v.pastWeeks[0].daysToFix, to: v.pastWeeks[v.pastWeeks.length - 1].daysToFix })}</p>
      </section>
    </>
  )
}

function OwnerView() {
  const { data, location } = useData()
  const { t, locName, problemTitle, formatDate } = useI18n()
  const v = ownerView(data!)
  const labels = useWeekLabels(v.weeks.map((w) => w.start))
  const maxB = Math.max(1, ...v.capex.map((b) => b.list.length))
  const buildingName = (b: string) => (/^\d+$/.test(b) ? locName(location(`building-${b}`)) : locName(location(b)))
  return (
    <>
      <section className="stack-sm" aria-labelledby="own-safety">
        <h2 id="own-safety" className="section-title">{t('lead.safetyNow')}</h2>
        {v.safety.length ? (
          <div className="banner banner-critical">
            <AlertTriangle size={22} aria-hidden />
            <div>
              <strong>{t('lead.ownerSafety', { n: v.safety.length, d: Math.max(...v.safety.map((s) => s.days)) })}</strong>
              <div className="small">{t('lead.ownerSafetyHint')}</div>
              <Link to="/problems?scope=all&safety=1" className="btn-text small">{t('lead.seeList')}</Link>
            </div>
          </div>
        ) : <SafetyList items={[]} />}
      </section>

      <section className="card stack" aria-labelledby="own-capex">
        <div className="section-head">
          <h2 id="own-capex" className="section-title row-inline"><Archive size={20} aria-hidden />{t('lead.capexTitle')}</h2>
          <span className="small muted">{t('lead.capexNew', { n: v.capexNewThisWeek })}</span>
        </div>
        <p className="muted small">{t('lead.capexHint')}</p>
        <div className="bars">
          {v.capex.map((b) => (
            <div key={b.building} className="bar-group">
              <Link to={`/problems?scope=all&status=capex`} className="bar-row link-row" aria-label={`${buildingName(b.building)}: ${b.list.length}`}>
                <span className="bar-label strong">{buildingName(b.building)}</span>
                <span className="bar-track"><span className="bar-fill bar-condition" style={{ width: `${(b.list.length / maxB) * 100}%` }} /></span>
                <span className="bar-n">{b.list.length}</span>
              </Link>
              <ul className="capex-items">
                {b.list.map((p) => (
                  <li key={p.id}>
                    <Link to={`/problems/${p.id}`}>{problemTitle(p)}</Link>
                    <span className="muted"> · {locName(location(p.location))} · {t('lead.since', { date: formatDate(p.history[0].at) })}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="card stack" aria-labelledby="own-areas">
        <h2 id="own-areas" className="section-title">{t('lead.areasTitle')}</h2>
        <p className="muted small">{t('lead.areasHint')}</p>
        <LineChart title={t('lead.areasTitle')} xLabels={labels} series={[
          { key: 'old', label: t('tag.old'), color: 'var(--stone)', values: v.weeks.map((w) => w.oldPer100) },
          { key: 'renovated', label: t('tag.renovated'), color: 'var(--teal)', values: v.weeks.map((w) => w.renovatedPer100) },
        ]} />
        <p className="small">{t('lead.areasRead')}</p>
      </section>

      <section className="card stack" aria-labelledby="own-capex-trend">
        <h2 id="own-capex-trend" className="section-title">{t('lead.capexTrend')}</h2>
        <p className="muted small">{t('lead.capexTrendHint')}</p>
        <LineChart title={t('lead.capexTrend')} xLabels={labels} series={[
          { key: 'capex', label: t('lead.capexItems'), color: 'var(--stone)', values: v.capexTrend },
        ]} />
      </section>

      <section className="card stack" aria-labelledby="own-buildings">
        <h2 id="own-buildings" className="section-title row-inline"><Building2 size={20} aria-hidden />{t('lead.buildingsTitle')}</h2>
        <p className="muted small">{t('lead.buildingsHint')}</p>
        <Bars bars={v.buildings.map((b) => ({
          key: String(b.building), n: b.rate, tone: b.old ? 'stone' : 'teal',
          label: `${locName(location(`building-${b.building}`))}${b.old ? ` · ${t('tag.old')}` : ''}`,
        }))} />
        <p className="small">{t('lead.buildingsRead')}</p>
      </section>

      <section className="card stack-sm" aria-labelledby="own-depts">
        <h2 id="own-depts" className="section-title">{t('lead.deptsWeek')}</h2>
        <ul className="list">
          {v.depts.map((d) => (
            <li key={d.dept}>
              <Link to={`/department/${d.dept}`} className="list-row link-row">
                <div className="list-row-main">
                  <div className="list-row-title">{t(`dept.${d.dept}`)}</div>
                  <div className="small muted">{t('lead.deptLine', { open: d.open, overdue: d.overdue, r: d.resultGoodIn10 })}</div>
                </div>
                <ChevronRight size={20} aria-hidden className="flip-rtl muted" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card stack" aria-labelledby="own-2031">
        <h2 id="own-2031" className="section-title row-inline"><Target size={20} aria-hidden />{t('lead.road')}</h2>
        <p>{t('lead.roadLine', { from: v.firstWeek.resultGoodIn10, to: v.lastWeek.resultGoodIn10 })}</p>
        <LineChart title={t('lead.road')} xLabels={labels.slice(0, -1)} series={[
          { key: 'res', label: t('insp.resultGood'), color: 'var(--teal)', values: v.weeks.slice(0, -1).map((w) => w.resultGoodIn10 ?? 0) },
        ]} />
        <p className="muted small">{t('lead.roadHint')}</p>
      </section>
    </>
  )
}
