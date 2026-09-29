/**
 * Beacons: small marks pinned to elements that open a tour on click or hover.
 * Loaded on first use, so pages without beacon tours never download it.
 */

import type { BeaconHandle, BeaconOpen, BeaconOptions, BeaconRequest, Theme } from '@docentjs/core'
import { templateFor } from './looks'
import { anchorPoint } from './position'
import type { DomRendererOptions } from './renderer'
import { resolveTarget } from './target'
import { applyTheme, isLightColor, loadPresets, tourTheme, usesPresets } from './theme'

const HOVER_OPEN_MS = 200
const HOVER_CLOSE_MS = 250
/** Side of the square that takes clicks and taps, whatever size the mark is drawn. */
const HIT = 44

/**
 * Beacons sit above the tour's scrim. While a tour runs, the only beacon left
 * is the one that opened it, and a scrim over it would cut it in half.
 */
export const BEACON_STYLES_CSS = `
:host {
  position: fixed;
  inset: 0;
  z-index: calc(var(--docent-z, 2147483000) + 1);
  pointer-events: none;
}
.beacon {
  --_c: var(--docent-beacon, var(--docent-accent, oklch(26% 0.02 285)));
  --_s: var(--docent-beacon-size, 10px);
  position: absolute;
  left: 0;
  top: 0;
  display: grid;
  place-items: center;
  width: ${HIT}px;
  height: ${HIT}px;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-family: var(--docent-font);
  cursor: pointer;
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
}
.beacon[hidden] { display: none; }
.beacon:focus-visible { outline: none; }
.mark {
  position: relative;
  width: var(--_s);
  height: var(--_s);
  border-radius: 999px;
  background: var(--_c);
  box-shadow: 0 0 0 2px var(--docent-bg, oklch(99.4% 0.003 285));
  transition: scale 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.beacon:hover .mark { scale: 1.2; }
.beacon:focus-visible .mark { outline: 2px solid var(--_c); outline-offset: 3px; }
.beacon[data-style="pulse"] .mark::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  animation: docent-beacon 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
}
.beacon[aria-expanded="true"] .mark::after { animation: none; }
@keyframes docent-beacon {
  from { box-shadow: 0 0 0 0 color-mix(in oklch, var(--_c) 55%, transparent); }
  to { box-shadow: 0 0 0 calc(var(--_s) * 1.4) transparent; }
}
.beacon[data-style="ring"] .mark {
  background: var(--docent-bg, oklch(99.4% 0.003 285));
  box-shadow: inset 0 0 0 2.5px var(--_c), 0 0 0 2px var(--docent-bg, oklch(99.4% 0.003 285));
}
.beacon[data-style="badge"] .mark {
  width: auto;
  height: auto;
  padding: 4px 7px;
  color: var(--_on, var(--docent-accent-fg, oklch(98.5% 0.004 285)));
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.beacon[data-style="badge"]:hover .mark { scale: 1.06; }
@media (prefers-reduced-motion: reduce) {
  .mark { transition: none; }
  .beacon[data-style="pulse"] .mark::after {
    animation: none;
    box-shadow: 0 0 0 4px color-mix(in oklch, var(--_c) 28%, transparent);
  }
}
`

const layers = new WeakMap<Document, BeaconLayer>()

export function showBeacon(
  doc: Document,
  request: BeaconRequest,
  options: DomRendererOptions,
): BeaconHandle {
  let layer = layers.get(doc)
  if (!layer) {
    layer = new BeaconLayer(doc)
    layers.set(doc, layer)
  }
  return layer.add(new Beacon(doc, request, options))
}

type Cleanup = () => void

/** One shadow root holds every beacon on the page and keeps them on their targets. */
class BeaconLayer {
  private host: HTMLDivElement | undefined
  private readonly beacons = new Set<Beacon>()
  private cleanups: Cleanup[] = []
  private frame: number | undefined

  constructor(private readonly doc: Document) {}

  add(beacon: Beacon): BeaconHandle {
    const shadow = this.mount()
    this.beacons.add(beacon)
    beacon.attach(shadow, this.schedule)
    this.schedule()
    return {
      reset: () => beacon.reset(),
      remove: () => {
        beacon.destroy()
        this.beacons.delete(beacon)
        if (this.beacons.size === 0) this.unmount()
      },
    }
  }

  private schedule = (): void => {
    const win = this.doc.defaultView
    if (!win || this.frame !== undefined) return
    this.frame = win.requestAnimationFrame(() => {
      this.frame = undefined
      const el = this.doc.documentElement
      for (const beacon of this.beacons) beacon.update(el.clientWidth, el.clientHeight)
    })
  }

