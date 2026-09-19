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
import {
  distTag,
  isPublished,
  packageExists,
  packages,
  run,
  stagedVersions,
} from './release-lib.mjs'

const dryRun = process.argv.includes('--dry-run')
const out = mkdtempSync(join(tmpdir(), 'docent-stage-'))
const staged = []
const firstPublish = []

for (const pkg of packages()) {
  const spec = `${pkg.name}@${pkg.version}`
  if (isPublished(pkg.name, pkg.version)) {
    console.log(`skip ${spec}: already published`)
    continue
  }
  if (!packageExists(pkg.name)) {
    // npm cannot stage (or trust-publish) a package that does not exist yet.
    console.log(`skip ${spec}: new package, needs a one-time manual publish`)
    firstPublish.push(spec)
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
  // Verbose logging surfaces npm's OIDC messages, which explain a refused
  // trusted-publishing login; they are hidden at the default log level.
  // No `--provenance`: with trusted publishing npm adds provenance on its own for
  // public repositories, and forcing it fails for private ones.
  if (process.env.CI) args.push('--loglevel', 'verbose')
  if (dryRun) args.push('--dry-run')
  console.log(`stage ${spec} (tag ${distTag(pkg.version)})`)
  try {
    const output = run('npm', args)
    if (output) console.log(output)
    staged.push(spec)
  } catch (error) {
    const text = `${error.stdout ?? ''}${error.stderr ?? ''}`
    const useful = text
      .split('\n')
      .filter((line) => !/^npm (verbose|timing|silly|http)\b/.test(line) || /oidc/i.test(line))
    console.log(useful.join('\n'))
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

const newPackages = firstPublish.length
  ? [
      '',
      '### New packages: publish once by hand',
      '',
      ...firstPublish.map((s) => `- \`${s}\``),
      '',
      'After approving the staged versions, from the repo root run',
      '`pnpm --filter <name> publish --access public`, then add its trusted publisher',
      '(`scripts/setup-trust.sh`). Later releases stage it like the others.',
    ].join('\n')
  : ''
const report = `${summary}${newPackages ? `\n${newPackages}` : ''}`
console.log(`\n${report}`)
// biome-ignore lint/suspicious/noUndeclaredEnvVars: set by GitHub Actions, not a Turborepo task input
const stepSummary = process.env.GITHUB_STEP_SUMMARY
if (stepSummary) appendFileSync(stepSummary, `${report}\n`)
