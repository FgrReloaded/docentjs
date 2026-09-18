import { describe, expect, it } from 'vitest'
import { defineTour } from '../define'
import {
  createMemoryStorage,
  ProgressStore,
  shouldShow,
  storageKey,
  type TourRecord,
} from './progress'

const record = (partial: Partial<TourRecord>): TourRecord => ({
  tourId: 't',
  version: 1,
  state: 'completed',
  updatedAt: 0,
  ...partial,
})

describe('shouldShow', () => {
  const once = defineTour({ id: 't', steps: [] })
  const untilDone = defineTour({ id: 't', steps: [], options: { frequency: 'until-completed' } })
  const always = defineTour({ id: 't', steps: [], options: { frequency: 'always' } })

  it('shows every tour to a user with no record', () => {
    expect(shouldShow(once, null)).toBe(true)
  })

  it('once: never again after any outcome, unless interrupted', () => {
    expect(shouldShow(once, record({ state: 'completed' }))).toBe(false)
    expect(shouldShow(once, record({ state: 'skipped' }))).toBe(false)
    expect(shouldShow(once, record({ state: 'in-progress' }))).toBe(true)
  })

  it('until-completed: keeps offering after a skip', () => {
    expect(shouldShow(untilDone, record({ state: 'skipped' }))).toBe(true)
    expect(shouldShow(untilDone, record({ state: 'completed' }))).toBe(false)
  })

  it('always: shows regardless', () => {
    expect(shouldShow(always, record({ state: 'completed' }))).toBe(true)
  })

  it('a version bump re-shows a completed tour', () => {
    const v2 = defineTour({ id: 't', version: 2, steps: [] })
    expect(shouldShow(v2, record({ version: 1, state: 'completed' }))).toBe(true)
    expect(shouldShow(v2, record({ version: 2, state: 'completed' }))).toBe(false)
  })
})

describe('ProgressStore', () => {
  it('round-trips records through storage', async () => {
    const storage = createMemoryStorage()
    const store = new ProgressStore(storage)
    const r = record({ state: 'in-progress', stepId: 's2', updatedAt: 42 })
    await store.set(r)
    expect(await storage.get(storageKey('t'))).toBe(JSON.stringify(r))
    expect(await store.get('t')).toEqual(r)
    await store.clear('t')
    expect(await store.get('t')).toBeNull()
  })

  it('ignores corrupt or foreign records', async () => {
    const storage = createMemoryStorage()
    const store = new ProgressStore(storage)
    await storage.set(storageKey('t'), '{not json')
    expect(await store.get('t')).toBeNull()
    await storage.set(storageKey('t'), JSON.stringify({ tourId: 'other', version: 1, state: 'x' }))
    expect(await store.get('t')).toBeNull()
  })
})
