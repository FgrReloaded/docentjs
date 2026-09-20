/**
 * Development-time checking. Tours are data, so a typo used to fail quietly.
 * On any non-production build we check each tour once and print what is wrong.
 *
 * The checker lives in its own module and is imported on demand, so production
 * bundles contain neither the call nor the code behind it.
 */

import type { Tour } from '@docentjs/core'

const checked = new WeakSet<Tour>()

/**
 * Written exactly like this on purpose: bundlers replace
 * `process.env.NODE_ENV` literally, so a production build turns this into
 * `false`, and the check plus its import are dropped. Without a bundler
 * `process` is simply not defined, and the catch treats that as development.
 */
function isProduction(): boolean {
  try {
    return process.env.NODE_ENV === 'production'
  } catch {
    return false
  }
}

/**
 * Check every tour the manager knows, as they load. Tours that never start
 * still get checked, which is where a broken condition usually hides.
 */
export function warnAboutTours(docent: {
  getTours(): Tour[]
  subscribe(listener: () => void): () => void
}): void {
  if (isProduction()) return
  const check = () => {
    for (const tour of docent.getTours()) warnIfInvalid(tour)
  }
  docent.subscribe(check)
  check()
}

/** Warn about anything wrong with this tour, once per tour, in development. */
export function warnIfInvalid(tour: Tour | undefined): void {
  if (!tour || isProduction() || checked.has(tour)) return
  checked.add(tour)
  void import('@docentjs/core/validate')
    .then(({ formatIssues, validateTour }) => {
      const issues = validateTour(tour)
      if (issues.length === 0) return
      const errors = issues.filter((issue) => issue.level === 'error').length
      const label = errors > 0 ? 'error' : 'warning'
      console.warn(
        `[docent] Tour "${tour.id}" has ${issues.length} ${label}${issues.length === 1 ? '' : 's'}:\n${formatIssues(issues)}\n` +
          'This check runs in development only. See https://docentjs.dev/reference/schema/',
      )
    })
    .catch(() => {
      // Checking is a convenience; never let it break the app.
    })
}
