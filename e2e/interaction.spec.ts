import { expect, test } from '@playwright/test'
import { box, button, events, host, open, overlay, popover, state } from './helpers'

test.describe('interaction modes', () => {
  test('advance on click passes the click through to the target', async ({ page }) => {
    await open(page, 'modes')
    await expect(popover(page).locator('.title')).toHaveText('Click it')
    await expect(host(page).locator('.blocker')).toBeHidden()
    await page.locator('#save').click()
    await expect(popover(page).locator('.title')).toHaveText('Blocked')
  })

  test('a blocked target does not receive clicks', async ({ page }) => {
    await open(page, 'modes', '=blocked')
    await expect(host(page).locator('.blocker')).toBeVisible()
    await page
      .locator('#blocked')
      .click({ force: true, trial: false })
      .catch(() => {})
    // Click through the real hit-test path at the target's centre.
    const b = await box(page.locator('#blocked'))
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
    await expect(page.locator('#blocked-count')).toHaveText('0')
    await expect(popover(page).locator('.title')).toHaveText('Blocked')
  })

  test('advance on input waits for the pattern', async ({ page }) => {
    await open(page, 'modes', '=input')
    const input = page.locator('#search')
    await expect(input).toBeInViewport()
    await input.fill('x')
    await expect(popover(page).locator('.title')).toHaveText('Type')
    await input.fill('abc')
    await expect(popover(page).locator('.title')).toHaveText('Done')
  })

  test('clicking the overlay skips when enabled', async ({ page }) => {
    await open(page, 'overlay')
    await overlay(page).click({ position: { x: 5, y: 400 } })
    await expect(popover(page)).toHaveCount(0)
    expect(await state(page)).toMatchObject({ status: 'skipped' })
  })

  test('waits for a lazy target to appear', async ({ page }) => {
    await page.goto('/app?tour=lazy&start&autoreveal')
    await expect(popover(page).locator('.title')).toHaveText('Lazy', { timeout: 3000 })
    await expect(page.locator('#lazy')).toBeVisible()
  })

  test('missing targets are skipped or abort as configured', async ({ page }) => {
    await page.goto('/app?tour=missing&start')
    await expect.poll(() => state(page)).toMatchObject({ status: 'aborted' })
    const log = await events(page)
    expect(log).toContain('step:missing:nope')
    expect(log).toContain('step:missing:abort')
    expect(log.at(-1)).toBe('tour:aborted')
    await expect(popover(page)).toHaveCount(0)
    await expect(button(page, 'Next')).toHaveCount(0)
  })
})
