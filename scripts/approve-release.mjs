#!/usr/bin/env node
/**
 * Local step: approve the staged versions that match the current package versions,
 * then create and push the git tags, which triggers the GitHub release workflow.
 * npm asks for your 2FA code for every approval.
 */
import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { isPublished, packages, root, stagedVersions } from './release-lib.mjs'

const pending = []
for (const pkg of packages()) {
  if (isPublished(pkg.name, pkg.version)) continue
  const match = stagedVersions(pkg.name).find((s) => s.version === pkg.version)
  if (!match) {
    console.log(`not staged yet: ${pkg.name}@${pkg.version}`)
    continue
  }
  if (!match.id) {
    console.error(`cannot read the stage id for ${pkg.name}@${pkg.version}:`, match.raw)
    process.exit(1)
  }
  pending.push({ spec: `${pkg.name}@${pkg.version}`, id: match.id })
}

if (pending.length === 0) {
  console.log('Nothing to approve. Pull main first if CI staged a new version.')
  process.exit(0)
}

console.log('\nStaged and waiting for approval:')
for (const p of pending) console.log(`  ${p.spec}  (stage ${p.id})`)
const rl = createInterface({ input: process.stdin, output: process.stdout })
const answer = await rl.question(
  `\nApprove ${pending.length} version(s) and make them public? (y/N) `,
)
rl.close()
if (answer.trim().toLowerCase() !== 'y') process.exit(0)

for (const p of pending) {
  console.log(`\napproving ${p.spec}`)
  const r = spawnSync('npm', ['stage', 'approve', p.id], { stdio: 'inherit' })
  if (r.status !== 0) {
    console.error(
      `approval failed for ${p.spec}; fix and rerun, approved ones are skipped next time`,
    )
    process.exit(r.status ?? 1)
  }
}

console.log('\ncreating git tags')
spawnSync('pnpm', ['exec', 'changeset', 'git-tag'], { stdio: 'inherit', cwd: root })
spawnSync('git', ['push', '--tags'], { stdio: 'inherit', cwd: root })
console.log('\nDone. Tags pushed; the GitHub release workflow creates the release notes.')
