import type { StorageAdapter } from '../seams'

/**
 * Prefix every key with the user id so progress on a shared browser (or a
 * developer switching test accounts) never leaks between users.
 * Anonymous visitors use the unprefixed keys.
 */
export function scopeStorage(base: StorageAdapter, userId: string | undefined): StorageAdapter {
  if (!userId) return base
  const prefix = `u:${userId}:`
  return {
    get: (key) => base.get(prefix + key),
    set: (key, value) => base.set(prefix + key, value),
    remove: (key) => base.remove(prefix + key),
  }
}
