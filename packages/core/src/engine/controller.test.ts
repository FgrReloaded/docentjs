import { describe, expect, it, vi } from 'vitest'
import { defineTour } from '../define'
import type { TourHooks } from '../hooks'
import type { Target, Tour } from '../schema/tour'
import type { DocentEvent, DocentEventType } from '../seams'
import { TourController } from './controller'
import { createMemoryStorage, ProgressStore } from './progress'
import type { RenderContext, Renderer } from './renderer'

const tick = () => new Promise((r) => setTimeout(r, 0))
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function key(t: Target): string {
  return typeof t === 'string' ? t : (t.name ?? t.selectors?.[0] ?? '')
}

/** In-memory renderer that records calls and lets tests make targets appear. */
function fakeRenderer(present: string[] = [], route?: string) {
  const targets = new Set(present)
  const waiters = new Map<string, (found: boolean) => void>()
  const shown: RenderContext[] = []
  let hides = 0
  let currentRoute = route
  const renderer: Renderer & {
    shown: RenderContext[]
    hides: () => number
    last: () => RenderContext | undefined
    appear: (t: string) => void
    setRoute: (r: string) => void
  } = {
    hasTarget: (t) => targets.has(key(t)),
    waitForTarget: (t, ms, signal) =>
      new Promise((resolve) => {
        const k = key(t)
        if (targets.has(k)) return resolve(true)
        const done = (found: boolean) => {
          waiters.delete(k)
          clearTimeout(timer)
          resolve(found)
        }
        const timer = Number.isFinite(ms) ? setTimeout(() => done(false), ms) : undefined
        signal.addEventListener('abort', () => done(false), { once: true })
        waiters.set(k, done)
      }),
    show: (ctx) => {
      shown.push(ctx)
    },
    hide: () => {
      hides++
    },
    currentRoute: () => currentRoute ?? '/',
    shown,
    hides: () => hides,
    last: () => shown[shown.length - 1],
    appear: (t) => {
      targets.add(t)
      waiters.get(t)?.(true)
    },
    setRoute: (r) => {
      currentRoute = r
    },
  }
  if (route === undefined) Reflect.deleteProperty(renderer, 'currentRoute')
  return renderer
}

function recorder() {
  const events: DocentEvent[] = []
  return {
    events,
    types: () => events.map((e) => e.type),
    sink: { emit: (e: DocentEvent) => void events.push(e) },
  }
}

const threeSteps = defineTour({
  id: 'three',
  version: 2,
  steps: [{ id: 'intro' }, { id: 'a', target: '#a' }, { id: 'b', target: { name: 'b' } }],
})

function setup(tour: Tour, opts: { present?: string[]; route?: string; hooks?: TourHooks } = {}) {
  const renderer = fakeRenderer(opts.present ?? ['#a', 'b'], opts.route)
  const rec = recorder()
  const storage = createMemoryStorage()
  const options: ConstructorParameters<typeof TourController>[0] = {
    tour,
    renderer,
    sink: rec.sink,
    storage,
    identity: { id: 'u1', traits: { plan: 'trial' } },
    now: () => 1000,
  }
  if (opts.hooks) options.hooks = opts.hooks
  const controller = new TourController(options)
  return { controller, renderer, rec, storage, store: new ProgressStore(storage) }
}

