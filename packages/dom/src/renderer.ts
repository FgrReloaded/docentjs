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
  BeaconOptions,
  Labels,
  MobileOptions,
  OverlayOptions,
  ProgressStyle,
  RenderContext,
  Renderer,
  Side,
  SpotlightOptions,
  Step,
  Target,
  ThemeSpec,
} from '@docentjs/core'
import { arrowGap, isConnector } from './arrows'
import type { Connector } from './connector'
import { templateFor } from './looks'
import { pinnedAncestor, uncover } from './occlusion'
import { Overlay } from './overlay'
import { buildHeadlessShell, buildPopover, type PopoverLook } from './popover'
import {
  centerPosition,
  clipToViewport,
  computePosition,
  dockedArrow,
  floatSide,
  inflate,
  oversizedClip,
  type PositionResult,
  type Rect,
  type Size,
  type Viewport,
} from './position'
import { STYLES } from './styles'
import { isVisible, resolveTarget, waitForTarget } from './target'
import {
  appearanceOf,
  applyTheme,
  type HeadlessPopover,
  loadPresets,
  type PopoverSlots,
  type PopoverTemplate,
  type ThemePresets,
  tourTheme,
  usesPresets,
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
  /** Beacon defaults when a tour sets none: style, position, size. */
  beacon?: BeaconOptions
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
   * Below this viewport width the screen counts as small: the card is as wide
   * as the screen allows, and sits above or below the target when it fits
   * there, docked near the bottom edge when it does not (see `mobile.layout`).
   * Default 480; 0 disables.
   */
  sheetBreakpoint?: number
  /** Small-screen settings when a tour sets none, e.g. `{ layout: 'dock' }`. */
  mobile?: MobileOptions
  /** Scroll past sticky/fixed headers and footers that cover the target. Default true. */
  avoidOcclusion?: boolean
  /**
   * Move focus into the popover when a tour opens, and back when it ends.
   * Default true. Tours opened by hovering a beacon never take focus.
   */
  focus?: boolean
}

type Cleanup = () => void

interface Look extends PopoverLook {
  arrow: ArrowStyle
  progress: ProgressStyle
  spotlight: SpotlightOptions
  overlay: OverlayOptions
  mobile: MobileOptions
}

/** How the card sits on a small screen this step. */
interface SmallLayout {
  /** Screen width it was decided at. */
  width?: number
  /** The side of the target the card floats on; undefined when docked. */
  side: 'top' | 'bottom' | undefined
  /** Docked at the top edge rather than the bottom. */
  dockTop: boolean
}

