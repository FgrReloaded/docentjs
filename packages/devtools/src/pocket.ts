/**
 * Pocket: the page at phone size, in a frame beside the panel. The frame loads
 * the same page, whose devtools notice they are inside it and run as a guest:
 * no panel, only following the main panel's edits and steps, and reporting
 * which step is showing. The two talk through `postMessage`, same origin only.
 */

import type { Docent, Tour } from '@docentjs/core'

/** The frame's name, which is how the page inside knows it is the Pocket. */
export const POCKET_NAME = 'docent-pocket'

export interface PocketSize {
  width: number
  height: number
  /** What the size is: a common phone, or the phone card's breakpoint. */
  hint: string
}

/** Common phone widths, and 480, where tours switch to their phone layout. */
export const POCKET_SIZES: ReadonlyArray<PocketSize> = [
  { width: 360, height: 780, hint: 'Small Android phone' },
  { width: 390, height: 844, hint: 'iPhone 14' },
  { width: 430, height: 932, hint: 'Large phone' },
  { width: 480, height: 900, hint: 'The phone breakpoint' },
]

/** Panel to frame. `hello` asks the frame to say it is ready (again). */
export type ToGuest =
  | { kind: 'hello' }
  | { kind: 'tours'; tours: Tour[] }
  | { kind: 'start'; tourId: string; stepId?: string }
  | { kind: 'next' }
  | { kind: 'back' }
  | { kind: 'stop' }

/** What the frame is showing. */
export interface GuestState {
  tourId?: string
  stepId?: string
  /** Step index, or -1 when no tour is running. */
  index: number
  total: number
  title?: string
}

/** Frame to panel. */
export type FromGuest = { kind: 'ready' } | ({ kind: 'state' } & GuestState)

const TAG = 'docentPocket'

/** Mark a message as ours. */
export function tag<T extends object>(message: T): T & { [TAG]: 1 } {
  return { ...message, [TAG]: 1 }
}

/** The message, when it is one of ours. */
export function pocketMessage<T>(data: unknown): T | undefined {
  return data && typeof data === 'object' && (data as Record<string, unknown>)[TAG] === 1
    ? (data as T)
    : undefined
}

/** Whether this window is the Pocket frame. */
export function isPocketFrame(win: Window | null | undefined): boolean {
  try {
    return !!win && win.name === POCKET_NAME && win.parent !== win
  } catch {
    return false
  }
}

/**
 * Run as the Pocket's guest: apply the panel's edits, go where it says, and
 * report each step shown. Returns the cleanup.
 */
export function runGuest(docent: Docent, win: Window): () => void {
  const origin = win.location.origin
  const post = (message: FromGuest) => win.parent.postMessage(tag(message), origin)
  /** What each tour was last set to, so a repeated edit does not re-render. */
  const applied = new Map<string, string>()

  const report = () => {
    const c = docent.activeController
    if (!c) {
      post({ kind: 'state', index: -1, total: 0 })
      return
    }
    const { index } = c.getState()
    const step = c.tour.steps[index]
    const title = step?.title ?? c.tour.name
    post({
      kind: 'state',
      tourId: c.tour.id,
      ...(step ? { stepId: step.id } : {}),
      index,
      total: c.tour.steps.length,
      ...(title ? { title } : {}),
    })
  }

  /** Ready, and where it is: sent when the guest starts and whenever the panel asks. */
  const greet = () => {
    post({ kind: 'ready' })
    report()
  }

  const handle = (m: ToGuest) => {
    if (m.kind === 'hello') greet()
    else if (m.kind === 'tours') {
      for (const tour of m.tours) {
        const json = JSON.stringify(tour)
        if (applied.get(tour.id) === json) continue
        applied.set(tour.id, json)
        void docent.updateTour(tour)
      }
    } else if (m.kind === 'start') {
      // Already there: nothing to do (the panel follows the frame, and back).
      const c = docent.activeController
      const at = c?.tour.steps[c.getState().index]?.id
      if (c?.tour.id === m.tourId && (m.stepId === undefined || at === m.stepId)) return
      void docent.start(m.tourId, m.stepId === undefined ? {} : { at: m.stepId })
    } else if (m.kind === 'next') void docent.activeController?.next()
    else if (m.kind === 'back') void docent.activeController?.back()
    else void docent.stop()
  }

  const onMessage = (e: MessageEvent) => {
    if (e.source !== win.parent || e.origin !== origin) return
    const m = pocketMessage<ToGuest>(e.data)
    if (m) void docent.ready.then(() => handle(m))
  }
  const off = docent.onEvent((e) => {
    if (e.type === 'step:shown' || e.type.startsWith('tour:')) queueMicrotask(report)
  })
  win.addEventListener('message', onMessage)
  greet()
  return () => {
    off()
    win.removeEventListener('message', onMessage)
  }
}
