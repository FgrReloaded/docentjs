import { describe, expect, it } from 'vitest'
import { defineTour } from '../define'
import { TourController } from '../engine/controller'
import { createMemoryStorage } from '../engine/progress'
import type { Renderer } from '../engine/renderer'
import type { Target, Tour } from '../schema/tour'
import type { TourSource } from '../seams'
import { Docent, type DocentOptions } from './docent'
import type { DocentEnvironment } from './environment'

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms))
const settle = async () => {
  for (let i = 0; i < 5; i++) await tick()
}
const key = (t: Target) => (typeof t === 'string' ? t : (t.name ?? t.selectors?.[0] ?? ''))

function fakeEnv(route = '/') {
  const elements = new Set<string>()
  const routeListeners = new Set<() => void>()
  const watchers = new Map<string, Set<() => void>>()
  let current = route
  const env: DocentEnvironment = {
    currentRoute: () => current,
    onRouteChange: (l) => {
      routeListeners.add(l)
      return () => routeListeners.delete(l)
    },
    hasTarget: (t) => elements.has(key(t)),
    watchTarget: (t, l) => {
      const k = key(t)
      if (elements.has(k)) l()
      const set = watchers.get(k) ?? new Set()
      set.add(l)
      watchers.set(k, set)
      return () => set.delete(l)
    },
  }
  return {
    env,
    navigate(to: string) {
      current = to
      for (const l of routeListeners) l()
    },
    appear(k: string) {
      elements.add(k)
      for (const l of watchers.get(k) ?? []) l()
    },
  }
}

function setup(tours: Tour[] | TourSource, extra: Partial<DocentOptions> = {}, route = '/') {
  const f = fakeEnv(route)
  const shown: string[] = []
  const controllers: TourController[] = []
  const storage = extra.storage ?? createMemoryStorage()
  const docent = new Docent({
    tours,
    storage,
    environment: f.env,
    createController: (tour, shared) => {
      const renderer: Renderer = {
        hasTarget: f.env.hasTarget,
        waitForTarget: async () => false,
        show: (ctx) => {
          shown.push(`${tour.id}:${ctx.step.id}`)
        },
        hide: () => {},
        currentRoute: () => f.env.currentRoute?.() ?? '/',
      }
      const c = new TourController({ ...shared, tour, renderer })
      controllers.push(c)
      return c
    },
    ...extra,
  })
  const active = () => docent.activeController
  const finish = async () => {
    const c = active()
    if (!c) throw new Error('no active tour')
    while (c.getState().status === 'running') await c.next()
    await settle()
  }
  return { docent, f, shown, controllers, storage, active, finish }
}

const oneStep = (id: string, extra: Partial<Tour> = {}) =>
  defineTour({ id, steps: [{ id: 'only', title: id }], ...extra })

describe('Docent triggers', () => {
  it('starts an auto tour once and never again with the default frequency', async () => {
    const { docent, shown, finish, f } = setup([oneStep('welcome', { trigger: { type: 'auto' } })])
    await docent.ready
    await settle()
    expect(shown).toEqual(['welcome:only'])
    expect(docent.getState().active).toBe('welcome')
    await finish()
    expect(docent.getState().active).toBeNull()
    expect(docent.tourState('welcome')).toBe('completed')
    f.navigate('/elsewhere') // re-arms triggers
    await settle()
    expect(shown).toEqual(['welcome:only'])
  })

  it('never auto-starts tours without a trigger or with a manual trigger', async () => {
    const { docent, shown } = setup([oneStep('a'), oneStep('b', { trigger: { type: 'manual' } })])
    await docent.ready
    await settle()
    expect(shown).toEqual([])
  })

  it('fires route triggers on matching routes only, including after navigation', async () => {
    const { docent, shown, f } = setup([
      oneStep('invoices', { trigger: { type: 'route', pattern: '/invoices/**' } }),
    ])
    await docent.ready
    await settle()
    expect(shown).toEqual([])
    f.navigate('/invoices/new')
    await settle()
    expect(shown).toEqual(['invoices:only'])
  })

  it('fires event triggers through track()', async () => {
    const { docent, shown } = setup([
      oneStep('saved', { trigger: { type: 'event', name: 'invoice-saved' } }),
    ])
    await docent.ready
    docent.track('other')
    docent.track('invoice-saved')
    await settle()
    expect(shown).toEqual(['saved:only'])
  })

  it('fires element triggers when the element appears', async () => {
    const { docent, shown, f } = setup([
      oneStep('menu', { trigger: { type: 'element', target: '#menu' } }),
    ])
    await docent.ready
    await settle()
    expect(shown).toEqual([])
    f.appear('#menu')
    await settle()
    expect(shown).toEqual(['menu:only'])
  })

  it('waits for trigger delays and drops route tours if the user left', async () => {
    const { docent, shown, f } = setup(
      [oneStep('late', { trigger: { type: 'route', pattern: '/a', delay: 20 } })],
      {},
      '/a',
    )
    await docent.ready
    await settle()
    expect(shown).toEqual([])
    await tick(30)
    await settle()
    expect(shown).toEqual(['late:only'])

    const second = setup(
      [oneStep('late2', { trigger: { type: 'route', pattern: '/a', delay: 20 } })],
      {},
      '/a',
    )
    await second.docent.ready
    second.f.navigate('/b')
    await tick(30)
    await settle()
    expect(second.shown).toEqual([])
    void f
  })
})

