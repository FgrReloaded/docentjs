/**
 * Devtools state. Signals, so any component that reads a value re-renders
 * when it changes. Tours come from the manager; unsaved edits live in
 * `drafts` and are pushed to the manager (live preview) after a short pause.
 */

import type { Docent, DocentEvent, DocentState, Tour } from '@docentjs/core'
import { computed, effect, signal } from '@preact/signals'
import { type PerfSnapshot, recordPerf } from '../perf'

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
  size: number
  tab: Tab
}

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
}

export function createStore(docent: Docent, options: StoreOptions) {
  const prefs = loadPrefs()
  const open = signal(options.open ?? prefs.open ?? false)
  const dock = signal<Dock>(prefs.dock ?? 'right')
  const size = signal(prefs.size ?? 420)
  const tab = signal<Tab>(prefs.tab ?? 'tours')
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
  let eventSeq = 0
  const cleanups: Array<() => void> = []

  /** Tours as the devtools shows them: drafts win over the manager's copy. */
  const tours = computed(() => managerTours.value.map((t) => drafts.value[t.id] ?? t))
  const edited = computed(
    () => new Set(Object.keys(drafts.value).filter((id) => drafts.value[id] !== originals.get(id))),
  )

  const refreshTours = () => {
    const list = docent.getTours()
    for (const t of list) if (!originals.has(t.id)) originals.set(t.id, t)
    managerTours.value = list
  }

  cleanups.push(
    effect(() => {
      savePrefs({ open: open.value, dock: dock.value, size: size.value, tab: tab.value })
    }),
  )
  cleanups.push(
    docent.subscribe((s) => {
      state.value = s
      refreshTours()
    }),
  )
  cleanups.push(
    docent.onEvent((event) => {
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
  const onRoute = () => tick.value++
  window.addEventListener('popstate', onRoute)
  cleanups.push(() => window.removeEventListener('popstate', onRoute))
  void docent.ready.then(refreshTours)

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
    drafts.value = rest
    if (pending?.id === id) pending = undefined
    void docent.updateTour(original)
  }

  function select(tourId: string | undefined, stepId?: string, goTo?: Tab): void {
    selection.value = stepId === undefined ? { tourId } : { tourId, stepId }
    if (goTo) tab.value = goTo
  }

  return {
    docent,
    open,
    dock,
    size,
    tab,
    state,
    tours,
    drafts,
    edited,
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
    editTour,
    resetTour,
    select,
    flush,
    destroy(): void {
      flush()
      for (const c of cleanups) c()
    },
  }
}

export type Store = ReturnType<typeof createStore>
