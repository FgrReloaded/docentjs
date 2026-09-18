import { expect, test } from '@playwright/test'
import { box, button, open, popover, viewport } from './helpers'

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

test.describe('bottom sheet', () => {
  test('narrow screens dock the popover to the bottom edge', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'desktop floats the popover')
    await open(page, 'basic', '=save')
    const p = popover(page)
    await expect(p).toHaveAttribute('data-side', 'sheet')
    const vp = viewport(page)
    const b = await box(p)
    expect(Math.round(b.x)).toBe(0)
    expect(Math.round(b.width)).toBe(vp.width)
    expect(Math.round(b.y + b.height)).toBe(vp.height)
    await expect(p.locator('.arrow')).toBeHidden()
    // The target stays visible above the sheet.
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
})
