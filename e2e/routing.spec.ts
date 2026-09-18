import { expect, test } from '@playwright/test'
import { button, open, popover, state } from './helpers'

test.describe('routes and persistence', () => {
  test('pauses on a step for another route and resumes after navigation', async ({ page }) => {
    await open(page, 'routes')
    await expect(popover(page).locator('.title')).toHaveText('Save')
    await button(page, 'Next').click()
    await expect.poll(() => state(page)).toMatchObject({ status: 'paused' })
    await expect(popover(page)).toHaveCount(0)

    await page.locator('[data-nav][href="/app/settings"]').click()
    await expect(popover(page).locator('.title')).toHaveText('Pref')
    expect(await state(page)).toMatchObject({ status: 'running', index: 1 })

    await page.goBack()
    await expect.poll(() => state(page)).toMatchObject({ status: 'paused' })
    await page.goForward()
    await expect(popover(page).locator('.title')).toHaveText('Pref')
  })

  test('progress survives a reload', async ({ page }) => {
    await open(page, 'persist')
    await button(page, 'Next').click()
    await expect(popover(page).locator('.title')).toHaveText('Two')
    await page.goto('/app?tour=persist&resume')
    await expect(popover(page).locator('.title')).toHaveText('Two')
    await button(page, 'Next').click()
    await button(page, 'Done').click()
    await expect(popover(page)).toHaveCount(0)
    const record = await page.evaluate(() => localStorage.getItem('docent:persist'))
    expect(JSON.parse(record ?? '{}')).toMatchObject({ state: 'completed', version: 1 })
  })
})
