/**
 * Route pattern matching for `route` triggers, conditions and step routes.
 *
 * Patterns are path globs:
 * - `/settings`          exact
 * - `/users/:id`         one segment (named for readability, value ignored)
 * - `/users/*`           one segment
 * - `/docs/**`           zero or more segments
 *
 * Query strings and hashes are ignored. Trailing slashes are tolerated.
 */

function segments(path: string): string[] {
  const clean = path.split(/[?#]/, 1)[0] ?? ''
  return clean.split('/').filter(Boolean)
}

function matchSegments(pattern: string[], path: string[], pi = 0, si = 0): boolean {
  if (pi === pattern.length) return si === path.length
  const p = pattern[pi]
  if (p === '**') {
    for (let k = si; k <= path.length; k++) {
      if (matchSegments(pattern, path, pi + 1, k)) return true
    }
    return false
  }
  if (si === path.length) return false
  if (p === '*' || p?.startsWith(':') || p === path[si]) {
    return matchSegments(pattern, path, pi + 1, si + 1)
  }
  return false
}

export function matchRoute(pattern: string, path: string): boolean {
  return matchSegments(segments(pattern), segments(path))
}
