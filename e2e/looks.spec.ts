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
