// @vitest-environment jsdom
import type { RenderContext } from '@docentjs/core'
import { defineTour } from '@docentjs/core'
import { describe, expect, it, vi } from 'vitest'
import { buildPopover, formatProgress } from './popover'

function context(
  partial: Partial<RenderContext> = {},
  step: Partial<RenderContext['step']> = {},
): RenderContext {
  const tour = defineTour({ id: 't', steps: [{ id: 's', title: 'Hello', body: 'World', ...step }] })
  return {
    tour,
    step: tour.steps[0] as RenderContext['step'],
    index: 0,
    progress: { current: 1, total: 3 },
    isFirst: true,
    isLast: false,
    canGoBack: false,
    actions: { next: vi.fn(), back: vi.fn(), skip: vi.fn(), goTo: vi.fn() },
    ...partial,
  }
}

describe('buildPopover', () => {
  it('renders title, body, progress and the right buttons', () => {
    const ctx = context()
    const { el, initialFocus } = buildPopover(document, ctx)
    expect(el.getAttribute('role')).toBe('dialog')
    expect(el.querySelector('.title')?.textContent).toBe('Hello')
    expect(el.getAttribute('aria-labelledby')).toBe(el.querySelector('.title')?.id)
    expect(el.querySelector('.body')?.textContent).toBe('World')
    expect(el.querySelector('.progress')?.textContent).toBe('1 of 3')
    const labels = Array.from(el.querySelectorAll('.button')).map((b) => b.textContent)
    expect(labels).toEqual(['Skip', 'Next'])
    expect(initialFocus.textContent).toBe('Next')
  })

  it('wires buttons to actions', () => {
    const ctx = context({ canGoBack: true })
    const { el } = buildPopover(document, ctx)
    const click = (label: string) =>
      (
        Array.from(el.querySelectorAll('button')).find(
          (b) => b.textContent === label,
        ) as HTMLButtonElement
      ).click()
    click('Next')
    click('Back')
    click('Skip')
    expect(ctx.actions.next).toHaveBeenCalledTimes(1)
    expect(ctx.actions.back).toHaveBeenCalledTimes(1)
    expect(ctx.actions.skip).toHaveBeenCalledTimes(1)
    ;(el.querySelector('.close') as HTMLButtonElement).click()
    expect(ctx.actions.skip).toHaveBeenCalledTimes(2)
  })

  it('shows Done on the last step and hides Skip', () => {
    const { el } = buildPopover(document, context({ isLast: true }))
    const labels = Array.from(el.querySelectorAll('.button')).map((b) => b.textContent)
    expect(labels).toEqual(['Done'])
  })

  it('respects per-step button flags and custom labels', () => {
    const ctx = context(
      { canGoBack: true },
      { buttons: { back: false, skip: false, close: false } },
    )
    const { el } = buildPopover(document, ctx, {
      next: 'Continue',
      progress: 'Step {current}/{total}',
    })
    expect(Array.from(el.querySelectorAll('.button')).map((b) => b.textContent)).toEqual([
      'Continue',
    ])
    expect(el.querySelector('.close')).toBeNull()
    expect(el.querySelector('.progress')?.textContent).toBe('Step 1/3')
  })

  it('falls back to focusing the dialog when there is no next button', () => {
    const { el, initialFocus } = buildPopover(document, context({}, { buttons: { next: false } }))
    expect(initialFocus).toBe(el)
  })

  it('renders media', () => {
    const { el } = buildPopover(document, context({}, { media: { type: 'image', src: '/x.png' } }))
    expect(el.querySelector('.media img')?.getAttribute('src')).toBe('/x.png')
  })
})

describe('formatProgress', () => {
  it('replaces placeholders', () => {
    expect(formatProgress('{current} of {total}', 2, 5)).toBe('2 of 5')
  })
})
