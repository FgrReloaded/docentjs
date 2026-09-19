/**
 * The tour manager. Holds many tours, watches their triggers, checks
 * conditions and frequency, and starts at most one at a time. This is what
 * turns the rules in the tour JSON into behaviour.
 */

import { type ConditionEnv, type CustomPredicate, evaluateAll } from '../engine/conditions'
import type { ControllerOptions, TourController } from '../engine/controller'
import {
  createMemoryStorage,
  ProgressStore,
  shouldShow,
  type TourRecord,
  tourVersion,
} from '../engine/progress'
import { matchRoute } from '../engine/route'
import type { TourHooks } from '../hooks'
import type { Tour, TourProgressState, TraitValue, Trigger } from '../schema/tour'
import {
  ANONYMOUS_IDENTITY,
  type DocentEvent,
  type EventSink,
  type Identity,
  type StorageAdapter,
  type TourSource,
} from '../seams'
import type { DocentEnvironment } from './environment'
import { scopeStorage } from './scoped-storage'

/** Options every controller the manager creates receives. */
export type SharedControllerOptions = Omit<ControllerOptions, 'tour' | 'renderer'>

export interface DocentOptions {
  /** Tours to manage: an array, or a source that loads (and may live-update) them. */
  tours?: Tour[] | TourSource
  identity?: Identity
  storage?: StorageAdapter
  sink?: EventSink
  /** Hooks per tour, keyed by tour id. */
  hooks?: Record<string, TourHooks>
  /** Predicates for `custom` conditions, by name. */
  custom?: Record<string, CustomPredicate>
  environment: DocentEnvironment
  /** Builds a platform controller for a tour. The DOM package supplies this. */
  createController: (tour: Tour, options: SharedControllerOptions) => TourController
  now?: () => number
  /**
   * Start watching triggers right away. Default true. Framework bindings pass
   * `false` and call `connect()` / `disconnect()` from their mount lifecycle,
   * which keeps construction free of side effects (React StrictMode).
   */
  connect?: boolean
}

export interface DocentState {
  /** Id of the tour currently running or paused, if any. */
  active: string | null
  /** Tours known to the manager. */
  tours: string[]
}

export type DocentListener = (state: DocentState) => void

export interface StartOptions {
  /** Step id or index to start from. */
  at?: number | string
}

type Cleanup = () => void

function isTourSource(value: Tour[] | TourSource | undefined): value is TourSource {
  return !!value && !Array.isArray(value) && typeof (value as TourSource).load === 'function'
}

export class Docent {
  private readonly options: DocentOptions
  private readonly env: DocentEnvironment
  private readonly baseStorage: StorageAdapter
  private identity: Identity
  private store: ProgressStore
  private tours = new Map<string, Tour>()
  private records = new Map<string, TourRecord | null>()
  private controller: TourController | undefined
  private activeId: string | null = null
  /** Tours whose trigger fired while another tour was running. */
  private queue: string[] = []
  private triggerCleanups: Cleanup[] = []
  /** `auto` triggers fire once per manager instance (per page load), not on every re-arm. */
  private readonly autoFired = new Set<string>()
  private readonly cleanups: Cleanup[] = []
  private readonly timers = new Set<ReturnType<typeof setTimeout>>()
  private readonly listeners = new Set<DocentListener>()
  private readonly eventListeners = new Set<(event: DocentEvent) => void>()
  private destroyed = false
  private loading: Promise<void> | undefined
  /** Wanted by the owner (between connect and disconnect). */
  private connected = false
  /** Listening to routes, the source and triggers. */
  private attached = false

  constructor(options: DocentOptions) {
    this.options = options
    this.env = options.environment
    this.identity = options.identity ?? ANONYMOUS_IDENTITY
    this.baseStorage = options.storage ?? createMemoryStorage()
    this.store = new ProgressStore(scopeStorage(this.baseStorage, this.identity.id))
    if (options.connect !== false) this.connect()
  }

  /** Resolves once tours and progress are loaded. Loading starts on first use. */
  get ready(): Promise<void> {
    this.loading ??= this.load()
    return this.loading
  }

