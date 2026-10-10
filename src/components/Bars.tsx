import { Link } from 'react-router-dom'

export interface Bar { key: string; label: string; n: number; to?: string; tone?: 'teal' | 'stone' | 'sage' | 'critical' }

/** Horizontal bars, one series: value at the tip, every bar labelled, each row a link when it has one. */
export function Bars({ bars, unit = '' }: { bars: Bar[]; unit?: string }) {
  const max = Math.max(1, ...bars.map((b) => b.n))
  return (
    <div className="bars">
      {bars.map((b) => {
        const body = (
          <>
            <span className="bar-label">{b.label}</span>
            <span className="bar-track"><span className={`bar-fill bar-tone-${b.tone ?? 'teal'}`} style={{ width: `${(b.n / max) * 100}%`, minWidth: b.n ? 2 : 0 }} /></span>
            <span className="bar-n">{b.n}{unit}</span>
          </>
        )
        return b.to
          ? <Link key={b.key} to={b.to} className="bar-row link-row" aria-label={`${b.label}: ${b.n}${unit}`}>{body}</Link>
          : <div key={b.key} className="bar-row" role="img" aria-label={`${b.label}: ${b.n}${unit}`}>{body}</div>
      })}
    </div>
  )
}
