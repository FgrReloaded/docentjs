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

  test('Pocket shows the page at phone size, with edits live in it', async ({ page }) => {
    await page.goto('/app?manager&devtools&user=pk1')
    await expect(panel(page).locator('.now')).toContainText('m-welcome')
    await panel(page)
      .getByRole('button', { name: /Pocket/ })
      .click()
    const pocket = page.locator('[data-docent-devtools] .pocket')
    const frame = pocket.locator('iframe[name="docent-pocket"]')
    await expect(frame).toHaveAttribute('width', '390')
    const inside = page.frameLocator('iframe[name="docent-pocket"]')
    // The page inside runs the tour, with no second panel of its own.
    await expect(pocket.locator('.pocket-status')).toContainText('Welcome, trial user')
    await expect(inside.locator('[data-docent-devtools]')).toHaveCount(0)
    const title = inside.locator('[data-docent-host]:not([data-leaving]) .title')
    await expect(title).toHaveText('Welcome, trial user')

    // An edit in the panel shows up in the phone.
    await panel(page).getByRole('tab', { name: 'Edit' }).click()
    // Hovering a step outlines nothing: the page is behind the phone, and an
    // outline there would haze the phone's spotlight.
    await panel(page).locator('.step-item').first().hover()
    await expect(page.locator('[data-docent-devtools-highlight]')).toBeHidden()
    await panel(page)
      .locator('.field', { hasText: /^Title/ })
      .locator('input')
      .fill('Hi from Pocket')
    await expect(title).toHaveText('Hi from Pocket')
    // The phone is at the size chosen, and the panel's bar follows it.
    await pocket.locator('.seg-btn', { hasText: '480' }).click()
    await expect(frame).toHaveAttribute('width', '480')
    await expect(panel(page).locator('.now')).toContainText('in the Pocket')

    // Nothing clips the frame with rounded corners: Chrome then drops clip-paths
    // on backdrop filters inside it, blurring a "blur" overlay's spotlight.
    const rounded = await frame.evaluate((el) => {
      const out: string[] = []
      for (
        let n: Element | null = el;
        n;
        n = n.parentElement ?? (n.getRootNode() as ShadowRoot).host ?? null
      ) {
        const cs = getComputedStyle(n)
        const clips = n === el || cs.overflow !== 'visible'
        if (clips && cs.borderRadius !== '0px') out.push(`${n.tagName}.${n.className}`)
      }
      return out
    })
    expect(rounded).toEqual([])

    await pocket.getByRole('button', { name: 'Close Pocket' }).click()
    await expect(pocket).toHaveCount(0)
  })
})
