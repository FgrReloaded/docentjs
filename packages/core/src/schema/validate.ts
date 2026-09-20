/**
 * Check a tour against the schema and say what is wrong in plain words.
 *
 * Tours are data, often written by hand or by a tool, so mistakes are easy to
 * make and used to fail silently: an unknown arrow style simply drew nothing.
 * This walks the spec in `spec.ts` and reports each problem with its path and,
 * where it can, the value that was probably meant.
 */

import type { Field, Spec, SpecName } from './spec'
import { SPECS } from './spec'

export type IssueLevel = 'error' | 'warning'

export interface TourIssue {
  level: IssueLevel
  /** Where the problem is, such as `steps[2].arrow`. */
  path: string
  message: string
  /** The value that was probably meant, when one is obvious. */
  suggestion?: string
}

export interface ValidateOptions {
  /** Report unknown fields, which are usually typos. Default true. */
  unknownFields?: boolean
}

/**
 * Check a tour. An empty result means it matches the schema; it does not mean
 * the targets exist on the page, which the devtools Audit tab checks.
 */
export function validateTour(tour: unknown, options: ValidateOptions = {}): TourIssue[] {
  const issues: TourIssue[] = []
  check(tour, { kind: 'ref', name: 'tour' }, '', issues, options.unknownFields !== false)
  if (isObject(tour) && Array.isArray(tour.steps)) {
    const seen = new Set<string>()
    tour.steps.forEach((step: unknown, i: number) => {
      const id = isObject(step) ? step.id : undefined
      if (typeof id !== 'string') return
      if (seen.has(id)) {
        issues.push({
          level: 'error',
          path: `steps[${i}].id`,
          message: `Duplicate step id "${id}". Ids must be unique within a tour.`,
        })
      }
      seen.add(id)
    })
  }
  return issues
}

/** True when the tour matches the schema. */
export function isValidTour(tour: unknown): boolean {
  return validateTour(tour).every((issue) => issue.level !== 'error')
}

/** One line per issue, for a console warning or a CI log. */
export function formatIssues(issues: TourIssue[]): string {
  return issues
    .map((issue) => {
      const where = issue.path === '' ? 'tour' : issue.path
      const hint = issue.suggestion ? ` Did you mean "${issue.suggestion}"?` : ''
      return `${issue.level === 'error' ? '✗' : '!'} ${where}: ${issue.message}${hint}`
    })
    .join('\n')
}

// ---------------------------------------------------------------------------

function check(
  value: unknown,
  spec: Spec,
  path: string,
  issues: TourIssue[],
  unknownFields: boolean,
): void {
  switch (spec.kind) {
    case 'ref':
      check(value, SPECS[spec.name as SpecName], path, issues, unknownFields)
      return
    case 'any':
      return
    case 'string':
      if (typeof value !== 'string') issues.push(wrongType(path, 'a string', value))
      return
    case 'boolean':
      if (typeof value !== 'boolean') issues.push(wrongType(path, 'true or false', value))
      return
    case 'number': {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        issues.push(wrongType(path, 'a number', value))
        return
      }
      if (spec.min !== undefined && value < spec.min) {
        issues.push({ level: 'error', path, message: `${value} is below the minimum ${spec.min}.` })
      }
      if (spec.max !== undefined && value > spec.max) {
        issues.push({ level: 'error', path, message: `${value} is above the maximum ${spec.max}.` })
      }
      return
    }
    case 'enum': {
      if (typeof value === 'string' && spec.values.includes(value)) return
      const near = typeof value === 'string' ? nearest(value, spec.values) : undefined
      issues.push({
        level: 'error',
        path,
        message: `${show(value)} is not one of: ${spec.values.join(', ')}.`,
        ...(near ? { suggestion: near } : {}),
      })
      return
    }
    case 'array': {
      if (!Array.isArray(value)) {
        issues.push(wrongType(path, 'a list', value))
        return
      }
      value.forEach((item, i) => {
        check(item, spec.items, `${path}[${i}]`, issues, unknownFields)
      })
      return
    }
    case 'record': {
      if (!isObject(value)) {
        issues.push(wrongType(path, 'an object', value))
        return
      }
      for (const [key, item] of Object.entries(value)) {
        check(item, spec.values, join(path, key), issues, unknownFields)
      }
      return
    }
    case 'object': {
      if (!isObject(value)) {
        issues.push(wrongType(path, 'an object', value))
        return
      }
      checkFields(value, spec.fields, path, issues, unknownFields)
      return
    }
    case 'union': {
      const branch = pickBranch(value, spec, path, issues)
      if (branch) check(value, branch, path, issues, unknownFields)
      return
    }
  }
}

