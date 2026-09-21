import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateTheme } from '@docentjs/core/validate'
import { describe, expect, it } from 'vitest'

/** The themes the gallery and `docent theme add` publish. */
const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../themes')
const files = readdirSync(DIR).filter((f) => f.endsWith('.json'))

describe('published themes', () => {
  it('ships a gallery', () => {
    expect(files.length).toBeGreaterThan(4)
  })

  it.each(files)('%s is a valid theme with a name and no warnings', (file) => {
    const theme = JSON.parse(readFileSync(join(DIR, file), 'utf8')) as { name?: unknown }
    expect(theme.name).toBeTypeOf('string')
    expect(validateTheme(theme)).toEqual([])
  })
})
