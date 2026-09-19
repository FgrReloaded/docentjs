#!/usr/bin/env node
/**
 * CI step: stage every package whose version is neither published nor already staged.
 * Nothing goes live here. A maintainer approves with `pnpm release:approve` (2FA).
 *
 * Packages are packed with pnpm first so `workspace:^` ranges become real versions;
 * npm does not understand the workspace protocol.
 */
import { appendFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { distTag, isPublished, packages, run, stagedVersions } from './release-lib.mjs'

const dryRun = process.argv.includes('--dry-run')
const out = mkdtempSync(join(tmpdir(), 'docent-stage-'))
const staged = []

for (const pkg of packages()) {
  const spec = `${pkg.name}@${pkg.version}`
  if (isPublished(pkg.name, pkg.version)) {
    console.log(`skip ${spec}: already published`)
    continue
  }
  if (stagedVersions(pkg.name).some((s) => s.version === pkg.version)) {
    console.log(`skip ${spec}: already staged, waiting for approval`)
    continue
  }
  const info = JSON.parse(
    run('pnpm', ['pack', '--pack-destination', out, '--json'], { cwd: pkg.path }),
  )
  const args = [
    'stage',
    'publish',
    info.filename,
    '--access',
    'public',
    '--tag',
    distTag(pkg.version),
  ]
  if (process.env.CI) args.push('--provenance')
  if (dryRun) args.push('--dry-run')
  console.log(`stage ${spec} (tag ${distTag(pkg.version)})`)
  try {
    const output = run('npm', args)
    if (output) console.log(output)
    staged.push(spec)
  } catch (error) {
    const text = `${error.stdout ?? ''}${error.stderr ?? ''}`
    console.log(text)
    // CI cannot list staged versions (OIDC tokens only cover publishing), so a
    // version staged by an earlier run is only detected here.
    if (/already (been )?staged|E409|conflict/i.test(text)) {
      console.log(`skip ${spec}: already staged, waiting for approval`)
      continue
    }
    throw error
  }
}

const summary = staged.length
  ? [
      `### Staged for approval`,
      '',
      ...staged.map((s) => `- \`${s}\``),
      '',
      'Nothing is live yet. Approve locally with `pnpm release:approve` (asks for your 2FA code),',
      'or on npmjs.com → package → Staged Packages.',
    ].join('\n')
  : 'Nothing to stage: every package version is already published or staged.'

console.log(`\n${summary}`)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`)