  private mount(): ShadowRoot {
    if (this.host?.shadowRoot) return this.host.shadowRoot
    const win = this.doc.defaultView
    const host = this.doc.createElement('div')
    host.setAttribute('data-docent-beacons', '')
    const shadow = host.attachShadow({ mode: 'open' })
    const style = this.doc.createElement('style')
    style.textContent = BEACON_STYLES_CSS
    shadow.appendChild(style)
    this.doc.body.appendChild(host)
    this.host = host

    const listen = (target: EventTarget | undefined | null, type: string, capture = false) => {
      target?.addEventListener(type, this.schedule, { capture, passive: true })
      this.cleanups.push(() => target?.removeEventListener(type, this.schedule, { capture }))
    }
    listen(win, 'scroll', true)
    listen(win, 'resize')
    listen(win?.visualViewport, 'resize')
    const observer = new MutationObserver(this.schedule)
    observer.observe(this.doc.documentElement, { childList: true, subtree: true, attributes: true })
    this.cleanups.push(() => observer.disconnect())
    return shadow
  }

  private unmount(): void {
    for (const c of this.cleanups) c()
    this.cleanups = []
    if (this.frame !== undefined) this.doc.defaultView?.cancelAnimationFrame(this.frame)
    this.frame = undefined
    this.host?.remove()
    this.host = undefined
  }
}

/**
 * One beacon and its opening rules. With `open: 'hover'`, a hover or keyboard
 * focus shows the tip as a preview that closes when the pointer and focus
 * leave both the beacon and the tip. A click, or any tour longer than one
 * step, keeps it open until the reader closes it.
 */
class Beacon {
  private readonly look: BeaconOptions
  /** The drawn mark. Absent for `style: 'none'`, where the target itself opens the tour. */
  private el: HTMLButtonElement | undefined
  private target: Element | null = null
  private launcherCleanups: Cleanup[] = []
  private previewCleanups: Cleanup[] = []
  private state: 'closed' | 'preview' | 'open' = 'closed'
  private shown = false
  private timer: ReturnType<typeof setTimeout> | undefined
  private destroyed = false
  /** Set while focus is handed back, so it does not reopen the preview. */
  private refocusing = false

  constructor(
    private readonly doc: Document,
    private readonly request: BeaconRequest,
    private readonly options: DomRendererOptions,
  ) {
    const template = templateFor(request.tour, options)
    this.look = { ...options.beacon, ...template?.beacon, ...request.tour.options?.beacon }
  }

  private get style() {
    return this.look.style ?? 'pulse'
  }

  /** Hover-style opening. `none` has no mark to click, so it always opens on hover. */
  private get hover(): boolean {
    return this.request.open === 'hover' || this.style === 'none'
  }

  attach(shadow: ShadowRoot, onChange: () => void): void {
    if (this.style === 'none') return
    const el = this.doc.createElement('button')
    el.type = 'button'
    el.className = 'beacon'
    el.hidden = true
    el.setAttribute('part', 'beacon')
    el.setAttribute('data-style', this.style)
    el.setAttribute('aria-label', this.request.label)
    el.setAttribute('aria-expanded', 'false')
    if (this.look.size !== undefined)
      el.style.setProperty('--docent-beacon-size', `${this.look.size}px`)
    const mark = this.doc.createElement('span')
    mark.className = 'mark'
    mark.setAttribute('part', 'beacon-mark')
    if (this.style === 'badge') mark.textContent = this.look.text ?? 'New'
    el.appendChild(mark)
    shadow.appendChild(el)
    this.el = el
    this.bind(el)
    void this.applyTheme(el).then(onChange)
  }

  update(width: number, height: number): void {
    if (this.destroyed) return
    if (!this.target?.isConnected) {
      const target = resolveTarget(this.request.target, this.doc)
      if (target !== this.target && !this.el) {
        for (const c of this.launcherCleanups) c()
        this.launcherCleanups = []
        if (target) this.bind(target)
      }
      this.target = target
    }
    const rect = this.target?.getBoundingClientRect()
    const visible = !!rect && rect.width > 0 && rect.height > 0
    if (!this.el) {
      if (visible) this.markShown()
      return
    }
    const point = visible ? anchorPoint(rect, this.look.position, this.look.offset) : undefined
    const onScreen =
      !!point && point.x >= 0 && point.y >= 0 && point.x <= width && point.y <= height
    this.el.hidden = !onScreen
    if (!point || !onScreen) return
    this.el.style.transform = `translate(${Math.round(point.x - HIT / 2)}px, ${Math.round(point.y - HIT / 2)}px)`
    this.markShown()
  }

  /** Its tour ended: wait to be opened again. */
  reset(): void {
    this.close()
    // Focus is still in the tip, which is about to go: bring it back here.
    const active = this.doc.activeElement
    if (active?.closest('[data-docent-host], [data-docent-popover]')) {
      this.refocusing = true
      this.el?.focus({ preventScroll: true })
      this.refocusing = false
    }
  }

