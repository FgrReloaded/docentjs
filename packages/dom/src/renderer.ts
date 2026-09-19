/**
 * The web renderer. Draws the overlay, spotlight and popover inside a shadow
 * root, keeps them glued to the target through scroll, resize and layout
 * changes, and wires gestures and keys back to the controller.
 *
 * Customisation layers, lowest to highest precedence:
 * renderer options → template (by name) → tour options. Slots project
 * light-DOM content into the built-in popover; headless mode replaces it.
 */

import type { Labels, RenderContext, Renderer, Step, Target, Theme } from '@docentjs/core'
import { uncover } from './occlusion'
import { Overlay } from './overlay'
import { buildHeadlessShell, buildPopover } from './popover'
import {
  centerPosition,
  clipToViewport,
  computePosition,
  type Rect,
  type Viewport,
} from './position'
import { STYLES } from './styles'
import { resolveTarget, waitForTarget } from './target'
import {
  applyTheme,
  type HeadlessPopover,
  mergeThemes,
  type PopoverSlots,
  type PopoverTemplate,
} from './theme'

export interface DomRendererOptions {
  /** Document to render into. Defaults to the global document. */
  document?: Document
  /** Override button and progress labels for every tour. */
  labels?: Labels
  /** Distance between target and popover, in px. */
  gap?: number
  /** Spotlight defaults when a tour sets none. */
  spotlight?: { padding?: number; radius?: number }
  /** Base theme tokens. Tours and templates layer on top. */
  theme?: Theme
  /** Replace regions of the built-in popover. */
  slots?: PopoverSlots
  /** Named templates that tours select with `options.template`. */
  templates?: Record<string, PopoverTemplate>
  /** Template to use when a tour names none. */
  template?: string
  /** Bring your own popover. Overlay, spotlight, positioning and keys stay. */
  headless?: HeadlessPopover
  /** Extra CSS injected into the shadow root. */
  css?: string
  /**
   * Below this viewport width the popover docks to the bottom edge as a sheet
   * instead of floating beside the target. Default 480; 0 disables.
   */
  sheetBreakpoint?: number
  /** Scroll past sticky/fixed headers and footers that cover the target. Default true. */
  avoidOcclusion?: boolean
}

type Cleanup = () => void

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

export class DomRenderer implements Renderer {
  private readonly doc: Document
  private readonly options: DomRendererOptions
  private host: HTMLDivElement | undefined
  private shadow: ShadowRoot | undefined
  private overlay: Overlay | undefined
  private templateStyle: HTMLStyleElement | undefined
  private popover: HTMLDivElement | undefined
  private arrow: HTMLDivElement | undefined
  private headlessContainer: HTMLElement | undefined
  private ctx: RenderContext | undefined
  private target: Element | null = null
  private cleanups: Cleanup[] = []
  private frame: number | undefined
  private previousFocus: Element | null = null
  /** Set once per step after the sheet has scrolled the target clear. */
  private sheetAdjusted = false

  constructor(options: DomRendererOptions = {}) {
    this.options = options
    this.doc = options.document ?? document
  }

  // -------------------------------------------------------------------------
  // Renderer contract
  // -------------------------------------------------------------------------

  hasTarget(target: Target): boolean {
    return resolveTarget(target, this.doc) !== null
  }

  async waitForTarget(target: Target, timeoutMs: number, signal: AbortSignal): Promise<boolean> {
    return (await waitForTarget(target, timeoutMs, signal, this.doc)) !== null
  }

  currentRoute(): string {
    const { pathname, search } = this.doc.defaultView?.location ?? { pathname: '/', search: '' }
    return `${pathname}${search}`
  }

