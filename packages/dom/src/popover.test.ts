// @vitest-environment jsdom
import type { RenderContext } from '@docentjs/core'
import { defineTour } from '@docentjs/core'
import { describe, expect, it, vi } from 'vitest'
import { buildPopover, formatProgress, resolveSlots } from './popover'

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

describe('resolveSlots', () => {
  it('turns slot results into slot-tagged light-DOM elements', () => {
    const node = document.createElement('nav')
    const out = resolveSlots(
      document,
      {
        buttons: () => node,
        progress: () => 'p',
        close: () => null,
        title: () => undefined,
        body: () => document.createTextNode('frag'),
      },
      context(),
    )
    expect(out.map((el) => `${el.tagName.toLowerCase()}[${el.getAttribute('slot')}]`)).toEqual([
      'nav[buttons]',
      'span[progress]',
      'span[close]',
      'div[body]',
    ])
    expect(out[1]?.textContent).toBe('p')
    expect(out[3]?.textContent).toBe('frag')
  })

  it('moves initial focus to the dialog when the buttons slot is replaced', () => {
    const { initialFocus, el } = buildPopover(document, context(), {}, { buttons: () => 'x' })
    expect(initialFocus).toBe(el)
  })
})

describe('formatProgress', () => {
  it('replaces placeholders', () => {
    expect(formatProgress('{current} of {total}', 2, 5)).toBe('2 of 5')
  })
})

describe('eyebrow and progress styles', () => {
  it('puts an eyebrow above the title and fills in the tour name', () => {
    const ctx = context({ tour: { ...context().tour, name: 'First run' } })
    const { el } = buildPopover(document, ctx, {}, {}, { eyebrow: '{tour}' })
    expect(el.querySelector('.eyebrow')?.textContent).toBe('First run')
    // The heading keeps its id, so the dialog is still labelled by it.
    expect(el.getAttribute('aria-labelledby')).toBe(el.querySelector('.title')?.id)
    expect(el.querySelector('.titles .title')?.textContent).toBe('Hello')
  })

  it('leaves the heading alone when there is no eyebrow', () => {
    const { el } = buildPopover(document, context())
    expect(el.querySelector('.titles')).toBeNull()
    expect(el.querySelector('.header .title')).not.toBeNull()
  })

  it('lets a step override or remove the tour eyebrow', () => {
    const override = buildPopover(
      document,
      context({}, { eyebrow: 'New' }),
      {},
      {},
      {
        eyebrow: 'Docent',
      },
    )
    expect(override.el.querySelector('.eyebrow')?.textContent).toBe('New')
    const removed = buildPopover(
      document,
      context({}, { eyebrow: '' }),
      {},
      {},
      {
        eyebrow: 'Docent',
      },
    )
    expect(removed.el.querySelector('.eyebrow')).toBeNull()
  })

  it.each([
    ['meter', 1, 0, true],
    ['count', 0, 0, true],
    ['ticks', 0, 3, true],
    ['dots', 0, 3, false],
    ['none', 0, 0, false],
  ] as const)('draws %s progress', (style, meters, marks, counted) => {
    const { el } = buildPopover(document, context(), {}, {}, { progress: style })
    const progress = el.querySelector('.progress') as HTMLElement
    expect(progress.querySelectorAll('.meter')).toHaveLength(meters)
    expect(progress.querySelectorAll('.marks i')).toHaveLength(marks)
    expect(progress.querySelector('.count') !== null).toBe(counted)
    // Dots carry no text, so the count is read from a label instead.
    if (style === 'dots') expect(progress.getAttribute('aria-label')).toBe('1 of 3')
  })

  it('marks the steps already taken', () => {
    const ctx = context({ progress: { current: 2, total: 4 } })
    const { el } = buildPopover(document, ctx, {}, {}, { progress: 'ticks' })
    const marks = [...el.querySelectorAll('.marks i')].map((m) => m.hasAttribute('data-done'))
    expect(marks).toEqual([true, true, false, false])
  })

  it('pads the count to two digits on request', () => {
    expect(formatProgress('{current2} / {total2}', 3, 12)).toBe('03 / 12')
    expect(formatProgress('{current} of {total}', 3, 12)).toBe('3 of 12')
  })
})