describe('Docent eligibility', () => {
  it('checks trait conditions and re-evaluates after identify()', async () => {
    const { docent, shown } = setup([
      oneStep('trial', {
        trigger: { type: 'auto' },
        conditions: [{ type: 'trait', key: 'plan', op: 'eq', value: 'trial' }],
      }),
    ])
    await docent.ready
    await settle()
    expect(shown).toEqual([])
    expect(docent.isEligible('trial')).toBe(false)
    await docent.identify('u1', { plan: 'trial' })
    await settle()
    expect(shown).toEqual(['trial:only'])
  })

  it('stores progress per user so another account sees the tour again', async () => {
    const storage = createMemoryStorage()
    const tours = [oneStep('welcome', { trigger: { type: 'auto' } })]
    const first = setup(tours, { storage, identity: { id: 'alice', traits: {} } })
    await first.docent.ready
    await settle()
    await first.finish()
    expect(first.docent.tourState('welcome')).toBe('completed')

    await first.docent.identify('bob')
    await settle()
    expect(first.shown).toEqual(['welcome:only', 'welcome:only'])
    await first.finish()

    await first.docent.identify('alice')
    await settle()
    expect(first.shown).toHaveLength(2)
    expect(first.docent.tourState('welcome')).toBe('completed')
    expect(await storage.get('u:alice:docent:welcome')).toContain('"completed"')
  })

  it('until-completed keeps offering after a skip', async () => {
    const { docent, shown, active, f } = setup([
      oneStep('again', {
        trigger: { type: 'route', pattern: '/**' },
        options: { frequency: 'until-completed' },
      }),
    ])
    await docent.ready
    await settle()
    await active()?.skip()
    await settle()
    expect(docent.tourState('again')).toBe('skipped')
    f.navigate('/next')
    await settle()
    expect(shown).toEqual(['again:only', 'again:only'])
  })

  it('a version bump shows a completed tour again', async () => {
    const storage = createMemoryStorage()
    const v1 = setup([oneStep('news', { trigger: { type: 'auto' } })], { storage })
    await v1.docent.ready
    await settle()
    await v1.finish()
    await v1.docent.destroy()

    const v2 = setup([oneStep('news', { version: 2, trigger: { type: 'auto' } })], { storage })
    await v2.docent.ready
    await settle()
    expect(v2.shown).toEqual(['news:only'])
  })

  it('supports conditions on other tours', async () => {
    const { docent, shown, finish } = setup([
      oneStep('first', { trigger: { type: 'auto' } }),
      oneStep('second', {
        trigger: { type: 'auto' },
        conditions: [{ type: 'tour', id: 'first', state: 'completed' }],
      }),
    ])
    await docent.ready
    await settle()
    expect(shown).toEqual(['first:only'])
    await finish()
    // Finishing `first` re-arms triggers, so the chained tour starts on its own.
    expect(shown).toEqual(['first:only', 'second:only'])
  })

  it('an "always" auto tour does not loop, and shows once per page load', async () => {
    const { docent, shown, finish, f } = setup([
      oneStep('loop', { trigger: { type: 'auto' }, options: { frequency: 'always' } }),
    ])
    await docent.ready
    await settle()
    await finish()
    f.navigate('/other')
    await settle()
    expect(shown).toEqual(['loop:only'])
    await docent.reset('loop')
    await settle()
    expect(shown).toEqual(['loop:only', 'loop:only'])
  })
})

