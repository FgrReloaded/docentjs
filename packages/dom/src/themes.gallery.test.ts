import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { THEME_VARS } from './theme'

/**
 * The themes published in the gallery. They are installed by copying the JSON,
 * so nothing in them may be a function or an unknown field: a theme that needs
 * code is not a theme.
 */
const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../themes')

const FIELDS = [
  'name',
  'theme',
  'eyebrow',
  'progress',
  'count',
  'arrow',
  'spotlight',
  'overlay',
  'css',
]
const PROGRESS = ['meter', 'count', 'ticks', 'dots', 'none']
const RINGS = ['hairline', 'none', 'glow', 'pulse', 'dashed', 'solid']
const SHAPES = ['rounded', 'rect', 'pill', 'circle']
const OVERLAYS = ['dim', 'blur', 'vignette', 'none']

const files = readdirSync(DIR).filter((f) => f.endsWith('.json'))

describe('published themes', () => {
  it('ships a gallery', () => {
    expect(files.length).toBeGreaterThan(4)
  })

  it.each(files)('%s is installable as data', (file) => {
    const theme = JSON.parse(readFileSync(join(DIR, file), 'utf8')) as Record<string, unknown>
    expect(JSON.stringify(theme)).not.toMatch(/function|=>/)
    expect(theme.name).toBeTypeOf('string')
    for (const key of Object.keys(theme)) expect(FIELDS).toContain(key)
    for (const token of Object.keys(theme.theme ?? {})) {
      expect(Object.keys(THEME_VARS)).toContain(token)
    }
    if (theme.progress !== undefined) expect(PROGRESS).toContain(theme.progress)
    const spotlight = (theme.spotlight ?? {}) as Record<string, unknown>
    if (spotlight.ring !== undefined) expect(RINGS).toContain(spotlight.ring)
    if (spotlight.shape !== undefined) expect(SHAPES).toContain(spotlight.shape)
    const overlay = (theme.overlay ?? {}) as Record<string, unknown>
    if (overlay.style !== undefined) expect(OVERLAYS).toContain(overlay.style)
  })
})
