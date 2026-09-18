/**
 * Runtime hooks. These are functions, so they are attached in code rather
 * than stored in the tour JSON. Step hooks are keyed by step id.
 */

import type { Step, Tour } from './schema/tour'
import type { MaybePromise } from './seams'

export interface StepContext {
  tour: Tour
  step: Step
  index: number
  total: number
}

export interface StepHooks {
  /**
   * Runs before the step renders. Open a menu, navigate, fetch data.
   * Return `false` to skip the step; return nothing to continue.
   */
  beforeShow?(ctx: StepContext): MaybePromise<undefined | false>
  afterShow?(ctx: StepContext): MaybePromise<void>
  beforeHide?(ctx: StepContext): MaybePromise<void>
}

export interface TourHooks {
  onStart?(tour: Tour): void
  onStepChange?(ctx: StepContext): void
  onComplete?(tour: Tour): void
  onSkip?(ctx: StepContext): void
  onAbort?(tour: Tour, reason: string): void
  /** Per-step hooks, keyed by step id. */
  steps?: Record<string, StepHooks>
}