function checkFields(
  value: Record<string, unknown>,
  fields: Record<string, Field>,
  path: string,
  issues: TourIssue[],
  unknownFields: boolean,
): void {
  for (const [key, field] of Object.entries(fields)) {
    const item = value[key]
    if (item === undefined) {
      if (field.required) {
        issues.push({
          level: 'error',
          path: join(path, key),
          message: 'Required field is missing.',
        })
      }
      continue
    }
    if (field.deprecated) {
      issues.push({ level: 'warning', path: join(path, key), message: field.deprecated })
    }
    check(item, field.spec, join(path, key), issues, unknownFields)
  }
  if (!unknownFields) return
  const known = Object.keys(fields)
  for (const key of Object.keys(value)) {
    if (known.includes(key)) continue
    const near = nearest(key, known)
    issues.push({
      level: 'warning',
      path: join(path, key),
      message: 'Unknown field, which Docent will ignore.',
      ...(near ? { suggestion: near } : {}),
    })
  }
}

/** Choose the branch of a union, using its discriminator when it has one. */
function pickBranch(
  value: unknown,
  spec: Extract<Spec, { kind: 'union' }>,
  path: string,
  issues: TourIssue[],
): Spec | undefined {
  const objects = spec.of.filter((s) => s.kind === 'object')
  const others = spec.of.filter((s) => s.kind !== 'object')
  if (!isObject(value)) {
    // A plain value: accept it if any non-object branch does.
    if (others.some((s) => matches(value, s))) return undefined
    const names = spec.of.map(describe).join(', or ')
    const near =
      typeof value === 'string'
        ? nearest(
            value,
            others.flatMap((s) => (s.kind === 'enum' ? [...s.values] : [])),
          )
        : undefined
    issues.push({
      level: 'error',
      path,
      message: `${show(value)} is not valid here. Expected ${names}.`,
      ...(near ? { suggestion: near } : {}),
    })
    return undefined
  }
  if (objects.length === 1) return objects[0]
  const by = spec.by
  if (!by) return objects.find((s) => matches(value, s)) ?? objects[0]
  const tag = value[by]
  const tags = objects.flatMap((s) => {
    const f = s.kind === 'object' ? s.fields[by]?.spec : undefined
    return f?.kind === 'enum' ? [...f.values] : []
  })
  const found = objects.find((s) => {
    const f = s.kind === 'object' ? s.fields[by]?.spec : undefined
    return f?.kind === 'enum' && typeof tag === 'string' && f.values.includes(tag)
  })
  if (found) return found
  const near = typeof tag === 'string' ? nearest(tag, tags) : undefined
  issues.push({
    level: 'error',
    path: join(path, by),
    message:
      tag === undefined
        ? `Required field is missing. Expected one of: ${tags.join(', ')}.`
        : `${show(tag)} is not one of: ${tags.join(', ')}.`,
    ...(near ? { suggestion: near } : {}),
  })
  return undefined
}

/** A quick shape test, without collecting issues. */
function matches(value: unknown, spec: Spec): boolean {
  const issues: TourIssue[] = []
  check(value, spec, '', issues, false)
  return issues.every((i) => i.level !== 'error')
}

function describe(spec: Spec): string {
  switch (spec.kind) {
    case 'string':
      return 'a string'
    case 'number':
      return 'a number'
    case 'boolean':
      return 'true or false'
    case 'enum':
      return `one of: ${spec.values.join(', ')}`
    case 'array':
      return 'a list'
    case 'object':
    case 'record':
      return 'an object'
    default:
      return 'a value'
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const join = (path: string, key: string) => (path === '' ? key : `${path}.${key}`)

function wrongType(path: string, expected: string, value: unknown): TourIssue {
  return { level: 'error', path, message: `Expected ${expected}, found ${show(value)}.` }
}

function show(value: unknown): string {
  if (typeof value === 'string') return `"${value}"`
  if (value === undefined) return 'nothing'
  if (Array.isArray(value)) return 'a list'
  if (typeof value === 'object' && value !== null) return 'an object'
  return String(value)
}

/** The closest option, when one is close enough to be worth suggesting. */
export function nearest(value: string, options: readonly string[]): string | undefined {
  let best: string | undefined
  let bestDistance = Number.POSITIVE_INFINITY
  for (const option of options) {
    const d = distance(value.toLowerCase(), option.toLowerCase())
    if (d < bestDistance) {
      bestDistance = d
      best = option
    }
  }
  // Roughly a third of the word: enough for a typo or two swapped letters.
  const allowed = Math.max(1, Math.round(value.length / 3))
  return best !== undefined && bestDistance <= allowed ? best : undefined
}

/** Levenshtein distance, two rows at a time. */
function distance(a: string, b: string): number {
  if (a === b) return 0
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      )
    }
    previous = current
  }
  return previous[b.length] ?? 0
}
