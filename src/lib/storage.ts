// Small per-device preferences. Storage can be blocked (private mode), so never throw.
export function readPref(key: string): string | null {
  try { return localStorage.getItem(`dr.${key}`) } catch { return null }
}
export function writePref(key: string, value: string): void {
  try { localStorage.setItem(`dr.${key}`, value) } catch { /* ignore */ }
}
