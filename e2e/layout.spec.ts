import { expect, test } from '@playwright/test'
import { box, button, open, popover, settled, viewport } from './helpers'

test.describe('sticky headers', () => {
  test('scrolls a target out from under a sticky header', async ({ page }) => {
    await open(page, 'sticky')
    const header = await box(page.locator('header'))
    const target = await box(page.locator('#search'))
    expect(target.y).toBeGreaterThanOrEqual(header.y + header.height)
    await expect(page.locator('#search')).toBeInViewport({ ratio: 1 })
  })

  test('waits for a smooth scroll before uncovering', async ({ page }) => {
    await open(page, 'sticky')
    await button(page, 'Next').click()
    await expect(popover(page).locator('.title')).toHaveText('Smooth')
    await expect
      .poll(async () => {
        const header = await box(page.locator('header'))
        const target = await box(page.locator('#save'))
        return target.y >= header.y + header.height
      })
      .toBe(true)
  })
})

test.describe('small screens', () => {
  test('the popover docks near the bottom as a card with room around it', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'desktop floats the popover')
    await open(page, 'basic', '=save')
    const p = popover(page)
    await expect(p).toHaveAttribute('data-side', 'sheet')
    await settled(page) // the entrance scales in from 97%
    const vp = viewport(page)
    const b = await box(p)
    // Centred, with an even margin on both sides and below.
    expect(Math.round(b.x)).toBe(12)
    expect(Math.round(vp.width - (b.x + b.width))).toBe(12)
    expect(Math.round(vp.height - (b.y + b.height))).toBe(12)
    // It never takes the whole screen, so the page stays in view behind it.
    expect(b.height).toBeLessThanOrEqual(vp.height * 0.72 + 1)
    await expect(p.locator('.arrow')).toBeHidden()
    // The target stays visible above the card.
    const target = await box(page.locator('#save'))
    expect(target.y + target.height).toBeLessThanOrEqual(b.y)
  })

  test('a target that would sit behind the sheet is scrolled clear', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'desktop floats the popover')
    await open(page, 'basic', '=corner')
    const p = popover(page)
    await expect(p).toHaveAttribute('data-side', 'sheet')
    await expect(page.locator('#corner')).toBeVisible()
  })

  test.describe('a short screen', () => {
    test.use({ viewport: { width: 844, height: 390 } })

    test('keeps a wordy step on screen and scrolls its text', async ({ page, isMobile }) => {
      test.skip(isMobile, 'this sets its own viewport')
      await open(page, 'wordy')
      const p = popover(page)
      await settled(page)
      const b = await box(p)
      const vp = viewport(page)
      expect(b.y).toBeGreaterThanOrEqual(0)
      expect(b.y + b.height).toBeLessThanOrEqual(vp.height)
      // The text scrolls inside the card, and fades while more remains.
      const more = await p.locator('.body').evaluate((el) => el.scrollHeight > el.clientHeight + 1)
      expect(more).toBe(true)
      await expect(p).toHaveClass(/scrolls/)
      // The buttons stay reachable at the bottom of the card.
      const done = await box(p.locator('[part~="button-next"]'))
      expect(done.y + done.height).toBeLessThanOrEqual(vp.height)
    })
  })
})
