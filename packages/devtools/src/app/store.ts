/**
 * Devtools state. Signals, so any component that reads a value re-renders
 * when it changes. Tours come from the manager; unsaved edits live in
 * `drafts` and are pushed to the manager (live preview) after a short pause.
 * Drafts are also kept in localStorage and restored on the next load, unless
 * `persist` is off.
 */

import type { Docent, DocentEvent, DocentState, Tour } from '@docentjs/core'
import { computed, effect, signal } from '@preact/signals'
import { loadDrafts, reconcile, type SavedDrafts, saveDrafts, stableJson } from '../drafts'
import { type PerfSnapshot, recordPerf } from '../perf'
import { startOnboarding } from './onboarding'

export type Tab = 'tours' | 'edit' | 'simulate' | 'events' | 'audit' | 'perf'
export type Dock = 'right' | 'left' | 'bottom'

export interface LoggedEvent {
  /** Sequence number, stable across re-renders. */
  id: number
  at: number
  event: DocentEvent
}

interface Prefs {
  open: boolean
  dock: Dock
  /** Panel width when docked left or right. */
  sideSize: number
  /** Panel height when docked at the bottom. */
  bottomSize: number
  tab: Tab
  /** The devtools tour has been offered once. */
  onboarded?: boolean
  /** Older single size, read once for migration. */
  size?: number
}

/** Below this width a side panel would cover the whole page, so the panel docks at the bottom. */
export const NARROW_WIDTH = 640

const isNarrow = (win: Window | undefined) => win !== undefined && win.innerWidth < NARROW_WIDTH

const PREFS_KEY = 'docent-devtools'
const MAX_EVENTS = 300

function loadPrefs(): Partial<Prefs> {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs>
  } catch {
    return {}
  }
}

function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {}
}

export interface StoreOptions {
  open?: boolean
  /** Element to outline on the page when hovering a step (lives outside the shadow root). */
  highlight: (el: Element | null) => void
  /** Let the developer click an element on the page. Resolves null when cancelled. */
  pick: () => Promise<Element | null>
  /** Keep preferences and unsaved edits in localStorage. Default true. */
  persist?: boolean
  /** The window the panel lives in. Default: the global one. */
  window?: Window
  /** Offer the devtools tour the first time the panel opens. Default true. */
  onboarding?: boolean
}

