import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  ChecklistRun, ChecklistTemplate, InspectionRun, InspectionTemplate, Location, Problem, User,
} from '../types'
import { ensureSeeded, getAll, loadSeed, put, type StoreName } from './db'

export interface AppData {
  users: User[]
  locations: Location[]
  checklistTemplates: ChecklistTemplate[]
  inspectionTemplates: InspectionTemplate[]
  checklistRuns: ChecklistRun[]
  inspectionRuns: InspectionRun[]
  problems: Problem[]
}

interface DataCtx {
  data: AppData | null
  error: boolean
  refresh: () => Promise<void>
  resetDemo: () => Promise<void>
  /** Saves one record on the device and refreshes the screen. */
  save: <T extends { id: string }>(store: StoreName, record: T) => Promise<void>
  user: (id: string) => User | undefined
  location: (id: string) => Location | undefined
}

const Ctx = createContext<DataCtx | null>(null)

async function readAll(): Promise<AppData> {
  const [users, locations, checklistTemplates, inspectionTemplates, checklistRuns, inspectionRuns, problems] =
    await Promise.all([
      getAll<User>('users'), getAll<Location>('locations'),
      getAll<ChecklistTemplate>('checklistTemplates'), getAll<InspectionTemplate>('inspectionTemplates'),
      getAll<ChecklistRun>('checklistRuns'), getAll<InspectionRun>('inspectionRuns'), getAll<Problem>('problems'),
    ])
  return { users, locations, checklistTemplates, inspectionTemplates, checklistRuns, inspectionRuns, problems }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const [error, setError] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setData(await readAll())
      setError(false)
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => {
    ensureSeeded().then(refresh).catch(() => setError(true))
  }, [refresh])

  const resetDemo = useCallback(async () => {
    await loadSeed()
    await refresh()
  }, [refresh])

  const save = useCallback(async <T extends { id: string }>(store: StoreName, record: T) => {
    await put(store, record)
    await refresh()
  }, [refresh])

  const value = useMemo<DataCtx>(() => {
    const users = new Map(data?.users.map((u) => [u.id, u]))
    const locs = new Map(data?.locations.map((l) => [l.id, l]))
    return {
      data, error, refresh, resetDemo, save,
      user: (id) => users.get(id),
      location: (id) => locs.get(id),
    }
  }, [data, error, refresh, resetDemo, save])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData(): DataCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useData outside DataProvider')
  return c
}
