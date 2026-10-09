import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CircleCheck } from 'lucide-react'

const Ctx = createContext<(msg: string) => void>(() => {})

/** Short success message that disappears on its own (brief 10.6). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<number>()
  const show = useCallback((m: string) => {
    setMsg(m)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMsg(null), 3000)
  }, [])
  return (
    <Ctx.Provider value={show}>
      {children}
      <div aria-live="polite">
        {msg && <div className="toast"><CircleCheck size={20} aria-hidden />{msg}</div>}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
