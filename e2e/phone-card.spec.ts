import { expect, test } from '@playwright/test'
import { box, button, open, popover, settled } from './helpers'

test.skip(({ isMobile }) => !isMobile, 'the phone card is for small screens')

test.describe('the phone card', () => {
  test('progress runs across the top, Next is full width, Back and Skip sit beneath it', async ({
    page,
  }) => {
    await open(page, 'basic')
    await button(page, 'Next').click()
    await expect(popover(page).locator('.title')).toHaveText('Save')
    await settled(page)
    const p = popover(page)
    await expect(p).toHaveClass(/stories/)
    const card = await box(p)
    const segments = await box(p.locator('.marks'))
    const title = await box(p.locator('.title'))
    const next = await box(button(page, 'Next'))
    const back = await box(button(page, 'Back'))
    const skip = await box(button(page, 'Skip'))
    // One segment per step, above the title; two of five done.
    await expect(p.locator('.marks i')).toHaveCount(5)
    await expect(p.locator('.marks i[data-done]')).toHaveCount(2)
    expect(segments.y + segments.height).toBeLessThanOrEqual(title.y)
    // Next spans the card's content width.
    expect(next.width).toBeGreaterThan(card.width - 40)
    // Back on the left and Skip on the right, on one row under Next.
    expect(back.y).toBeGreaterThanOrEqual(next.y + next.height)
    expect(Math.abs(back.y - skip.y)).toBeLessThan(2)
    expect(back.x).toBeLessThan(skip.x)
    // The count is still there for screen readers.
    await expect(p.locator('.count')).toHaveText('2 of 5')
  })

  test('a step with no target is centred as a hero, not docked', async ({ page }) => {
    await open(page, 'basic')
    await settled(page)
    const p = popover(page)
    await expect(p).toHaveClass(/hero/)
    await expect(p).toHaveAttribute('data-side', 'center')
    const b = await box(p)
    const vp = page.viewportSize() as { width: number; height: number }
    // Centred: roughly the same room above and below.
    expect(Math.abs(b.y - (vp.height - (b.y + b.height)))).toBeLessThan(40)
  })

  test('the compact card is small, sits right by its target and points at it', async ({ page }) => {
    await open(page, 'basic', '=save&card=compact')
    const p = popover(page)
    await expect(p).toHaveClass(/compact/)
    await expect(p).not.toHaveClass(/stories/)
    await expect(p).toHaveAttribute('data-side', /^(top|bottom)$/)
    await settled(page)
    const card = await box(p)
    const target = await box(page.locator('#save'))
    const vp = page.viewportSize() as { width: number; height: number }
    // About 70% of the screen at most, leaving the page visible around it.
    expect(card.width).toBeLessThanOrEqual(Math.round(vp.width * 0.7) + 1)
    // Close to the target, with the caret pointing at it.
    const distance = Math.min(
      Math.abs(card.y - (target.y + target.height)),
      Math.abs(target.y - (card.y + card.height)),
    )
    expect(distance).toBeLessThan(40)
    await expect(p.locator('.arrow')).toBeVisible()
    // A pager instead of the count, a small Next, and Skip left to the close button.
    await expect(p.locator('.marks')).toBeVisible()
    await expect(p.locator('.marks i')).toHaveCount(5)
    await expect(button(page, 'Skip')).toBeHidden()
    await expect(p.locator('.close')).toBeVisible()
    const next = await box(button(page, 'Next'))
    expect(next.width).toBeLessThan(card.width / 2)
    // Back is a round icon that still carries its label.
    await button(page, 'Next').click()
    const back = p.locator('[part~="button-back"]')
    await expect(back).toHaveText('Back')
    const b = await box(back)
    expect(Math.abs(b.width - b.height)).toBeLessThan(2)
  })

  test('the classic card is one option away', async ({ page }) => {
    await open(page, 'basic', '=save&card=classic')
    const p = popover(page)
    await expect(p).not.toHaveClass(/stories/)
    await expect(p.locator('.marks')).toBeHidden()
  })
})
