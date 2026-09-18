import { expect, test } from '@playwright/test'
import { button, open, popover, state } from './helpers'

test.describe('keyboard and focus', () => {
  test('arrow keys navigate and Escape skips', async ({ page }) => {
    await open(page, 'basic')
    await page.keyboard.press('ArrowRight')
    await expect(popover(page).locator('.title')).toHaveText('Save')
    await page.keyboard.press('ArrowLeft')
    await expect(popover(page).locator('.title')).toHaveText('Intro')
    await page.keyboard.press('Escape')
    await expect(popover(page)).toHaveCount(0)
    expect(await state(page)).toMatchObject({ status: 'skipped' })
  })

  test('Tab cycles inside the popover', async ({ page }) => {
    await open(page, 'basic')
    await button(page, 'Next').click()
    await expect(button(page, 'Next')).toBeFocused()
    await page.keyboard.press('Tab')
    // Wrapped to the first focusable: the close button.
    await expect(popover(page).locator('.close')).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(button(page, 'Next')).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(button(page, 'Skip')).toBeFocused()
  })

  test('the dialog is labelled for assistive tech', async ({ page }) => {
    await open(page, 'basic')
    const p = popover(page)
    await expect(p).toHaveAttribute('role', 'dialog')
    const labelledBy = await p.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    await expect(p.locator(`#${labelledBy}`)).toHaveText('Intro')
  })
})
