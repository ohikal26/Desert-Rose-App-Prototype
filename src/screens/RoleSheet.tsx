import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useData } from '../data/DataContext'
import { useI18n } from '../i18n/I18n'
import { useAppState } from '../state/AppState'
import type { Role } from '../types'

const ORDER: Role[] = ['employee', 'supervisor', 'auditor', 'head', 'gm', 'ceo', 'owner']

export function RoleSheet({ onClose }: { onClose: () => void }) {
  const { data } = useData()
  const { t, userName, jobName } = useI18n()
  const { userId, setUserId } = useAppState()
  const ref = useRef<HTMLDivElement>(null)
  // Each person starts on their own home screen.
  const nav = useNavigate()

  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!data) return null
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet" role="dialog" aria-modal="true" aria-labelledby="role-sheet-title"
        tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}
      >
        <div className="section-head">
          <h2 id="role-sheet-title">{t('home.switchRole')}</h2>
          <button type="button" className="btn-text" onClick={onClose}>
            <X size={20} aria-hidden />{t('settings.cancel')}
          </button>
        </div>
        <p className="muted small">{t('home.switchRoleHint')}</p>
        {ORDER.map((role) => {
          const people = data.users.filter((u) => u.role === role)
          return (
            <section key={role} className="stack-sm" aria-label={t(`role.${role}`)}>
              <span className="section-label">{t(`role.${role}`)}</span>
              {people.map((u) => (
                <button
                  key={u.id} type="button" className="person-btn" aria-pressed={u.id === userId}
                  onClick={() => { setUserId(u.id); onClose(); nav('/') }}
                >
                  <span className="avatar" aria-hidden>{u.initials}</span>
                  <span>
                    <span className="who-name">{userName(u)}</span>
                    <br />
                    <span className="muted small">{jobName(u)} · {t(`dept.${u.department}`)}</span>
                  </span>
                </button>
              ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}
