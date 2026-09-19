// @vitest-environment jsdom
import { defineTour, type RenderContext } from '@docentjs/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DomRenderer } from './renderer'

function ctx(overrides: Partial<RenderContext> = {}): RenderContext {
  const tour = defineTour({
    id: 't',
    options: { theme: { accent: 'tomato' } },
    steps: [{ id: 's', target: '#target', title: 'Title', body: 'Body' }],
  })
  return {
    tour,
    step: tour.steps[0] as RenderContext['step'],
    index: 0,
    progress: { current: 1, total: 1 },
    isFirst: true,
    isLast: true,
    canGoBack: false,
    actions: { next: vi.fn(), back: vi.fn(), skip: vi.fn(), goTo: vi.fn() },
    ...overrides,
  }
}

const host = () => document.querySelector('[data-docent-host]') as HTMLElement | null
const shadow = () => host()?.shadowRoot as ShadowRoot

afterEach(() => {
  document.body.innerHTML = ''
})

describe('DomRenderer', () => {
  it('mounts a shadow host with overlay and popover, and removes it on hide', () => {
    document.body.innerHTML = '<button id="target">go</button>'
    const r = new DomRenderer()
    r.show(ctx())
    expect(host()).not.toBeNull()
    expect(shadow().querySelector('.overlay')).not.toBeNull()
    expect(shadow().querySelector('.popover')?.getAttribute('role')).toBe('dialog')
    expect(shadow().querySelector('slot[name="title"] .title')?.textContent).toBe('Title')
    r.hide()
    expect(host()).toBeNull()
  })

  it('applies renderer, template and tour themes in order', () => {
    const r = new DomRenderer({
      theme: { accent: 'base', radius: '1px', width: '10px' },
      templates: { card: { theme: { accent: 'template', radius: '2px' } } },
    })
    r.show(
      ctx({ tour: { ...ctx().tour, options: { theme: { accent: 'tomato' }, template: 'card' } } }),
    )
    const style = host()?.style
    expect(style?.getPropertyValue('--docent-accent')).toBe('tomato')
    expect(style?.getPropertyValue('--docent-radius')).toBe('2px')
    expect(style?.getPropertyValue('--docent-width')).toBe('10px')
  })

  it('projects slot overrides from the light DOM and removes them between steps', () => {
    const custom = document.createElement('button')
    custom.textContent = 'Mine'
    const r = new DomRenderer({
      slots: {
        buttons: () => custom,
        progress: (c) => `Step ${c.progress.current}`,
        close: () => null,
      },
    })
    r.show(ctx())
    const slotted = Array.from(host()?.children ?? []).map((el) => el.getAttribute('slot'))
    expect(slotted.sort()).toEqual(['buttons', 'close', 'progress'])
    expect(custom.getAttribute('slot')).toBe('buttons')
    expect(custom.isConnected).toBe(true)
    expect(host()?.querySelector('[slot="progress"]')?.textContent).toBe('Step 1')
    expect(host()?.querySelector('[slot="close"]')?.childNodes.length).toBe(0)
    // Defaults still exist as slot fallbacks inside the shadow.
    expect(shadow().querySelector('slot[name="buttons"] .button')).not.toBeNull()

    r.show(ctx())
    expect(host()?.querySelectorAll('[slot]').length).toBe(3)
    r.hide()
    expect(custom.isConnected).toBe(false)
  })

  it('template slots and css apply when a tour names the template', () => {
    const r = new DomRenderer({
      templates: {
        card: {
          slots: { title: () => 'From template' },
          css: '.popover { border: 1px solid red }',
        },
      },
    })
    r.show(ctx({ tour: { ...ctx().tour, options: { template: 'card' } } }))
    expect(host()?.querySelector('[slot="title"]')?.textContent).toBe('From template')
    const styles = Array.from(shadow().querySelectorAll('style')).map((s) => s.textContent ?? '')
    expect(styles.some((s) => s.includes('border: 1px solid red'))).toBe(true)
  })

  it('headless mode hands the app a positioned light-DOM container', () => {
    document.body.innerHTML = '<button id="target">go</button>'
    const cleanup = vi.fn()
    const render = vi.fn((c: RenderContext, container: HTMLElement) => {
      container.textContent = `Custom ${c.step.id}`
      return cleanup
    })
    const r = new DomRenderer({ headless: { render } })
    r.show(ctx())
    const container = host()?.querySelector('[data-docent-popover]') as HTMLElement
    expect(container.getAttribute('slot')).toBe('popover')
    expect(container.textContent).toBe('Custom s')
    expect(container.getAttribute('role')).toBe('dialog')
    expect(shadow().querySelector('.popover.headless slot[name="popover"]')).not.toBeNull()
    expect(shadow().querySelector('.popover .title')).toBeNull()
    expect(container.getAttribute('data-side')).toBeTruthy()

    r.show(ctx())
    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(render).toHaveBeenCalledTimes(2)
    r.hide()
    expect(cleanup).toHaveBeenCalledTimes(2)
  })

  it('injects extra css once at mount', () => {
    const r = new DomRenderer({ css: '.popover { color: purple }' })
    r.show(ctx())
    expect(shadow().querySelector('style')?.textContent).toContain('color: purple')
  })

  it('ignores keys typed in fields inside shadow roots and in opted-out elements', () => {
    const c = ctx({ isLast: false, canGoBack: true })
    const r = new DomRenderer()
    r.show(c)
    const widget = document.createElement('div')
    document.body.appendChild(widget)
    const input = document.createElement('input')
    widget.attachShadow({ mode: 'open' }).appendChild(input)
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }),
    )
    expect(c.actions.next).not.toHaveBeenCalled()

    const panel = document.createElement('div')
    panel.setAttribute('data-docent-ignore-keys', '')
    document.body.appendChild(panel)
    panel.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
    )
    expect(c.actions.skip).not.toHaveBeenCalled()
    r.hide()
  })

  it('Escape skips and arrow keys navigate', () => {
    const c = ctx({ isLast: false, canGoBack: true })
    const r = new DomRenderer()
    r.show(c)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(c.actions.next).toHaveBeenCalledTimes(1)
    expect(c.actions.back).toHaveBeenCalledTimes(1)
    expect(c.actions.skip).toHaveBeenCalledTimes(1)
    r.hide()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(c.actions.next).toHaveBeenCalledTimes(1)
  })
})