export function createStore(docent: Docent, options: StoreOptions) {
  const persist = options.persist !== false
  const win = options.window ?? (typeof window === 'undefined' ? undefined : window)
  const prefs = persist ? loadPrefs() : {}
  const open = signal(options.open ?? prefs.open ?? false)
  const dock = signal<Dock>(prefs.dock ?? 'right')
  const sideSize = signal(
    prefs.sideSize ?? (prefs.dock !== 'bottom' ? prefs.size : undefined) ?? 420,
  )
  const bottomSize = signal(
    prefs.bottomSize ?? (prefs.dock === 'bottom' ? prefs.size : undefined) ?? 340,
  )
  const narrow = signal(isNarrow(win))
  /** Where the panel actually sits: the chosen dock, or the bottom on narrow screens. */
  const layout = computed<Dock>(() => (narrow.value ? 'bottom' : dock.value))
  const size = computed(() => (layout.value === 'bottom' ? bottomSize.value : sideSize.value))
  const tab = signal<Tab>(prefs.tab ?? 'tours')
  const onboarded = signal(prefs.onboarded ?? false)
  /** Whether the devtools tour is on screen. */
  const onboarding = signal(false)
  let guide: ReturnType<typeof startOnboarding> | undefined
  const state = signal<DocentState>(docent.getState())
  const managerTours = signal<Tour[]>(docent.getTours())
  const drafts = signal<Record<string, Tour>>({})
  const tick = signal(0)
  const events = signal<LoggedEvent[]>([])
  const selection = signal<{ tourId?: string | undefined; stepId?: string | undefined }>({})
  const query = signal('')
  const picking = signal(false)
  const perf = signal<PerfSnapshot>({ steps: [], missingTargets: 0 })
  const mountedAt = Date.now()
  const originals = new Map<string, Tour>()
  /** Drafts from earlier sessions, until their tour shows up in the manager. */
  const saved: SavedDrafts = persist ? loadDrafts() : {}
  /** Code version (stable JSON) each draft started from. */
  const bases = new Map<string, string>()
  const draftTimes = new Map<string, number>()
  /** Tours whose edits were restored from an earlier session. */
  const restored = signal<ReadonlySet<string>>(new Set())
  /** Restored tours whose code changed after the edits were made. */
  const stale = signal<ReadonlySet<string>>(new Set())
  let eventSeq = 0
  const cleanups: Array<() => void> = []

  /** Tours as the devtools shows them: drafts win over the manager's copy. */
  const tours = computed(() => managerTours.value.map((t) => drafts.value[t.id] ?? t))
  const edited = computed(
    () => new Set(Object.keys(drafts.value).filter((id) => drafts.value[id] !== originals.get(id))),
  )

  const refreshTours = () => {
    const list = docent.getTours()
    const restore: Tour[] = []
    for (const t of list) {
      if (originals.has(t.id)) continue
      originals.set(t.id, t)
      const draft = saved[t.id]
      if (!draft) continue
      const verdict = reconcile(draft, t)
      delete saved[t.id]
      if (verdict === 'saved') continue
      bases.set(t.id, draft.base)
      draftTimes.set(t.id, draft.at)
      restore.push(draft.tour)
      restored.value = new Set([...restored.value, t.id])
      if (verdict === 'stale') stale.value = new Set([...stale.value, t.id])
    }
    managerTours.value = list
    if (restore.length > 0) {
      drafts.value = { ...drafts.value, ...Object.fromEntries(restore.map((t) => [t.id, t])) }
      for (const t of restore) void docent.updateTour(t)
    }
  }

  if (persist)
    cleanups.push(
      effect(() => {
        savePrefs({
          open: open.value,
          dock: dock.value,
          sideSize: sideSize.value,
          bottomSize: bottomSize.value,
          tab: tab.value,
          onboarded: onboarded.value,
        })
      }),
    )
  if (persist)
    cleanups.push(
      effect(() => {
        const current = drafts.value
        // Drafts for tours this page has not registered (yet) are kept as they were.
        const out: SavedDrafts = { ...saved }
        for (const [id, tour] of Object.entries(current)) {
          const original = originals.get(id)
          if (!original || tour === original) continue
          out[id] = {
            tour,
            base: bases.get(id) ?? stableJson(original),
            at: draftTimes.get(id) ?? Date.now(),
          }
        }
        saveDrafts(out)
      }),
    )
  cleanups.push(
    docent.subscribe((s) => {
      state.value = s
      refreshTours()
    }),
  )
  let shown = ''
  const follow = (tourId: string, stepId: string | undefined) => {
    const key = `${tourId}\u0000${stepId ?? ''}`
    if (key === shown) return
    shown = key
    selection.value = stepId === undefined ? { tourId } : { tourId, stepId }
  }
  const running = docent.activeController
  if (running) follow(running.tour.id, running.tour.steps[running.getState().index]?.id)
  cleanups.push(
    docent.onEvent((event) => {
      if (event.type === 'step:shown') follow(event.tourId, event.stepId)
      else if (event.type.startsWith('tour:')) shown = ''
      const next = [...events.value, { id: ++eventSeq, at: Date.now(), event }]
      events.value = next.length > MAX_EVENTS ? next.slice(-MAX_EVENTS) : next
      tick.value++
    }),
  )
  const recorder = recordPerf(docent)
  cleanups.push(recorder.subscribe(() => (perf.value = recorder.snapshot())))
  cleanups.push(() => recorder.stop())

  // Targets appear and routes change without telling anyone; re-check while open.
  const timer = setInterval(() => {
    if (open.value) tick.value++
  }, 1000)
  cleanups.push(() => clearInterval(timer))
  const onResize = () => {
    narrow.value = isNarrow(win)
  }
  win?.addEventListener('resize', onResize)
  cleanups.push(() => win?.removeEventListener('resize', onResize))
  const onRoute = () => tick.value++
  win?.addEventListener('popstate', onRoute)
  cleanups.push(() => win?.removeEventListener('popstate', onRoute))
  void docent.ready.then(refreshTours)

  /** Show the devtools tour, from the start. */
  function tour(): void {
    stopTour()
    onboarded.value = true
    open.value = true
    const g = startOnboarding(store)
    guide = g
    onboarding.value = true
    const off = g.subscribe((s) => {
      if (s.status === 'running' || s.status === 'paused' || s.status === 'idle') return
      off()
      if (guide === g) stopTour()
    })
  }
  function stopTour(): void {
    const g = guide
    guide = undefined
    onboarding.value = false
    void g?.destroy()
  }
  cleanups.push(stopTour)
  cleanups.push(
    effect(() => {
      if (!open.value) {
        if (guide) stopTour()
        return
      }
      // Offered once, and never over a tour the app is running.
      if (options.onboarding === false || onboarded.value || state.value.active) return
      setTimeout(() => {
        if (open.value && !onboarded.value) tour()
      }, 300)
    }),
  )

  let commitTimer: ReturnType<typeof setTimeout> | undefined
  let pending: Tour | undefined
  const flush = () => {
    clearTimeout(commitTimer)
    if (pending) void docent.updateTour(pending)
    pending = undefined
  }

  /**
   * Change a tour. The panel updates at once; the running tour re-renders after
   * a short pause (or at once with `immediate`), so typing stays smooth.
   */
  function editTour(id: string, change: (tour: Tour) => Tour, immediate = false): void {
    const current = tours.value.find((t) => t.id === id)
    if (!current) return
    const next = change(current)
    const original = originals.get(id)
    if (original && !bases.has(id)) bases.set(id, stableJson(original))
    draftTimes.set(id, Date.now())
    drafts.value = { ...drafts.value, [id]: next }
    if (pending && pending.id !== id) flush()
    pending = next
    clearTimeout(commitTimer)
    if (immediate) flush()
    else commitTimer = setTimeout(flush, 180)
  }

  function resetTour(id: string): void {
    const original = originals.get(id)
    if (!original) return
    const { [id]: _removed, ...rest } = drafts.value
    bases.delete(id)
    draftTimes.delete(id)
    const without = (set: ReadonlySet<string>) => new Set([...set].filter((x) => x !== id))
    restored.value = without(restored.value)
    stale.value = without(stale.value)
    drafts.value = rest
    if (pending?.id === id) pending = undefined
    void docent.updateTour(original)
  }

  /** Resize the panel along its current axis. */
  function resize(px: number): void {
    if (layout.value === 'bottom') bottomSize.value = px
    else sideSize.value = px
  }

  function select(tourId: string | undefined, stepId?: string, goTo?: Tab): void {
    selection.value = stepId === undefined ? { tourId } : { tourId, stepId }
    if (goTo) tab.value = goTo
  }

  const store = {
    docent,
    /** Whether drafts are kept in localStorage across reloads. */
    persist,
    open,
    dock,
    layout,
    narrow,
    size,
    resize,
    tab,
    state,
    tours,
    drafts,
    edited,
    restored,
    stale,
    tick,
    events,
    selection,
    query,
    picking,
    perf,
    recorder,
    mountedAt,
    highlight: options.highlight,
    pick: async () => {
      picking.value = true
      try {
        return await options.pick()
      } finally {
        picking.value = false
      }
    },
    onboarding,
    tour,
    stopTour,
    editTour,
    resetTour,
    select,
    flush,
    destroy(): void {
      flush()
      for (const c of cleanups) c()
    },
  }
  return store
}

export type Store = ReturnType<typeof createStore>
