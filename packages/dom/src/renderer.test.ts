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

const restores: Array<() => void> = []

/**
 * jsdom measures everything as zero, which leaves no space between the target
 * and the popover. Give both real sizes so layout code has something to work with.
 */
function stubLayout(target: HTMLElement): void {
  target.getBoundingClientRect = () =>
    ({
      x: 20,
      y: 240,
      width: 140,
      height: 44,
      top: 240,
      left: 20,
      right: 160,
      bottom: 284,
    }) as DOMRect
  const define = (obj: object, key: string, value: number) => {
    const previous = Object.getOwnPropertyDescriptor(obj, key)
    Object.defineProperty(obj, key, { value, configurable: true })
    restores.push(() => {
      if (previous) Object.defineProperty(obj, key, previous)
      else delete (obj as Record<string, unknown>)[key]
    })
  }
  define(HTMLElement.prototype, 'offsetWidth', 320)
  define(HTMLElement.prototype, 'offsetHeight', 180)
  define(document.documentElement, 'clientWidth', 1024)
  define(document.documentElement, 'clientHeight', 768)
}

afterEach(() => {
  document.body.innerHTML = ''
  for (const restore of restores.splice(0)) restore()
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

  it('fades in the first step and slides from the previous spot between steps', () => {
    document.body.innerHTML = '<button id="target">go</button>'
    const r = new DomRenderer()
    r.show(ctx())
    const first = shadow().querySelector('.popover') as HTMLElement
    expect(first.hasAttribute('data-entering')).toBe(true)
    first.style.transform = 'translate(10px, 20px)'

    r.show(ctx())
    const second = shadow().querySelector('.popover') as HTMLElement
    expect(second).not.toBe(first)
    expect(second.hasAttribute('data-entering')).toBe(false)
    expect(second.hasAttribute('data-moving')).toBe(true)
    r.hide()
  })

  it('resolves arrow, spotlight and overlay from renderer, template, tour and step', () => {
    document.body.innerHTML = '<button id="target">go</button>'
    const r = new DomRenderer({
      arrow: 'dashed',
      spotlight: { shape: 'pill' },
      overlay: { style: 'blur', blur: 6 },
      templates: { t: { arrow: 'curve', spotlight: { ring: 'glow' } } },
    })
    const base = ctx()
    const tour = {
      ...base.tour,
      options: { template: 't', overlay: { opacity: 0.3, color: 'red' } },
    }
    r.show({ ...base, tour })
    const h = host() as HTMLElement
    expect(h.getAttribute('data-arrow')).toBe('curve')
    expect(h.getAttribute('data-shape')).toBe('pill')
    expect(h.getAttribute('data-ring')).toBe('glow')
    expect(h.getAttribute('data-overlay')).toBe('blur')
    expect(h.style.getPropertyValue('--docent-overlay')).toBe('red')
    expect(h.style.getPropertyValue('--docent-overlay-opacity')).toBe('0.3')
    expect(h.style.getPropertyValue('--docent-blur')).toBe('6px')

    const step = { ...base.step, arrow: 'none' as const, spotlight: { ring: 'pulse' as const } }
    r.show({ ...base, tour, step })
    expect(h.getAttribute('data-arrow')).toBe('none')
    expect(h.getAttribute('data-ring')).toBe('pulse')
    r.hide()
  })

  it('draws a connector for connector styles and clears it otherwise', async () => {
    document.body.innerHTML = '<button id="target">go</button>'
    stubLayout(document.getElementById('target') as HTMLElement)
    const r = new DomRenderer({ arrow: 'loop', sheetBreakpoint: 0 })
    r.show(ctx())
    // The connector code is a lazy chunk; it draws once the import resolves.
    const svg = await vi.waitFor(() => {
      const el = shadow().querySelector('svg.connector')
      if (!el?.querySelector('path.stroke')) throw new Error('connector not drawn yet')
      return el as SVGSVGElement
    })
    expect(svg.querySelectorAll('path.stroke').length).toBeGreaterThan(1)
    expect(svg.classList.contains('animate')).toBe(true)
    // A later layout update redraws without replaying the draw-in.
    r.update(true)
    expect(svg.classList.contains('animate')).toBe(false)
    r.show({ ...ctx(), step: { ...ctx().step, arrow: 'caret' } })
    expect(svg.childElementCount).toBe(0)
    r.hide()
  })

  it('keeps room for a connector even when the app sets a small gap', async () => {
    document.body.innerHTML = '<button id="target">go</button>'
    stubLayout(document.getElementById('target') as HTMLElement)
    // `gap` is written with the default caret in mind; a drawn arrow needs more.
    const r = new DomRenderer({ arrow: 'sketch', gap: 14, sheetBreakpoint: 0 })
    r.show(ctx())
    await vi.waitFor(() => {
      if (!shadow().querySelector('svg.connector path.stroke')) throw new Error('not drawn')
    })
    expect(host()?.hasAttribute('data-caret')).toBe(false)
    r.hide()
  })

  it('takes a theme object as the template, which is how one is installed', () => {
    document.body.innerHTML = '<button id="target">go</button>'
    const theme = {
      name: 'Ledger',
      theme: { accent: 'rebeccapurple' },
      eyebrow: '{tour}',
      progress: 'ticks' as const,
      count: '{current2} / {total2}',
    }
    const r = new DomRenderer({ template: theme })
    const tour = { ...ctx().tour, name: 'First run' }
    r.show({ ...ctx(), tour, progress: { current: 2, total: 9 } })
    expect(shadow().querySelector('.eyebrow')?.textContent).toBe('First run')
    expect(shadow().querySelector('.count')?.textContent).toBe('02 / 09')
    expect(shadow().querySelectorAll('.marks i')).toHaveLength(9)
    // The tour sets its own accent, and a tour outranks the installed theme.
    expect(host()?.style.getPropertyValue('--docent-accent')).toBe('tomato')
    r.hide()
  })

  it("lets a tour override the theme's look", () => {
    document.body.innerHTML = '<button id="target">go</button>'
    const r = new DomRenderer({ template: { progress: 'ticks', eyebrow: 'Docent' } })
    const base = ctx()
    r.show({
      ...base,
      tour: { ...base.tour, options: { ...base.tour.options, progress: 'dots', eyebrow: 'New' } },
    })
    expect(shadow().querySelector('.progress')?.getAttribute('data-progress')).toBe('dots')
    expect(shadow().querySelector('.eyebrow')?.textContent).toBe('New')
    r.hide()
  })

  it('gives number tokens their unit and picks readable text for a light accent', () => {
    const r = new DomRenderer({ theme: { radius: 12, width: 300, duration: 180 } })
    r.show(ctx({ tour: { ...ctx().tour, options: { theme: { accent: 'rgb(250, 204, 21)' } } } }))
    const style = host()?.style
    expect(style?.getPropertyValue('--docent-radius')).toBe('12px')
    expect(style?.getPropertyValue('--docent-width')).toBe('300px')
    expect(style?.getPropertyValue('--docent-duration')).toBe('180ms')
    // Yellow needs dark text, taken from the theme's own foreground token.
    expect(style?.getPropertyValue('--docent-accent-fg')).toBe('var(--docent-fg)')
    r.show(ctx({ tour: { ...ctx().tour, options: { theme: { accent: 'rgb(20, 20, 30)' } } } }))
    expect(host()?.style.getPropertyValue('--docent-accent-fg')).toBe('var(--docent-bg)')
    r.hide()
  })

  it('resolves a preset named in the tour, and layers tokens on top of it', async () => {
    const r = new DomRenderer()
    const base = ctx().tour
    await r.show(ctx({ tour: { ...base, options: { theme: 'dark' as const } } }))
    const dark = host()?.style.getPropertyValue('--docent-bg')
    expect(dark).toMatch(/oklch/)
    await r.show(
      ctx({ tour: { ...base, options: { theme: { preset: 'dark' as const, accent: 'tomato' } } } }),
    )
    expect(host()?.style.getPropertyValue('--docent-bg')).toBe(dark)
    expect(host()?.style.getPropertyValue('--docent-accent')).toBe('tomato')
    r.hide()
  })

  it('follows the system setting with appearance auto, and changes with it', async () => {
    const listeners: Array<() => void> = []
    let dark = true
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        get matches() {
          return dark
        },
        addEventListener: (_: string, fn: () => void) => listeners.push(fn),
        removeEventListener: vi.fn(),
      })),
    )
    const r = new DomRenderer({ appearance: 'auto' })
    await r.show(ctx({ tour: { ...ctx().tour, options: {} } }))
    const night = host()?.style.getPropertyValue('--docent-bg')
    expect(night).toMatch(/oklch/)
    dark = false
    for (const fn of listeners) fn()
    expect(host()?.style.getPropertyValue('--docent-bg')).not.toBe(night)
    r.hide()
    vi.unstubAllGlobals()
  })

  it('applies a built-in look by name, and lets an app replace it', () => {
    document.body.innerHTML = '<button id="target">go</button>'
    const r = new DomRenderer({ sheetBreakpoint: 0 })
    const tour = { ...ctx().tour, options: { template: 'hint' } }
    r.show(ctx({ tour }))
    expect(host()?.getAttribute('data-overlay')).toBe('none')
    expect(host()?.getAttribute('data-ring')).toBe('glow')
    expect(host()?.getAttribute('data-arrow')).toBe('curve')
    expect(host()?.style.getPropertyValue('--docent-width')).toBe('300px')
    r.hide()

    const own = new DomRenderer({
      sheetBreakpoint: 0,
      templates: { hint: { arrow: 'none', theme: { width: 200 } } },
    })
    own.show(ctx({ tour }))
    expect(host()?.getAttribute('data-arrow')).toBe('none')
    expect(host()?.style.getPropertyValue('--docent-width')).toBe('200px')
    own.hide()
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