describe('Docent one tour at a time', () => {
  it('queues tours whose trigger fires while another runs', async () => {
    const { docent, shown, finish } = setup([
      oneStep('one', { trigger: { type: 'auto' } }),
      oneStep('two', { trigger: { type: 'auto' } }),
    ])
    await docent.ready
    await settle()
    expect(shown).toEqual(['one:only'])
    await finish()
    expect(shown).toEqual(['one:only', 'two:only'])
    expect(docent.getState().active).toBe('two')
  })

  it('manual start ignores rules and replaces the running tour', async () => {
    const { docent, shown, finish } = setup([
      oneStep('auto', { trigger: { type: 'auto' } }),
      oneStep('help', { conditions: [{ type: 'custom', name: 'never' }] }),
    ])
    await docent.ready
    await settle()
    expect(await docent.start('help')).toBe(true)
    expect(docent.getState().active).toBe('help')
    await finish()
    expect(await docent.start('missing')).toBe(false)

    await docent.start('help')
    await finish()
    expect(shown.filter((s) => s === 'help:only')).toHaveLength(2)
  })

  it('reset() makes a completed tour show again', async () => {
    const { docent, shown, finish } = setup([oneStep('w', { trigger: { type: 'auto' } })])
    await docent.ready
    await settle()
    await finish()
    await docent.reset('w')
    await settle()
    expect(shown).toEqual(['w:only', 'w:only'])
  })

  it('forwards track() to the running tour', async () => {
    const tour = defineTour({
      id: 'ev',
      trigger: { type: 'auto' },
      steps: [{ id: 'wait', advance: { on: 'event', name: 'saved' } }, { id: 'next' }],
    })
    const { docent, shown } = setup([tour])
    await docent.ready
    await settle()
    docent.track('saved')
    await settle()
    expect(shown).toEqual(['ev:wait', 'ev:next'])
  })

  it('resumes persisted tours where they left off', async () => {
    const storage = createMemoryStorage()
    const tour = defineTour({
      id: 'p',
      trigger: { type: 'auto' },
      options: { persist: true },
      steps: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    })
    const first = setup([tour], { storage })
    await first.docent.ready
    await settle()
    await first.active()?.next()
    await first.docent.destroy()

    const second = setup([tour], { storage })
    await second.docent.ready
    await settle()
    expect(second.shown).toEqual(['p:b'])
  })
})

describe('Docent lifecycle', () => {
  it('does nothing until connected when connect is false', async () => {
    let loads = 0
    const source: TourSource = {
      load: async () => {
        loads++
        return [oneStep('w', { trigger: { type: 'auto' } })]
      },
    }
    const { docent, shown } = setup(source, { connect: false })
    await settle()
    expect(loads).toBe(0)
    expect(shown).toEqual([])
    docent.connect()
    await settle()
    expect(loads).toBe(1)
    expect(shown).toEqual(['w:only'])
  })

  it('survives connect, disconnect, connect (React StrictMode) without duplicates', async () => {
    const { docent, shown, f } = setup(
      [
        oneStep('r', {
          trigger: { type: 'route', pattern: '/x' },
          options: { frequency: 'always' },
        }),
      ],
      { connect: false },
    )
    docent.connect()
    void docent.disconnect()
    docent.connect()
    await settle()
    f.navigate('/x')
    await settle()
    expect(shown).toEqual(['r:only'])
    expect(docent.getState().active).toBe('r')

    await docent.disconnect()
    expect(docent.getState().active).toBeNull()
    expect(docent.tourState('r')).toBe('in-progress') // not recorded as skipped
    f.navigate('/y')
    f.navigate('/x')
    await settle()
    expect(shown).toEqual(['r:only'])

    docent.connect()
    await settle()
    expect(shown).toEqual(['r:only', 'r:only'])
  })

  it('manual start works before connecting, and destroy is final', async () => {
    const { docent, shown } = setup([oneStep('m')], { connect: false })
    expect(await docent.start('m')).toBe(true)
    expect(shown).toEqual(['m:only'])
    await docent.destroy()
    docent.connect()
    await settle()
    expect(docent.getState().active).toBeNull()
  })
})

describe('Docent sources and state', () => {
  it('loads from a TourSource and reacts to live updates', async () => {
    let push: ((tours: Tour[]) => void) | undefined
    const source: TourSource = {
      load: async () => [oneStep('a')],
      subscribe: (l) => {
        push = l
        return () => {}
      },
    }
    const { docent, shown } = setup(source)
    const states: Array<string[]> = []
    docent.subscribe((s) => states.push(s.tours))
    await docent.ready
    expect(docent.getState().tours).toEqual(['a'])
    push?.([oneStep('a'), oneStep('b', { trigger: { type: 'auto' } })])
    await settle()
    expect(docent.getState().tours).toEqual(['a', 'b'])
    expect(shown).toEqual(['b:only'])
    expect(states.at(-1)).toEqual(['a', 'b'])
  })

  it('exposes tours, the condition environment and a live event stream', async () => {
    const { docent, finish } = setup([oneStep('w', { trigger: { type: 'auto' } })], {
      identity: { id: 'u', traits: { plan: 'pro' } },
    })
    const events: string[] = []
    docent.onEvent((e) => events.push(`${e.type}:${e.tourId}`))
    await docent.ready
    await settle()
    expect(docent.getTours().map((t) => t.id)).toEqual(['w'])
    expect(docent.getConditionEnv().identity.traits).toEqual({ plan: 'pro' })
    await finish()
    expect(events).toEqual([
      'tour:started:w',
      'step:shown:w',
      'step:completed:w',
      'tour:completed:w',
    ])
  })

  it('destroy stops everything', async () => {
    const { docent, shown, f } = setup([
      oneStep('r', { trigger: { type: 'route', pattern: '/x' } }),
    ])
    await docent.ready
    await docent.destroy()
    f.navigate('/x')
    await settle()
    expect(shown).toEqual([])
  })
})
