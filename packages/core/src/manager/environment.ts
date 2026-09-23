/**
 * What the manager needs from the platform to evaluate triggers. The DOM
 * package implements it with `location`, navigation events and a
 * MutationObserver; a native package would use its router and view tree.
 */

import type { Target } from '../schema/tour'

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
}