  destroy(): void {
    this.destroyed = true
    this.close()
    for (const c of this.launcherCleanups) c()
    this.launcherCleanups = []
    this.el?.remove()
  }

  private close(): void {
    this.pin()
    this.state = 'closed'
    this.el?.setAttribute('aria-expanded', 'false')
  }

  private markShown(): void {
    if (this.shown) return
    this.shown = true
    this.request.onShown()
  }

  /** The beacon's colours: the tour's theme, with `beacon` falling back to the accent. */
  private async applyTheme(el: HTMLElement): Promise<void> {
    const { tour } = this.request
    const template = templateFor(tour, this.options)
    const presets = usesPresets(tour, this.options, template) ? await loadPresets() : undefined
    if (this.destroyed) return
    const dark = this.doc.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches
    const theme: Theme = tourTheme(tour, this.options, template, presets, dark ?? false)
    applyTheme(el, theme)
    const color = theme.beacon ?? theme.accent
    if (theme.beacon !== undefined && color !== undefined) {
      const light = isLightColor(el, String(color))
      if (light !== undefined) el.style.setProperty('--_on', light ? '#111' : '#fff')
    }
  }

  private bind(launcher: Element): void {
    const on = <K extends keyof HTMLElementEventMap>(
      type: K,
      handler: (e: HTMLElementEventMap[K]) => void,
    ) => {
      launcher.addEventListener(type, handler as EventListener)
      this.launcherCleanups.push(() => launcher.removeEventListener(type, handler as EventListener))
    }
    if (this.el) on('click', () => this.onClick())
    if (!this.hover) return
    on('pointerenter', (e) => {
      if (e.pointerType === 'touch' || this.state !== 'closed') return
      clearTimeout(this.timer)
      this.timer = setTimeout(() => this.open('hover'), HOVER_OPEN_MS)
    })
    on('pointerleave', () => {
      if (this.state === 'closed') clearTimeout(this.timer)
    })
    on('focusin', () => {
      const keyboard =
        launcher.matches(':focus-visible') || !!launcher.querySelector(':focus-visible')
      if (this.state === 'closed' && keyboard && !this.refocusing) this.open('hover')
    })
    on('focusout', () => {
      if (this.state === 'preview') this.closeSoon()
    })
  }

  private onClick(): void {
    if (this.state === 'closed') {
      clearTimeout(this.timer)
      this.open('click')
    } else if (this.state === 'preview') {
      this.pin()
      this.focusTip()
    } else {
      this.request.onClose()
    }
  }

  private open(via: BeaconOpen): void {
    if (!this.request.onOpen(via)) return
    const preview = via === 'hover' && this.request.tour.steps.length === 1
    this.state = preview ? 'preview' : 'open'
    this.el?.setAttribute('aria-expanded', 'true')
    if (preview) this.watchPreview()
  }

  /** While previewing, close once the pointer is over neither the beacon nor the tip. */
  private watchPreview(): void {
    const over = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const path = e.composedPath()
      const launcher = this.el ?? this.target
      if ((launcher && path.includes(launcher)) || path.some((n) => this.inTip(n))) {
        clearTimeout(this.timer)
      } else this.closeSoon()
    }
    const down = (e: PointerEvent) => {
      if (e.composedPath().some((n) => this.inTip(n))) this.pin()
    }
    this.doc.addEventListener('pointerover', over, true)
    this.doc.addEventListener('pointerdown', down, true)
    this.previewCleanups.push(() => {
      this.doc.removeEventListener('pointerover', over, true)
      this.doc.removeEventListener('pointerdown', down, true)
    })
  }

  private closeSoon(): void {
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      if (this.state === 'preview') this.request.onClose()
    }, HOVER_CLOSE_MS)
  }

  private pin(): void {
    clearTimeout(this.timer)
    this.state = 'open'
    for (const c of this.previewCleanups) c()
    this.previewCleanups = []
  }

  private inTip(node: EventTarget | null): boolean {
    if (!(node instanceof Element)) return false
    return node.getAttribute('part') === 'popover' || node.hasAttribute('data-docent-popover')
  }

  /** Move focus into the open tip: its main button, or the card itself. */
  private focusTip(): void {
    const headless = this.doc.querySelector<HTMLElement>('[data-docent-popover]')
    const shadow = this.doc.querySelector('[data-docent-host]:not([data-leaving])')?.shadowRoot
    const tip =
      headless ??
      shadow?.querySelector<HTMLElement>('.button.primary') ??
      shadow?.querySelector<HTMLElement>('.popover')
    tip?.focus({ preventScroll: true })
  }
}
