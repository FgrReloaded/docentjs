/**
 * Persisted per-tour progress: what the user has seen, where they stopped,
 * and whether the tour should be offered again.
 */

import type { Frequency, Tour, TourProgressState } from '../schema/tour'
import type { StorageAdapter } from '../seams'

export interface TourRecord {
  tourId: string
  version: number
  state: TourProgressState
  /** Step to resume from when the tour was interrupted. */
  stepId?: string
  /** Unix epoch milliseconds. */
  updatedAt: number
}

export const STORAGE_PREFIX = 'docent:'

export function storageKey(tourId: string): string {
  return `${STORAGE_PREFIX}${tourId}`
}

export function tourVersion(tour: Tour): number {
  return tour.version ?? 1
}

/** Whether a tour should be offered given what the user has already done. */
export function shouldShow(tour: Tour, record: TourRecord | null): boolean {
  if (!record) return true
  if (record.version < tourVersion(tour)) return true
  const frequency: Frequency = tour.options?.frequency ?? 'once'
  switch (frequency) {
    case 'always':
      return true
    case 'until-completed':
      return record.state !== 'completed'
    case 'once':
      return record.state === 'not-started' || record.state === 'in-progress'
  }
}

export class ProgressStore {
  constructor(private readonly storage: StorageAdapter) {}

  async get(tourId: string): Promise<TourRecord | null> {
    const raw = await this.storage.get(storageKey(tourId))
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as Partial<TourRecord>
      if (parsed.tourId !== tourId || typeof parsed.version !== 'number' || !parsed.state) {
        return null
      }
      return parsed as TourRecord
    } catch {
      return null
    }
  }

  async set(record: TourRecord): Promise<void> {
    await this.storage.set(storageKey(record.tourId), JSON.stringify(record))
  }

  async clear(tourId: string): Promise<void> {
    await this.storage.remove(storageKey(tourId))
  }
}

/** In-memory adapter. Default when no storage is configured, and handy in tests. */
export function createMemoryStorage(): StorageAdapter {
  const map = new Map<string, string>()
  return {
    get: (key) => map.get(key) ?? null,
    set: (key, value) => {
      map.set(key, value)
    },
    remove: (key) => {
      map.delete(key)
    },
  }
}
