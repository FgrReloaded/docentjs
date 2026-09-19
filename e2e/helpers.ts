import { expect, type Locator, type Page } from '@playwright/test'

export const host = (page: Page) => page.locator('[data-docent-host]')
export const popover = (page: Page) => host(page).locator('.popover')
export const overlay = (page: Page) => host(page).locator('.overlay')
export const button = (page: Page, label: string) =>
  popover(page).locator('.button', { hasText: label })

export async function open(page: Page, tour: string, extra = '') {
  await page.goto(`/app?tour=${tour}&start${extra}`)
  await expect(popover(page)).toBeVisible()
}

export async function box(locator: Locator) {
  const b = await locator.boundingBox()
  if (!b) throw new Error('element has no box')
  return b
}

export async function events(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { events: string[] }).events)
}

export async function state(page: Page) {
  return page.evaluate(() =>
    (
      window as unknown as { docent: { getState(): { status: string; index: number } } }
    ).docent.getState(),
  )
}

export function viewport(page: Page) {
  const vp = page.viewportSize()
  if (!vp) throw new Error('viewport size unavailable')
  return vp
}

/** Wait until the popover has finished sliding to its spot (two equal readings in a row). */
export async function settled(page: Page) {
  let last = ''
  await expect
    .poll(
      async () => {
        const b = await popover(page).boundingBox()
        const now = b ? `${Math.round(b.x)},${Math.round(b.y)}` : ''
        const stable = now !== '' && now === last
        last = now
        return stable
      },
      { intervals: [50] },
    )
    .toBe(true)
}
