import { createMemoryStorage, type StorageAdapter } from '@docentjs/core'

/**
 * `localStorage`-backed adapter. Falls back to memory when storage is
 * unavailable (private mode, blocked cookies, SSR).
 */
export function createLocalStorage(storage?: Storage): StorageAdapter {
  let backing: Storage
  try {
    backing = storage ?? globalThis.localStorage
    const probe = '__docent__'
    backing.setItem(probe, '1')
    backing.removeItem(probe)
  } catch {
    return createMemoryStorage()
  }
  const guard = <T>(fn: () => T, fallback: T): T => {
    try {
      return fn()
    } catch {
      return fallback
    }
  }
  return {
    get: (key) => guard(() => backing.getItem(key), null),
    set: (key, value) => guard(() => backing.setItem(key, value), undefined),
    remove: (key) => guard(() => backing.removeItem(key), undefined),
  }
}