  show(ctx: RenderContext): void {
    const firstStep = !this.host
    const host = this.mount()
    // Where the previous step's popover sat, so the new one glides from there
    // alongside the spotlight instead of vanishing and fading back in.
    const from = this.popover?.style.transform || null
    this.teardownStep()
    this.ctx = ctx
    this.target = ctx.step.target === undefined ? null : resolveTarget(ctx.step.target, this.doc)

    const template = this.template(ctx)
    applyTheme(host, mergeThemes(this.options.theme, template?.theme, ctx.tour.options?.theme))
    this.setTemplateCss(template?.css)

    const initialFocus = this.options.headless
      ? this.buildHeadless(ctx, host, this.options.headless)
      : this.buildDefault(ctx, host, template)
    if (this.popover && from) {
      this.popover.style.transform = from
      this.popover.setAttribute('data-moving', '')
    } else {
      this.popover?.setAttribute('data-entering', '')
    }

    if (this.target) {
      const smooth = this.scrollIntoView(this.target, ctx.step)
      if (this.options.avoidOcclusion !== false) {
        const target = this.target
        this.afterScroll(smooth, target, () => {
          if (this.target === target && uncover(target, host, this.viewport())) this.update()
        })
      }
    }
    this.update()
    this.listen()
    this.wireAdvance(ctx.step)

    if (firstStep) this.previousFocus = this.doc.activeElement
    requestAnimationFrame(() => {
      this.popover?.removeAttribute('data-entering')
      initialFocus.focus({ preventScroll: true })
    })
  }

  hide(): void {
    this.teardownStep()
    if (this.host) {
      this.host.remove()
      this.host = undefined
      this.shadow = undefined
      this.overlay = undefined
      this.templateStyle = undefined
    }
    const prev = this.previousFocus
    this.previousFocus = null
    if (prev instanceof HTMLElement && prev.isConnected) prev.focus({ preventScroll: true })
  }

  // -------------------------------------------------------------------------
  // Layout
  // -------------------------------------------------------------------------

  /** Re-measure and re-position everything. Safe to call often. */
  update(): void {
    const ctx = this.ctx
    const overlay = this.overlay
    const popover = this.popover
    const win = this.doc.defaultView
    if (!ctx || !overlay || !popover || !win) return

    const viewport = this.viewport()
    const overlaySize = { width: overlay.el.offsetWidth, height: overlay.el.offsetHeight }
    const spotlight = {
      ...this.options.spotlight,
      ...ctx.tour.options?.spotlight,
      ...ctx.step.spotlight,
    }
    const padding = spotlight.padding ?? 8
    const radius = spotlight.radius ?? 10
    const external = this.headlessContainer
    const sheet = this.isSheet(viewport)
    popover.classList.toggle('sheet', sheet)
    popover.style.width = sheet ? `${viewport.width}px` : ''
    const floating = { width: popover.offsetWidth, height: popover.offsetHeight }

    if (sheet) {
      const rect = this.target?.isConnected ? toRect(this.target.getBoundingClientRect()) : null
      overlay.update(
        overlaySize,
        { target: rect, padding, radius },
        this.blocksInteraction(ctx.step),
      )
      const vx = viewport.x ?? 0
      const top = (viewport.y ?? 0) + viewport.height - floating.height
      popover.style.transform = `translate(${vx}px, ${top}px)`
      popover.setAttribute('data-side', 'sheet')
      external?.setAttribute('data-side', 'sheet')
      this.keepClearOfSheet(rect, top)
      return
    }

    if (!this.target?.isConnected) {
      overlay.update(overlaySize, { target: null, padding, radius }, false)
      const { x, y } = centerPosition(floating, viewport)
      popover.style.transform = `translate(${x}px, ${y}px)`
      popover.setAttribute('data-side', 'center')
      external?.setAttribute('data-side', 'center')
      return
    }

    const rect = toRect(this.target.getBoundingClientRect())
    overlay.update(overlaySize, { target: rect, padding, radius }, this.blocksInteraction(ctx.step))
    const hole = overlay.hole ?? rect
    const pos = computePosition({
      anchor: clipToViewport(hole, viewport),
      floating,
      viewport,
      placement: ctx.step.placement ?? 'auto',
      gap: this.options.gap ?? 12,
    })
    popover.style.transform = `translate(${pos.x}px, ${pos.y}px)`
    popover.setAttribute('data-side', pos.side)
    if (this.arrow) {
      const vertical = pos.side === 'top' || pos.side === 'bottom'
      this.arrow.style.left = vertical ? `${pos.arrow - 6}px` : ''
      this.arrow.style.top = vertical ? '' : `${pos.arrow - 6}px`
    }
    if (external) {
      external.setAttribute('data-side', pos.side)
      external.style.setProperty('--docent-arrow', `${pos.arrow}px`)
    }
  }

