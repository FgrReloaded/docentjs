/**
 * Orchestrates one tour: drives the pure reducer, talks to the renderer,
 * runs hooks, persists progress and emits events. This is the only stateful,
 * side-effectful piece of the core.
 */

import type { StepContext, TourHooks } from '../hooks'
import type { Step, Tour, TourProgressState } from '../schema/tour'
import { ANONYMOUS_IDENTITY, type EventSink, type Identity, type StorageAdapter } from '../seams'
import { type ConditionEnv, type CustomPredicate, evaluateCondition } from './conditions'
import { createEvent, NOOP_SINK } from './events'
import { createMemoryStorage, ProgressStore, type TourRecord, tourVersion } from './progress'
import {
  canGoBack,
  type EngineAction,
  type EngineContext,
  type EngineState,
  hasNext,
  IDLE_STATE,
  isFinished,
  progress,
  reduce,
} from './reducer'
import type { RenderContext, Renderer } from './renderer'
import { matchRoute } from './route'

export interface ControllerOptions {
  tour: Tour
  renderer: Renderer
  identity?: Identity
  storage?: StorageAdapter
  sink?: EventSink
  hooks?: TourHooks
  /** Predicates for `custom` conditions, by name. */
  custom?: Record<string, CustomPredicate>
  /** Progress of other tours, for `tour` conditions. */
  tourState?: (tourId: string) => TourProgressState
  /** How long `onMissing: 'wait'` waits when the step sets no `waitFor`. */
  defaultWaitMs?: number
  now?: () => number
}

export type StateListener = (state: EngineState) => void

const DEFAULT_WAIT_MS = 3000

export class TourController {
  readonly tour: Tour
  private state: EngineState = IDLE_STATE
  private readonly renderer: Renderer
  private readonly identity: Identity
  private readonly store: ProgressStore
  private readonly sink: EventSink
  private readonly hooks: TourHooks
  private readonly custom: Record<string, CustomPredicate>
  private readonly tourStateOf: ((tourId: string) => TourProgressState) | undefined
  private readonly defaultWaitMs: number
  private readonly now: () => number
  private readonly listeners = new Set<StateListener>()

  /** Bumped whenever an async flow must be abandoned. */
  private generation = 0
  private pendingAbort: AbortController | undefined
  private pendingTimer: ReturnType<typeof setTimeout> | undefined

