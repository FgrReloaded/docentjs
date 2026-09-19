/**
 * Answers "why is (or isn't) this tour showing?" from the manager's public
 * state. Kept in devtools so none of this ships in production bundles.
 */

import {
  type Condition,
  type ConditionEnv,
  type Docent,
  evaluateCondition,
  matchRoute,
  type Target,
  type Tour,
  type TourProgressState,
  type TraitValue,
} from '@docentjs/core'

export type TourVerdict = 'running' | 'eligible' | 'waiting' | 'blocked' | 'manual'

export interface ConditionCheck {
  text: string
  passed: boolean
}

export interface TourExplanation {
  tour: Tour
  verdict: TourVerdict
  /** One sentence for the list view. */
  summary: string
  /** `text` describes the trigger; `awaiting` is what it waits for when not holding. */
  trigger: { text: string; awaiting: string; holds: boolean | null }
  frequency: { rule: string; state: TourProgressState; allows: boolean }
  conditions: ConditionCheck[]
}

export function describeTarget(target: Target): string {
  if (typeof target === 'string') return target
  if (target.name) return `[data-docent="${target.name}"]`
  return target.selectors?.[0] ?? '(empty target)'
}

function show(value: TraitValue | undefined): string {
  if (value === undefined) return 'missing'
  return JSON.stringify(value)
}

/** Human text for a condition, including the actual value where that helps. */
export function describeCondition(c: Condition, env: ConditionEnv): string {
  switch (c.type) {
    case 'trait': {
      const actual = env.identity.traits[c.key]
      const expected = c.op === 'exists' || c.op === 'missing' ? '' : ` ${show(c.value)}`
      return `trait ${c.key} ${c.op}${expected} (user has ${show(actual)})`
    }
    case 'route':
      return `route matches ${c.pattern} (now ${env.route ?? 'unknown'})`
    case 'element':
      return `${describeTarget(c.target)} ${c.exists === false ? 'is absent' : 'is on the page'}`
    case 'tour':
      return `tour "${c.id}" is ${c.state} (it is ${env.tourState?.(c.id) ?? 'not-started'})`
    case 'all':
      return `all of: ${c.conditions.map((x) => describeCondition(x, env)).join('; ')}`
    case 'any':
      return `any of: ${c.conditions.map((x) => describeCondition(x, env)).join('; ')}`
    case 'not':
      return `not (${describeCondition(c.condition, env)})`
    case 'custom':
      return `custom "${c.name}"${env.custom?.[c.name] ? '' : ' (not registered)'}`
  }
}

function describeTrigger(tour: Tour, env: ConditionEnv): TourExplanation['trigger'] {
  const t = tour.trigger
  const delay = t && 'delay' in t && t.delay ? ` after ${t.delay} ms` : ''
  if (!t || t.type === 'manual')
    return { text: 'manual: start it from code or here', awaiting: 'a manual start', holds: null }
  switch (t.type) {
    case 'auto':
      return { text: `on page load${delay}`, awaiting: 'page load', holds: true }
    case 'route': {
      const holds = env.route !== undefined && matchRoute(t.pattern, env.route)
      return { text: `on route ${t.pattern}${delay}`, awaiting: `route ${t.pattern}`, holds }
    }
    case 'element':
      return {
        text: `when ${describeTarget(t.target)} appears${delay}`,
        awaiting: `${describeTarget(t.target)} to appear`,
        holds: env.elementExists?.(t.target) ?? false,
      }
    case 'event':
      return { text: `on track('${t.name}')`, awaiting: `track('${t.name}')`, holds: null }
  }
}

function frequencyAllows(rule: string, state: TourProgressState): boolean {
  if (rule === 'always') return true
  if (rule === 'until-completed') return state !== 'completed'
  return state === 'not-started' || state === 'in-progress'
}

export function explainTour(docent: Docent, tour: Tour): TourExplanation {
  const env = docent.getConditionEnv()
  const rule = tour.options?.frequency ?? 'once'
  const state = docent.tourState(tour.id)
  const frequency = { rule, state, allows: frequencyAllows(rule, state) }
  const conditions = (tour.conditions ?? []).map((c) => ({
    text: describeCondition(c, env),
    passed: evaluateCondition(c, env),
  }))
  const trigger = describeTrigger(tour, env)
  const failed = conditions.find((c) => !c.passed)

  const base = { tour, trigger, frequency, conditions }
  if (docent.getState().active === tour.id)
    return { ...base, verdict: 'running', summary: 'Running now' }
  if (!frequency.allows) {
    return {
      ...base,
      verdict: 'blocked',
      summary: `Already ${state}; frequency "${rule}" will not show it again${rule === 'once' ? ' until the version changes' : ''}`,
    }
  }
  if (failed) return { ...base, verdict: 'blocked', summary: `Condition failed: ${failed.text}` }
  if (trigger.holds === null) {
    return {
      ...base,
      verdict: tour.trigger?.type === 'event' ? 'waiting' : 'manual',
      summary:
        tour.trigger?.type === 'event'
          ? `Eligible; waiting for ${trigger.awaiting}`
          : 'Manual only',
    }
  }
  if (!trigger.holds)
    return { ...base, verdict: 'waiting', summary: `Eligible; waiting for ${trigger.awaiting}` }
  return {
    ...base,
    verdict: 'eligible',
    summary: docent.getState().active
      ? 'Eligible; queued behind the running tour'
      : 'Eligible and triggered; it should be showing',
  }
}
