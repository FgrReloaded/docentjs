import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { THEMES } from './themes'

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../themes')
const onDisk = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort()

describe('bundled themes', () => {
  it('bundles every theme in themes/, so `theme add` can install each one', () => {
    expect(Object.keys(THEMES).sort()).toEqual(onDisk)
  })

  it.each(onDisk)('%s is bundled exactly as published', (slug) => {
    expect(THEMES[slug]).toEqual(JSON.parse(readFileSync(join(DIR, `${slug}.json`), 'utf8')))
  })
})
