import { describe, expect, it } from 'vitest'
import { defineTour } from '../define'
import {
  canGoBack,
  type EngineContext,
  type EngineState,
  hasNext,
  IDLE_STATE,
  isActive,
  isFinished,
  progress,
  reduce,
} from './reducer'

const tour = defineTour({
  id: 't',
  steps: [{ id: 'a' }, { id: 'b' }, { id: 'c', onMissing: 'abort' }, { id: 'd' }],
})

function ctx(ineligible: string[] = []): EngineContext {
  return {
    tour,
    isEligible: (i) => {
      const step = tour.steps[i]
      return step !== undefined && !ineligible.includes(step.id)
    },
  }
}

const running = (index: number, history: number[] = []): EngineState => ({
  status: 'running',
  index,
  history,
})

describe('start', () => {
  it('starts at the first eligible step', () => {
    expect(reduce(IDLE_STATE, { type: 'start' }, ctx())).toEqual(running(0))
    expect(reduce(IDLE_STATE, { type: 'start' }, ctx(['a']))).toEqual(running(1))
  })

  it('starts at a given id or index', () => {
    expect(reduce(IDLE_STATE, { type: 'start', at: 'c' }, ctx())).toEqual(running(2))
    expect(reduce(IDLE_STATE, { type: 'start', at: 3 }, ctx())).toEqual(running(3))
  })

  it('aborts on an unknown step or when nothing is eligible', () => {
    expect(reduce(IDLE_STATE, { type: 'start', at: 'zz' }, ctx())).toMatchObject({
      status: 'aborted',
      reason: 'unknown-step',
    })
    expect(reduce(IDLE_STATE, { type: 'start' }, ctx(['a', 'b', 'c', 'd']))).toMatchObject({
      status: 'aborted',
      reason: 'no-eligible-steps',
    })
  })
})

describe('next / back', () => {
  it('walks forward recording history and completes at the end', () => {
    let s = running(0)
    s = reduce(s, { type: 'next' }, ctx())
    expect(s).toEqual(running(1, [0]))
    s = reduce(s, { type: 'next' }, ctx(['c']))
    expect(s).toEqual(running(3, [0, 1]))
    s = reduce(s, { type: 'next' }, ctx())
    expect(s).toEqual({ status: 'completed', index: 3, history: [0, 1] })
  })

  it('goes back through history and stops at the start', () => {
    let s = running(3, [0, 1])
    s = reduce(s, { type: 'back' }, ctx())
    expect(s).toEqual(running(1, [0]))
    s = reduce(s, { type: 'back' }, ctx())
    expect(s).toEqual(running(0))
    expect(reduce(s, { type: 'back' }, ctx())).toBe(s)
  })

  it('skips history entries that became ineligible', () => {
    const s = reduce(running(3, [0, 1]), { type: 'back' }, ctx(['b']))
    expect(s).toEqual(running(0))
  })

  it('ignores navigation when not running', () => {
    expect(reduce(IDLE_STATE, { type: 'next' }, ctx())).toBe(IDLE_STATE)
    const done: EngineState = { status: 'completed', index: 3, history: [] }
    expect(reduce(done, { type: 'back' }, ctx())).toBe(done)
  })
})

describe('go', () => {
  it('jumps to an eligible step and records history', () => {
    expect(reduce(running(0), { type: 'go', to: 'd' }, ctx())).toEqual(running(3, [0]))
  })

  it('is a no-op for the current, unknown or ineligible step', () => {
    const s = running(0)
    expect(reduce(s, { type: 'go', to: 0 }, ctx())).toBe(s)
    expect(reduce(s, { type: 'go', to: 'zz' }, ctx())).toBe(s)
    expect(reduce(s, { type: 'go', to: 'b' }, ctx(['b']))).toBe(s)
  })
})

describe('missing and skipped steps', () => {
  it('moves on without recording history when a target is missing', () => {
    expect(reduce(running(0, []), { type: 'stepMissing' }, ctx())).toEqual(running(1, []))
    expect(reduce(running(0, []), { type: 'stepSkipped' }, ctx())).toEqual(running(1, []))
  })

  it('aborts when the step says so', () => {
    expect(reduce(running(2), { type: 'stepMissing' }, ctx())).toMatchObject({
      status: 'aborted',
      reason: 'target-missing',
    })
  })

  it('completes when the missing step was the last one', () => {
    expect(reduce(running(3), { type: 'stepMissing' }, ctx())).toMatchObject({
      status: 'completed',
    })
  })
})

describe('pause / resume / end states', () => {
  it('pauses and resumes', () => {
    const paused = reduce(running(1, [0]), { type: 'pause', reason: 'route' }, ctx())
    expect(paused).toEqual({ status: 'paused', index: 1, history: [0], reason: 'route' })
    expect(reduce(paused, { type: 'next' }, ctx())).toBe(paused)
    expect(reduce(paused, { type: 'resume' }, ctx())).toEqual(running(1, [0]))
    expect(reduce(running(1), { type: 'resume' }, ctx())).toEqual(running(1))
  })

  it('skip, complete and abort end the tour from running or paused', () => {
    const paused = reduce(running(1), { type: 'pause', reason: 'x' }, ctx())
    expect(reduce(running(1), { type: 'skip' }, ctx()).status).toBe('skipped')
    expect(reduce(paused, { type: 'skip' }, ctx()).status).toBe('skipped')
    expect(reduce(running(1), { type: 'complete' }, ctx()).status).toBe('completed')
    expect(reduce(running(1), { type: 'abort', reason: 'r' }, ctx())).toMatchObject({
      status: 'aborted',
      reason: 'r',
    })
    expect(reduce(IDLE_STATE, { type: 'skip' }, ctx())).toBe(IDLE_STATE)
  })
})

describe('selectors', () => {
  it('report activity and completion', () => {
    expect(isActive(running(0))).toBe(true)
    expect(isActive(IDLE_STATE)).toBe(false)
    expect(isFinished({ status: 'skipped', index: 0, history: [] })).toBe(true)
    expect(isFinished(running(0))).toBe(false)
  })

  it('canGoBack considers eligibility of history', () => {
    expect(canGoBack(running(1, [0]), ctx())).toBe(true)
    expect(canGoBack(running(1, [0]), ctx(['a']))).toBe(false)
    expect(canGoBack(running(0), ctx())).toBe(false)
  })

  it('hasNext looks past ineligible steps', () => {
    expect(hasNext(running(1), ctx(['c']))).toBe(true)
    expect(hasNext(running(1), ctx(['c', 'd']))).toBe(false)
    expect(hasNext(running(3), ctx())).toBe(false)
  })

  it('progress counts every step so numbers stay stable', () => {
    expect(progress(running(2), ctx(['b']))).toEqual({ current: 3, total: 4 })
  })
})