const DEFAULT_LOOK: Look = {
  arrow: 'caret',
  progress: 'meter',
  spotlight: {},
  overlay: {},
  mobile: {},
}

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
  /** Reads the safe-area insets, which only CSS can see. */
  private safeProbe: HTMLDivElement | undefined
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
  /**
   * The small-screen layout for this step. Decided once, so the card does not
   * jump between floating and docked while the page scrolls; decided again
   * after a smooth scroll settles or when the screen width changes.
   */
  private layout: SmallLayout | undefined
  /** Whether the target has been on screen this step (it may be shown late). */
  private shown = false
  /** The step shown last, to tell Next from Back for the step-change motion. */
  private lastIndex: number | undefined
  /** While the card animates between two steps' heights: the height it is heading for. */
  private heightTo: number | undefined
  private connector: Connector | undefined
  /** Loaded on first use: connector styles cost nothing for tours that never use them. */
  private connectorModule: typeof import('./connector') | undefined
  private connectorLoading: Promise<void> | undefined
  /** Arrow, spotlight and overlay settings for the current step. */
  private look: Look = DEFAULT_LOOK
  /** Preset tokens, once loaded. */
  private presets: ThemePresets | undefined
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
    if (this.presets === undefined && usesPresets(ctx.tour, this.options, this.template(ctx))) {
      return loadPresets().then((presets) => {
        this.presets = presets
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
    // Its height too, so the card grows or shrinks to the new step instead of jumping.
    const fromHeight = this.options.headless ? 0 : (this.popover?.offsetHeight ?? 0)
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
    const back = this.lastIndex !== undefined && ctx.index < this.lastIndex
    this.lastIndex = ctx.index
    if (this.popover && from) {
      this.popover.style.transform = from
      // Which way the content moves in: from the end for Next, from the start for Back.
      this.popover.setAttribute('data-moving', back ? 'back' : 'forward')
    } else {
      this.popover?.setAttribute('data-entering', '')
    }

    // A hidden target has nowhere to scroll to yet; `update` scrolls once it is shown.
    this.shown = !!this.target && isVisible(this.target)
    if (this.target && this.shown) {
      const target = this.target
      const smooth = this.scrollIntoView(target, ctx.step)
      this.afterScroll(smooth, target, () => {
        if (this.target !== target) return
        // Where a smooth scroll ends is where the small-screen layout should be decided.
        if (smooth) this.layout = undefined
        const uncovered =
          this.options.avoidOcclusion !== false && uncover(target, host, this.viewport())
        if (uncovered || smooth) this.update()
      })
    }
    this.update()
    if (fromHeight) this.animateHeight(fromHeight)
    this.listen()
    this.wireAdvance(ctx.step)

    const focus = this.options.focus !== false
    if (firstStep && focus) this.previousFocus = deepActiveElement(this.doc)
    // On touch screens the dialog itself takes focus: a focus ring on Next
    // appearing unasked reads as a glitch there. Keyboards still start on Next.
    const into =
      this.popover && !this.headlessContainer && touchOnly(this.doc) ? this.popover : initialFocus
    requestAnimationFrame(() => {
      this.popover?.removeAttribute('data-entering')
      if (firstStep) host.removeAttribute('data-entering')
      if (focus) into.focus({ preventScroll: true })
    })
  }

  /**
   * Grow or shrink the card from the previous step's height instead of
   * jumping. Layout uses the final height throughout, so a docked card keeps
   * its bottom edge still while its top follows the height.
   */
  private animateHeight(from: number): void {
    const popover = this.popover
    if (!popover) return
    const to = popover.offsetHeight
    if (Math.abs(to - from) < 2) return
    this.heightTo = to
    popover.setAttribute('data-resizing', '')
    popover.style.height = `${from}px`
    // Commit the start height, so the change below transitions.
    void popover.offsetHeight
    popover.style.height = `${to}px`
    const done = () => {
      clearTimeout(timer)
      if (this.popover === popover) this.heightTo = undefined
      popover.style.height = ''
      popover.removeAttribute('data-resizing')
    }
    const timer = setTimeout(done, (this.host ? this.duration(this.host) : 220) + 50)
    this.cleanups.push(done)
  }

  hide(): void {
    const lastTarget = this.target
    // The card stays for its exit, unless it holds the app's own nodes (slots,
    // headless), which leave with the step.
    const leaving = this.host && this.host.childElementCount === 0 ? this.popover : undefined
    if (leaving) this.popover = undefined
    this.teardownStep()
    this.lastIndex = undefined
    this.scrollingBody?.removeEventListener('scroll', this.onBodyScroll)
    this.scrollingBody = undefined
    this.schemeQuery?.removeEventListener('change', this.onSchemeChange)
    this.schemeQuery = undefined
    if (this.host) {
      this.leave(this.host, !!leaving)
      this.host = undefined
      this.shadow = undefined
      this.overlay = undefined
      this.safeProbe = undefined
      this.connector = undefined
      this.templateStyle = undefined
    }
    const prev = this.previousFocus
    this.previousFocus = null
    if (!(prev instanceof HTMLElement)) return
    // What opened the tour may be gone (a beacon that has been seen): fall back to the target.
    const back = prev.isConnected ? prev : lastTarget
    if (
      back instanceof HTMLElement &&
      back.isConnected &&
      (back === prev || back.matches(FOCUSABLE))
    )
      back.focus({ preventScroll: true })
  }

  /**
   * Let the tour fade away, and a docked card slide off, instead of vanishing.
   * The host is marked `data-leaving` (inert, ignored by lookups of the live
   * tour) and removed once its exit has played.
   */
  private leave(host: HTMLElement, animate: boolean): void {
    const win = this.doc.defaultView
    const still = !win?.matchMedia || win.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!animate || still) {
      host.remove()
      return
    }
    host.setAttribute('data-leaving', '')
    setTimeout(() => host.remove(), this.duration(host) * 1.5 + 50)
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
    // Where the popover may sit: the visible area minus notches and the home indicator.
    const room = this.room(viewport)
    const overlaySize = { width: overlay.el.offsetWidth, height: overlay.el.offsetHeight }
    const spotlight = this.look.spotlight
    const padding = spotlight.padding ?? 8
    const radius = spotlight.radius ?? 10
    const shape = spotlight.shape ?? 'rounded'
    const external = this.headlessContainer
    // A hidden target (a desktop-only sidebar, a tab not shown yet) has no box to
    // point at: centre the card until it is shown, which the ResizeObserver sees.
    const target = this.target?.isConnected && isVisible(this.target) ? this.target : null
    if (target && !this.shown) {
      this.shown = true
      this.layout = undefined
      this.scrollIntoView(target, ctx.step)
    }
    const small = this.isSmall(viewport)
    // Never taller than the screen: the body scrolls instead of being cut off.
    // On a small screen it also leaves some of the page visible.
    const limit = small ? room.height * 0.72 : room.height - EDGE * 2
    this.host?.style.setProperty('--docent-max-h', `${Math.max(160, Math.round(limit))}px`)
    // On a small screen the card is as wide as the screen allows, with air around it.
    popover.style.width = small ? `${Math.min(room.width - EDGE * 2, DOCKED_MAX_WIDTH)}px` : ''
    popover.style.maxWidth = small ? 'none' : ''
    popover.classList.toggle('small', small)
    // The phone card; a step with no target shows it centred, as a hero.
    // Both change the card's height, so they are set before it is measured.
    const stories = small && this.look.mobile.card !== 'classic'
    const hero = stories && !target
    popover.classList.toggle('stories', stories)
    popover.classList.toggle('hero', hero)
    const floating = { width: popover.offsetWidth, height: this.heightTo ?? popover.offsetHeight }
    this.markScrollable(popover)

    const rect = target ? toRect(target.getBoundingClientRect()) : null
    const layout = small ? this.smallLayout(ctx, target, rect, floating, room, padding) : undefined
    const docked = !!layout && !layout.side && !hero
    popover.classList.toggle('sheet', docked)
    popover.toggleAttribute('data-dock', false)
    external?.toggleAttribute('data-dock', false)

    if (layout && docked) {
      const left = room.x + Math.max(EDGE, (room.width - floating.width) / 2)
      const top = layout.dockTop
        ? room.y + EDGE
        : Math.max(room.y + EDGE, room.y + room.height - floating.height - EDGE)
      // The cutout stays in the strip of page left beside the card.
      const free = layout.dockTop
        ? {
            ...room,
            y: top + floating.height,
            height: room.y + room.height - top - floating.height,
          }
        : { ...room, height: top - room.y }
      overlay.update(
        overlaySize,
        {
          target: rect,
          padding,
          radius,
          shape,
          clip: rect ? oversizedClip(rect, free) : undefined,
        },
        this.blocksInteraction(ctx),
      )
      popover.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`
      popover.setAttribute('data-side', 'sheet')
      external?.setAttribute('data-side', 'sheet')
      if (!rect) {
        this.connector?.clear()
        return
      }
      // Docked, the card still points at its target: the caret on the edge
      // facing it, or the tour's connector.
      const side = layout.dockTop ? 'top' : 'bottom'
      const hole = clipToViewport(overlay.hole ?? rect, room)
      const arrow = dockedArrow(hole, left, floating.width)
      popover.setAttribute('data-dock', side)
      external?.setAttribute('data-dock', side)
      this.placeArrow(side, arrow)
      this.renderConnector({ x: left, y: top, side, align: 'center', arrow }, floating, hole)
      if (!layout.dockTop && target && !this.keepClearOfSheet(target, rect, top, room)) {
        // The page cannot scroll the target clear of the card: move the card to the top.
        layout.dockTop = true
        this.update()
      }
      return
    }

    if (!rect) {
      overlay.update(overlaySize, { target: null, padding, radius }, false)
      this.connector?.clear()
      const { x, y } = centerPosition(floating, room)
      popover.style.transform = `translate(${x}px, ${y}px)`
      popover.setAttribute('data-side', 'center')
      external?.setAttribute('data-side', 'center')
      return
    }

    overlay.update(
      overlaySize,
      { target: rect, padding, radius, shape, clip: oversizedClip(rect, room) },
      this.blocksInteraction(ctx),
    )
    const hole = overlay.hole ?? rect
    const pos = computePosition({
      anchor: clipToViewport(hole, room),
      floating,
      viewport: room,
      // On a small screen, the side the card was found to fit on.
      placement: layout?.side ?? ctx.step.placement ?? 'auto',
      gap: this.gap(),
      // A full-width card is centred, with the same margin as a docked one.
      ...(small ? { edgePadding: EDGE } : {}),
    })
    popover.style.transform = `translate(${pos.x}px, ${pos.y}px)`
    popover.setAttribute('data-side', pos.side)
    external?.setAttribute('data-side', pos.side)
    this.placeArrow(pos.side, pos.arrow)
    this.renderConnector(pos, floating, clipToViewport(hole, room))
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

  private themeFor(ctx: RenderContext, template: PopoverTemplate | undefined) {
    const dark = this.doc.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches
    return tourTheme(ctx.tour, this.options, template, this.presets, dark ?? false)
  }

  /** With `appearance: 'auto'`, follow the system setting while the tour runs. */
  private watchAppearance(ctx: RenderContext): void {
    const wanted = appearanceOf(ctx.tour, this.options) === 'auto'
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

  /**
   * A beacon's tip keeps the page usable and, with one step, reads as a tip:
   * no counter and "Got it". The tour's own settings still win.
   */
  private resolveLook(ctx: RenderContext, template: PopoverTemplate | undefined): Look {
    const tour = ctx.tour.options ?? {}
    const step = ctx.step
    const tip = isBeaconTour(ctx)
    const single = tip && ctx.tour.steps.length === 1
    return {
      arrow: step.arrow ?? tour.arrow ?? template?.arrow ?? this.options.arrow ?? 'caret',
      eyebrow: tour.eyebrow ?? template?.eyebrow ?? this.options.eyebrow,
      progress:
        tour.progress ??
        (single ? 'none' : (template?.progress ?? this.options.progress ?? 'meter')),
      count: template?.count,
      labels: single ? { done: 'Got it' } : undefined,
      spotlight: {
        ...this.options.spotlight,
        ...template?.spotlight,
        ...tour.spotlight,
        ...step.spotlight,
      },
      overlay: {
        ...this.options.overlay,
        ...template?.overlay,
        ...(tip ? { style: 'none' as const } : {}),
        ...tour.overlay,
        ...step.overlay,
      },
      // A theme can say how it looks on a phone; the tour's own settings win.
      mobile: { ...this.options.mobile, ...template?.mobile, ...tour.mobile },
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
   * The visible area minus the safe-area insets (notch, home indicator,
   * rounded corners), which are non-zero on pages with `viewport-fit=cover`.
   */
  private room(viewport: Viewport): Rect {
    const probe = this.safeProbe
    const style = probe && this.doc.defaultView?.getComputedStyle(probe)
    const inset = (side: 'Top' | 'Right' | 'Bottom' | 'Left') =>
      Number.parseFloat(style?.[`padding${side}`] ?? '') || 0
    const top = inset('Top')
    const left = inset('Left')
    return {
      x: (viewport.x ?? 0) + left,
      y: (viewport.y ?? 0) + top,
      width: Math.max(0, viewport.width - left - inset('Right')),
      height: Math.max(0, viewport.height - top - inset('Bottom')),
    }
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

  private isSmall(viewport: Viewport): boolean {
    const breakpoint = this.options.sheetBreakpoint ?? 480
    return breakpoint > 0 && viewport.width < breakpoint
  }

  /**
   * Float above or below the target when the card fits there, dock otherwise.
   * Docked cards sit at the bottom, unless the target is pinned to the lower
   * half of the screen (a tab bar), which no scrolling can move clear.
   */
  private smallLayout(
    ctx: RenderContext,
    target: Element | null,
    rect: Rect | null,
    floating: Size,
    room: Rect,
    padding: number,
  ): SmallLayout {
    if (!target || !rect) return { side: undefined, dockTop: false }
    if (this.layout?.width === room.width) return this.layout
    const mode = this.look.mobile.layout ?? 'auto'
    const anchor = clipToViewport(inflate(rect, padding), room)
    const placement = ctx.step.placement ?? 'auto'
    const side =
      mode === 'dock'
        ? undefined
        : floatSide(anchor, floating, room, placement, this.gap(), EDGE, mode === 'float')
    const low = rect.y + rect.height / 2 > room.y + room.height / 2
    const dockTop = !side && low && pinnedAncestor(target) !== null
    this.layout = { width: room.width, side, dockTop }
    return this.layout
  }

  /** Point the caret (and a headless popover's `--docent-arrow`) at the target. */
  private placeArrow(side: Side, offset: number): void {
    if (this.arrow) {
      const vertical = side === 'top' || side === 'bottom'
      this.arrow.style.left = vertical ? `${offset - 6}px` : ''
      this.arrow.style.top = vertical ? '' : `${offset - 6}px`
    }
    this.headlessContainer?.style.setProperty('--docent-arrow', `${offset}px`)
  }

  /**
   * With the card docked at the bottom, scroll once so the target is not hidden
   * behind it. A target taller than the room above the card only has its top
   * brought in: scrolling it fully clear would push its heading off screen.
   * Returns false when the target stays covered (the page ends too soon).
   */
  private keepClearOfSheet(target: Element, rect: Rect, sheetTop: number, room: Rect): boolean {
    const win = this.doc.defaultView
    const overlap = rect.y + rect.height - sheetTop
    if (!win || overlap <= 0 || this.sheetAdjusted) return true
    this.sheetAdjusted = true
    const headroom = rect.y - (room.y + EDGE)
    const by = Math.min(overlap + 16, headroom)
    // Instant, even under `scroll-behavior: smooth`, so the result can be read back now.
    if (by > 0) win.scrollBy({ top: by, behavior: 'instant' })
    return rect.height > sheetTop - room.y || target.getBoundingClientRect().bottom <= sheetTop
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
    return templateFor(ctx.tour, this.options)
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
    // The scrim fades in with the first step.
    host.setAttribute('data-entering', '')
    const shadow = host.attachShadow({ mode: 'open' })
    const style = this.doc.createElement('style')
    style.textContent = this.options.css ? `${STYLES}\n${this.options.css}` : STYLES
    shadow.appendChild(style)
    const probe = this.doc.createElement('div')
    probe.className = 'safe-area'
    shadow.appendChild(probe)
    const overlay = new Overlay(this.doc)
    shadow.appendChild(overlay.el)
    shadow.appendChild(overlay.ring)
    shadow.appendChild(overlay.blocker)
    if (this.connectorModule) this.attachConnector(shadow, this.connectorModule)
    this.doc.body.appendChild(host)
    this.host = host
    this.shadow = shadow
    this.overlay = overlay
    this.safeProbe = probe
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
    this.layout = undefined
    this.shown = false
    this.heightTo = undefined
  }

  private blocksInteraction(ctx: RenderContext): boolean {
    const step = ctx.step
    if (step.interaction) return step.interaction === 'block'
    if (isBeaconTour(ctx)) return false
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
    // Scroll events stop at shadow boundaries, so a target inside a scrolling
    // web component is followed by listening on each shadow root above it.
    for (let root = this.target?.getRootNode(); root instanceof ShadowRoot; ) {
      const shadow = root
      shadow.addEventListener('scroll', this.scheduleUpdate, { capture: true, passive: true })
      this.cleanups.push(() =>
        shadow.removeEventListener('scroll', this.scheduleUpdate, { capture: true }),
      )
      root = shadow.host.getRootNode()
    }
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

    if (options.closeOnOutsideClick ?? isBeaconTour(ctx)) {
      on(
        'pointerdown',
        (e) => {
          const inside = e.composedPath().some(
            (n) =>
              n === this.popover ||
              n === this.headlessContainer ||
              // Beacons handle their own clicks, including closing their tip.
              (n instanceof Element && n.hasAttribute('data-docent-beacons')),
          )
          if (!inside) ctx.actions.skip()
        },
        { capture: true },
      )
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

/** A device whose only pointer is a finger: no hover, coarse pointer. */
const touchOnly = (doc: Document) =>
  doc.defaultView?.matchMedia?.('(hover: none) and (pointer: coarse)').matches ?? false

const isBeaconTour = (ctx: RenderContext) => ctx.tour.trigger?.type === 'beacon'

/** The focused element, looking inside open shadow roots (a beacon is a button in one). */
function deepActiveElement(doc: Document): Element | null {
  let active = doc.activeElement
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement
  return active
}