  /**
   * The visible area in layout-viewport coordinates. Uses the visual viewport
   * so pinch zoom, the on-screen keyboard and pages that overflow on mobile
   * (where `innerWidth` grows past the screen) all position correctly.
   */
  private viewport(): Viewport {
    const win = this.doc.defaultView
    const vv = win?.visualViewport
    if (vv) return { x: vv.offsetLeft, y: vv.offsetTop, width: vv.width, height: vv.height }
    const el = this.doc.documentElement
    return { x: 0, y: 0, width: el.clientWidth, height: el.clientHeight }
  }

  private isSheet(viewport: Viewport): boolean {
    const breakpoint = this.options.sheetBreakpoint ?? 480
    return breakpoint > 0 && viewport.width < breakpoint
  }

  /** In sheet mode, scroll once so the target is not hidden behind the sheet. */
  private keepClearOfSheet(target: Rect | null, sheetTop: number): void {
    const win = this.doc.defaultView
    if (!target || !win || this.sheetAdjusted) return
    const overlap = target.y + target.height - sheetTop
    if (overlap <= 0) return
    this.sheetAdjusted = true
    win.scrollBy({ top: overlap + 16, behavior: 'auto' })
  }

  /**
   * Run once a smooth scroll has settled, or right away for instant scrolls.
   * Settled means the target stopped moving for two frames' worth of samples,
   * not a fixed delay: smooth scrolls take longer on slow or busy devices.
   * `scrollend` finishes early where supported; a cap keeps it bounded.
   */
  private afterScroll(smooth: boolean, target: Element, fn: () => void): void {
    const win = this.doc.defaultView
    if (!smooth || !win) {
      fn()
      return
    }
    let done = false
    let lastTop = Number.NaN
    let stableSamples = 0
    const stop = () => {
      done = true
      win.removeEventListener('scrollend', finish)
      clearInterval(poll)
      clearTimeout(cap)
    }
    const finish = () => {
      if (done) return
      stop()
      fn()
    }
    const poll = setInterval(() => {
      const top = target.getBoundingClientRect().top
      stableSamples = Math.abs(top - lastTop) < 0.5 ? stableSamples + 1 : 0
      lastTop = top
      if (stableSamples >= 2) finish()
    }, 80)
    const cap = setTimeout(finish, 3000)
    win.addEventListener('scrollend', finish, { once: true })
    this.cleanups.push(stop)
  }

  // -------------------------------------------------------------------------
  // Popover construction
  // -------------------------------------------------------------------------

  private template(ctx: RenderContext): PopoverTemplate | undefined {
    const name = ctx.tour.options?.template ?? this.options.template
    return name === undefined ? undefined : this.options.templates?.[name]
  }

  private buildDefault(
    ctx: RenderContext,
    host: HTMLElement,
    template: PopoverTemplate | undefined,
  ): HTMLElement {
    const slots: PopoverSlots = { ...this.options.slots, ...template?.slots }
    const { el, arrow, initialFocus, slotted } = buildPopover(
      this.doc,
      ctx,
      this.options.labels ?? {},
      slots,
    )
    this.popover = el
    this.arrow = arrow
    for (const node of slotted) {
      host.appendChild(node)
      this.cleanups.push(() => node.remove())
    }
    this.shadow?.appendChild(el)
    return initialFocus
  }

  private buildHeadless(
    ctx: RenderContext,
    host: HTMLElement,
    headless: HeadlessPopover,
  ): HTMLElement {
    const { el, arrow } = buildHeadlessShell(this.doc)
    this.popover = el
    this.arrow = arrow
    this.shadow?.appendChild(el)

    const container = this.doc.createElement('div')
    container.setAttribute('slot', 'popover')
    container.setAttribute('data-docent-popover', '')
    container.setAttribute('role', 'dialog')
    container.tabIndex = -1
    host.appendChild(container)
    this.headlessContainer = container
    const cleanup = headless.render(ctx, container)
    this.cleanups.push(() => {
      cleanup?.()
      container.remove()
      this.headlessContainer = undefined
    })
    return container
  }

