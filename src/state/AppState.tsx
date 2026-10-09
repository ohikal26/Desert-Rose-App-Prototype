import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readPref, writePref } from '../lib/storage'

export type TextSize = 'normal' | 'large'

interface AppStateCtx {
  userId: string
  setUserId: (id: string) => void
  textSize: TextSize
  setTextSize: (s: TextSize) => void
  online: boolean
}

const Ctx = createContext<AppStateCtx | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState(() => readPref('user') ?? 'karim')
  const [textSize, setTextSizeState] = useState<TextSize>(() => (readPref('textSize') === 'large' ? 'large' : 'normal'))
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.textSize = textSize
  }, [textSize])

  const setUserId = useCallback((id: string) => { setUserIdState(id); writePref('user', id) }, [])
  const setTextSize = useCallback((s: TextSize) => { setTextSizeState(s); writePref('textSize', s) }, [])

  const value = useMemo(() => ({ userId, setUserId, textSize, setTextSize, online }),
    [userId, setUserId, textSize, setTextSize, online])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppState(): AppStateCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAppState outside AppStateProvider')
  return c
}
