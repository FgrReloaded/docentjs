import { expect, type Page, test } from '@playwright/test'
import { events, host, popover } from './helpers'

const beacon = (page: Page, label: string) =>
  page.locator('[data-docent-beacons]').getByRole('button', { name: label })
const title = (page: Page) => popover(page).locator('.title')

test.describe('beacons', () => {
  test('a click opens the tip, an outside click closes it, and a seen beacon goes away', async ({
    page,
  }) => {
    await page.goto('/app?beacons&user=b1')
    const save = beacon(page, 'About saving')
    await expect(save).toBeVisible()
    await expect(host(page)).toHaveCount(0)

    await save.click()
    await expect(title(page)).toHaveText('Saving')
    await expect(host(page)).toHaveAttribute('data-overlay', 'none')
    await expect(popover(page).locator('.button')).toHaveText('Got it')

    await page.mouse.click(5, 5)
    await expect(popover(page)).toHaveCount(0)
    await expect(save).toHaveCount(0)
    expect(await events(page)).toEqual(
      expect.arrayContaining(['beacon:shown', 'beacon:opened', 'tour:skipped']),
    )

    await page.reload()
    await expect(beacon(page, 'Sidebar tip')).toBeVisible()
    await expect(beacon(page, 'About saving')).toHaveCount(0)
  })

  test('hovering previews the tip and leaving closes it; the beacon stays', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'hover needs a mouse')
    await page.goto('/app?beacons&user=b2')
    const dot = beacon(page, 'Sidebar tip')
    await dot.hover()
    await expect(title(page)).toHaveText('Sidebar tip')
    await expect(dot).toHaveAttribute('aria-expanded', 'true')

    await page.mouse.move(600, 600, { steps: 4 })
    await expect(popover(page)).toHaveCount(0)
    await expect(dot).toBeVisible()
    await expect(dot).toHaveAttribute('aria-expanded', 'false')
  })

  test('a scrim never covers the beacon that opened it', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hover needs a mouse')
    await page.goto('/app?beacons&user=b4')
    const badge = beacon(page, 'Blurred tip')
    await expect(badge).toBeVisible()
    // The part of the badge outside the element, where the blur would be.
    const mark = await badge.locator('.mark').boundingBox()
    const target = await page.locator('#blocked').boundingBox()
    if (!mark || !target) throw new Error('no box')
    await page.mouse.move(mark.x + mark.width - 3, target.y - 3)
    await expect(title(page)).toHaveText('Behind a blur')
    await expect(host(page)).toHaveAttribute('data-overlay', 'blur')
    // A hand never holds still: nudge the pointer around inside the badge.
    for (let i = 0; i < 8; i++) {
      await page.mouse.move(mark.x + mark.width - 3 - (i % 2), target.y - 3)
      await page.waitForTimeout(100)
    }
    await expect(title(page)).toHaveText('Behind a blur')
    expect((await events(page)).filter((e) => e === 'beacon:opened')).toHaveLength(1)
  })

  test('the beacon follows its target when the page scrolls', async ({ page }) => {
    await page.goto('/app?beacons&user=b3')
    const save = beacon(page, 'About saving')
    await expect(save).toBeVisible()
    const before = await save.boundingBox()
    await page.evaluate(() => window.scrollBy(0, 40))
    await expect.poll(async () => (await save.boundingBox())?.y).not.toBe(before?.y)
    const target = await page.locator('#save').boundingBox()
    const after = await save.boundingBox()
    if (!target || !after) throw new Error('no box')
    expect(Math.abs(after.y + after.height / 2 - target.y)).toBeLessThan(2)
  })
})
