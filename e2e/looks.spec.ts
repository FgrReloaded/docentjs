import { expect, test } from '@playwright/test'

const host = (page: import('@playwright/test').Page) => page.locator('[data-docent-host]')

test.describe('arrow, spotlight and overlay looks', () => {
  test.skip(({ isMobile }) => isMobile, 'the mobile sheet has no connector')

  test('loads connector arrows on demand and draws them to the target', async ({ page }) => {
    const chunks: string[] = []
    page.on('request', (r) => {
      if (/connector-[\w-]+\.js$/.test(r.url())) chunks.push(r.url())
    })
    await page.goto('/e2e/fixtures/showcase.html?step=new')
    await expect(host(page).locator('.popover')).toBeVisible()
    expect(chunks).toHaveLength(0) // the default caret never loads connector code

    await page.goto('/e2e/fixtures/showcase.html?step=new&arrow=loop')
    const path = host(page).locator('svg.connector path.stroke').first()
    await expect(path).toBeAttached()
    expect(chunks.length).toBeGreaterThan(0)
    await expect(host(page)).toHaveAttribute('data-arrow', 'loop')
    // The caret notch is hidden when a connector is drawn.
    await expect(host(page).locator('.arrow')).toBeHidden()
  })

  test('aims at the near edge of an oversized target, not its middle', async ({ page }) => {
    // The sidebar runs the full height of the page. Pointing at its centre used
    // to drag the line far below the popover.
    await page.goto('/e2e/fixtures/showcase.html?step=nav&arrow=line')
    const path = host(page).locator('svg.connector path.stroke').first()
    await expect(path).toBeAttached()
    const d = (await path.getAttribute('d')) ?? ''
    const [from, to] = [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => ({
      x: Number(m[1]),
      y: Number(m[2]),
    }))
    if (!from || !to) throw new Error(`unexpected path: ${d}`)
    expect(Math.hypot(to.x - from.x, to.y - from.y)).toBeLessThan(140)
    // The arrowhead stays level with the card it comes from.
    const card = await host(page).locator('.popover').boundingBox()
    if (!card) throw new Error('no popover')
    expect(to.y).toBeGreaterThan(card.y)
    expect(to.y).toBeLessThan(card.y + card.height)
    // And it arrives at an angle rather than dead-on.
    expect(Math.abs(to.y - from.y)).toBeGreaterThan(8)
  })

  test('a small gap set by the app does not squeeze the connector out', async ({ page }) => {
    // Apps set `gap` for the default caret. A drawn arrow needs more room than
    // that, and used to end up with none at all.
    await page.goto('/e2e/fixtures/showcase.html?step=new&arrow=curve&gap=14')
    await expect(host(page).locator('.popover')).toBeVisible()
    await expect(host(page).locator('svg.connector path.stroke').first()).toBeAttached()
    await expect(host(page).locator('.arrow')).toBeHidden()
  })

  test('still draws the arrow when the target is too big to sit beside', async ({ page }) => {
    // The panel fills the page, so the popover is clamped on top of it and there
    // is no band to cross. The line routes around the card instead of vanishing.
    await page.goto('/e2e/fixtures/showcase.html?step=revenue&arrow=curve&big=1')
    const card = host(page).locator('.popover')
    await expect(card).toBeVisible()
    const target = await page.locator('[data-docent="revenue"]').boundingBox()
    const box = await card.boundingBox()
    if (!target || !box) throw new Error('no layout')
    // Guard the premise: the popover really does overlap the panel.
    expect(box.x).toBeLessThan(target.x + target.width)
    expect(box.x + box.width).toBeGreaterThan(target.x)
    await expect(host(page).locator('svg.connector path.stroke').first()).toBeAttached()
    await expect(host(page).locator('.arrow')).toBeHidden()
  })

  test('overlay none keeps the page usable and shapes change the cutout', async ({ page }) => {
    await page.goto('/e2e/fixtures/showcase.html?step=new&overlay=none&shape=circle&ring=glow')
    await expect(host(page)).toHaveAttribute('data-overlay', 'none')
    await expect(host(page)).toHaveAttribute('data-shape', 'circle')
    await expect(host(page)).toHaveAttribute('data-ring', 'glow')
    const pointer = await host(page)
      .locator('.overlay')
      .evaluate((el) => getComputedStyle(el).pointerEvents)
    expect(pointer).toBe('none')
    // A page control outside the spotlight is clickable.
    await page.locator('button.app', { hasText: 'Import' }).click({ timeout: 2000 })
    const ring = await host(page)
      .locator('.ring')
      .evaluate((el) => {
        const s = getComputedStyle(el)
        return { w: Number.parseFloat(s.width), h: Number.parseFloat(s.height) }
      })
    expect(Math.round(ring.w)).toBe(Math.round(ring.h))
  })
})
