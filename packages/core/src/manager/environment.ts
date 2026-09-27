/**
 * What the manager needs from the platform to evaluate triggers. The DOM
 * package implements it with `location`, navigation events and a
 * MutationObserver; a native package would use its router and view tree.
 */

import type { BeaconOpen, Target, Tour } from '../schema/tour'

/** A beacon the manager wants on screen, with the callbacks that drive its tour. */
export interface BeaconRequest {
  tour: Tour
  target: Target
  open: BeaconOpen
  /** Accessible name of the beacon. */
  label: string
  /** The beacon became visible. Called once. */
  onShown(): void
  /** Start the tour. False when it cannot start now (another tour is running). */
  onOpen(via: BeaconOpen): boolean
  /** Close the tour the beacon opened: a second click, or a hover preview left behind. */
  onClose(): void
}

export interface BeaconHandle {
  /** The beacon's tour ended and the beacon stays: go back to waiting. */
  reset(): void
  remove(): void
}

export interface DocentEnvironment {
  /** Current path, e.g. `/invoices/new`. Omit on platforms without routes. */
  currentRoute?(): string
  /** Call `listener` after every navigation. Returns an unsubscribe function. */
  onRouteChange?(listener: () => void): () => void
  /** Synchronous presence check, for `element` conditions. */
  hasTarget(target: Target): boolean
  /**
   * Call `listener` whenever the target goes from absent to present, including
   * immediately if it is already present. Returns an unsubscribe function.
   */
  watchTarget?(target: Target, listener: () => void): () => void
  /** Viewport width in px, for `minViewportWidth`. Omit on platforms without one. */
  viewportWidth?(): number | undefined
  /** Call `listener` when the viewport is resized. Returns an unsubscribe function. */
  onViewportChange?(listener: () => void): () => void
  /** Draw a beacon until it is removed. Without this, beacon tours never show. */
  showBeacon?(request: BeaconRequest): BeaconHandle
}
