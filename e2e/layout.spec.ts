import { expect, test } from '@playwright/test'
import { box, button, open, popover, settled, viewport } from './helpers'

test.describe('sticky headers', () => {
  test('scrolls a target out from under a sticky header', async ({ page }) => {
    await open(page, 'sticky')
    const header = await box(page.locator('header'))
    const target = await box(page.locator('#search'))
    expect(target.y).toBeGreaterThanOrEqual(header.y + header.height)
    await expect(page.locator('#search')).toBeInViewport({ ratio: 1 })
  })

  test('waits for a smooth scroll before uncovering', async ({ page }) => {
    await open(page, 'sticky')
    await button(page, 'Next').click()
    await expect(popover(page).locator('.title')).toHaveText('Smooth')
    await expect
      .poll(async () => {
        const header = await box(page.locator('header'))
        const target = await box(page.locator('#save'))
        return target.y >= header.y + header.height
      })
      .toBe(true)
  })
})

test.describe('small screens', () => {
  test('the card floats beside its target when it fits, as wide as the screen', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'desktop floats the popover')
    await open(page, 'basic', '=save')
    const p = popover(page)
    await expect(p).toHaveAttribute('data-side', 'bottom')
    await settled(page) // the entrance scales in from 97%
    const vp = viewport(page)
    const b = await box(p)
    expect(Math.round(b.x)).toBe(12)
    expect(Math.round(vp.width - (b.x + b.width))).toBe(12)
    // Right under the target, pointing at it.
    const target = await box(page.locator('#save'))
    expect(b.y).toBeGreaterThan(target.y + target.height)
    expect(b.y - (target.y + target.height)).toBeLessThan(40)
    await expect(p.locator('.arrow')).toBeVisible()
  })

  test('docked, the card keeps room around it and points at its target', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'desktop floats the popover')
    await open(page, 'basic', '=save&layout=dock')
    const p = popover(page)
    await expect(p).toHaveAttribute('data-side', 'sheet')
    await expect(p).toHaveAttribute('data-dock', 'bottom')
    await settled(page)
    const vp = viewport(page)
    const b = await box(p)
    // Centred, with an even margin on both sides and below.
    expect(Math.round(b.x)).toBe(12)
    expect(Math.round(vp.width - (b.x + b.width))).toBe(12)
    expect(Math.round(vp.height - (b.y + b.height))).toBe(12)
    // It never takes the whole screen, so the page stays in view behind it.
    expect(b.height).toBeLessThanOrEqual(vp.height * 0.72 + 1)
    // The target stays visible above the card, and the caret lines up with it.
    const target = await box(page.locator('#save'))
    expect(target.y + target.height).toBeLessThanOrEqual(b.y)
    const arrow = await box(p.locator('.arrow'))
    expect(Math.abs(arrow.x + arrow.width / 2 - (target.x + target.width / 2))).toBeLessThan(3)
  })

  test('a docked card goes to the top for a target pinned to the bottom', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'desktop floats the popover')
    await open(page, 'basic', '=corner&layout=dock')
    const p = popover(page)
    await expect(p).toHaveAttribute('data-dock', 'top')
    await settled(page)
    const b = await box(p)
    const corner = await box(page.locator('#corner'))
    expect(b.y + b.height).toBeLessThan(corner.y)
    await expect(page.locator('#corner')).toBeInViewport({ ratio: 1 })
  })

  test('a docked card goes to the top when the page cannot scroll the target clear', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'desktop floats the popover')
    // The search field is at the very end of the page.
    await open(page, 'basic', '=search&layout=dock')
    const p = popover(page)
    await expect(p).toHaveAttribute('data-dock', 'top')
    await settled(page)
    const b = await box(p)
    const target = await box(page.locator('#search'))
    expect(target.y).toBeGreaterThanOrEqual(b.y + b.height)
    await expect(page.locator('#search')).toBeInViewport({ ratio: 1 })
  })

  test('with room around it, a card at the end of the page floats above its target', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'desktop floats the popover')
    await open(page, 'basic', '=search')
    await expect(popover(page)).toHaveAttribute('data-side', 'top')
  })

  for (const [label, tour, extra] of [
    ['a tall target', 'tall', ''],
    // On screen from the start: the scroll that clears the card is what pins the header.
    ['a target under a header that pins once the page scrolls', 'mid', '&pinlater'],
  ] as const) {
    test(`${label} comes to just below the sticky header, never under it`, async ({
      page,
      isMobile,
    }) => {
      test.skip(!isMobile, 'desktop floats the popover')
      await open(page, tour, `=${tour}&layout=dock${extra}`)
      await settled(page)
      const header = await box(page.locator('header'))
      const target = await box(page.locator(`#${tour}`))
      const ring = await box(page.locator('[data-docent-host]:not([data-leaving]) .ring'))
      // Its top is in view, below the header (a frosted header would blur what is under it).
      expect(target.y).toBeGreaterThanOrEqual(header.y + header.height - 1)
      // The spotlight is cropped to below the header too.
      expect(ring.y).toBeGreaterThanOrEqual(header.y + header.height)
    })
  }

  test.describe('a narrow phone', () => {
    test.use({ viewport: { width: 340, height: 700 } })

    test('the step counter never runs under the buttons', async ({ page }) => {
      // Step 2 of 5 shows all three buttons: Not now, Back and Continue.
      // The classic card keeps the counter in the footer row; the phone card moves it to the top.
      await open(page, 'basic', '=save&long&card=classic')
      await settled(page)
      const p = popover(page)
      const card = await box(p)
      const buttons = await box(p.locator('.buttons'))
      for (const part of ['.count', '.marks']) {
        const b = await box(p.locator(part))
        const overlaps =
          b.x < buttons.x + buttons.width &&
          buttons.x < b.x + b.width &&
          b.y < buttons.y + buttons.height &&
          buttons.y < b.y + b.height
        expect(overlaps, `${part} overlaps the buttons`).toBe(false)
        expect(b.x + b.width).toBeLessThanOrEqual(card.x + card.width)
      }
    })
  })

  test.describe('a short screen', () => {
    test.use({ viewport: { width: 844, height: 390 } })

    test('keeps a wordy step on screen and scrolls its text', async ({ page, isMobile }) => {
      test.skip(isMobile, 'this sets its own viewport')
      await open(page, 'wordy')
      const p = popover(page)
      await settled(page)
      const b = await box(p)
      const vp = viewport(page)
      expect(b.y).toBeGreaterThanOrEqual(0)
      expect(b.y + b.height).toBeLessThanOrEqual(vp.height)
      // The text scrolls inside the card, and fades while more remains.
      const more = await p.locator('.body').evaluate((el) => el.scrollHeight > el.clientHeight + 1)
      expect(more).toBe(true)
      await expect(p).toHaveClass(/scrolls/)
      // The buttons stay reachable at the bottom of the card.
      const done = await box(p.locator('[part~="button-next"]'))
      expect(done.y + done.height).toBeLessThanOrEqual(vp.height)
    })
  })
})
