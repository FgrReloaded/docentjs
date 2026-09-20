/**
 * Write the tour JSON Schema that the docs site serves.
 *
 * Run `pnpm gen:schema` after changing the schema spec. A test fails when the
 * published file and the code disagree.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tourJsonSchema } from '../packages/core/dist/validate.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'apps/docs/public/schema/tour-v1.json')
const contents = `${JSON.stringify(tourJsonSchema(), null, 2)}\n`
const relative = out.slice(root.length + 1)

if (process.argv.includes('--check')) {
  const current = readFileSync(out, 'utf8')
  if (current !== contents) {
    console.error(`${relative} is out of date. Run \`pnpm gen:schema\` and commit the result.`)
    process.exit(1)
  }
  console.log(`${relative} is up to date`)
} else {
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, contents)
  console.log(`wrote ${relative}`)
}
