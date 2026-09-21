/**
 * The web renderer. Draws the overlay, spotlight and popover inside a shadow
 * root, keeps them glued to the target through scroll, resize and layout
 * changes, and wires gestures and keys back to the controller.
 *
 * Customisation layers, lowest to highest precedence:
 * renderer options → template (by name) → tour options. Slots project
 * light-DOM content into the built-in popover; headless mode replaces it.
 */

import type {
  Appearance,
  ArrowStyle,
  Labels,
  OverlayOptions,
  ProgressStyle,
  RenderContext,
  Renderer,
  SpotlightOptions,
  Step,
  Target,
  Theme,
  ThemeSpec,
} from '@docentjs/core'
import { arrowGap, isConnector } from './arrows'
import type { Connector } from './connector'
import { BUILT_IN_LOOKS, type LookName } from './looks'
import { uncover } from './occlusion'
import { Overlay } from './overlay'
import { buildHeadlessShell, buildPopover, type PopoverLook } from './popover'
import {
  centerPosition,
  clipToViewport,
  computePosition,
  type PositionResult,
  type Rect,
  type Size,
  type Viewport,
} from './position'
import { STYLES } from './styles'
import { resolveTarget, waitForTarget } from './target'
import {
  applyTheme,
  type HeadlessPopover,
  mergeThemes,
  needsPresets,
  type PopoverSlots,
  type PopoverTemplate,
  resolveTheme,
  type ThemePresets,
} from './theme'

export interface DomRendererOptions {
  /** Document to render into. Defaults to the global document. */
  document?: Document
  /** Override button and progress labels for every tour. */
  labels?: Labels
  /** Distance between target and popover, in px. */
  gap?: number
  /** Spotlight defaults when a tour sets none: padding, radius, shape, ring. */
  spotlight?: SpotlightOptions
  /** Arrow style when a tour sets none. Default `caret`. */
  arrow?: ArrowStyle
  /** How the step counter is drawn when a tour sets none. Default `meter`. */
  progress?: ProgressStyle
  /** A small line above every title. `{tour}` becomes the tour's name. */
  eyebrow?: string
  /** Overlay defaults when a tour sets none: style, color, opacity, blur. */
  overlay?: OverlayOptions
  /** Base theme: a preset name, tokens, or both. Tours and templates layer on top. */
  theme?: ThemeSpec
  /** Light (default), dark, or follow the reader's system setting. */
  appearance?: Appearance
  /** Replace regions of the built-in popover. */
  slots?: PopoverSlots
  /** Named templates that tours select with `options.template`. */
  templates?: Record<string, PopoverTemplate>
  /** Template to use when a tour names none: a registered name, or a theme itself. */
  template?: string | PopoverTemplate
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

interface Look extends PopoverLook {
  arrow: ArrowStyle
  progress: ProgressStyle
  spotlight: SpotlightOptions
  overlay: OverlayOptions
}

const DEFAULT_LOOK: Look = { arrow: 'caret', progress: 'meter', spotlight: {}, overlay: {} }

/** Breathing room kept between the popover and the edges of the screen. */
const EDGE = 12
/** How wide the docked card grows on a small screen. */
const DOCKED_MAX_WIDTH = 460

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
  private connector: Connector | undefined
  /** Loaded on first use: connector styles cost nothing for tours that never use them. */
  private connectorModule: typeof import('./connector') | undefined
  private connectorLoading: Promise<void> | undefined
  /** Arrow, spotlight and overlay settings for the current step. */
  private look: Look = DEFAULT_LOOK
  /** Preset tokens, once loaded. */
  private presets: ThemePresets | undefined
  private presetLoad: Promise<void> | undefined
  /** Set while `appearance: 'auto'` is following the system setting. */
  private schemeQuery: MediaQueryList | undefined
  /** The body element currently watched for scrolling. */
  private scrollingBody: HTMLElement | undefined
  /** Until then the step's own transition runs; scroll updates may animate. */
  private settleUntil = 0
  /** Play the connector draw-in on its next render. */
  private drawConnector = false
  private trackingFrame: number | undefined

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

  show(ctx: RenderContext): void | Promise<void> {
    // Preset tokens live in a separate chunk, so tours that name one (or ask
    // for dark) wait for it rather than flashing the default look first.
    if (this.presets === undefined && this.usesPresets(ctx)) {
      return this.loadPresets().then(() => {
        this.showNow(ctx)
      })
    }
    this.showNow(ctx)
  }

