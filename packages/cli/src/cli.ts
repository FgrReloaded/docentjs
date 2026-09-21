#!/usr/bin/env node
/**
 * `docent` — check tour files and install themes, without a browser.
 *
 * Tours and themes are data, so they can be checked in a script, in CI, or by
 * a tool that writes them. This reports the same problems the library reports
 * in development, with the file and the path inside it.
 */

import { glob, readFile, writeFile } from 'node:fs/promises'
import { argv, exit, stdout } from 'node:process'
import { formatIssues, type TourIssue, tourJsonSchema, validateTour } from '@docentjs/core/validate'
import { themeCommand } from './theme'

const HELP = `docent — tools for Docent tours and themes

Usage
  docent validate <files...>   Check tour files against the schema
  docent schema [file]         Print the tour JSON Schema, or write it to a file
  docent theme list            List the ready-made themes
  docent theme add <name>      Install a theme into your project

Options
  --json          Report as JSON, for other tools to read
  --quiet         Print only problems, not the summary
  --allow-unknown Ignore unknown fields instead of warning about them
  -h, --help      Show this message

Examples
  docent validate tours/*.json
  docent validate tours/welcome.tour.json --json
  docent schema tour-schema.json
  docent theme add ledger
`

interface FileReport {
  file: string
  issues: TourIssue[]
  /** Set when the file could not be read or parsed. */
  failed?: string
}

async function main(args: string[]): Promise<number> {
  if (args[0] === 'theme') return themeCommand(args.slice(1))
  const flags = new Set(args.filter((a) => a.startsWith('-')))
  const rest = args.filter((a) => !a.startsWith('-'))
  const [command, ...paths] = rest

  if (flags.has('-h') || flags.has('--help') || command === undefined || command === 'help') {
    stdout.write(HELP)
    return command === undefined ? 1 : 0
  }

  if (command === 'schema') {
    const json = `${JSON.stringify(tourJsonSchema(), null, 2)}\n`
    if (paths[0]) {
      await writeFile(paths[0], json)
      stdout.write(`Wrote ${paths[0]}\n`)
    } else {
      stdout.write(json)
    }
    return 0
  }

  if (command !== 'validate') {
    stdout.write(`Unknown command "${command}".\n\n${HELP}`)
    return 1
  }

  if (paths.length === 0) {
    stdout.write('Give at least one file to check, for example: docent validate tours/*.json\n')
    return 1
  }

  const files = await expand(paths)
  if (files.length === 0) {
    stdout.write(`No files matched ${paths.join(', ')}\n`)
    return 1
  }

  const reports: FileReport[] = []
  for (const file of files) {
    reports.push(await checkFile(file, { unknownFields: !flags.has('--allow-unknown') }))
  }

  if (flags.has('--json')) {
    stdout.write(`${JSON.stringify(reports, null, 2)}\n`)
  } else {
    stdout.write(report(reports, flags.has('--quiet')))
  }

  const bad = reports.some(
    (r) => r.failed !== undefined || r.issues.some((i) => i.level === 'error'),
  )
  return bad ? 1 : 0
}

/** Expand any patterns, so quoted globs work the same in every shell. */
async function expand(paths: string[]): Promise<string[]> {
  const out: string[] = []
  for (const path of paths) {
    if (!/[*?[]/.test(path)) {
      out.push(path)
      continue
    }
    for await (const match of glob(path)) out.push(match)
  }
  return [...new Set(out)].sort()
}

/** One file, which may hold a single tour or a list of them. */
async function checkFile(file: string, options: { unknownFields: boolean }): Promise<FileReport> {
  let text: string
  try {
    text = await readFile(file, 'utf8')
  } catch {
    return { file, issues: [], failed: 'Could not read this file.' }
  }
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    return { file, issues: [], failed: `Not valid JSON: ${(error as Error).message}` }
  }
  const tours = Array.isArray(data) ? data : [data]
  const issues = tours.flatMap((tour, index) => {
    const found = validateTour(tour, options)
    if (!Array.isArray(data)) return found
    // Say which tour in the list, since the file holds several.
    return found.map((issue) => ({
      ...issue,
      path: `[${index}]${issue.path ? `.${issue.path}` : ''}`,
    }))
  })
  return { file, issues }
}

function report(reports: FileReport[], quiet: boolean): string {
  const lines: string[] = []
  let errors = 0
  let warnings = 0
  for (const r of reports) {
    if (r.failed) {
      errors++
      lines.push(`${r.file}\n✗ ${r.failed}\n`)
      continue
    }
    errors += r.issues.filter((i) => i.level === 'error').length
    warnings += r.issues.filter((i) => i.level === 'warning').length
    if (r.issues.length > 0) lines.push(`${r.file}\n${formatIssues(r.issues)}\n`)
  }
  if (!quiet) {
    const files = `${reports.length} file${reports.length === 1 ? '' : 's'}`
    lines.push(
      errors === 0 && warnings === 0
        ? `${files} checked, no problems found.`
        : `${files} checked: ${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}.`,
    )
  }
  return `${lines.join('\n')}\n`
}

exit(await main(argv.slice(2)))
