/**
 * `docent theme` — list the ready-made themes and install one into a project.
 * A theme is one JSON file, so installing is writing that file; the command
 * checks it first and says how to wire it up.
 */

import { access, mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { stdout } from 'node:process'
import { formatIssues, nearest, validateTheme } from '@docentjs/core/validate'
import { THEMES, type ThemeFile } from './themes'

const DEFAULT_OUT = 'docent-theme.json'

export const THEME_HELP = `docent theme — install a ready-made look

Usage
  docent theme list                List the themes you can install
  docent theme add <name|url>      Write a theme into your project

Options
  --out <file>    Where to write it (default: ${DEFAULT_OUT})
  --force         Replace the file if it already exists

Examples
  docent theme add ledger
  docent theme add nocturne --out src/tour-theme.json
  docent theme add https://example.com/my-theme.json
`

export async function themeCommand(args: string[]): Promise<number> {
  const [sub, ...rest] = args
  if (sub === 'list') return list()
  if (sub === 'add') return add(rest)
  stdout.write(sub === undefined ? THEME_HELP : `Unknown command "theme ${sub}".\n\n${THEME_HELP}`)
  return 1
}

function list(): number {
  const width = Math.max(...Object.keys(THEMES).map((n) => n.length)) + 2
  const lines = Object.entries(THEMES).map(
    ([slug, theme]) => `  ${slug.padEnd(width)}${theme.name ?? slug} · ${facts(theme)}`,
  )
  stdout.write(`${lines.join('\n')}\n\nInstall one: docent theme add <name>\n`)
  return 0
}

/** What sets a theme apart, in a few words: the same line the gallery shows. */
function facts(theme: ThemeFile): string {
  const overlay = theme.overlay as { style?: string } | undefined
  return [
    theme.progress === 'none' ? 'no progress' : `${theme.progress ?? 'meter'} progress`,
    theme.eyebrow ? 'eyebrow' : null,
    theme.arrow ? `${theme.arrow} arrow` : null,
    overlay?.style === 'none' ? 'no scrim' : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

async function add(args: string[]): Promise<number> {
  const { source, out, force } = parse(args)
  if (!source) {
    stdout.write('Name a theme to add, for example: docent theme add ledger\n')
    stdout.write('See them all with: docent theme list\n')
    return 1
  }

  const loaded = await load(source)
  if (typeof loaded === 'string') {
    stdout.write(`${loaded}\n`)
    return 1
  }

  const issues = validateTheme(loaded)
  if (issues.length > 0) stdout.write(`${formatIssues(issues)}\n\n`)
  if (issues.some((i) => i.level === 'error')) {
    stdout.write(`Not installed: ${source} is not a valid theme.\n`)
    return 1
  }

  if (!force && (await exists(out))) {
    stdout.write(`${out} already exists. Add --force to replace it, or --out to write elsewhere.\n`)
    return 1
  }
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, `${JSON.stringify(loaded, null, 2)}\n`)

  const path = out.startsWith('.') || out.startsWith('/') ? out : `./${out}`
  stdout.write(`Added ${loaded.name ?? source} to ${out}

Use it where you set up Docent:
  import theme from '${path}'
  createTour(tour, { renderer: { template: theme } })

React, Vue and Svelte: https://docentjs.dev/customize/themes/
`)
  return 0
}

function parse(args: string[]): { source?: string; out: string; force: boolean } {
  let source: string | undefined
  let out = DEFAULT_OUT
  let force = false
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string
    if (arg === '--force') force = true
    else if (arg === '--out') out = args[++i] ?? out
    else if (arg.startsWith('--out=')) out = arg.slice('--out='.length)
    else if (!arg.startsWith('-')) source ??= arg
  }
  return { ...(source === undefined ? {} : { source }), out, force }
}

/** A bundled theme by name, or one fetched from a URL. A string is an error to show. */
async function load(source: string): Promise<ThemeFile | string> {
  if (!/^https?:\/\//.test(source)) {
    const theme = THEMES[source]
    if (theme) return theme
    const guess = nearest(source, Object.keys(THEMES))
    return `There is no theme called "${source}".${guess ? ` Did you mean "${guess}"?` : ''}\nSee them all with: docent theme list`
  }
  let response: Response
  try {
    response = await fetch(source)
  } catch (error) {
    return `Could not reach ${source}: ${(error as Error).message}`
  }
  if (!response.ok) return `Could not fetch ${source}: ${response.status} ${response.statusText}`
  try {
    const data: unknown = await response.json()
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return `${source} is not a theme: expected a JSON object.`
    }
    return data as ThemeFile
  } catch {
    return `${source} is not valid JSON.`
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}