  private showNow(ctx: RenderContext): void {
    const firstStep = !this.host
    const host = this.mount()
    // Where the previous step's popover sat, so the new one glides from there
    // alongside the spotlight instead of vanishing and fading back in.
    const from = this.popover?.style.transform || null
    this.teardownStep()
    this.ctx = ctx
    this.target = ctx.step.target === undefined ? null : resolveTarget(ctx.step.target, this.doc)

    const template = this.template(ctx)
    this.watchAppearance(ctx)
    applyTheme(host, this.themeFor(ctx, template))
    this.setTemplateCss(template?.css)
    this.applyLook(host, this.resolveLook(ctx, template))
    this.settleUntil = performance.now() + this.duration(host) * 1.5
    this.drawConnector = true

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
    this.scrollingBody?.removeEventListener('scroll', this.onBodyScroll)
    this.scrollingBody = undefined
    this.schemeQuery?.removeEventListener('change', this.onSchemeChange)
    this.schemeQuery = undefined
    if (this.host) {
      this.host.remove()
      this.host = undefined
      this.shadow = undefined
      this.overlay = undefined
      this.connector = undefined
      this.templateStyle = undefined
    }
    const prev = this.previousFocus
    this.previousFocus = null
    if (prev instanceof HTMLElement && prev.isConnected) prev.focus({ preventScroll: true })
  }

  // -------------------------------------------------------------------------
  // Layout
  // -------------------------------------------------------------------------