describe('TourController happy path', () => {
  it('walks every step and completes', async () => {
    const onComplete = vi.fn()
    const { controller, renderer, rec, store } = setup(threeSteps, { hooks: { onComplete } })

    await controller.start()
    expect(controller.getState()).toMatchObject({ status: 'running', index: 0 })
    expect(renderer.last()).toMatchObject({
      step: { id: 'intro' },
      progress: { current: 1, total: 3 },
      isFirst: true,
      isLast: false,
      canGoBack: false,
    })
    expect(await store.get('three')).toMatchObject({
      state: 'in-progress',
      stepId: 'intro',
      version: 2,
    })

    await controller.next()
    expect(renderer.last()).toMatchObject({ step: { id: 'a' }, isFirst: false, canGoBack: true })

    await controller.next()
    expect(renderer.last()).toMatchObject({ step: { id: 'b' }, isLast: true })

    await controller.next()
    expect(controller.getState().status).toBe('completed')
    expect(renderer.hides()).toBe(1)
    expect(onComplete).toHaveBeenCalledWith(threeSteps)
    expect(await store.get('three')).toMatchObject({ state: 'completed' })
    expect(rec.types()).toEqual<DocentEventType[]>([
      'tour:started',
      'step:shown',
      'step:completed',
      'step:shown',
      'step:completed',
      'step:shown',
      'step:completed',
      'tour:completed',
    ])
    expect(rec.events[1]).toMatchObject({
      tourId: 'three',
      tourVersion: 2,
      stepId: 'intro',
      stepIndex: 0,
      timestamp: 1000,
      identity: { id: 'u1' },
    })
  })

  it('goes back through history and jumps by id', async () => {
    const { controller, renderer } = setup(threeSteps)
    await controller.start()
    await controller.next()
    await controller.back()
    expect(renderer.last()?.step.id).toBe('intro')
    await controller.back()
    expect(renderer.last()?.step.id).toBe('intro')
    await controller.goTo('b')
    expect(renderer.last()?.step.id).toBe('b')
    expect(controller.getState().history).toEqual([0])
  })

  it('renderer actions drive the controller', async () => {
    const { controller, renderer } = setup(threeSteps)
    await controller.start()
    renderer.last()?.actions.next()
    await tick()
    expect(renderer.last()?.step.id).toBe('a')
    renderer.last()?.actions.skip()
    await tick()
    expect(controller.getState().status).toBe('skipped')
  })

  it('ignores a second start while active', async () => {
    const { controller, renderer } = setup(threeSteps)
    await controller.start()
    await controller.start('b')
    expect(renderer.shown).toHaveLength(1)
  })
})

describe('skip, abort and hooks', () => {
  it('skip records the outcome and calls onSkip with the step', async () => {
    const onSkip = vi.fn()
    const { controller, rec, store } = setup(threeSteps, { hooks: { onSkip } })
    await controller.start()
    await controller.next()
    await controller.skip()
    expect(controller.getState().status).toBe('skipped')
    expect(rec.types().at(-1)).toBe('tour:skipped')
    expect(await store.get('three')).toMatchObject({ state: 'skipped' })
    expect(onSkip).toHaveBeenCalledWith(
      expect.objectContaining({ step: { id: 'a', target: '#a' }, index: 1 }),
    )
  })

  it('abort reports the reason', async () => {
    const onAbort = vi.fn()
    const { controller, rec } = setup(threeSteps, { hooks: { onAbort } })
    await controller.start()
    await controller.abort('user-logged-out')
    expect(rec.types().at(-1)).toBe('tour:aborted')
    expect(onAbort).toHaveBeenCalledWith(threeSteps, 'user-logged-out')
  })

  it('runs step hooks in order and lets beforeShow skip a step', async () => {
    const calls: string[] = []
    const hooks: TourHooks = {
      onStart: () => void calls.push('onStart'),
      onStepChange: (c) => void calls.push(`change:${c.step.id}`),
      steps: {
        intro: {
          beforeShow: () => void calls.push('before:intro'),
          afterShow: () => void calls.push('after:intro'),
          beforeHide: () => void calls.push('hide:intro'),
        },
        a: { beforeShow: () => false },
      },
    }
    const { controller, renderer, rec } = setup(threeSteps, { hooks })
    await controller.start()
    await controller.next()
    expect(renderer.last()?.step.id).toBe('b')
    expect(calls).toEqual([
      'onStart',
      'before:intro',
      'change:intro',
      'after:intro',
      'hide:intro',
      'change:b',
    ])
    expect(rec.types()).toContain('step:skipped')
    expect(controller.getState().history).toEqual([0])
  })
})

