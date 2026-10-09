import { useEffect, useRef, useState } from 'react'
import { Camera, Trash2, X } from 'lucide-react'
import { useI18n } from '../i18n/I18n'
import { resizePhoto } from '../lib/photos'

/** Square thumbnail; tap for full screen (brief 10.5). */
export function PhotoThumb({ src, alt, size = 72 }: { src: string; alt: string; size?: number }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <>
      <button type="button" className="thumb" style={{ width: size, height: size }} onClick={() => setOpen(true)}
        aria-label={`${alt}. ${t('photo.open')}`}>
        <img src={src} alt="" />
      </button>
      {open && (
        <div className="photo-full" role="dialog" aria-modal="true" aria-label={alt} onClick={() => setOpen(false)}>
          <img src={src} alt={alt} />
          <button ref={closeRef} type="button" className="btn btn-secondary photo-close" onClick={() => setOpen(false)}>
            <X size={20} aria-hidden />{t('photo.close')}
          </button>
        </div>
      )}
    </>
  )
}

/** "Take photo" button. The camera opens directly on phones (capture="environment"). */
export function PhotoInput({ value, onChange, label }: { value?: string; onChange: (v?: string) => void; label?: string }) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="row">
      {value && <PhotoThumb src={value} alt={t('photo.alt')} />}
      <input
        ref={inputRef} type="file" accept="image/*" capture="environment" className="visually-hidden" tabIndex={-1}
        aria-hidden
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          setBusy(true)
          try { onChange(await resizePhoto(f)) } finally { setBusy(false) }
        }}
      />
      <button type="button" className="btn btn-secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
        <Camera size={20} aria-hidden />
        {busy ? t('state.loading') : value ? t('photo.retake') : label ?? t('photo.take')}
      </button>
      {value && (
        <button type="button" className="btn-text btn-danger-text" onClick={() => onChange(undefined)}>
          <Trash2 size={18} aria-hidden />{t('photo.remove')}
        </button>
      )}
    </div>
  )
}