  private setTemplateCss(css: string | undefined): void {
    if (!this.shadow) return
    if (!css) {
      this.templateStyle?.remove()
      this.templateStyle = undefined
      return
    }
    if (!this.templateStyle) {
      this.templateStyle = this.doc.createElement('style')
      this.shadow.appendChild(this.templateStyle)
    }
    if (this.templateStyle.textContent !== css) this.templateStyle.textContent = css
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private mount(): HTMLDivElement {
    if (this.host) return this.host
    const host = this.doc.createElement('div')
    host.setAttribute('data-docent-host', '')
    const shadow = host.attachShadow({ mode: 'open' })
    const style = this.doc.createElement('style')
    style.textContent = this.options.css ? `${STYLES}\n${this.options.css}` : STYLES
    shadow.appendChild(style)
    const overlay = new Overlay(this.doc)
    shadow.appendChild(overlay.el)
    shadow.appendChild(overlay.ring)
    shadow.appendChild(overlay.blocker)
    this.doc.body.appendChild(host)
    this.host = host
    this.shadow = shadow
    this.overlay = overlay
    return host
  }

  private teardownStep(): void {
    for (const c of this.cleanups) c()
    this.cleanups = []
    if (this.frame !== undefined) cancelAnimationFrame(this.frame)
    this.frame = undefined
    this.popover?.remove()
    this.popover = undefined
    this.arrow = undefined
    this.ctx = undefined
    this.target = null
    this.sheetAdjusted = false
  }

  private blocksInteraction(step: Step): boolean {
    if (step.interaction) return step.interaction === 'block'
    const advance = step.advance
    return !(typeof advance === 'object' && (advance.on === 'click' || advance.on === 'input'))
  }

  /** Returns true when a smooth scroll was started (callers must wait for it to settle). */
  private scrollIntoView(el: Element, step: Step): boolean {
    const scroll = { ...this.ctx?.tour.options?.scroll, ...step.scroll }
    if (scroll.enabled === false) return false
    const r = el.getBoundingClientRect()
    const v = this.viewport()
    const vx = v.x ?? 0
    const vy = v.y ?? 0
    const behavior = scroll.behavior ?? 'auto'
    if (r.height > v.height || r.width > v.width) {
      // Oversized target: it can never be fully shown, so only make sure its top is on screen.
      const topVisible = r.top >= vy && r.top < vy + v.height && r.left < vx + v.width
      if (!topVisible) el.scrollIntoView({ block: 'start', inline: 'start', behavior })
      return !topVisible && behavior === 'smooth'
    }
    const visible =
      r.top >= vy && r.left >= vx && r.bottom <= vy + v.height && r.right <= vx + v.width
    if (visible) return false
    el.scrollIntoView({ block: scroll.block ?? 'center', inline: 'nearest', behavior })
    return behavior === 'smooth'
  }

  private scheduleUpdate = (): void => {
    if (this.frame !== undefined) return
    this.frame = requestAnimationFrame(() => {
      this.frame = undefined
      this.update()
    })
  }

  private listen(): void {
    const win = this.doc.defaultView
    const ctx = this.ctx
    if (!win || !ctx) return
    const on = <K extends keyof WindowEventMap>(
      type: K,
      handler: (e: WindowEventMap[K]) => void,
      opts?: AddEventListenerOptions,
    ) => {
      win.addEventListener(type, handler, opts)
      this.cleanups.push(() => win.removeEventListener(type, handler, opts))
    }

    on('scroll', this.scheduleUpdate, { capture: true, passive: true })
    on('resize', this.scheduleUpdate, { passive: true })
    const vv = win.visualViewport
    if (vv) {
      vv.addEventListener('resize', this.scheduleUpdate)
      vv.addEventListener('scroll', this.scheduleUpdate)
      this.cleanups.push(() => {
        vv.removeEventListener('resize', this.scheduleUpdate)
        vv.removeEventListener('scroll', this.scheduleUpdate)
      })
    }
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(this.scheduleUpdate)
      if (this.target) ro.observe(this.target)
      ro.observe(this.doc.documentElement)
      if (this.popover) ro.observe(this.popover)
      if (this.headlessContainer) ro.observe(this.headlessContainer)
      this.cleanups.push(() => ro.disconnect())
    }

    const options = ctx.tour.options ?? {}
    on('keydown', (e) => this.onKeydown(e, ctx), { capture: true })

    if (options.closeOnOverlayClick && this.overlay) {
      const overlayEl = this.overlay.el
      const handler = () => ctx.actions.skip()
      overlayEl.addEventListener('click', handler)
      this.cleanups.push(() => overlayEl.removeEventListener('click', handler))
    }
  }

