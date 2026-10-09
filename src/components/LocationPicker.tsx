import { useMemo, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import type { Location } from '../types'

interface Props {
  /** Only show places that pass this test (for example, places that have a checklist). */
  filter?: (l: Location) => boolean
  /** Shown first, under "My places". */
  mine?: string[]
  department?: 'recreation' | 'housekeeping'
  onPick: (l: Location) => void
}

/** Pick a place from a list: the fallback when the camera cannot scan (brief 7.2). */
export function LocationPicker({ filter, mine = [], department, onPick }: Props) {
  const { data } = useData()
  const { t, locName } = useI18n()
  const [q, setQ] = useState('')

  const all = useMemo(
    () => (data?.locations ?? []).filter((l) => (!department || l.department === department) && (!filter || filter(l))),
    [data, department, filter],
  )
  const query = q.trim().toLowerCase()
  const matches = (l: Location) => !query || locName(l).toLowerCase().includes(query) || l.name.toLowerCase().includes(query)

  const myPlaces = all.filter((l) => mine.includes(l.id) && matches(l))
  // Rooms are many: only list them once the person starts typing a number.
  const others = all.filter((l) => !mine.includes(l.id) && matches(l) && (l.type !== 'room' || query.length >= 2))
  const shown = others.slice(0, 40)

  return (
    <div className="stack">
      <label className="field">
        <span className="field-label">{t('pick.search')}</span>
        <span className="search-box">
          <Search size={20} aria-hidden />
          <input type="search" inputMode="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={t('pick.placeholder')} />
        </span>
      </label>
      {myPlaces.length > 0 && <Group title={t('pick.mine')} list={myPlaces} onPick={onPick} name={locName} />}
      {shown.length > 0 && <Group title={t('pick.all')} list={shown} onPick={onPick} name={locName} />}
      {others.length > shown.length && <p className="muted small">{t('pick.more', { n: others.length - shown.length })}</p>}
      {myPlaces.length === 0 && shown.length === 0 && (
        // Before typing, rooms are hidden on purpose: say so instead of "no match".
        <p className="muted">{!query && all.some((l) => l.type === 'room') ? t('pick.typeRoom') : t('pick.none')}</p>
      )}
    </div>
  )
}

function Group({ title, list, onPick, name }: {
  title: string; list: Location[]; onPick: (l: Location) => void; name: (l: Location) => string
}) {
  return (
    <section className="stack-sm" aria-label={title}>
      <span className="section-label">{title}</span>
      <ul className="list">
        {list.map((l) => (
          <li key={l.id}>
            <button type="button" className="list-row list-button" onClick={() => onPick(l)}>
              <span className="list-row-main list-row-title">{name(l)}</span>
              <ChevronRight size={20} aria-hidden className="flip-rtl muted" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
