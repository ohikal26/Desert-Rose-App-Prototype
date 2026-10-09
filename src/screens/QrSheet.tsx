import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import QRCode from 'qrcode'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { BackLink } from '../components/BackLink'
import ar from '../i18n/ar.json'
import type { Location } from '../types'

const arContent = ar.content as Record<string, string>

/** Printable A4 sheet: one QR code per place, labelled in Arabic and English (brief 7.6). */
export function QrSheet() {
  const { data } = useData()
  const { t } = useI18n()
  const [codes, setCodes] = useState<Record<string, string>>({})

  // Pools, beaches, towel centres, HK areas and one code per building. Rooms would be one per room in the real tool.
  const places = (data?.locations ?? []).filter((l) => l.type !== 'room' && l.type !== 'corridor')

  useEffect(() => {
    let live = true
    Promise.all(places.map(async (l) => [l.id, await QRCode.toDataURL(l.qr, { margin: 1, width: 240, color: { dark: '#1F2A2E' } })] as const))
      .then((pairs) => { if (live) setCodes(Object.fromEntries(pairs)) })
    return () => { live = false }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const nameEn = (l: Location) => l.name
  const nameAr = (l: Location) =>
    l.type === 'building' ? arContent['loc.building'].replace('{n}', String(l.building)) : arContent[`loc.${l.id}`] ?? l.name

  return (
    <div className="qr-page">
      <div className="qr-toolbar no-print">
        <BackLink to="/settings" />
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={20} aria-hidden />{t('qr.print')}
        </button>
      </div>
      <header className="qr-head">
        <img src="logo/DR_logo_icon.png" alt="Desert Rose" className="qr-logo" />
        <div>
          <h1>{t('qr.title')}</h1>
          <p className="muted small">{t('qr.hint')}</p>
        </div>
      </header>
      <ul className="qr-grid">
        {places.map((l) => (
          <li key={l.id} className="qr-card">
            {codes[l.id] ? <img src={codes[l.id]} alt={`QR ${l.qr}`} /> : <span className="qr-placeholder" />}
            <span className="qr-name" lang="ar" dir="rtl">{nameAr(l)}</span>
            <span className="qr-name" lang="en" dir="ltr">{nameEn(l)}</span>
            <span className="qr-id">{l.qr}</span>
          </li>
        ))}
      </ul>
      <p className="muted small no-print">{t('qr.rooms')}</p>
    </div>
  )
}
