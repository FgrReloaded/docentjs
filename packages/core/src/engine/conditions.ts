/**
 * Evaluates serialisable {@link Condition}s against a runtime environment.
 * Pure: everything it needs is passed in.
 */

import type { Condition, Target, TourProgressState, TraitValue } from '../schema/tour'
import type { Identity } from '../seams'
import { matchRoute } from './route'

export type CustomPredicate = (args?: Record<string, TraitValue>) => boolean

export interface ConditionEnv {
  identity: Identity
  /** Current path, e.g. `/invoices/new`. */
  route?: string
  elementExists?: (target: Target) => boolean
  tourState?: (tourId: string) => TourProgressState
  custom?: Record<string, CustomPredicate>
}

function sameValue(a: TraitValue | undefined, b: TraitValue | undefined): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => v === b[i])
  }
  return a === b
}

function compare(a: TraitValue | undefined, b: TraitValue | undefined): number | null {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0
  return null
}

function contains(haystack: TraitValue | undefined, needle: TraitValue | undefined): boolean {
  if (Array.isArray(haystack)) return typeof needle === 'string' && haystack.includes(needle)
  if (typeof haystack === 'string') {
    return (
      (typeof needle === 'string' || typeof needle === 'number') &&
      haystack.includes(String(needle))
    )
  }
  return false
}

function inList(value: TraitValue | undefined, list: TraitValue | undefined): boolean {
  if (!Array.isArray(list)) return false
  if (Array.isArray(value)) return value.some((v) => list.includes(v))
  return typeof value === 'string' && list.includes(value)
}

export function evaluateTrait(
  actual: TraitValue | undefined,
  op: Extract<Condition, { type: 'trait' }>['op'],
  expected: TraitValue | undefined,
): boolean {
  switch (op) {
    case 'exists':
      return actual !== undefined && actual !== null
    case 'missing':
      return actual === undefined || actual === null
    case 'eq':
      return sameValue(actual, expected)
    case 'neq':
      return !sameValue(actual, expected)
    case 'in':
      return inList(actual, expected)
    case 'nin':
      return !inList(actual, expected)
    case 'contains':
      return contains(actual, expected)
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const c = compare(actual, expected)
      if (c === null) return false
      if (op === 'gt') return c > 0
      if (op === 'gte') return c >= 0
      if (op === 'lt') return c < 0
      return c <= 0
    }
  }
}

export function evaluateCondition(condition: Condition, env: ConditionEnv): boolean {
  switch (condition.type) {
    case 'trait':
      return evaluateTrait(env.identity.traits[condition.key], condition.op, condition.value)
    case 'route':
      return env.route !== undefined && matchRoute(condition.pattern, env.route)
    case 'element': {
      const exists = env.elementExists?.(condition.target) ?? false
      return exists === (condition.exists ?? true)
    }
    case 'tour':
      return (env.tourState?.(condition.id) ?? 'not-started') === condition.state
    case 'all':
      return condition.conditions.every((c) => evaluateCondition(c, env))
    case 'any':
      return condition.conditions.some((c) => evaluateCondition(c, env))
    case 'not':
      return !evaluateCondition(condition.condition, env)
    case 'custom':
      return env.custom?.[condition.name]?.(condition.args) ?? false
  }
}

/** All conditions must hold. An empty or missing list holds. */
export function evaluateAll(conditions: Condition[] | undefined, env: ConditionEnv): boolean {
  return (conditions ?? []).every((c) => evaluateCondition(c, env))
}
