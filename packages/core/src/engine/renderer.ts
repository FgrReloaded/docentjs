/**
 * The contract between the core controller and a platform renderer
 * (DOM today, React Native later). The renderer draws; the controller decides.
 */

import type { Step, Target, Tour } from '../schema/tour'
import type { MaybePromise } from '../seams'
import type { Progress } from './reducer'

export interface RenderActions {
  next(): void
  back(): void
  skip(): void
  /** Jump to a step by id or index. */
  goTo(step: number | string): void
}

export interface RenderContext {
  tour: Tour
  step: Step
  index: number
  progress: Progress
  isFirst: boolean
  isLast: boolean
  canGoBack: boolean
  actions: RenderActions
}

export interface Renderer {
  /** Synchronous presence check. Used for `element` conditions and missing-target handling. */
  hasTarget(target: Target): boolean
  /**
   * Wait up to `timeoutMs` for the target to appear. Resolve `true` when it does.
   * Must resolve promptly (with `false`) when `signal` aborts.
   */
  waitForTarget(target: Target, timeoutMs: number, signal: AbortSignal): Promise<boolean>
  /** Render the step. The renderer wires user gestures to `ctx.actions`. */
  show(ctx: RenderContext): MaybePromise<void>
  /** Remove everything from screen. Called on finish and before each new step. */
  hide(): MaybePromise<void>
  /** Current route path, when the platform has one. */
  currentRoute?(): string
}
