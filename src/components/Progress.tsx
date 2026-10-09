import { useI18n } from '../i18n/I18n'

/** A row of segments, one per task. Shows a count, never a percentage (rule 1). */
export function Segments({ done, skipped = 0, total }: { done: number; skipped?: number; total: number }) {
  const { t } = useI18n()
  return (
    <div className="segments" role="img" aria-label={t('run.progress', { done, total })}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < done ? 'is-done' : i < done + skipped ? 'is-skipped' : ''} />
      ))}
    </div>
  )
}
