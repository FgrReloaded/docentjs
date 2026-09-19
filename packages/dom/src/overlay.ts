/**
 * Full-viewport backdrop with a rounded cutout. The cutout is a `clip-path`
 * so pointer events pass through the hole to the page for free; a separate
 * blocker element covers it when the step forbids interaction.
 */

import type { SpotlightShape } from '@docentjs/core'
import { inflate, type Rect, type Size } from './position'

export function holePath(viewport: Size, hole: Rect, radius: number): string {
  const r = Math.max(0, Math.min(radius, hole.width / 2, hole.height / 2))
  const { x, y, width: w, height: h } = hole
  const outer = `M0 0H${viewport.width}V${viewport.height}H0Z`
  const inner =
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}` +
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  return `path(evenodd, "${outer}${inner}")`
}

export interface OverlayUpdate {
  /** Target rect in viewport coordinates, or `null` for a modal step. */
  target: Rect | null
  padding: number
  radius: number
  shape?: SpotlightShape
}

/** The padded cutout and its corner radius for a shape. */
export function holeFor(
  target: Rect,
  padding: number,
  radius: number,
  shape: SpotlightShape = 'rounded',
): { hole: Rect; radius: number } {
  if (shape === 'circle') {
    const cx = target.x + target.width / 2
    const cy = target.y + target.height / 2
    const rr = Math.hypot(target.width, target.height) / 2 + padding
    return { hole: { x: cx - rr, y: cy - rr, width: rr * 2, height: rr * 2 }, radius: rr }
  }
  const hole = inflate(target, padding)
  if (shape === 'rect') return { hole, radius: 0 }
  if (shape === 'pill') return { hole, radius: Math.min(hole.width, hole.height) / 2 }
  return { hole, radius: Math.max(0, Math.min(radius, hole.width / 2, hole.height / 2)) }
}

export class Overlay {
  readonly el: HTMLDivElement
  readonly blocker: HTMLDivElement
  /** Hairline of light around the cutout. */
  readonly ring: HTMLDivElement
  private lastHole: Rect | null = null

  constructor(doc: Document) {
    this.el = doc.createElement('div')
    this.el.setAttribute('part', 'overlay')
    this.el.className = 'overlay'
    this.blocker = doc.createElement('div')
    this.blocker.className = 'blocker'
    this.blocker.hidden = true
    this.ring = doc.createElement('div')
    this.ring.className = 'ring'
    this.ring.setAttribute('part', 'ring')
    this.ring.style.opacity = '0'
  }

  /** Move the ring to a rect; a zero-size rect collapses it (modal steps). */
  private placeRing(rect: Rect, radius: number, visible: boolean): void {
    Object.assign(this.ring.style, {
      transform: `translate(${rect.x}px, ${rect.y}px)`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      borderRadius: `${radius}px`,
      opacity: visible ? '1' : '0',
    })
  }

  /** Current hole, padded, in viewport coordinates. */
  get hole(): Rect | null {
    return this.lastHole
  }

  update(viewport: Size, { target, padding, radius, shape }: OverlayUpdate, block: boolean): void {
    if (!target) {
      // Collapse to a point so the path keeps the same structure and can animate.
      const c = this.lastHole
      const cx = c ? c.x + c.width / 2 : viewport.width / 2
      const cy = c ? c.y + c.height / 2 : viewport.height / 2
      this.lastHole = null
      this.setCentre(cx, cy)
      this.el.style.clipPath = holePath(viewport, { x: cx, y: cy, width: 0, height: 0 }, 0)
      this.placeRing({ x: cx, y: cy, width: 0, height: 0 }, 0, false)
      this.blocker.hidden = true
      return
    }
    const { hole, radius: r } = holeFor(target, padding, radius, shape)
    this.lastHole = hole
    this.setCentre(hole.x + hole.width / 2, hole.y + hole.height / 2)
    this.el.style.clipPath = holePath(viewport, hole, r)
    this.placeRing(hole, r, true)
    this.blocker.hidden = !block
    if (block) {
      this.blocker.style.transform = `translate(${hole.x}px, ${hole.y}px)`
      this.blocker.style.width = `${hole.width}px`
      this.blocker.style.height = `${hole.height}px`
    }
  }

  /** Exposed for the vignette style, which is centred on the cutout. */
  private setCentre(x: number, y: number): void {
    this.el.style.setProperty('--docent-hole-x', `${Math.round(x)}px`)
    this.el.style.setProperty('--docent-hole-y', `${Math.round(y)}px`)
  }
}
