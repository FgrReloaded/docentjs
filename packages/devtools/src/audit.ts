/**
 * Static and page-aware checks for tours: mistakes that make a tour silently
 * not show, feel broken, or be hard to read.
 */

import {
  type Condition,
  type Docent,
  matchRoute,
  type Step,
  type Theme,
  type ThemeSpec,
  type Tour,
} from '@docentjs/core'
import { validateTour } from '@docentjs/core/validate'
import { resolveTarget, toSpec } from '@docentjs/dom'
import { contrast, dark, light, minimal } from '@docentjs/dom/themes'
import { contrastRatio } from './contrast'

export type Severity = 'error' | 'warning' | 'info'

export interface Issue {
  severity: Severity
  tourId: string
  stepId?: string
  message: string
  /** What to do about it. */
  hint?: string
}

function walk(conditions: Condition[] | undefined, visit: (c: Condition) => void): void {
  for (const c of conditions ?? []) {
    visit(c)
    if (c.type === 'all' || c.type === 'any') walk(c.conditions, visit)
    if (c.type === 'not') walk([c.condition], visit)
  }
}

function isStructural(selector: string): boolean {
  return /:nth-(of-type|child)|\s>\s.*\s>\s/.test(selector)
}

/**
 * Checks against the element as it is right now: a target that exists but
 * cannot be seen, or sits under something else, spotlights nothing.
 */
function elementIssues(
  at: { tourId: string; stepId: string },
  step: Step,
  element: Element,
  out: Issue[],
): void {
  // Some environments (jsdom, printing) report no layout at all; there is
  // nothing to measure there, and every element would look invisible.
  if (element.ownerDocument.body.getBoundingClientRect().width === 0) return
  const rect = element.getBoundingClientRect()
  const style = getComputedStyle(element)
  if (rect.width === 0 || rect.height === 0 || style.visibility === 'hidden') {
    out.push({
      ...at,
      severity: 'warning',
      message: 'Target is on the page but has no visible box.',
      hint: 'The spotlight would have nothing to draw. Point at the visible parent instead.',
    })
    return
  }
  if (Number.parseFloat(style.opacity) < 0.1) {
    out.push({ ...at, severity: 'warning', message: 'Target is on the page but transparent.' })
  }
  if (rect.width < 8 || rect.height < 8) {
    out.push({
      ...at,
      severity: 'info',
      message: `Target is only ${Math.round(rect.width)}×${Math.round(rect.height)} px.`,
      hint: 'Spotlight padding helps, or point at its container.',
    })
  }
  const view = element.ownerDocument.defaultView
  if (!view) return
  const width = view.innerWidth
  const height = view.innerHeight
  if (rect.bottom < 0 || rect.top > height || rect.right < 0 || rect.left > width) {
    out.push({
      ...at,
      severity: 'info',
      message: 'Target is off screen right now.',
      hint: 'Docent scrolls to it, unless the step sets scroll: { enabled: false }.',
    })
  } else {
    const covering = occluder(element, rect)
    if (covering) {
      out.push({
        ...at,
        severity: 'warning',
        message: `Target is covered by <${covering.tagName.toLowerCase()}${idOf(covering)}>.`,
        hint: 'Docent moves stickies out of the way, but a fixed panel over it stays.',
      })
    }
  }
  if (rect.width > width * 0.9 || rect.height > height * 0.9) {
    out.push({
      ...at,
      severity: 'info',
      message: 'Target fills most of the screen.',
      hint: 'The popover has little room beside it; it will be placed over the page.',
    })
  }
  if (step.advance && typeof step.advance === 'object' && step.advance.on === 'click') {
    const disabled = element.matches('[disabled], [aria-disabled="true"]')
    if (disabled) {
      out.push({
        ...at,
        severity: 'error',
        message: 'Step waits for a click, but the target is disabled.',
      })
    }
  }
}

/** The element painted over the middle of the target, when it is not the target itself. */
function occluder(element: Element, rect: DOMRect): Element | null {
  const doc = element.ownerDocument
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const top = doc.elementFromPoint(x, y)
  if (!top || top === element || element.contains(top) || top.contains(element)) return null
  // Ignore anything Docent itself puts on the page.
  if (top.closest('[data-docent-host], [data-docent-devtools], [data-docent-devtools-highlight]'))
    return null
  return top
}

const idOf = (el: Element) => (el.id ? `#${el.id}` : '')

