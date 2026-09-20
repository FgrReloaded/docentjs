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

  test('live-edits the running step and picks a target from the page', async ({ page }) => {
    await page.goto('/app?manager&devtools&user=dt4&plan=trial')
    await expect(popover(page).locator('.title')).toHaveText('Welcome, trial user')

    await panel(page).getByRole('tab', { name: 'Edit' }).click()
    const title = panel(page).locator('.field', { hasText: 'Title' }).locator('input')
    await title.fill('Welcome aboard')
    await expect(popover(page).locator('.title')).toHaveText('Welcome aboard')

    // Point the step at the Save button with the picker.
    await panel(page).getByRole('button', { name: 'Pick' }).click()
    await page.mouse.move(10, 10)
    const save = await page.locator('#save').boundingBox()
    if (!save) throw new Error('no save button')
    await page.mouse.move(save.x + save.width / 2, save.y + save.height / 2)
    await page.mouse.click(save.x + save.width / 2, save.y + save.height / 2)
    const best = panel(page).locator('.candidate').first()
    await expect(best).toContainText('name: save')
    await best.click()
    await expect(popover(page)).not.toHaveAttribute('data-side', 'center')
    const tours = await page.evaluate(() =>
      (
        window as unknown as {
          docent: { getTours(): Array<{ id: string; steps: Array<{ target?: unknown }> }> }
        }
      ).docent.getTours(),
    )
    expect(tours.find((t) => t.id === 'm-welcome')?.steps[0]?.target).toEqual({ name: 'save' })

    // Picking an arrow re-renders the running step with it.
    const arrow = panel(page).locator('.field', { hasText: 'Arrow' }).last().locator('select')
    await arrow.selectOption('curve')
    await expect(page.locator('[data-docent-host]')).toHaveAttribute('data-arrow', 'curve')
    await expect(
      page.locator('[data-docent-host] svg.connector path.stroke').first(),
    ).toBeAttached()
  })

  test('audit reports a target hidden under a fixed panel', async ({ page }) => {
    await page.goto('/app?manager&devtools&user=dt5&plan=pro')
    const p = panel(page)
    await p.getByRole('tab', { name: /Audit/ }).click()
    await expect(p.getByText(/Target is covered by <div#cover>/)).toBeVisible()
  })
})
