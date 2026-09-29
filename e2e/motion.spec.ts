import { expect, test } from '@playwright/test'
import { button, open, popover } from './helpers'

/** Names of the CSS animations running on the popover's content. */
async function contentAnimations(page: import('@playwright/test').Page): Promise<string[]> {
  return popover(page).evaluate((p) =>
    [...p.querySelectorAll(':scope > slot > *')].flatMap((el) =>
      el.getAnimations().map((a) => (a as CSSAnimation).animationName),
    ),
  )
}

test.describe('motion', () => {
  test('step changes animate the content, which way the tour goes on a phone', async ({
    page,
    isMobile,
  }) => {
    await open(page, 'basic')
    await button(page, 'Next').click()
    await expect(popover(page).locator('.title')).toHaveText('Save')
    // Slots draw nothing, so the animation has to be on what is in them to be seen.
    const forward = await contentAnimations(page)
    expect(forward).toContain(isMobile ? 'docent-from-end' : 'docent-swap')

    await button(page, 'Back').click()
    await expect(popover(page).locator('.title')).toHaveText('Intro')
    expect(await contentAnimations(page)).toContain(isMobile ? 'docent-from-start' : 'docent-swap')
  })

  test('the card changes height smoothly between steps of different length', async ({ page }) => {
    // The welcome step has three lines of text, the next one two.
    await page.goto('/e2e/fixtures/showcase.html?step=welcome')
    const p = page.locator('[data-docent-host]:not([data-leaving]) .popover')
    await expect(p).toBeVisible()
    await p.locator('[part~="button-next"]').click()
    await expect(p.locator('.title')).toHaveText('Create your first invoice')
    const heightTransition = await p.evaluate((el) =>
      el.getAnimations().some((a) => (a as CSSTransition).transitionProperty === 'height'),
    )
    expect(heightTransition).toBe(true)
    // Once it lands, the card is back to its natural height.
    await expect(p).not.toHaveAttribute('data-resizing')
    expect(await p.evaluate((el) => el.style.height)).toBe('')
  })

  test('the tour fades out and is removed when it ends', async ({ page }) => {
    await open(page, 'basic')
    const leaving = page.locator('[data-docent-host][data-leaving]')
    await page.keyboard.press('Escape')
    await expect(popover(page)).toHaveCount(0)
    // It plays an exit (inert while it does), then goes away.
    await expect(leaving).toHaveCount(1)
    await expect(leaving).toHaveCount(0)
  })
})
