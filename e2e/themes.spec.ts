import { expect, type Page, test } from '@playwright/test'

const host = (page: Page) => page.locator('[data-docent-host]')

test.describe('themes', () => {
  test('a theme handed to the renderer changes the look with no code', async ({ page }) => {
    await page.goto('/e2e/fixtures/showcase.html?step=new&progress=ticks&eyebrow=%7Btour%7D')
    await expect(host(page).locator('.popover')).toBeVisible()
    // The eyebrow the default popover has no room for, now declared.
    await expect(host(page).locator('.eyebrow')).toHaveText('Northwind tour')
    await expect(host(page).locator('.count')).toHaveText('02 / 05')
    await expect(host(page).locator('.marks i')).toHaveCount(5)
    // Two of five taken.
    await expect(host(page).locator('.marks i[data-done]')).toHaveCount(2)
    // The heading is still what labels the dialog.
    const title = host(page).locator('.title')
    await expect(host(page).locator('.popover')).toHaveAttribute(
      'aria-labelledby',
      (await title.getAttribute('id')) ?? '',
    )
  })

  test('dots carry the count for a screen reader, since they have no text', async ({ page }) => {
    await page.goto('/e2e/fixtures/showcase.html?step=new&progress=dots')
    await expect(host(page).locator('.marks i')).toHaveCount(5)
    await expect(host(page).locator('.count')).toHaveCount(0)
    await expect(host(page).locator('.progress')).toHaveAttribute('aria-label', '2 of 5')
  })

  test('without a theme the heading stands alone, as before', async ({ page }) => {
    await page.goto('/e2e/fixtures/showcase.html?step=new')
    await expect(host(page).locator('.popover')).toBeVisible()
    await expect(host(page).locator('.eyebrow')).toHaveCount(0)
    await expect(host(page).locator('.meter')).toHaveCount(1)
  })
})
