import { expect, test } from '@playwright/test'
import { button, host, popover } from './helpers'

const title = (page: import('@playwright/test').Page) => popover(page).locator('.title')
const active = (page: import('@playwright/test').Page) =>
  page.evaluate(
    () =>
      (window as unknown as { docent: { getState(): { active: string | null } } }).docent.getState()
        .active,
  )

test.describe('tour manager', () => {
  test('auto tour shows once for a qualifying user and never again after reload', async ({
    page,
  }) => {
    await page.goto('/app?manager&user=alice&plan=trial')
    await expect(title(page)).toHaveText('Welcome, trial user')
    await button(page, 'Done').click()
    await expect(popover(page)).toHaveCount(0)

    await page.reload()
    await page.waitForTimeout(400)
    await expect(host(page)).toHaveCount(0)
    expect(await active(page)).toBeNull()
  })

  test('conditions keep the tour from users who do not match', async ({ page }) => {
    await page.goto('/app?manager&user=bob&plan=pro')
    await page.waitForTimeout(400)
    await expect(host(page)).toHaveCount(0)
  })

  test('progress is per user on the same browser', async ({ page }) => {
    await page.goto('/app?manager&user=carol')
    await button(page, 'Done').click()
    await page.goto('/app?manager&user=dave')
    await expect(title(page)).toHaveText('Welcome, trial user')
  })

  test('route trigger starts a tour after client-side navigation', async ({ page }) => {
    await page.goto('/app?manager&user=erin&plan=pro')
    await page.waitForTimeout(300)
    await expect(host(page)).toHaveCount(0)
    await page.locator('[data-nav][href="/app/settings"]').click()
    await expect(title(page)).toHaveText('Your preferences')
    expect(await active(page)).toBe('m-settings')
  })

  test('element trigger starts a tour when the element appears', async ({ page }) => {
    await page.goto('/app?manager&user=frank&plan=pro')
    await page.locator('#reveal').click()
    await expect(title(page)).toHaveText('It appeared')
    expect(await active(page)).toBe('m-lazy')
  })
})
