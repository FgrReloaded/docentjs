/**
 * Gather the built example apps into the docs output, so the site serves them
 * from https://docentjs.dev/examples/<name>/.
 *
 * Run `pnpm build:site` (turbo build, then this). Cloudflare Pages runs the
 * same command and publishes `apps/docs/dist`.
 *
 * The three Vite apps are copied as they were built — each one sets a `base`
 * matching its subpath. The vanilla example is a single file that imports the
 * packages through relative paths into the repo, which only exist here, so its
 * import map is pointed at a vendored copy on the way out.
 */
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const self = fileURLToPath(import.meta.url)
const root = join(dirname(self), '..')
const site = join(root, 'apps/docs/dist/examples')

const relative = (path) => path.slice(root.length + 1)

function fail(message) {
  console.error(message)
  process.exit(1)
}

function needs(path, what) {
  if (!existsSync(path)) fail(`${relative(path)} is missing. Run \`pnpm build\` first (${what}).`)
}

/** Replace this example's own folder, never the parent: `/examples/` is a docs page. */
function replaceDir(name) {
  const out = join(site, name)
  rmSync(out, { recursive: true, force: true })
  mkdirSync(out, { recursive: true })
  return out
}

needs(join(root, 'apps/docs/dist'), 'the docs site builds last')

// --- Vite apps ------------------------------------------------------------

for (const name of ['react', 'vue', 'svelte']) {
  const from = join(root, 'examples', name, 'dist')
  needs(from, `the ${name} example`)
  const out = replaceDir(name)
  cpSync(from, out, { recursive: true })
  console.log(`wrote ${relative(out)}`)
}

// --- Vanilla --------------------------------------------------------------

/** Where the import map points in the repo, and where it points once deployed. */
const VENDORED = [
  ['../../packages/core/dist/index.js', './vendor/core/index.js'],
  ['../../packages/dom/dist/index.js', './vendor/dom/index.js'],
  ['../../packages/dom/dist/themes.js', './vendor/dom/themes.js'],
]

const source = join(root, 'examples/vanilla/index.html')
needs(source, 'the vanilla example')

const vanilla = replaceDir('vanilla')

// The ESM output of both packages: `index.js` pulls in sibling chunks, and
// `@docentjs/dom` imports `@docentjs/core` by name, which the import map
// resolves to the copy next to it. The CommonJS and type files stay behind.
for (const pkg of ['core', 'dom']) {
  const from = join(root, 'packages', pkg, 'dist')
  needs(from, `the ${pkg} package`)
  const to = join(vanilla, 'vendor', pkg)
  mkdirSync(to, { recursive: true })
  for (const file of readdirSync(from)) {
    if (file.endsWith('.js')) copyFileSync(join(from, file), join(to, file))
  }
}

let html = readFileSync(source, 'utf8')
for (const [repoPath, sitePath] of VENDORED) {
  if (!html.includes(repoPath)) {
    fail(`${relative(source)} no longer imports ${repoPath}. Update VENDORED in ${relative(self)}.`)
  }
  html = html.replaceAll(repoPath, sitePath)
}
writeFileSync(join(vanilla, 'index.html'), html)
console.log(`wrote ${relative(vanilla)}`)
