import { useEffect, useRef, useState } from 'react'
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'
import { CameraOff } from 'lucide-react'
import { useI18n } from '../i18n/I18n'

/**
 * Live camera QR scanner (@zxing/browser, runs fully on the device).
 * Calls onCode with each code it reads. Cameras fail, so callers always offer a list too.
 */
export function QrScanner({ onCode }: { onCode: (text: string) => void }) {
  const { t } = useI18n()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const cb = useRef(onCode)
  cb.current = onCode

  useEffect(() => {
    let controls: IScannerControls | undefined
    let stopped = false
    const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 150 })
    reader
      .decodeFromConstraints({ video: { facingMode: 'environment' } }, videoRef.current!, (result) => {
        if (result && !stopped) cb.current(result.getText())
      })
      .then((c) => {
        if (stopped) c.stop()
        else controls = c
      })
      .catch(() => setFailed(true))
    return () => {
      stopped = true
      controls?.stop()
    }
  }, [])

  if (failed) {
    return (
      <div className="panel row" role="status">
        <CameraOff size={22} aria-hidden />
        <span>{t('scan.noCamera')}</span>
      </div>
    )
  }
  return (
    <div className="scanner">
      <video ref={videoRef} muted playsInline aria-label={t('scan.videoLabel')} />
      <div className="scanner-frame" aria-hidden />
    </div>
  )
}

/** QR values printed on the location sheet look like "DR-LOC:quiet-pool". */
export function locationIdFromQr(text: string): string | null {
  const m = /^DR-LOC:([a-z0-9-]+)$/.exec(text.trim())
  return m ? m[1] : null
}