  /** Start watching routes, the tour source and triggers. Idempotent. */
  connect(): void {
    if (this.destroyed || this.connected) return
    this.connected = true
    void this.ready.then(() => {
      if (this.connected && !this.attached && !this.destroyed) this.attach()
    })
  }

  /**
   * Stop watching and remove any running tour without recording an outcome.
   * `connect()` resumes. Unlike `destroy()`, the manager stays usable.
   */
  async disconnect(): Promise<void> {
    this.connected = false
    if (this.attached) {
      this.attached = false
      this.disarmTriggers()
      for (const c of this.cleanups) c()
      this.cleanups.length = 0
    }
    this.queue = []
    await this.stopActive()
    this.emitState()
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** The tours currently managed. */
  getTours(): Tour[] {
    return [...this.tours.values()]
  }

  /**
   * Observe every lifecycle event from every tour, in addition to the `sink`
   * option. Returns an unsubscribe function. Used by devtools.
   */
  onEvent(listener: (event: DocentEvent) => void): () => void {
    this.eventListeners.add(listener)
    return () => this.eventListeners.delete(listener)
  }

  getState(): DocentState {
    return { active: this.activeId, tours: [...this.tours.keys()] }
  }

  subscribe(listener: DocentListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** The controller of the running tour, for fine-grained control. */
  get activeController(): TourController | undefined {
    return this.controller
  }

  /**
   * Set who the user is. Progress is stored per user id, and traits feed
   * `trait` conditions. Re-evaluates triggers, since the user may now qualify.
   */
  async identify(id: string | undefined, traits: Record<string, TraitValue> = {}): Promise<void> {
    await this.ready
    const userChanged = id !== this.identity.id
    this.identity = id === undefined ? { traits } : { id, traits }
    if (userChanged) {
      this.autoFired.clear()
      this.store = new ProgressStore(scopeStorage(this.baseStorage, id))
      await this.loadRecords()
    }
    this.armTriggers()
  }

  /**
   * Report something that happened in your app. Starts tours with a matching
   * `event` trigger and advances a running step waiting on that event.
   */
  track(eventName: string): void {
    this.controller?.notify(eventName)
    for (const tour of this.tours.values()) {
      const t = tour.trigger
      if (t?.type === 'event' && t.name === eventName) this.fire(tour.id)
    }
  }

  /**
   * Start a tour now, ignoring its trigger, conditions and frequency. Use for
   * "take the tour" buttons. Stops any tour already running.
   */
  async start(tourId: string, options: StartOptions = {}): Promise<boolean> {
    await this.ready
    const tour = this.tours.get(tourId)
    if (!tour) return false
    await this.stopActive()
    await this.run(tour, options.at, true)
    return true
  }

  /** Whether a tour's conditions hold and its frequency allows showing it now. */
  isEligible(tourId: string): boolean {
    const tour = this.tours.get(tourId)
    if (!tour) return false
    return (
      shouldShow(tour, this.records.get(tourId) ?? null) &&
      evaluateAll(tour.conditions, this.getConditionEnv())
    )
  }

  /** Progress state of a tour for the current user. */
  tourState(tourId: string): TourProgressState {
    const tour = this.tours.get(tourId)
    const record = this.records.get(tourId)
    if (!record) return 'not-started'
    if (tour && record.version < tourVersion(tour)) return 'not-started'
    return record.state
  }

  /**
   * Replace a tour's definition, e.g. from a live editor. If it is running, the
   * current step re-renders with the new content. Triggers are not re-armed, so
   * editing never starts a tour by itself.
   */
  async updateTour(tour: Tour): Promise<void> {
    await this.ready
    this.tours.set(tour.id, tour)
    if (this.activeId === tour.id) await this.controller?.updateTour(tour)
    this.emitState()
  }

  /** Forget progress for one tour, or all of them, so they show again. */
  async reset(tourId?: string): Promise<void> {
    await this.ready
    const ids = tourId ? [tourId] : [...this.tours.keys()]
    for (const id of ids) {
      await this.store.clear(id)
      this.records.set(id, null)
      this.autoFired.delete(id)
    }
    this.armTriggers()
  }

  /**
   * Re-check triggers and tell the running tour the route may have changed.
   * Call after navigation if your router does not emit browser navigation events.
   */
  async refresh(): Promise<void> {
    await this.ready
    this.armTriggers()
    await this.controller?.routeChanged()
  }

  /** Stop the running tour (recorded as skipped). */
  async stop(): Promise<void> {
    await this.controller?.skip()
  }

  async destroy(): Promise<void> {
    await this.disconnect()
    this.destroyed = true
    this.listeners.clear()
    this.eventListeners.clear()
  }

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  private async load(): Promise<void> {
    const source = this.options.tours
    const initial = isTourSource(source) ? await source.load() : (source ?? [])
    this.setTours(initial)
    await this.loadRecords()
  }

  private attach(): void {
    this.attached = true
    const source = this.options.tours
    if (isTourSource(source) && source.subscribe) {
      this.cleanups.push(
        source.subscribe((tours) => {
          this.setTours(tours)
          void this.loadRecords().then(() => this.armTriggers())
        }),
      )
    }
    if (this.env.onRouteChange) {
      this.cleanups.push(this.env.onRouteChange(() => this.armTriggers()))
    }
    this.armTriggers()
  }

  private setTours(tours: Tour[]): void {
    this.tours = new Map(tours.map((t) => [t.id, t]))
    this.queue = this.queue.filter((id) => this.tours.has(id))
    this.emitState()
  }

  private async loadRecords(): Promise<void> {
    const entries = await Promise.all(
      [...this.tours.keys()].map(async (id) => [id, await this.store.get(id)] as const),
    )
    this.records = new Map(entries)
  }

  // -------------------------------------------------------------------------
  // Triggers
  // -------------------------------------------------------------------------

  private disarmTriggers(): void {
    for (const c of this.triggerCleanups) c()
    this.triggerCleanups = []
    for (const t of this.timers) clearTimeout(t)
    this.timers.clear()
  }

  /**
   * (Re)arm every trigger. Cheap; called on load, identify, route change,
   * source updates and after a tour finishes (so chained tours can start).
   * `except` skips one tour, used for the tour that just finished.
   */
  private armTriggers(except?: string): void {
    if (this.destroyed || !this.attached) return
    this.disarmTriggers()
    for (const tour of this.tours.values()) {
      const trigger = tour.trigger
      if (!trigger || tour.id === except) continue
      this.arm(tour, trigger)
    }
  }

  private arm(tour: Tour, trigger: Trigger): void {
    switch (trigger.type) {
      case 'manual':
      case 'event':
        return
      case 'auto':
        // Marked as used in fire() only once it actually starts or queues, so a tour
        // that was not eligible at load can still start when the user qualifies.
        if (this.autoFired.has(tour.id)) return
        this.fireAfter(tour.id, trigger.delay)
        return
      case 'route': {
        const route = this.env.currentRoute?.()
        if (route !== undefined && matchRoute(trigger.pattern, route))
          this.fireAfter(tour.id, trigger.delay)
        return
      }
      case 'element': {
        if (!this.env.watchTarget) {
          if (this.env.hasTarget(trigger.target)) this.fireAfter(tour.id, trigger.delay)
          return
        }
        this.triggerCleanups.push(
          this.env.watchTarget(trigger.target, () => this.fireAfter(tour.id, trigger.delay)),
        )
      }
    }
  }

  private fireAfter(tourId: string, delay: number | undefined): void {
    if (!delay) {
      this.fire(tourId)
      return
    }
    const timer = setTimeout(() => {
      this.timers.delete(timer)
      this.fire(tourId)
    }, delay)
    this.timers.add(timer)
  }

  /** A trigger fired: start the tour if eligible, or queue it behind the running one. */
  private fire(tourId: string): void {
    if (this.destroyed || !this.attached || tourId === this.activeId) return
    if (!this.isEligible(tourId) || !this.triggerStillHolds(tourId)) return
    if (this.tours.get(tourId)?.trigger?.type === 'auto') this.autoFired.add(tourId)
    if (this.activeId) {
      if (!this.queue.includes(tourId)) this.queue.push(tourId)
      return
    }
    const tour = this.tours.get(tourId)
    if (tour) void this.run(tour, undefined, false)
  }

  /** Route triggers are only valid while the user is still on a matching route. */
  private triggerStillHolds(tourId: string): boolean {
    const trigger = this.tours.get(tourId)?.trigger
    if (trigger?.type !== 'route') return true
    const route = this.env.currentRoute?.()
    return route !== undefined && matchRoute(trigger.pattern, route)
  }

  // -------------------------------------------------------------------------
  // Running
  // -------------------------------------------------------------------------

  /** What conditions are evaluated against right now. Used by `isEligible` and devtools. */
  getConditionEnv(): ConditionEnv {
    const env: ConditionEnv = {
      identity: this.identity,
      elementExists: (t) => this.env.hasTarget(t),
      tourState: (id) => this.tourState(id),
      custom: this.options.custom ?? {},
    }
    const route = this.env.currentRoute?.()
    if (route !== undefined) env.route = route
    return env
  }

  private sharedOptions(tour: Tour): SharedControllerOptions {
    const shared: SharedControllerOptions = {
      identity: this.identity,
      storage: scopeStorage(this.baseStorage, this.identity.id),
      tourState: (id) => this.tourState(id),
    }
    shared.sink = {
      emit: (event) => {
        this.options.sink?.emit(event)
        for (const l of this.eventListeners) l(event)
      },
    }
    const hooks = this.options.hooks?.[tour.id]
    if (hooks) shared.hooks = hooks
    if (this.options.custom) shared.custom = this.options.custom
    if (this.options.now) shared.now = this.options.now
    return shared
  }

  private async run(tour: Tour, at: number | string | undefined, manual: boolean): Promise<void> {
    this.queue = this.queue.filter((id) => id !== tour.id)
    const controller = this.options.createController(tour, this.sharedOptions(tour))
    this.controller = controller
    this.activeId = tour.id
    // Mirror what the controller persists, so tourState() is right while it runs.
    this.records.set(tour.id, {
      tourId: tour.id,
      version: tourVersion(tour),
      state: 'in-progress',
      updatedAt: (this.options.now ?? Date.now)(),
    })
    this.emitState()

    const off = controller.subscribe((state) => {
      if (
        state.status === 'completed' ||
        state.status === 'skipped' ||
        state.status === 'aborted'
      ) {
        off()
        this.finished(controller, tour, state.status === 'completed' ? 'completed' : 'skipped')
      }
    })

    const resume = !manual && at === undefined && tour.options?.persist
    if (resume) await controller.resume()
    else await controller.start(at)

    // start() returned without running (nothing happened): release the slot.
    if (controller.getState().status === 'idle' && this.controller === controller) {
      off()
      this.release(controller)
    }
  }

  /**
   * The controller emits the final status before it finishes writing storage,
   * so record the outcome here directly instead of reading it back.
   */
  private finished(controller: TourController, tour: Tour, state: 'completed' | 'skipped'): void {
    if (this.controller !== controller) return
    this.records.set(tour.id, {
      tourId: tour.id,
      version: tourVersion(tour),
      state,
      updatedAt: (this.options.now ?? Date.now)(),
    })
    this.release(controller, tour.id)
  }

  private release(controller: TourController, finishedId?: string): void {
    this.controller = undefined
    this.activeId = null
    this.emitState()
    // Let the finished controller complete its own cleanup (hide, persist, events) first.
    setTimeout(() => {
      void controller.destroy()
      this.drainQueue()
      // Tours whose conditions depend on the one that just ended may now qualify.
      if (!this.activeId) this.armTriggers(finishedId)
    }, 0)
  }

  /** Stop the running tour without recording an outcome (used before a manual start). */
  private async stopActive(): Promise<void> {
    const controller = this.controller
    if (!controller) return
    this.controller = undefined
    this.activeId = null
    await controller.destroy()
  }

  private drainQueue(): void {
    while (this.queue.length > 0 && !this.activeId) {
      const next = this.queue.shift()
      if (next) this.fire(next)
    }
  }

  private emitState(): void {
    const state = this.getState()
    for (const l of this.listeners) l(state)
  }
}
