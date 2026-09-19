// @vitest-environment jsdom
import { createMemoryStorage, defineTour } from '@docentjs/core'
import { createDocent } from '@docentjs/dom'
import { afterEach, describe, expect, it } from 'vitest'
import { explainTour } from './explain'

const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
}

afterEach(() => {
  document.body.innerHTML = ''
  history.pushState({}, '', '/')
})

function manager(...tours: ReturnType<typeof defineTour>[]) {
  return createDocent({
    tours,
    storage: createMemoryStorage(),
    identity: { id: 'u', traits: { plan: 'pro' } },
  })
}

const find = (d: ReturnType<typeof manager>, id: string) => {
  const tour = d.getTours().find((t) => t.id === id)
  if (!tour) throw new Error(id)
  return explainTour(d, tour)
}

describe('explainTour', () => {
  it('explains a failed trait condition with the actual value', async () => {
    const d = manager(
      defineTour({
        id: 'trial',
        trigger: { type: 'auto' },
        conditions: [{ type: 'trait', key: 'plan', op: 'eq', value: 'trial' }],
        steps: [{ id: 's' }],
      }),
    )
    await d.ready
    const x = find(d, 'trial')
    expect(x.verdict).toBe('blocked')
    expect(x.summary).toBe('Condition failed: trait plan eq "trial" (user has "pro")')
    expect(x.conditions).toEqual([
      { text: 'trait plan eq "trial" (user has "pro")', passed: false },
    ])
    await d.destroy()
  })

  it('reports running, manual, waiting and frequency-blocked tours', async () => {
    const d = manager(
      defineTour({ id: 'auto', trigger: { type: 'auto' }, steps: [{ id: 's' }] }),
      defineTour({ id: 'manual', steps: [{ id: 's' }] }),
      defineTour({
        id: 'route',
        trigger: { type: 'route', pattern: '/billing' },
        steps: [{ id: 's' }],
      }),
      defineTour({ id: 'event', trigger: { type: 'event', name: 'saved' }, steps: [{ id: 's' }] }),
    )
    await d.ready
    await settle()
    expect(find(d, 'auto').verdict).toBe('running')
    expect(find(d, 'manual')).toMatchObject({ verdict: 'manual', summary: 'Manual only' })
    expect(find(d, 'route')).toMatchObject({
      verdict: 'waiting',
      summary: 'Eligible; waiting for route /billing',
    })
    expect(find(d, 'event').summary).toBe("Eligible; waiting for track('saved')")

    await d.activeController?.next()
    await settle()
    expect(find(d, 'auto')).toMatchObject({
      verdict: 'blocked',
      summary:
        'Already completed; frequency "once" will not show it again until the version changes',
    })
    await d.destroy()
  })
})
