import { describe, expect, it } from 'vitest'
import type { Condition, TraitOperator, TraitValue } from '../schema/tour'
import { type ConditionEnv, evaluateAll, evaluateCondition, evaluateTrait } from './conditions'

const env: ConditionEnv = {
  identity: {
    id: 'u1',
    traits: { plan: 'trial', seats: 5, roles: ['admin', 'billing'], beta: true },
  },
  route: '/invoices/new',
  elementExists: (t) => t === '#present',
  tourState: (id) => (id === 'welcome' ? 'completed' : 'not-started'),
  custom: { isWeekend: () => false, over: (args) => (args?.n as number) > 3 },
}

describe('evaluateTrait', () => {
  it.each<[TraitValue | undefined, TraitOperator, TraitValue | undefined, boolean]>([
    ['trial', 'eq', 'trial', true],
    ['trial', 'eq', 'pro', false],
    ['trial', 'neq', 'pro', true],
    [5, 'gt', 3, true],
    [5, 'gte', 5, true],
    [5, 'lt', 3, false],
    [5, 'lte', 5, true],
    ['b', 'gt', 'a', true],
    ['5', 'gt', 3, false],
    ['trial', 'in', ['trial', 'pro'], true],
    ['free', 'in', ['trial', 'pro'], false],
    [['admin', 'x'], 'in', ['admin'], true],
    ['trial', 'nin', ['pro'], true],
    ['hello world', 'contains', 'world', true],
    [['a', 'b'], 'contains', 'b', true],
    [['a', 'b'], 'contains', 'c', false],
    ['x', 'exists', undefined, true],
    [undefined, 'exists', undefined, false],
    [null, 'missing', undefined, true],
    [['a'], 'eq', ['a'], true],
    [['a'], 'eq', ['b'], false],
  ])('%s %s %s → %s', (actual, op, expected, result) => {
    expect(evaluateTrait(actual, op, expected)).toBe(result)
  })
})

describe('evaluateCondition', () => {
  it.each<[string, Condition, boolean]>([
    ['trait', { type: 'trait', key: 'plan', op: 'eq', value: 'trial' }, true],
    ['missing trait', { type: 'trait', key: 'nope', op: 'exists' }, false],
    ['route match', { type: 'route', pattern: '/invoices/*' }, true],
    ['route miss', { type: 'route', pattern: '/settings' }, false],
    ['element present', { type: 'element', target: '#present' }, true],
    ['element absent', { type: 'element', target: '#absent' }, false],
    ['element absent expected', { type: 'element', target: '#absent', exists: false }, true],
    ['tour state', { type: 'tour', id: 'welcome', state: 'completed' }, true],
    ['tour unknown', { type: 'tour', id: 'other', state: 'not-started' }, true],
    ['custom', { type: 'custom', name: 'over', args: { n: 4 } }, true],
    ['custom unknown', { type: 'custom', name: 'nope' }, false],
    [
      'all',
      {
        type: 'all',
        conditions: [
          { type: 'trait', key: 'beta', op: 'eq', value: true },
          { type: 'route', pattern: '/invoices/**' },
        ],
      },
      true,
    ],
    [
      'any',
      {
        type: 'any',
        conditions: [
          { type: 'custom', name: 'isWeekend' },
          { type: 'trait', key: 'seats', op: 'gte', value: 5 },
        ],
      },
      true,
    ],
    ['not', { type: 'not', condition: { type: 'custom', name: 'isWeekend' } }, true],
  ])('%s', (_label, condition, expected) => {
    expect(evaluateCondition(condition, env)).toBe(expected)
  })

  it('treats route conditions as false without a route', () => {
    const { route: _r, ...noRoute } = env
    expect(evaluateCondition({ type: 'route', pattern: '/**' }, noRoute)).toBe(false)
  })

  it('evaluateAll holds for empty lists', () => {
    expect(evaluateAll(undefined, env)).toBe(true)
    expect(evaluateAll([], env)).toBe(true)
    expect(evaluateAll([{ type: 'custom', name: 'isWeekend' }], env)).toBe(false)
  })
})