  /**
   * Re-measure and re-position everything. Safe to call often. `tracking`
   * marks updates caused by scroll or resize: once the step's own transition
   * has finished, those follow the target instantly instead of trailing it.
   */
  update(tracking = false): void {
    const ctx = this.ctx
    const overlay = this.overlay
    const popover = this.popover
    const win = this.doc.defaultView
    if (!ctx || !overlay || !popover || !win) return
    if (tracking && performance.now() > this.settleUntil) this.markTracking()

    const viewport = this.viewport()
    const overlaySize = { width: overlay.el.offsetWidth, height: overlay.el.offsetHeight }
    const spotlight = this.look.spotlight
    const padding = spotlight.padding ?? 8
    const radius = spotlight.radius ?? 10
    const shape = spotlight.shape ?? 'rounded'
    const external = this.headlessContainer
    const sheet = this.isSheet(viewport)
    popover.classList.toggle('sheet', sheet)
    // Never taller than the screen: the body scrolls instead of being cut off.
    // Docked, it also leaves the page visible above it.
    const limit = sheet ? viewport.height * 0.72 : viewport.height - EDGE * 2
    this.host?.style.setProperty('--docent-max-h', `${Math.max(160, Math.round(limit))}px`)
    // Docked: a card with air around it, as wide as the screen allows.
    popover.style.width = sheet ? `${Math.min(viewport.width - EDGE * 2, DOCKED_MAX_WIDTH)}px` : ''
    const floating = { width: popover.offsetWidth, height: popover.offsetHeight }
    this.markScrollable(popover)

    if (sheet) {
      const rect = this.target?.isConnected ? toRect(this.target.getBoundingClientRect()) : null
      overlay.update(
        overlaySize,
        { target: rect, padding, radius, shape },
        this.blocksInteraction(ctx.step),
      )
      this.connector?.clear()
      const vx = viewport.x ?? 0
      const left = vx + Math.max(EDGE, (viewport.width - floating.width) / 2)
      const top = Math.max(
        (viewport.y ?? 0) + EDGE,
        (viewport.y ?? 0) + viewport.height - floating.height - EDGE,
      )
      popover.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`
      popover.setAttribute('data-side', 'sheet')
      external?.setAttribute('data-side', 'sheet')
      this.keepClearOfSheet(rect, top)
      return
    }

    if (!this.target?.isConnected) {
      overlay.update(overlaySize, { target: null, padding, radius }, false)
      this.connector?.clear()
      const { x, y } = centerPosition(floating, viewport)
      popover.style.transform = `translate(${x}px, ${y}px)`
      popover.setAttribute('data-side', 'center')
      external?.setAttribute('data-side', 'center')
      return
    }

    const rect = toRect(this.target.getBoundingClientRect())
    overlay.update(
      overlaySize,
      { target: rect, padding, radius, shape },
      this.blocksInteraction(ctx.step),
    )
    const hole = overlay.hole ?? rect
    const pos = computePosition({
      anchor: clipToViewport(hole, viewport),
      floating,
      viewport,
      placement: ctx.step.placement ?? 'auto',
      gap: this.gap(),
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
    this.renderConnector(pos, floating, clipToViewport(hole, viewport))
  }

  /**
   * Distance between the target and the popover. A drawn connector needs room
   * to be seen, and `options.gap` is written with the default caret in mind, so
   * a connector takes the larger of the two rather than being squeezed out.
   */
  private gap(): number {
    const needed = arrowGap(this.look.arrow)
    const configured = this.options.gap
    if (configured === undefined) return needed
    return isConnector(this.look.arrow) ? Math.max(configured, needed) : configured
  }

  /** Draw the connector for connector arrow styles; clear it otherwise. */
  private renderConnector(pos: PositionResult, floating: Size, hole: Rect): void {
    const style = this.look.arrow
    if (!isConnector(style)) {
      this.connector?.clear()
      this.host?.removeAttribute('data-caret')
      return
    }
    const mod = this.connectorModule
    const connector = this.connector
    if (!mod || !connector) {
      this.loadConnector()
      return
    }
    const ends = mod.connectorEndpoints({
      side: pos.side,
      popover: { x: pos.x, y: pos.y, width: floating.width, height: floating.height },
      target: hole,
    })
    // No room for a line: show the caret rather than a stub drawn under the card.
    this.host?.toggleAttribute('data-caret', !ends)
    if (!ends) {
      connector.clear()
      return
    }
    connector.render(mod.connectorShape(style, ends.from, ends.to, ends.bend), this.drawConnector)
    this.drawConnector = false
  }

  /** Fetch the connector module once, then draw with it. */
  private loadConnector(): void {
    this.connectorLoading ??= import('./connector').then((mod) => {
      this.connectorModule = mod
      if (this.shadow) this.attachConnector(this.shadow, mod)
      this.update()
    })
  }

  /** Add the connector layer and its styles, beneath any popover. */
  private attachConnector(shadow: ShadowRoot, mod: typeof import('./connector')): void {
    if (this.connector) return
    const style = this.doc.createElement('style')
    style.textContent = mod.CONNECTOR_STYLES_CSS
    this.connector = new mod.Connector(this.doc)
    const before = this.popover ?? null
    shadow.insertBefore(style, before)
    shadow.insertBefore(this.connector.el, before)
  }

  /** Does anything here need the built-in presets? */
  private usesPresets(ctx: RenderContext): boolean {
    return (
      this.appearance(ctx) !== 'light' ||
      needsPresets(this.options.theme) ||
      needsPresets(ctx.tour.options?.theme) ||
      needsPresets(this.template(ctx)?.theme)
    )
  }

  private loadPresets(): Promise<void> {
    this.presetLoad ??= import('./themes').then((mod) => {
      this.presets = {
        light: mod.light,
        dark: mod.dark,
        minimal: mod.minimal,
        contrast: mod.contrast,
      }
    })
    return this.presetLoad
  }

  private appearance(ctx: RenderContext): Appearance {
    return ctx.tour.options?.appearance ?? this.options.appearance ?? 'light'
  }

  /** The surface tokens for the current appearance: dark, or nothing for light. */
  private appearanceTheme(ctx: RenderContext): Theme | undefined {
    const appearance = this.appearance(ctx)
    if (appearance === 'dark') return this.presets?.dark
    if (appearance !== 'auto') return undefined
    return this.prefersDark() ? this.presets?.dark : this.presets?.light
  }

  private prefersDark(): boolean {
    return this.doc.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  }

  /** Renderer, then the appearance surface, then template, then tour. */
  private themeFor(ctx: RenderContext, template: PopoverTemplate | undefined): Theme {
    const presets = this.presets
    return mergeThemes(
      resolveTheme(this.options.theme, presets),
      this.appearanceTheme(ctx),
      resolveTheme(template?.theme, presets),
      resolveTheme(ctx.tour.options?.theme, presets),
    )
  }

  /** With `appearance: 'auto'`, follow the system setting while the tour runs. */
  private watchAppearance(ctx: RenderContext): void {
    const wanted = this.appearance(ctx) === 'auto'
    if (wanted === (this.schemeQuery !== undefined)) return
    if (!wanted) {
      this.schemeQuery?.removeEventListener('change', this.onSchemeChange)
      this.schemeQuery = undefined
      return
    }
    this.schemeQuery = this.doc.defaultView?.matchMedia?.('(prefers-color-scheme: dark)')
    this.schemeQuery?.addEventListener('change', this.onSchemeChange)
  }

  private onSchemeChange = (): void => {
    const ctx = this.ctx
    if (ctx && this.host) applyTheme(this.host, this.themeFor(ctx, this.template(ctx)))
  }

  private resolveLook(ctx: RenderContext, template: PopoverTemplate | undefined): Look {
    const tour = ctx.tour.options ?? {}
    const step = ctx.step
    return {
      arrow: step.arrow ?? tour.arrow ?? template?.arrow ?? this.options.arrow ?? 'caret',
      eyebrow: tour.eyebrow ?? template?.eyebrow ?? this.options.eyebrow,
      progress: tour.progress ?? template?.progress ?? this.options.progress ?? 'meter',
      count: template?.count,
      spotlight: {
        ...this.options.spotlight,
        ...template?.spotlight,
        ...tour.spotlight,
        ...step.spotlight,
      },
      overlay: { ...this.options.overlay, ...template?.overlay, ...tour.overlay, ...step.overlay },
    }
  }

  /** Expose the look to the stylesheet as host attributes and variables. */
  private applyLook(host: HTMLElement, look: Look): void {
    this.look = look
    host.setAttribute('data-arrow', look.arrow)
    host.setAttribute('data-ring', look.spotlight.ring ?? 'hairline')
    host.setAttribute('data-shape', look.spotlight.shape ?? 'rounded')
    host.setAttribute('data-overlay', look.overlay.style ?? 'dim')
    const { color, opacity, blur } = look.overlay
    if (color !== undefined) host.style.setProperty('--docent-overlay', color)
    if (opacity !== undefined) host.style.setProperty('--docent-overlay-opacity', String(opacity))
    if (blur !== undefined) host.style.setProperty('--docent-blur', `${blur}px`)
    else host.style.removeProperty('--docent-blur')
  }

  /** The current transition duration in ms, from the --docent-duration token. */
  private duration(host: HTMLElement): number {
    const raw =
      this.doc.defaultView?.getComputedStyle(host).getPropertyValue('--docent-duration').trim() ??
      ''
    const n = Number.parseFloat(raw)
    if (Number.isNaN(n)) return 220
    return raw.endsWith('ms') ? n : n * 1000
  }

  /** Disable transitions for this frame so scroll-driven moves stay glued to the target. */
  private markTracking(): void {
    const host = this.host
    if (!host) return
    host.setAttribute('data-tracking', '')
    if (this.trackingFrame !== undefined) cancelAnimationFrame(this.trackingFrame)
    this.trackingFrame = requestAnimationFrame(() => {
      this.trackingFrame = undefined
      host.removeAttribute('data-tracking')
    })
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

  /**
   * Fade the bottom of the text while there is more to read, so a scrollable
   * body never looks like a sentence that was cut off.
   */
  private markScrollable(popover: HTMLElement): void {
    const body = popover.querySelector('.body')
    if (!(body instanceof HTMLElement)) return
    const update = () => {
      const more = body.scrollHeight - body.clientHeight - body.scrollTop
      popover.classList.toggle('scrolls', more > 4)
    }
    if (!this.scrollingBody || this.scrollingBody !== body) {
      this.scrollingBody?.removeEventListener('scroll', this.onBodyScroll)
      this.scrollingBody = body
      body.addEventListener('scroll', this.onBodyScroll, { passive: true })
    }
    update()
  }

  private onBodyScroll = (): void => {
    if (this.popover) this.markScrollable(this.popover)
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

  /** The tour's template: one the app registered, or a built-in look. */
  private template(ctx: RenderContext): PopoverTemplate | undefined {
    // A tour names a template; the renderer may instead be handed one outright,
    // which is how an installed theme arrives.
    const chosen = ctx.tour.options?.template ?? this.options.template
    if (chosen === undefined) return undefined
    if (typeof chosen !== 'string') return chosen
    return this.options.templates?.[chosen] ?? BUILT_IN_LOOKS[chosen as LookName]
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
      this.look,
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
    if (this.connectorModule) this.attachConnector(shadow, this.connectorModule)
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
    this.connector?.clear()
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
      this.update(true)
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