  constructor(options: ControllerOptions) {
    this.tour = options.tour
    this.renderer = options.renderer
    this.identity = options.identity ?? ANONYMOUS_IDENTITY
    this.store = new ProgressStore(options.storage ?? createMemoryStorage())
    this.sink = options.sink ?? NOOP_SINK
    this.hooks = options.hooks ?? {}
    this.custom = options.custom ?? {}
    this.tourStateOf = options.tourState
    this.defaultWaitMs = options.defaultWaitMs ?? DEFAULT_WAIT_MS
    this.now = options.now ?? Date.now
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  getState(): EngineState {
    return this.state
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Start from the first eligible step, or from `at` (step id or index). */
  async start(at?: number | string): Promise<void> {
    if (this.state.status === 'running' || this.state.status === 'paused') return
    this.cancelPending()
    this.dispatch(at === undefined ? { type: 'start' } : { type: 'start', at })
    if (isFinished(this.state)) return this.finish()
    this.emit('tour:started')
    this.hooks.onStart?.(this.tour)
    await this.persist('in-progress')
    await this.showCurrent()
  }

  /** Start where the user left off, according to persisted progress. */
  async resume(): Promise<void> {
    const record = await this.store.get(this.tour.id)
    if (record?.state === 'in-progress' && record.version === tourVersion(this.tour)) {
      return this.start(record.stepId)
    }
    return this.start()
  }

  async next(): Promise<void> {
    if (this.state.status !== 'running') return
    await this.leaveCurrent()
    this.emit('step:completed', this.state.index)
    this.dispatch({ type: 'next' })
    await this.afterTransition()
  }

  async back(): Promise<void> {
    if (!canGoBack(this.state, this.context())) return
    await this.leaveCurrent()
    this.dispatch({ type: 'back' })
    await this.afterTransition()
  }

  async goTo(step: number | string): Promise<void> {
    if (this.state.status !== 'running') return
    const before = this.state
    const after = reduce(before, { type: 'go', to: step }, this.context())
    if (after === before) return
    await this.leaveCurrent()
    this.setState(after)
    await this.afterTransition()
  }

  /** The user gave up on the tour (Skip button, close, Escape). */
  async skip(): Promise<void> {
    if (!this.isActive()) return
    const ctx = this.stepContext()
    await this.leaveCurrent()
    this.dispatch({ type: 'skip' })
    await this.finish()
    if (ctx) this.hooks.onSkip?.(ctx)
  }

  async abort(reason: string): Promise<void> {
    if (!this.isActive()) return
    await this.leaveCurrent()
    this.dispatch({ type: 'abort', reason })
    await this.finish()
  }

  /** Report a named application event. Advances a step waiting on it. */
  notify(eventName: string): void {
    const step = this.currentStep()
    const advance = step?.advance
    if (typeof advance === 'object' && advance.on === 'event' && advance.name === eventName) {
      void this.next()
    }
  }

  /** Tell the controller the route changed. Pauses or resumes route-bound steps. */
  async routeChanged(): Promise<void> {
    const step = this.currentStep()
    if (!step) return
    const onRoute = this.stepOnRoute(step)
    if (this.state.status === 'paused' && this.state.reason === 'route' && onRoute) {
      this.dispatch({ type: 'resume' })
      await this.showCurrent()
    } else if (this.state.status === 'running' && !onRoute) {
      this.cancelPending()
      this.dispatch({ type: 'pause', reason: 'route' })
      await this.renderer.hide()
    }
  }

  /** Stop everything and clear the screen without recording an outcome. */
  async destroy(): Promise<void> {
    this.cancelPending()
    this.listeners.clear()
    await this.renderer.hide()
    this.state = IDLE_STATE
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private isActive(): boolean {
    return this.state.status === 'running' || this.state.status === 'paused'
  }

  private currentStep(): Step | undefined {
    return this.isActive() ? this.tour.steps[this.state.index] : undefined
  }

  private conditionEnv(): ConditionEnv {
    const env: ConditionEnv = {
      identity: this.identity,
      elementExists: (t) => this.renderer.hasTarget(t),
      custom: this.custom,
    }
    const route = this.renderer.currentRoute?.()
    if (route !== undefined) env.route = route
    if (this.tourStateOf) env.tourState = this.tourStateOf
    return env
  }

  private context(): EngineContext {
    const env = this.conditionEnv()
    return {
      tour: this.tour,
      isEligible: (i) => {
        const step = this.tour.steps[i]
        if (!step) return false
        return step.condition ? evaluateCondition(step.condition, env) : true
      },
    }
  }

  private stepOnRoute(step: Step): boolean {
    const route = this.renderer.currentRoute?.()
    if (!step.route || route === undefined) return true
    return matchRoute(step.route, route)
  }

  private dispatch(action: EngineAction): void {
    this.setState(reduce(this.state, action, this.context()))
  }

  private setState(next: EngineState): void {
    if (next === this.state) return
    this.state = next
    for (const l of this.listeners) l(next)
  }

  private stepContext(): StepContext | undefined {
    const step = this.currentStep()
    if (!step) return undefined
    return { tour: this.tour, step, index: this.state.index, total: this.tour.steps.length }
  }

  private emit(type: Parameters<typeof createEvent>[0], stepIndex?: number): void {
    const input: Parameters<typeof createEvent>[1] = {
      tour: this.tour,
      identity: this.identity,
      now: this.now,
    }
    if (stepIndex !== undefined) input.stepIndex = stepIndex
    this.sink.emit(createEvent(type, input))
  }

  private async persist(state: TourProgressState): Promise<void> {
    const record: TourRecord = {
      tourId: this.tour.id,
      version: tourVersion(this.tour),
      state,
      updatedAt: this.now(),
    }
    const step = this.currentStep()
    if (state === 'in-progress' && step) record.stepId = step.id
    await this.store.set(record)
  }

  private cancelPending(): void {
    this.generation++
    this.pendingAbort?.abort()
    this.pendingAbort = undefined
    if (this.pendingTimer !== undefined) clearTimeout(this.pendingTimer)
    this.pendingTimer = undefined
  }

  /** Run `beforeHide` for the step being left, if any. */
  private async leaveCurrent(): Promise<void> {
    const ctx = this.stepContext()
    this.cancelPending()
    if (ctx && this.state.status === 'running') {
      await this.hooks.steps?.[ctx.step.id]?.beforeHide?.(ctx)
    }
  }

  private async afterTransition(): Promise<void> {
    if (this.state.status === 'running') return this.showCurrent()
    if (isFinished(this.state)) return this.finish()
  }

  private async finish(): Promise<void> {
    this.cancelPending()
    await this.renderer.hide()
    switch (this.state.status) {
      case 'completed':
        this.emit('tour:completed')
        await this.persist('completed')
        this.hooks.onComplete?.(this.tour)
        break
      case 'skipped':
        this.emit('tour:skipped')
        await this.persist('skipped')
        break
      case 'aborted':
        this.emit('tour:aborted')
        await this.persist('skipped')
        this.hooks.onAbort?.(this.tour, this.state.reason ?? 'unknown')
        break
    }
  }

  private async showCurrent(): Promise<void> {
    this.cancelPending()
    const generation = this.generation
    const stale = () => generation !== this.generation
    const ctx = this.stepContext()
    if (!ctx) return
    const { step } = ctx

    if (!this.stepOnRoute(step)) {
      this.dispatch({ type: 'pause', reason: 'route' })
      await this.renderer.hide()
      return
    }

    const proceed = await this.hooks.steps?.[step.id]?.beforeShow?.(ctx)
    if (stale()) return
    if (proceed === false) {
      this.emit('step:skipped', this.state.index)
      this.dispatch({ type: 'stepSkipped' })
      return this.afterTransition()
    }

    if (step.target !== undefined && !(await this.ensureTarget(step, generation))) {
      if (stale()) return
      this.emit('step:missing', this.state.index)
      this.dispatch({ type: 'stepMissing' })
      return this.afterTransition()
    }
    if (stale()) return

    await this.renderer.show(this.renderContext(ctx))
    if (stale()) return
    this.emit('step:shown', this.state.index)
    this.hooks.onStepChange?.(ctx)
    await this.persist('in-progress')
    await this.hooks.steps?.[step.id]?.afterShow?.(ctx)
    if (stale()) return
    this.armAdvance(step, generation)
  }

  /** Resolve `true` when the target is present, waiting if the step allows it. */
  private async ensureTarget(step: Step, generation: number): Promise<boolean> {
    const target = step.target
    if (target === undefined) return true
    if (this.renderer.hasTarget(target)) return true
    const waitMs = step.waitFor ?? (step.onMissing === 'wait' ? this.defaultWaitMs : 0)
    if (waitMs <= 0) return false
    const abort = new AbortController()
    this.pendingAbort = abort
    const found = await this.renderer.waitForTarget(target, waitMs, abort.signal)
    if (generation !== this.generation) return false
    this.pendingAbort = undefined
    return found
  }

  /** Set up automatic advancement for `delay` and `element` steps. */
  private armAdvance(step: Step, generation: number): void {
    const advance = step.advance
    if (typeof advance !== 'object') return
    if (advance.on === 'delay') {
      this.pendingTimer = setTimeout(() => {
        this.pendingTimer = undefined
        if (generation === this.generation) void this.next()
      }, advance.ms)
    } else if (advance.on === 'element') {
      const abort = new AbortController()
      this.pendingAbort = abort
      void this.renderer
        .waitForTarget(advance.target, Number.POSITIVE_INFINITY, abort.signal)
        .then((found) => {
          if (found && generation === this.generation) void this.next()
        })
    }
  }

  private renderContext(ctx: StepContext): RenderContext {
    const engineCtx = this.context()
    return {
      tour: this.tour,
      step: ctx.step,
      index: ctx.index,
      progress: progress(this.state, engineCtx),
      isFirst: this.state.history.length === 0,
      isLast: !hasNext(this.state, engineCtx),
      canGoBack: canGoBack(this.state, engineCtx),
      actions: {
        next: () => void this.next(),
        back: () => void this.back(),
        skip: () => void this.skip(),
        goTo: (s) => void this.goTo(s),
      },
    }
  }
}