describe('missing targets', () => {
  it('skips a missing target by default', async () => {
    const { controller, renderer, rec } = setup(threeSteps, { present: ['b'] })
    await controller.start()
    await controller.next()
    expect(renderer.last()?.step.id).toBe('b')
    expect(rec.types()).toContain('step:missing')
  })

  it('waits for a target that appears in time', async () => {
    const tour = defineTour({
      id: 'w',
      steps: [{ id: 'a', target: '#a', onMissing: 'wait', waitFor: 50 }],
    })
    const { controller, renderer } = setup(tour, { present: [] })
    const started = controller.start()
    await tick()
    expect(renderer.shown).toHaveLength(0)
    renderer.appear('#a')
    await started
    expect(renderer.last()?.step.id).toBe('a')
  })

  it('gives up after the wait and moves on', async () => {
    const tour = defineTour({
      id: 'w',
      steps: [{ id: 'a', target: '#a', waitFor: 5 }, { id: 'b' }],
    })
    const { controller, renderer } = setup(tour, { present: [] })
    await controller.start()
    expect(renderer.last()?.step.id).toBe('b')
  })

  it('aborts when the step demands the target', async () => {
    const tour = defineTour({
      id: 'w',
      steps: [{ id: 'a', target: '#a', onMissing: 'abort' }],
    })
    const onAbort = vi.fn()
    const { controller } = setup(tour, { present: [], hooks: { onAbort } })
    await controller.start()
    expect(controller.getState()).toMatchObject({ status: 'aborted', reason: 'target-missing' })
    expect(onAbort).toHaveBeenCalledWith(tour, 'target-missing')
  })

  it('a skip during a wait cancels it', async () => {
    const tour = defineTour({
      id: 'w',
      steps: [{ id: 'a', target: '#a', onMissing: 'wait' }],
    })
    const { controller, renderer } = setup(tour, { present: [] })
    const started = controller.start()
    await tick()
    await controller.skip()
    renderer.appear('#a')
    await started
    expect(renderer.shown).toHaveLength(0)
    expect(controller.getState().status).toBe('skipped')
  })
})

describe('conditions', () => {
  it('skips steps whose condition fails and shows stable progress', async () => {
    const tour = defineTour({
      id: 'c',
      steps: [
        { id: 'a' },
        { id: 'pro-only', condition: { type: 'trait', key: 'plan', op: 'eq', value: 'pro' } },
        { id: 'has-b', condition: { type: 'element', target: { name: 'b' } } },
        { id: 'z' },
      ],
    })
    const { controller, renderer } = setup(tour)
    await controller.start()
    await controller.next()
    expect(renderer.last()).toMatchObject({
      step: { id: 'has-b' },
      progress: { current: 3, total: 4 },
    })
    await controller.next()
    expect(renderer.last()?.step.id).toBe('z')
    await controller.back()
    expect(renderer.last()?.step.id).toBe('has-b')
  })
})

describe('advance modes', () => {
  it('advances on a named event', async () => {
    const tour = defineTour({
      id: 'e',
      steps: [{ id: 'a', advance: { on: 'event', name: 'saved' } }, { id: 'b' }],
    })
    const { controller, renderer } = setup(tour)
    await controller.start()
    controller.notify('other')
    await tick()
    expect(renderer.last()?.step.id).toBe('a')
    controller.notify('saved')
    await tick()
    expect(renderer.last()?.step.id).toBe('b')
  })

  it('advances after a delay', async () => {
    const tour = defineTour({
      id: 'd',
      steps: [{ id: 'a', advance: { on: 'delay', ms: 5 } }, { id: 'b' }],
    })
    const { controller, renderer } = setup(tour)
    await controller.start()
    expect(renderer.last()?.step.id).toBe('a')
    await wait(15)
    expect(renderer.last()?.step.id).toBe('b')
  })

  it('advances when an element appears', async () => {
    const tour = defineTour({
      id: 'el',
      steps: [{ id: 'a', advance: { on: 'element', target: '#menu' } }, { id: 'b' }],
    })
    const { controller, renderer } = setup(tour)
    await controller.start()
    renderer.appear('#menu')
    await tick()
    expect(renderer.last()?.step.id).toBe('b')
  })
})

