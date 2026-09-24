/**
 * Screenshot each example app mid-tour for the cards on /examples/.
 *
 * Needs the built site: `pnpm build:site`, then `pnpm capture:examples`.
 * The images land in apps/docs/src/assets/examples/ and are committed, so the
 * docs build never has to run a browser. Re-run it when an example changes.
 *
 * Pass `--sweep <dir>` to capture every step of every tour into a scratch
 * folder instead, for picking a better frame.
 */
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const site = join(root, 'apps/docs/dist')
const out = join(root, 'apps/docs/src/assets/examples')

/** Which tour to open and how many steps to move forward before the shot. */
const SHOTS = [
  { name: 'react', tour: 'ledgerline-onboarding', steps: 2 },
  { name: 'vue', tour: 'cinder-triage', steps: 1 },
  { name: 'svelte', tour: 'pressroom-desk', steps: 2 },
  { name: 'vanilla', tour: 'nocturne-studio', steps: 2 },
]

const VIEWPORT = { width: 1280, height: 800 }
/** 16:10, like the card. */
const CROP = { width: 880, height: 550 }

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
}

if (!existsSync(join(site, 'examples/react/index.html'))) {
  console.error('apps/docs/dist/examples is missing. Run `pnpm build:site` first.')
  process.exit(1)
}

const server = createServer((req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (path.endsWith('/')) path += 'index.html'
  const file = join(site, path)
  if (!file.startsWith(site) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end()
    return
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
})
await new Promise((resolve) => server.listen(0, resolve))
const origin = `http://localhost:${server.address().port}`

const sweepAt = process.argv.indexOf('--sweep')
const sweep = sweepAt !== -1
const sweepDir = process.argv[sweepAt + 1]
if (sweep && !sweepDir) {
  console.error('Pass a scratch folder: --sweep <dir>.')
  process.exit(1)
}
mkdirSync(sweep ? sweepDir : out, { recursive: true })

const browser = await chromium.launch()
try {
  for (const shot of SHOTS) {
    const page = await browser.newPage({
      viewport: VIEWPORT,
      deviceScaleFactor: 2,
      colorScheme: 'light',
      reducedMotion: 'reduce',
    })
    await page.goto(`${origin}/examples/${shot.name}/?start=${shot.tour}`)
    await page.waitForTimeout(1200)
    const last = sweep ? 12 : shot.steps
    for (let step = 0; step <= last; step++) {
      if (step > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(700)
      }
      // Advancing by keyboard leaves a focus ring on the popover's button.
      await page.evaluate(() => {
        let el = document.activeElement
        while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement
        el?.blur()
      })
      await page.waitForTimeout(200)
      if (sweep) {
        await page.screenshot({ path: join(sweepDir, `${shot.name}-${step}.png`) })
      }
    }
    if (!sweep) {
      // The whole window is too small to read on a card, so frame the popover
      // with enough of the app around it to show where it lives.
      const box = await page.locator('[role="dialog"]').first().boundingBox()
      if (!box) throw new Error(`${shot.name}: no popover on screen`)
      const x = Math.min(
        Math.max(box.x + box.width / 2 - CROP.width / 2, 0),
        VIEWPORT.width - CROP.width,
      )
      const y = Math.min(
        Math.max(box.y + box.height / 2 - CROP.height / 2, 0),
        VIEWPORT.height - CROP.height,
      )
      await page.screenshot({ path: join(out, `${shot.name}.png`), clip: { x, y, ...CROP } })
      console.log(`wrote apps/docs/src/assets/examples/${shot.name}.png`)
    }
    await page.close()
  }
} finally {
  await browser.close()
  server.close()
}
