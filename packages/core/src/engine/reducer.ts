/**
 * Pure state machine for a single running tour. No side effects, no timers,
 * no DOM. Eligibility of steps (conditions, missing targets) is supplied by
 * the caller through {@link EngineContext} so the reducer stays pure.
 */

import type { Tour } from '../schema/tour'

export type TourStatus = 'idle' | 'running' | 'paused' | 'completed' | 'skipped' | 'aborted'

export interface EngineState {
  status: TourStatus
  /** Index into `tour.steps`, or -1 when not running. */
  index: number
  /** Indices of previously shown steps, oldest first. Drives `back`. */
  history: number[]
  /** Set when status is `aborted` or `paused`. */
  reason?: string
}

export type EngineAction =
  | { type: 'start'; at?: number | string }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'go'; to: number | string }
  | { type: 'skip' }
  | { type: 'complete' }
  | { type: 'abort'; reason: string }
  | { type: 'pause'; reason: string }
  | { type: 'resume' }
  | { type: 'stepMissing' }
  | { type: 'stepSkipped' }

export interface EngineContext {
  tour: Tour
  /** Whether the step at `index` may be shown right now. */
  isEligible: (index: number) => boolean
}

export const IDLE_STATE: EngineState = Object.freeze({ status: 'idle', index: -1, history: [] })

export function resolveStepIndex(tour: Tour, ref: number | string): number {
  if (typeof ref === 'number') return ref >= 0 && ref < tour.steps.length ? ref : -1
  return tour.steps.findIndex((s) => s.id === ref)
}

/** First eligible index at or after `from` (or at or before, when `dir` is -1). -1 if none. */
export function findEligible(ctx: EngineContext, from: number, dir: 1 | -1 = 1): number {
  const total = ctx.tour.steps.length
  for (let i = from; i >= 0 && i < total; i += dir) {
    if (ctx.isEligible(i)) return i
  }
  return -1
}

function advance(state: EngineState, ctx: EngineContext, record: boolean): EngineState {
  const next = findEligible(ctx, state.index + 1)
  if (next === -1) return { status: 'completed', index: state.index, history: state.history }
  return {
    status: 'running',
    index: next,
    history: record ? [...state.history, state.index] : state.history,
  }
}

export function reduce(state: EngineState, action: EngineAction, ctx: EngineContext): EngineState {
  switch (action.type) {
    case 'start': {
      const at = action.at === undefined ? 0 : resolveStepIndex(ctx.tour, action.at)
      if (at === -1) return { status: 'aborted', index: -1, history: [], reason: 'unknown-step' }
      const first = findEligible(ctx, at)
      if (first === -1) {
        return { status: 'aborted', index: -1, history: [], reason: 'no-eligible-steps' }
      }
      return { status: 'running', index: first, history: [] }
    }

    case 'next':
      if (state.status !== 'running') return state
      return advance(state, ctx, true)

    case 'stepMissing': {
      if (state.status !== 'running') return state
      const step = ctx.tour.steps[state.index]
      if (step?.onMissing === 'abort') {
        return { ...state, status: 'aborted', reason: 'target-missing' }
      }
      // 'skip' and 'wait' (after the wait elapsed) both move on without recording history.
      return advance(state, ctx, false)
    }

    case 'stepSkipped':
      if (state.status !== 'running') return state
      return advance(state, ctx, false)

    case 'back': {
      if (state.status !== 'running') return state
      const history = [...state.history]
      let prev = history.pop()
      // Skip over history entries that are no longer eligible.
      while (prev !== undefined && !ctx.isEligible(prev)) prev = history.pop()
      if (prev === undefined) return state
      return { status: 'running', index: prev, history }
    }

    case 'go': {
      if (state.status !== 'running') return state
      const to = resolveStepIndex(ctx.tour, action.to)
      if (to === -1 || to === state.index || !ctx.isEligible(to)) return state
      return { status: 'running', index: to, history: [...state.history, state.index] }
    }

    case 'pause':
      if (state.status !== 'running') return state
      return { ...state, status: 'paused', reason: action.reason }

    case 'resume': {
      if (state.status !== 'paused') return state
      const { reason: _reason, ...rest } = state
      return { ...rest, status: 'running' }
    }

    case 'skip':
      if (state.status !== 'running' && state.status !== 'paused') return state
      return { status: 'skipped', index: state.index, history: state.history }

    case 'complete':
      if (state.status !== 'running' && state.status !== 'paused') return state
      return { status: 'completed', index: state.index, history: state.history }

    case 'abort':
      if (state.status !== 'running' && state.status !== 'paused') return state
      return { ...state, status: 'aborted', reason: action.reason }
  }
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export function isActive(state: EngineState): boolean {
  return state.status === 'running' || state.status === 'paused'
}

export function isFinished(state: EngineState): boolean {
  return state.status === 'completed' || state.status === 'skipped' || state.status === 'aborted'
}

export function canGoBack(state: EngineState, ctx: EngineContext): boolean {
  return state.status === 'running' && state.history.some((i) => ctx.isEligible(i))
}

/** True when another eligible step follows. False on the last step. */
export function hasNext(state: EngineState, ctx: EngineContext): boolean {
  return state.status === 'running' && findEligible(ctx, state.index + 1) !== -1
}

export interface Progress {
  /** 1-based position of the current step. */
  current: number
  total: number
}

/** Position over all steps, ineligible ones included, so numbers stay stable. */
export function progress(state: EngineState, ctx: EngineContext): Progress {
  return { current: state.index + 1, total: ctx.tour.steps.length }
}
