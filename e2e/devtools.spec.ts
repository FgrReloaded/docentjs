import { expect, type Page, test } from '@playwright/test'
import { popover } from './helpers'

const panel = (page: Page) => page.locator('[data-docent-devtools] .panel')
const active = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { docent: { getState(): { active: string | null } } }).docent.getState()
        .active,
  )

test.describe('devtools', () => {
  test.skip(({ isMobile }) => isMobile, 'the panel is a desktop tool')

  test('explains why a tour is not showing, and simulating a user fixes it', async ({ page }) => {
    await page.goto('/app?manager&devtools&user=dt1&plan=pro')
    const card = panel(page).locator('.card', { hasText: 'm-welcome' })
    await expect(card.locator('.badge')).toHaveText('blocked')
    await expect(card.locator('.summary')).toHaveText(
      'Condition failed: trait plan eq "trial" (user has "pro")',
    )

    await panel(page).getByRole('tab', { name: 'Simulate' }).click()
    await panel(page).locator('textarea').fill('{"plan":"trial"}')
    await panel(page).getByRole('button', { name: 'Apply identity' }).click()
    await expect(popover(page).locator('.title')).toHaveText('Welcome, trial user')
    await expect(panel(page).locator('.now')).toContainText('m-welcome')
  })

  test('stays usable above the tour overlay and keeps its own keys', async ({ page }) => {
    await page.goto('/app?manager&devtools&user=dt2&plan=trial')
    await expect(popover(page).locator('.title')).toHaveText('Welcome, trial user')

    // Typing arrow keys and Escape in a devtools input must not drive the tour.
    await panel(page).getByRole('tab', { name: 'Simulate' }).click()
    const eventInput = panel(page).getByPlaceholder('invoice-saved')
    await eventInput.click()
    await eventInput.press('ArrowRight')
    await eventInput.press('Escape')
    expect(await active(page)).toBe('m-welcome')

    // Play another tour from a specific step, clicking through the overlay area.
    await panel(page).getByRole('tab', { name: 'Tours' }).click()
    const settings = panel(page).locator('.card', { hasText: 'm-settings' })
    await settings.locator('.head').click()
    await settings.getByRole('button', { name: 'Play', exact: true }).click()
    expect(await active(page)).toBe('m-settings')
  })

  test('logs events in order', async ({ page }) => {
    await page.goto('/app?manager&devtools&user=dt3&plan=trial')
    await expect(popover(page)).toBeVisible()
    await panel(page).getByRole('tab', { name: 'Events' }).click()
    await expect(panel(page).locator('.event').first()).toContainText('step:shown m-welcome')
    await expect(panel(page).locator('.event').last()).toContainText('tour:started m-welcome')
  })
})
