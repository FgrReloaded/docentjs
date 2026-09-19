/**
 * Shared helpers for the staged release scripts.
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const root = new URL('..', import.meta.url).pathname

/** Publishable workspace packages: `packages/*` without `private: true`. */
export function packages() {
  const dir = join(root, 'packages')
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const path = join(dir, d.name)
      const pkg = JSON.parse(readFileSync(join(path, 'package.json'), 'utf8'))
      return { path, name: pkg.name, version: pkg.version, private: pkg.private === true }
    })
    .filter((p) => !p.private)
}

export function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts })
}

/** True when `name@version` is already live on npm. */
export function isPublished(name, version) {
  try {
    return run('npm', ['view', `${name}@${version}`, 'version']).trim() === version
  } catch {
    return false
  }
}

/** True when the package has ever been published. Staging only works for existing packages. */
export function packageExists(name) {
  try {
    run('npm', ['view', name, 'name'])
    return true
  } catch {
    return false
  }
}

/**
 * Staged entries for a package. The JSON shape is not formally documented, so read
 * the version and id defensively.
 */
export function stagedVersions(name) {
  let raw
  try {
    raw = JSON.parse(run('npm', ['stage', 'list', name, '--json']) || '[]')
  } catch {
    return []
  }
  const list = Array.isArray(raw) ? raw : (raw.objects ?? raw.staged ?? raw.data ?? [])
  return list.map((e) => ({
    id: e.id ?? e.stageId ?? e.stage_id ?? e.uuid,
    version:
      e.version ??
      e.package?.version ??
      String(e.spec ?? '')
        .split('@')
        .pop(),
    raw: e,
  }))
}

/** `latest` for normal versions, the prerelease id (`beta`, `canary`) otherwise. */
export function distTag(version) {
  const pre = version.split('-')[1]
  return pre ? pre.split('.')[0] : 'latest'
}
