// All data lives on the device in IndexedDB. No server.
import { openDB, type IDBPDatabase } from 'idb'
import { expandSeed } from './expandSeed'

export const STORES = [
  'users', 'locations', 'checklistTemplates', 'inspectionTemplates',
  'checklistRuns', 'inspectionRuns', 'problems',
] as const
export type StoreName = (typeof STORES)[number]

const DB_NAME = 'desert-rose-oe'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        for (const s of STORES) d.createObjectStore(s, { keyPath: 'id' })
        d.createObjectStore('meta')
      },
    })
  }
  return dbPromise
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  return (await db()).getAll(store)
}

export async function put<T>(store: StoreName, value: T): Promise<void> {
  await (await db()).put(store, value)
}

/** Clears every store and loads the seed again. Used on first run and by "Reset demo data". */
export async function loadSeed(): Promise<void> {
  const data = expandSeed()
  const d = await db()
  const tx = d.transaction([...STORES, 'meta'], 'readwrite')
  for (const s of STORES) await tx.objectStore(s).clear()
  const rows: Record<StoreName, unknown[]> = { ...data, inspectionRuns: [] }
  for (const s of STORES) for (const r of rows[s]) await tx.objectStore(s).put(r)
  await tx.objectStore('meta').put(new Date().toISOString(), 'seededAt')
  await tx.done
}

export async function ensureSeeded(): Promise<void> {
  const seededAt = await (await db()).get('meta', 'seededAt')
  if (!seededAt) await loadSeed()
}