  private onKeydown(e: KeyboardEvent, ctx: RenderContext): void {
    const options = ctx.tour.options ?? {}
    // The real origin, even inside shadow roots (where `e.target` is retargeted to the host).
    const path = typeof e.composedPath === 'function' ? e.composedPath() : []
    const origin = (path[0] ?? e.target) as Element | null
    // Elements marked `data-docent-ignore-keys` (e.g. the devtools panel) keep their keys.
    if (path.some((n) => n instanceof Element && n.hasAttribute('data-docent-ignore-keys'))) return
    if (e.key === 'Escape' && options.allowClose !== false) {
      e.preventDefault()
      ctx.actions.skip()
      return
    }
    if (e.key === 'Tab') {
      this.trapTab(e)
      return
    }
    if (options.keyboard === false) return
    const inField =
      origin instanceof HTMLElement &&
      (/^(INPUT|TEXTAREA|SELECT)$/.test(origin.tagName) || origin.isContentEditable)
    if (inField) return
    if (e.key === 'ArrowRight' && ctx.step.buttons?.next !== false) {
      e.preventDefault()
      ctx.actions.next()
    } else if (e.key === 'ArrowLeft' && ctx.canGoBack && ctx.step.buttons?.back !== false) {
      e.preventDefault()
      ctx.actions.back()
    }
  }

  /** Keep Tab cycling inside the popover when focus is already in it. */
  private trapTab(e: KeyboardEvent): void {
    const scope = this.headlessContainer ?? this.popover
    if (!scope) return
    const active = this.headlessContainer ? this.doc.activeElement : this.shadow?.activeElement
    const inside = active && (scope.contains(active) || this.host?.contains(active))
    if (!active || !inside) return
    // Slotted light-DOM controls are children of the host; include them in the cycle.
    const roots: ParentNode[] = this.headlessContainer
      ? [scope]
      : [scope, ...(this.host ? [this.host] : [])]
    const items = roots.flatMap((r) => Array.from(r.querySelectorAll<HTMLElement>(FOCUSABLE)))
    if (items.length === 0) return
    const first = items[0] as HTMLElement
    const last = items[items.length - 1] as HTMLElement
    if (e.shiftKey && active === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  private wireAdvance(step: Step): void {
    const advance = step.advance
    const ctx = this.ctx
    if (!ctx || typeof advance !== 'object') return
    if (advance.on !== 'click' && advance.on !== 'input') return
    const el = advance.target === undefined ? this.target : resolveTarget(advance.target, this.doc)
    if (!el) return

    if (advance.on === 'click') {
      const handler = () => ctx.actions.next()
      el.addEventListener('click', handler, { once: true })
      this.cleanups.push(() => el.removeEventListener('click', handler))
      return
    }

    const pattern = advance.match ? new RegExp(advance.match) : /.+/
    const handler = (e: Event) => {
      const value = (e.target as HTMLInputElement | HTMLTextAreaElement).value ?? ''
      if (pattern.test(value)) ctx.actions.next()
    }
    el.addEventListener('input', handler)
    this.cleanups.push(() => el.removeEventListener('input', handler))
  }
}

function toRect(r: DOMRect): Rect {
  return { x: r.left, y: r.top, width: r.width, height: r.height }
}
