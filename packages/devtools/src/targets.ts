import { matchRoute, type Step } from '@docentjs/core'
import { candidateSelectors, queryAllDeep, resolveTarget, toSpec } from '@docentjs/dom'
import { describeTarget } from './explain'

export interface TargetHealth {
  /** `modal` steps have no target. */
  status: 'modal' | 'found' | 'missing' | 'other-route'
  text: string
  element: Element | null
}

/** Which candidate selector (if any) resolves a step's target on the current page. */
export function checkTarget(step: Step, route: string | undefined): TargetHealth {
  if (step.target === undefined)
    return { status: 'modal', text: 'centred modal, no target', element: null }
  const element = resolveTarget(step.target)
  if (element) {
    const spec = toSpec(step.target)
    const scope = spec.within ? (queryAllDeep(document, spec.within)[0] ?? document) : document
    const used = candidateSelectors(spec).find((sel) => queryAllDeep(scope, sel).length > 0)
    return { status: 'found', text: `found via ${used ?? describeTarget(step.target)}`, element }
  }
  if (step.route && route !== undefined && !matchRoute(step.route, route)) {
    return { status: 'other-route', text: `on ${step.route}, not this page`, element: null }
  }
  const tried = candidateSelectors(step.target)
  return {
    status: 'missing',
    text: `not found (tried ${tried.join(', ') || 'nothing'})`,
    element: null,
  }
}
