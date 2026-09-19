import { expect, test } from '@playwright/test'
import { box, button, events, open, overlay, popover, settled, state, viewport } from './helpers'

test.describe('basic flow', () => {
  test('modal step is centred and progress counts every step', async ({ page, isMobile }) => {
    test.skip(isMobile, 'narrow screens use the bottom sheet')
    await open(page, 'basic')
    const p = popover(page)
    await expect(p).toHaveAttribute('data-side', 'center')
    await expect(p.locator('.title')).toHaveText('Intro')
    await expect(p.locator('.progress')).toHaveText('1 of 5')
    const vp = viewport(page)
    const b = await box(p)
    expect(Math.abs(b.x + b.width / 2 - vp.width / 2)).toBeLessThan(2)
    expect(Math.abs(b.y + b.height / 2 - vp.height / 2)).toBeLessThan(2)
    // No Back on the first step, Skip present, Next focused.
    await expect(button(page, 'Back')).toHaveCount(0)
    await expect(button(page, 'Skip')).toBeVisible()
    await expect(button(page, 'Next')).toBeFocused()
  })

  test('spotlight sits below the target with the arrow pointing at it', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'narrow screens use the bottom sheet')
    await open(page, 'basic')
    await button(page, 'Next').click()
    const p = popover(page)
    await expect(p).toHaveAttribute('data-side', 'bottom')
    await settled(page)
    const target = await box(page.locator('#save'))
    const pop = await box(p)
    expect(pop.y).toBeGreaterThan(target.y + target.height)
    expect(pop.y - (target.y + target.height)).toBeLessThan(40)
    // Overlay hole: the clip path mentions coordinates around the target.
    const clip = await overlay(page).evaluate((el) => getComputedStyle(el).clipPath)
    expect(clip).toContain('path(')
    expect(clip).toContain('evenodd')
    await expect(button(page, 'Back')).toBeVisible()
  })

  test('scrolls a far target into view and flips placement to stay on screen', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'narrow screens use the bottom sheet')
    await open(page, 'basic', '=search')
    const target = page.locator('#search')
    await expect(target).toBeInViewport()
    const p = popover(page)
    await expect(p).toHaveAttribute('data-side', 'top')
    const vp = viewport(page)
    const b = await box(p)
    expect(b.x).toBeGreaterThanOrEqual(0)
    expect(b.y).toBeGreaterThanOrEqual(0)
    expect(b.x + b.width).toBeLessThanOrEqual(vp.width)
    expect(b.y + b.height).toBeLessThanOrEqual(vp.height)
  })

  test('a fixed corner target flips from bottom to top', async ({ page, isMobile }) => {
    test.skip(isMobile, 'narrow screens use the bottom sheet')
    await open(page, 'basic', '=corner')
    await expect(popover(page)).toHaveAttribute('data-side', 'top')
    const pop = await box(popover(page))
    const target = await box(page.locator('#corner'))
    expect(pop.y + pop.height).toBeLessThanOrEqual(target.y)
  })

  test('walks to the end, emits events and restores focus', async ({ page }) => {
    await page.goto('/app?tour=basic')
    await page.locator('#start').click()
    await expect(popover(page)).toBeVisible()
    for (let i = 0; i < 4; i++) await button(page, 'Next').click()
    await button(page, 'Done').click()
    await expect(popover(page)).toHaveCount(0)
    expect(await state(page)).toMatchObject({ status: 'completed' })
    await expect(page.locator('#start')).toBeFocused()
    const log = await events(page)
    expect(log[0]).toBe('tour:started')
    expect(log.at(-1)).toBe('tour:completed')
    expect(log.filter((e) => e.startsWith('step:shown'))).toHaveLength(5)
  })

  test('back and skip', async ({ page }) => {
    await open(page, 'basic')
    await button(page, 'Next').click()
    await button(page, 'Back').click()
    await expect(popover(page).locator('.title')).toHaveText('Intro')
    await button(page, 'Skip').click()
    await expect(popover(page)).toHaveCount(0)
    expect(await state(page)).toMatchObject({ status: 'skipped' })
    expect((await events(page)).at(-1)).toBe('tour:skipped')
  })

  test('popover follows the target while the page scrolls', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the bottom sheet stays docked')
    await open(page, 'basic', '=save')
    const before = await box(popover(page))
    // Scroll a little so the target stays on screen and the popover keeps its placement.
    await page.evaluate(() => window.scrollTo(0, 40))
    // The popover animates to its new spot; wait until it has settled 40px higher.
    await expect
      .poll(async () => Math.round(before.y - (await box(popover(page))).y), { timeout: 2000 })
      .toBe(40)
  })
})
