#!/usr/bin/env node
/**
 * Local step: approve the staged versions that match the current package versions,
 * then tag the version (`v0.2.1`) and push it, which creates the GitHub release.
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
  const all = packages()
  const version = all[0]?.version
  const live = all.every((p) => isPublished(p.name, p.version))
  const tagged =
    spawnSync('git', ['ls-remote', '--exit-code', '--tags', 'origin', `refs/tags/v${version}`], {
      cwd: root,
    }).status === 0
  if (live && !tagged) {
    console.log(
      `\nv${version} is live on npm but not tagged. On the commit that set this version, run:`,
    )
    console.log(`  git tag -a v${version} -m v${version} && git push origin v${version}`)
  }
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

// One tag per version (all packages share it). A single tag push reliably
// triggers the GitHub release workflow; GitHub drops tag events when more than
// three tags are pushed at once.
const versions = new Set(packages().map((p) => p.version))
if (versions.size !== 1) {
  console.error(`packages disagree on the version: ${[...versions].join(', ')}; tag skipped`)
  process.exit(1)
}
const tag = `v${[...versions][0]}`
const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' })

git('fetch', '--quiet', 'origin', 'main')
const head = git('rev-parse', 'HEAD').stdout.trim()
const main = git('rev-parse', 'origin/main').stdout.trim()
if (head !== main) {
  console.error(`\nPackages are live, but ${tag} was not tagged: HEAD is not origin/main.`)
  console.error(
    `Run \`git switch main && git pull\`, then: git tag -a ${tag} -m ${tag} && git push origin ${tag}`,
  )
  process.exit(1)
}
if (git('rev-parse', '--verify', '--quiet', `refs/tags/${tag}`).status !== 0) {
  git('tag', '-a', tag, '-m', tag)
}
const push = spawnSync('git', ['push', 'origin', tag], { cwd: root, stdio: 'inherit' })
if (push.status !== 0) process.exit(push.status ?? 1)
console.log(
  `\nDone. Pushed ${tag}; the GitHub release workflow creates the release from the changelogs.`,
)
