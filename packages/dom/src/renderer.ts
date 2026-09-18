/**
 * The web renderer. Draws the overlay, spotlight and popover inside a shadow
 * root, keeps them glued to the target through scroll, resize and layout
 * changes, and wires gestures and keys back to the controller.
 */

import type { Labels, RenderContext, Renderer, Step, Target } from '@docentjs/core'
import { Overlay } from './overlay'
import { buildPopover } from './popover'
import { centerPosition, clipToViewport, computePosition, type Rect } from './position'
import { STYLES } from './styles'
import { resolveTarget, waitForTarget } from './target'

export interface DomRendererOptions {
  /** Document to render into. Defaults to the global document. */
  document?: Document
  /** Override button and progress labels for every tour. */
  labels?: Labels
  /** Distance between target and popover, in px. */
  gap?: number
  /** Spotlight defaults when a tour sets none. */
  spotlight?: { padding?: number; radius?: number }
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
  private popover: HTMLDivElement | undefined
  private arrow: HTMLDivElement | undefined
  private ctx: RenderContext | undefined
  private target: Element | null = null
  private cleanups: Cleanup[] = []
  private frame: number | undefined
  private previousFocus: Element | null = null

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
    this.mount()
    this.teardownStep()
    this.ctx = ctx
    this.target = ctx.step.target === undefined ? null : resolveTarget(ctx.step.target, this.doc)

    const { el, arrow, initialFocus } = buildPopover(this.doc, ctx, this.options.labels ?? {})
    this.popover = el
    this.arrow = arrow
    el.setAttribute('data-entering', '')
    this.shadow?.appendChild(el)

    if (this.target) this.scrollIntoView(this.target, ctx.step)
    this.update()
    this.listen()
    this.wireAdvance(ctx.step)

    if (firstStep) this.previousFocus = this.doc.activeElement
    requestAnimationFrame(() => {
      el.removeAttribute('data-entering')
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

    const viewport = { width: win.innerWidth, height: win.innerHeight }
    const spotlight = {
      ...this.options.spotlight,
      ...ctx.tour.options?.spotlight,
      ...ctx.step.spotlight,
    }
    const padding = spotlight.padding ?? 6
    const radius = spotlight.radius ?? 6
    const floating = { width: popover.offsetWidth, height: popover.offsetHeight }

    if (!this.target?.isConnected) {
      overlay.update(viewport, { target: null, padding, radius }, false)
      const { x, y } = centerPosition(floating, viewport)
      popover.style.transform = `translate(${x}px, ${y}px)`
      popover.setAttribute('data-side', 'center')
      return
    }

    const rect = toRect(this.target.getBoundingClientRect())
    overlay.update(viewport, { target: rect, padding, radius }, this.blocksInteraction(ctx.step))
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
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private mount(): void {
    if (this.host) return
    const host = this.doc.createElement('div')
    host.setAttribute('data-docent-host', '')
    const shadow = host.attachShadow({ mode: 'open' })
    const style = this.doc.createElement('style')
    style.textContent = STYLES
    shadow.appendChild(style)
    const overlay = new Overlay(this.doc)
    shadow.appendChild(overlay.el)
    shadow.appendChild(overlay.blocker)
    this.doc.body.appendChild(host)
    this.host = host
    this.shadow = shadow
    this.overlay = overlay
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
  }

  private blocksInteraction(step: Step): boolean {
    if (step.interaction) return step.interaction === 'block'
    const advance = step.advance
    return !(typeof advance === 'object' && (advance.on === 'click' || advance.on === 'input'))
  }

  private scrollIntoView(el: Element, step: Step): void {
    const scroll = { ...this.ctx?.tour.options?.scroll, ...step.scroll }
    if (scroll.enabled === false) return
    const win = this.doc.defaultView
    if (!win) return
    const r = el.getBoundingClientRect()
    const behavior = scroll.behavior ?? 'auto'
    if (r.height > win.innerHeight || r.width > win.innerWidth) {
      // Oversized target: it can never be fully shown, so only make sure its top is on screen.
      const topVisible = r.top >= 0 && r.top < win.innerHeight && r.left < win.innerWidth
      if (!topVisible) el.scrollIntoView({ block: 'start', inline: 'start', behavior })
      return
    }
    const visible =
      r.top >= 0 && r.left >= 0 && r.bottom <= win.innerHeight && r.right <= win.innerWidth
    if (visible) return
    el.scrollIntoView({ block: scroll.block ?? 'center', inline: 'nearest', behavior })
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
    if (this.target && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(this.scheduleUpdate)
      ro.observe(this.target)
      ro.observe(this.doc.documentElement)
      this.cleanups.push(() => ro.disconnect())
    }
    if (this.popover && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(this.scheduleUpdate)
      ro.observe(this.popover)
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
    if (e.key === 'Escape' && options.allowClose !== false) {
      e.preventDefault()
      ctx.actions.skip()
      return
    }
    if (e.key === 'Tab' && this.popover) {
      this.trapTab(e, this.popover)
      return
    }
    if (options.keyboard === false) return
    const inField =
      e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)
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
  private trapTab(e: KeyboardEvent, popover: HTMLElement): void {
    const active = this.shadow?.activeElement
    if (!active || !popover.contains(active)) return
    const items = Array.from(popover.querySelectorAll<HTMLElement>(FOCUSABLE))
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
