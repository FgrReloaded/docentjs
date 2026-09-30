import type { Docent, DocentEvent, Tour } from '@docentjs/core'
import { describe, expect, it, vi } from 'vitest'
import { isPocketFrame, POCKET_NAME, pocketMessage, runGuest, tag } from './pocket'

const ORIGIN = 'http://localhost:5173'

/** A window inside a frame, and the parent it talks to. */
function frameWindow() {
  const parent = { postMessage: vi.fn() }
  let onMessage: ((e: MessageEvent) => void) | undefined
  const win = {
    name: POCKET_NAME,
    parent,
    location: { origin: ORIGIN },
    addEventListener: (_type: string, fn: (e: MessageEvent) => void) => (onMessage = fn),
    removeEventListener: vi.fn(),
  }
  const send = (data: unknown, from: unknown = parent, origin = ORIGIN) =>
    onMessage?.({ data, source: from, origin } as unknown as MessageEvent)
  const posted = () => parent.postMessage.mock.calls.map(([m]) => pocketMessage<object>(m))
  return { win: win as unknown as Window, parent, send, posted }
}

function fakeDocent(controller?: { tour: Tour; index: number }) {
  let listener: ((e: DocentEvent) => void) | undefined
  const docent = {
    ready: Promise.resolve(),
    updateTour: vi.fn(async () => {}),
    start: vi.fn(async () => true),
    stop: vi.fn(async () => {}),
    get activeController() {
      if (!controller) return undefined
      return {
        tour: controller.tour,
        getState: () => ({ index: controller.index }),
        next: vi.fn(),
        back: vi.fn(),
      }
    },
    onEvent: (fn: (e: DocentEvent) => void) => {
      listener = fn
      return () => (listener = undefined)
    },
  }
  const emit = (e: Partial<DocentEvent>) => listener?.(e as DocentEvent)
  return { docent: docent as unknown as Docent, spies: docent, emit }
}

const tour: Tour = {
  schemaVersion: 1,
  id: 'first-run',
  name: 'First run',
  steps: [
    { id: 'hello', title: 'Hello' },
    { id: 'save', title: 'Save' },
  ],
}
const flush = () => new Promise((r) => setTimeout(r, 0))

describe('Pocket guest', () => {
  it('knows when it is inside the Pocket frame', () => {
    const top = { name: POCKET_NAME } as { name: string; parent?: unknown }
    top.parent = top
    expect(isPocketFrame(top as unknown as Window)).toBe(false)
    expect(isPocketFrame(frameWindow().win)).toBe(true)
    expect(isPocketFrame(undefined)).toBe(false)
  })

  it('says it is ready, applies edits once, and goes to the step it is sent to', async () => {
    const { win, send, posted } = frameWindow()
    const { docent, spies } = fakeDocent()
    const stop = runGuest(docent, win)
    expect(posted()[0]).toMatchObject({ kind: 'ready' })

    const edited = { ...tour, name: 'Edited' }
    send(tag({ kind: 'tours', tours: [edited] }))
    send(tag({ kind: 'tours', tours: [edited] }))
    await flush()
    expect(spies.updateTour).toHaveBeenCalledTimes(1)

    send(tag({ kind: 'start', tourId: 'first-run', stepId: 'save' }))
    await flush()
    expect(spies.start).toHaveBeenCalledWith('first-run', { at: 'save' })
    stop()
  })

  it('says it is ready again when the panel asks, with where it is', async () => {
    const { win, send, posted } = frameWindow()
    const { docent } = fakeDocent({ tour, index: 0 })
    runGuest(docent, win)
    const before = posted().length
    send(tag({ kind: 'hello' }))
    await flush()
    const after = posted().slice(before)
    expect(after[0]).toMatchObject({ kind: 'ready' })
    expect(after[1]).toMatchObject({ kind: 'state', tourId: 'first-run', stepId: 'hello' })
  })

  it('ignores messages from anywhere but its parent, and ones that are not its own', async () => {
    const { win, send } = frameWindow()
    const { docent, spies } = fakeDocent()
    runGuest(docent, win)
    send(tag({ kind: 'stop' }), {})
    send(tag({ kind: 'stop' }), undefined, 'https://elsewhere.example')
    send({ kind: 'stop' })
    await flush()
    expect(spies.stop).not.toHaveBeenCalled()
  })

  it('reports the step it shows, and stays put when sent where it already is', async () => {
    const { win, send, posted } = frameWindow()
    const { docent, spies, emit } = fakeDocent({ tour, index: 1 })
    runGuest(docent, win)
    emit({ type: 'step:shown', tourId: 'first-run', stepId: 'save' } as Partial<DocentEvent>)
    await flush()
    expect(posted().at(-1)).toMatchObject({
      kind: 'state',
      tourId: 'first-run',
      stepId: 'save',
      index: 1,
      total: 2,
      title: 'Save',
    })
    send(tag({ kind: 'start', tourId: 'first-run', stepId: 'save' }))
    await flush()
    expect(spies.start).not.toHaveBeenCalled()
  })
})