describe('routes', () => {
  const tour = defineTour({
    id: 'r',
    steps: [
      { id: 'home', route: '/' },
      { id: 'settings', route: '/settings/**' },
    ],
  })

  it('pauses on a step whose route is not current and resumes on navigation', async () => {
    const { controller, renderer } = setup(tour, { route: '/' })
    await controller.start()
    await controller.next()
    expect(controller.getState()).toMatchObject({ status: 'paused', reason: 'route' })
    expect(renderer.hides()).toBe(1)
    renderer.setRoute('/settings/profile')
    await controller.routeChanged()
    expect(controller.getState().status).toBe('running')
    expect(renderer.last()?.step.id).toBe('settings')
  })

  it('pauses when the user navigates away from the current step', async () => {
    const { controller, renderer } = setup(tour, { route: '/' })
    await controller.start()
    renderer.setRoute('/elsewhere')
    await controller.routeChanged()
    expect(controller.getState().status).toBe('paused')
    renderer.setRoute('/')
    await controller.routeChanged()
    expect(controller.getState().status).toBe('running')
  })

  it('ignores routes when the renderer has none', async () => {
    const { controller, renderer } = setup(tour)
    await controller.start()
    await controller.next()
    expect(renderer.last()?.step.id).toBe('settings')
  })
})

describe('persistence and resume', () => {
  it('resumes from the persisted step for the same version', async () => {
    const first = setup(threeSteps)
    await first.controller.start()
    await first.controller.next()

    const renderer = fakeRenderer(['#a', 'b'])
    const second = new TourController({ tour: threeSteps, renderer, storage: first.storage })
    await second.resume()
    expect(renderer.last()?.step.id).toBe('a')
  })

  it('starts over when the tour version changed', async () => {
    const first = setup(threeSteps)
    await first.controller.start()
    await first.controller.next()

    const renderer = fakeRenderer(['#a', 'b'])
    const v3 = defineTour({ ...threeSteps, version: 3 })
    const second = new TourController({ tour: v3, renderer, storage: first.storage })
    await second.resume()
    expect(renderer.last()?.step.id).toBe('intro')
  })

  it('updateTour re-renders the current step with new content', async () => {
    const { controller, renderer } = setup(threeSteps)
    await controller.start()
    await controller.next()
    const edited = defineTour({
      ...threeSteps,
      steps: threeSteps.steps.map((s) => (s.id === 'a' ? { ...s, title: 'Edited' } : s)),
    })
    await controller.updateTour(edited)
    expect(renderer.last()).toMatchObject({ step: { id: 'a', title: 'Edited' }, index: 1 })
    expect(controller.getState()).toMatchObject({ status: 'running', index: 1, history: [0] })
  })

  it('updateTour falls back to the nearest step when the current one is removed', async () => {
    const { controller, renderer } = setup(threeSteps)
    await controller.start('b')
    await controller.updateTour(defineTour({ ...threeSteps, steps: threeSteps.steps.slice(0, 2) }))
    expect(renderer.last()?.step.id).toBe('a')
    await controller.updateTour(defineTour({ ...threeSteps, steps: [] }))
    expect(controller.getState()).toMatchObject({ status: 'aborted', reason: 'tour-emptied' })
  })

  it('can start again right after destroy without the reset clobbering it', async () => {
    const { controller, renderer } = setup(threeSteps)
    await controller.start()
    const destroyed = controller.destroy()
    await controller.start()
    await destroyed
    expect(controller.getState()).toMatchObject({ status: 'running', index: 0 })
    expect(renderer.shown).toHaveLength(2)
  })

  it('notifies subscribers and destroy clears the screen', async () => {
    const { controller, renderer } = setup(threeSteps)
    const seen: string[] = []
    const off = controller.subscribe((s) => void seen.push(s.status))
    await controller.start()
    off()
    await controller.destroy()
    expect(seen).toEqual(['running'])
    expect(renderer.hides()).toBe(1)
    expect(controller.getState().status).toBe('idle')
  })
})
