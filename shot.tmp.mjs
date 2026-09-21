import { chromium } from 'playwright'
const [url, out, clicks = '0'] = process.argv.slice(2)
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await p.goto(url)
await p.waitForTimeout(2200)
const findPop = () => p.evaluate(() => {
  const walk = (root) => {
    for (const el of root.querySelectorAll('*')) {
      if (el.shadowRoot) {
        const pop = el.shadowRoot.querySelector('.popover')
        if (pop) return pop
        const r = walk(el.shadowRoot)
        if (r) return r
      }
    }
    return null
  }
  const pop = walk(document)
  if (!pop) return null
  window.__pop = pop
  const r = pop.getBoundingClientRect()
  return { x: r.x, y: r.y, width: r.width, height: r.height }
})
for (let i = 0; i < Number(clicks); i++) {
  await p.evaluate(() => {
    const walk = (root) => {
      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) {
          const btn = el.shadowRoot.querySelector('[part~="button-next"]')
          if (btn) return btn
          const r = walk(el.shadowRoot)
          if (r) return r
        }
      }
      return null
    }
    walk(document)?.click()
  })
  await p.waitForTimeout(900)
}
const box = await findPop()
const pad = 16
await p.screenshot({ path: out, clip: box ? { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 } : undefined })
console.log(box)
await b.close()
