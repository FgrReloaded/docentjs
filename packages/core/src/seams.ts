/**
 * Extension seams — the interfaces the runtime is built against so that tours,
 * user identity, storage and analytics can come from anywhere: inline JSON,
 * a local file, the user's own backend, or a hosted service.
 */

import type { Tour, TraitValue } from './schema/tour'

export type MaybePromise<T> = T | Promise<T>

// ---------------------------------------------------------------------------
// Tour source
// ---------------------------------------------------------------------------

export interface TourSource {
  /** Return every tour this source knows about. */
  load(): MaybePromise<Tour[]>
  /**
   * Optional live updates. Return an unsubscribe function.
   * Lets a hosted source push tour changes without a page reload.
   */
  subscribe?(listener: (tours: Tour[]) => void): () => void
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export interface Identity {
  /** Stable user id. Omit for anonymous visitors. */
  id?: string
  /** Attributes that `trait` conditions evaluate against. */
  traits: Record<string, TraitValue>
}

export const ANONYMOUS_IDENTITY: Identity = { traits: {} }

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

/**
 * Key/value storage for progress and seen-state. Shape matches `localStorage`
 * but every method may be async so React Native's AsyncStorage fits too.
 */
export interface StorageAdapter {
  get(key: string): MaybePromise<string | null>
  set(key: string, value: string): MaybePromise<void>
  remove(key: string): MaybePromise<void>
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type DocentEventType =
  | 'tour:started'
  | 'tour:completed'
  | 'tour:skipped'
  | 'tour:aborted'
  | 'step:shown'
  | 'step:completed'
  | 'step:skipped'
  | 'step:missing'

export interface DocentEvent {
  type: DocentEventType
  tourId: string
  tourVersion: number
  stepId?: string
  stepIndex?: number
  /** Unix epoch milliseconds. */
  timestamp: number
  identity: Identity
}

/** Receives every lifecycle event. Wire it to console, your analytics, or a hosted endpoint. */
export interface EventSink {
  emit(event: DocentEvent): void
}