function stepIssues(tour: Tour, step: Step, route: string | undefined, out: Issue[]): void {
  const at = { tourId: tour.id, stepId: step.id }
  if (!step.title && !step.body) {
    out.push({
      ...at,
      severity: 'warning',
      message: 'Step has no title or body.',
      hint: 'Add a short title.',
    })
  }
  if (step.body && step.body.length > 220) {
    out.push({
      ...at,
      severity: 'info',
      message: `Body is ${step.body.length} characters.`,
      hint: 'One or two short sentences read best in a popover.',
    })
  }
  const advance = step.advance
  if (
    typeof advance === 'object' &&
    (advance.on === 'click' || advance.on === 'input') &&
    step.interaction === 'block'
  ) {
    out.push({
      ...at,
      severity: 'error',
      message: `Advances on ${advance.on}, but interaction is blocked.`,
      hint: 'Remove interaction: "block" so the user can reach the target.',
    })
  }
  if (step.target === undefined) return
  const spec = toSpec(step.target)
  const selectors = spec.selectors ?? []
  if (!spec.name && selectors.length > 0 && selectors.every(isStructural)) {
    out.push({
      ...at,
      severity: 'warning',
      message: 'Target relies on a structural selector.',
      hint: 'Add data-docent="…" to the element and target it by name.',
    })
  }
  const element = resolveTarget(step.target)
  if (element) elementIssues(at, step, element, out)
  if (!element) {
    const elsewhere =
      step.route !== undefined && route !== undefined && !matchRoute(step.route, route)
    if (elsewhere) {
      out.push({ ...at, severity: 'info', message: `Target is on ${step.route}, not this page.` })
    } else {
      out.push({
        ...at,
        severity: 'warning',
        message: 'Target is not on this page.',
        hint: 'Check the selector, or set onMissing: "wait" if it renders later.',
      })
    }
  }
}

const COLOR_TOKENS: Array<keyof Theme> = [
  'background',
  'foreground',
  'muted',
  'accent',
  'accentForeground',
]

const PRESETS = { light, dark, minimal, contrast }

/** A theme as plain tokens, whether it names a preset, sets tokens, or both. */
function tokensOf(spec: ThemeSpec | undefined): Theme | undefined {
  if (spec === undefined) return undefined
  if (typeof spec === 'string') return PRESETS[spec]
  const { preset, ...tokens } = spec
  return preset ? { ...PRESETS[preset], ...tokens } : tokens
}

function themeIssues(tour: Tour, out: Issue[]): void {
  const own = tokensOf(tour.options?.theme)
  // The defaults are known to pass; only check tours that change colors.
  if (!own || !COLOR_TOKENS.some((k) => own[k] !== undefined)) return
  const t: Theme = { ...light, ...own }
  const pairs: Array<[string, string | undefined, string | undefined, number]> = [
    ['Text', t.foreground, t.background, 4.5],
    ['Muted text', t.muted, t.background, 4.5],
    ['Primary button text', t.accentForeground, t.accent, 4.5],
  ]
  for (const [label, fg, bg, min] of pairs) {
    if (!fg || !bg) continue
    const ratio = contrastRatio(fg, bg)
    if (ratio === null || ratio >= min) continue
    out.push({
      tourId: tour.id,
      severity: ratio < 3 ? 'error' : 'warning',
      message: `${label} contrast is ${ratio.toFixed(2)}:1 (needs ${min}:1).`,
      hint: 'Adjust the theme colors in the Edit tab.',
    })
  }
}

/** Schema problems: unknown values, missing fields, typos. */
function schemaIssues(tour: Tour, out: Issue[]): void {
  for (const issue of validateTour(tour)) {
    const index = issue.path.match(/^steps\[(\d+)\]/)?.[1]
    const step = index === undefined ? undefined : tour.steps[Number(index)]
    const field = issue.path.replace(/^steps\[\d+\]\.?/, '')
    out.push({
      tourId: tour.id,
      ...(step ? { stepId: step.id } : {}),
      severity: issue.level,
      message: field ? `${field}: ${issue.message}` : issue.message,
      ...(issue.suggestion ? { hint: `Did you mean "${issue.suggestion}"?` } : {}),
    })
  }
}

export function auditTours(docent: Docent, tours: Tour[]): Issue[] {
  const out: Issue[] = []
  const env = docent.getConditionEnv()
  const ids = new Set(tours.map((t) => t.id))
  for (const tour of tours) {
    schemaIssues(tour, out)
    for (const step of tour.steps) {
      stepIssues(tour, step, env.route, out)
    }
    if (tour.steps.length === 0)
      out.push({ tourId: tour.id, severity: 'error', message: 'Tour has no steps.' })
    walk(tour.conditions, (c) => {
      if (c.type === 'custom' && !env.custom?.[c.name]) {
        out.push({
          tourId: tour.id,
          severity: 'error',
          message: `Custom condition "${c.name}" is not registered.`,
          hint: 'Pass it in the custom option, or the tour never qualifies.',
        })
      }
      if (c.type === 'tour' && !ids.has(c.id)) {
        out.push({
          tourId: tour.id,
          severity: 'warning',
          message: `Condition refers to unknown tour "${c.id}".`,
        })
      }
    })
    if (!tour.trigger || tour.trigger.type === 'manual') {
      out.push({ tourId: tour.id, severity: 'info', message: 'No trigger: starts only from code.' })
    }
    if (tour.trigger?.type === 'auto' && tour.options?.frequency === 'always') {
      out.push({
        tourId: tour.id,
        severity: 'info',
        message: 'Shows on every page load (auto trigger, frequency always).',
      })
    }
    themeIssues(tour, out)
  }
  const rank: Record<Severity, number> = { error: 0, warning: 1, info: 2 }
  return out.sort((a, b) => rank[a.severity] - rank[b.severity])
}
