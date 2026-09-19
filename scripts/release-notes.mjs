#!/usr/bin/env node
/**
 * Build one set of release notes for a version from every package's
 * CHANGELOG.md. Packages share one version, so identical sections are merged
 * and "Updated dependencies" noise is dropped.
 *
 *   node scripts/release-notes.mjs 0.2.0 > notes.md
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { packages } from './release-lib.mjs'

const version = (process.argv[2] ?? '').replace(/^v/, '')
if (!version) {
  console.error('usage: release-notes.mjs <version>')
  process.exit(1)
}

/** The section under `## <version>` in a changesets changelog. */
function section(changelog, v) {
  const lines = changelog.split('\n')
  const start = lines.findIndex((l) => l.trim() === `## ${v}`)
  if (start === -1) return ''
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((l) => /^## /.test(l))
  return (end === -1 ? rest : rest.slice(0, end)).join('\n')
}

/** Drop "- Updated dependencies" bullets (with their nested lines) and headings left empty. */
function clean(text) {
  const out = []
  let skipping = false
  for (const line of text.split('\n')) {
    if (/^- Updated dependencies/.test(line)) {
      skipping = true
      continue
    }
    if (skipping && /^\s+\S/.test(line)) continue
    skipping = false
    out.push(line)
  }
  const blocks = out.join('\n').split(/\n(?=### )/)
  return blocks
    .filter((b) => !/^### /.test(b.trim()) || /\n\s*- /.test(b))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const groups = new Map()
const all = packages()
for (const pkg of all) {
  const file = join(pkg.path, 'CHANGELOG.md')
  const body = existsSync(file) ? clean(section(readFileSync(file, 'utf8'), version)) : ''
  if (!body) continue
  const names = groups.get(body) ?? []
  names.push(pkg.name)
  groups.set(body, names)
}

const parts = []
if (groups.size === 0) {
  parts.push(`Version ${version}.`)
} else if (groups.size === 1 && [...groups.values()][0].length === all.length) {
  parts.push([...groups.keys()][0])
} else {
  for (const [body, names] of groups) {
    parts.push(
      `## ${names.map((n) => `\`${n}\``).join(', ')}\n\n${body.replace(/^### /gm, '#### ')}`,
    )
  }
}
parts.push(
  [
    '---',
    '',
    `**Packages**, all at \`${version}\`:`,
    '',
    ...all.map((p) => `- [\`${p.name}\`](https://www.npmjs.com/package/${p.name}/v/${version})`),
  ].join('\n'),
)
console.log(`${parts.join('\n\n')}\n`)
