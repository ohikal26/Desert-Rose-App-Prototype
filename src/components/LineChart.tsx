import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18n'

export interface Series { key: string; label: string; color: string; values: number[] }

/**
 * Small line chart: 2px lines, end dots with a surface ring, labelled end values,
 * one axis, recessive grid, hover crosshair with a tooltip, and a table view.
 * Direction-aware: time runs right to left in Arabic.
 */
export function LineChart({ series, xLabels, title, height = 180, unit = '' }: {
  series: Series[]; xLabels: string[]; title: string; height?: number; unit?: string
}) {
  const { t, dir } = useI18n()
  const id = useId()
  const [hover, setHover] = useState<number | null>(null)
  const [table, setTable] = useState(false)
  // Draw at the real width so text stays at its true size on a phone.
  const box = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(640)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [table])
  const H = height, padL = 36, padR = 44, padT = 12, padB = 28
  const n = xLabels.length
  const max = useMemo(() => niceMax(Math.max(...series.flatMap((s) => s.values))), [series])
  const ticks = [0, max / 2, max]
  const rtl = dir === 'rtl'
  const x = (i: number) => {
    const f = n === 1 ? 0 : i / (n - 1)
    const w = W - padL - padR
    return rtl ? padR + (1 - f) * w : padL + f * w
  }
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB)
  // End labels: keep them at least 18px apart so close values never overlap.
  const endY = useMemo(() => {
    const order = series.map((s, i) => ({ i, y: y(s.values[n - 1]) })).sort((a, b) => a.y - b.y)
    for (let k = 1; k < order.length; k++) if (order[k].y - order[k - 1].y < 18) order[k].y = order[k - 1].y + 18
    const out: number[] = []
    order.forEach((o) => { out[o.i] = o.y })
    return out
  }, [series, max, H]) // eslint-disable-line react-hooks/exhaustive-deps
  const fmt = (v: number) => `${Number.isInteger(v) ? v : v.toFixed(1)}${unit}`

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let best = 0
    for (let i = 1; i < n; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i
    setHover(best)
  }

  return (
    <figure className="chart" aria-labelledby={`${id}-t`}>
      <figcaption id={`${id}-t`} className="visually-hidden">{title}</figcaption>
      <div className="chart-legend" aria-hidden>
        {series.map((s) => <span key={s.key} className="legend-item"><span className="legend-key" style={{ background: s.color }} />{s.label}</span>)}
      </div>
      {!table ? (
        <div className="chart-box" ref={box}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
            {ticks.map((v) => (
              <g key={v}>
                <line x1={rtl ? padR : padL} x2={rtl ? W - padL : W - padR} y1={y(v)} y2={y(v)} className="chart-grid" />
                <text x={rtl ? W - padL + 8 : padL - 8} y={y(v) + 4} textAnchor={rtl ? 'start' : 'end'} className="chart-tick">{fmt(v)}</text>
              </g>
            ))}
            {xLabels.map((l, i) => (i === 0 || i === n - 1 || i === Math.floor(n / 2)) && (
              <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="chart-tick">{l}</text>
            ))}
            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} className="chart-cross" />}
            {series.map((s) => (
              <g key={s.key}>
                <polyline fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
                  points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
                <circle cx={x(n - 1)} cy={y(s.values[n - 1])} r={5} fill={s.color} stroke="var(--card)" strokeWidth={2} />
                <text x={x(n - 1) + (rtl ? -10 : 10)} y={endY[series.indexOf(s)] + 5} textAnchor={rtl ? 'end' : 'start'} className="chart-end">
                  {fmt(s.values[n - 1])}
                </text>
                {hover !== null && <circle cx={x(hover)} cy={y(s.values[hover])} r={5} fill={s.color} stroke="var(--card)" strokeWidth={2} />}
              </g>
            ))}
          </svg>
          {hover !== null && (
            <div className="chart-tip" style={{ [rtl ? 'right' : 'left']: `${(Math.abs(x(hover) - (rtl ? W : 0)) / W) * 100}%` }}>
              <strong>{xLabels[hover]}</strong>
              {series.map((s) => (
                <span key={s.key} className="row-inline"><span className="legend-key" style={{ background: s.color }} />{s.label}: {fmt(s.values[hover])}</span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <table className="chart-table">
          <thead><tr><th scope="col">{t('lead.week')}</th>{series.map((s) => <th key={s.key} scope="col">{s.label}</th>)}</tr></thead>
          <tbody>{xLabels.map((l, i) => <tr key={i}><th scope="row">{l}</th>{series.map((s) => <td key={s.key}>{fmt(s.values[i])}</td>)}</tr>)}</tbody>
        </table>
      )}
      <button type="button" className="btn-text small" onClick={() => setTable(!table)}>{table ? t('lead.showChart') : t('lead.showTable')}</button>
    </figure>
  )
}

function niceMax(v: number): number {
  if (v <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p
  return 10 * p
}
