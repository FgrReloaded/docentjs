/**
 * Drawn connectors between the popover and its target: the arrow styles other
 * than the default caret. Geometry is pure (tested without a browser); the
 * Connector class turns it into SVG inside the shadow root.
 */

export interface Point {
  x: number
  y: number
}

export interface ConnectorPath {
  d: string
  /** SVG stroke-dasharray. Dashed paths fade in instead of drawing. */
  dash?: string
  width?: number
  opacity?: number
}

export interface ConnectorShape {
  paths: ConnectorPath[]
  /** Arrowhead (open chevron) at the target end. */
  head?: string
  /** Filled dot at the target end (`pin`). */
  dot?: Point
}

import type { Side } from '@docentjs/core'
import type { ConnectorStyle } from './arrows'
import type { Rect } from './position'

export { arrowGap, CONNECTOR_STYLES, type ConnectorStyle, isConnector } from './arrows'

const r = (n: number) => Math.round(n * 10) / 10
const pt = (p: Point) => `${r(p.x)} ${r(p.y)}`

function frame(a: Point, b: Point) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = Math.hypot(dx, dy) || 1
  const u = { x: dx / length, y: dy / length }
  const n = { x: -u.y, y: u.x }
  const at = (along: number, across: number): Point => ({
    x: a.x + u.x * along + n.x * across,
    y: a.y + u.y * along + n.y * across,
  })
  return { length, u, n, at }
}

function polyline(points: Point[]): string {
  return points.map((p, i) => `${i ? 'L' : 'M'}${pt(p)}`).join('')
}

/** Open chevron at `tip`, pointing along `dir` (unit vector). */
export function arrowHead(tip: Point, dir: Point, size = 7): string {
  const angle = 0.5
  const back = (s: number) => ({
    x: tip.x - size * (dir.x * Math.cos(angle) - s * dir.y * Math.sin(angle)),
    y: tip.y - size * (dir.y * Math.cos(angle) + s * dir.x * Math.sin(angle)),
  })
  return `M${pt(back(1))}L${pt(tip)}L${pt(back(-1))}`
}

function unit(from: Point, to: Point): Point {
  const l = Math.hypot(to.x - from.x, to.y - from.y) || 1
  return { x: (to.x - from.x) / l, y: (to.y - from.y) / l }
}

/** Polyline with rounded interior corners. */
function rounded(points: Point[], radius: number): string {
  let d = `M${pt(points[0] as Point)}`
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i] as Point
    const prev = points[i - 1] as Point
    const next = points[i + 1] as Point
    const inLen = Math.hypot(p.x - prev.x, p.y - prev.y)
    const outLen = Math.hypot(next.x - p.x, next.y - p.y)
    const c = Math.min(radius, inLen / 2, outLen / 2)
    const a = unit(p, prev)
    const b = unit(p, next)
    d += `L${pt({ x: p.x + a.x * c, y: p.y + a.y * c })}Q${pt(p)} ${pt({ x: p.x + b.x * c, y: p.y + b.y * c })}`
  }
  return `${d}L${pt(points[points.length - 1] as Point)}`
}

/** How far outside the target the arrowhead stops. */
const TIP = 6
/** The line leaves a little clear of the card, so it reads as drawn onto the page. */
const STANDOFF = 5
/** Keeps the popover end away from the card's corners. */
const CORNER = 16
/** Keeps the target end away from the cutout's corners. */
const EDGE = 12
/** Below this the two are too close to run a line between them. */
const MIN_GAP = 16
/** A line routed around the card needs at least this much clear edge to land on. */
const MIN_CLEAR = 28

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export interface EndpointInput {
  /** Which side of the target the popover ended up on. */
  side: Side
  /** The popover, in viewport coordinates. */
  popover: Rect
  /** The spotlight cutout, clipped to the visible area. */
  target: Rect
}

export interface Endpoints {
  from: Point
  to: Point
  /** Which way curves bow, as `connectorShape` takes it. */
  bend: 1 | -1
}

/**
 * Where a connector starts and ends.
 *
 * It lands on the part of the target's near edge that faces the popover, never
 * on the target's centre: aiming at the centre of a sidebar or a full-width
 * banner drags the line down or across the whole element, far from the popover
 * it is supposed to connect. A deliberate lean along that edge keeps the line
 * from pointing dead-on, which reads as drawn rather than mechanical.
 *
 * A target too big to sit beside leaves the popover on top of it, with no band
 * to draw in. The line then leaves the card sideways and lands on the stretch of
 * the same edge the card does not cover.
 *
 * Returns `null` only when the card covers the target with nothing to point at.
 */
export function connectorEndpoints({ side, popover, target }: EndpointInput): Endpoints | null {
  const horizontal = side === 'left' || side === 'right'
  /** Which way the target lies from the popover, along the main axis. */
  const toward = side === 'right' || side === 'bottom' ? -1 : 1
  const at = (main: number, across: number): Point =>
    horizontal ? { x: main, y: across } : { x: across, y: main }

  const mainStart = horizontal ? popover.x : popover.y
  const mainSize = horizontal ? popover.width : popover.height
  const targetMain = horizontal ? target.x : target.y
  const targetMainSize = horizontal ? target.width : target.height
  /** The popover edge facing the target, and the target edge facing back. */
  const face = toward > 0 ? mainStart + mainSize : mainStart
  const edge = toward > 0 ? targetMain : targetMain + targetMainSize
  const gap = (edge - face) * toward
  const tip = edge - TIP * toward

  // The rest is the cross axis: y beside the target, x above or below it.
  const pStart = horizontal ? popover.y : popover.x
  const pSize = horizontal ? popover.height : popover.width
  const tStart = horizontal ? target.y : target.x
  const tSize = horizontal ? target.height : target.width
  const inset = Math.min(EDGE, tSize / 2)
  const lo = tStart + inset
  const hi = tStart + tSize - inset

  let from: Point
  let to: Point
  /** Which way along the target's edge the line reaches. */
  let dir: 1 | -1
  /** Whether the line runs across the gap or around the card. */
  let between: boolean

  if (gap >= MIN_GAP) {
    between = true
    // The point on the target's edge the popover already sits across from.
    const facing = clamp(pStart + pSize / 2, lo, hi)
    // Lean along that edge, toward whichever end of the target has more room, so
    // the line arrives at an angle. Proportional to the gap, so the angle holds.
    const lean = clamp(gap * 0.5, 20, 52)
    dir = hi - facing >= facing - lo ? 1 : -1
    const land = clamp(facing + dir * lean, lo, hi)
    const corner = Math.min(CORNER, pSize / 2)
    const leave = clamp(land - dir * lean, pStart + corner, pStart + pSize - corner)
    from = at(face + STANDOFF * toward, leave)
    to = at(tip, land)
  } else {
    between = false
    // The card overlaps the target. Reach past it, to whichever side of the card
    // leaves more of the target's edge uncovered.
    const before = pStart - tStart
    const after = tStart + tSize - (pStart + pSize)
    dir = after >= before ? 1 : -1
    const clear = dir > 0 ? after : before
    if (clear < MIN_CLEAR) return null
    const lean = clamp(clear * 0.5, 20, 52)
    const leave = dir > 0 ? pStart + pSize : pStart
    from = at(face - CORNER * toward, leave + STANDOFF * dir)
    to = at(tip, clamp(leave + lean * dir, lo, hi))
  }

  // A line across the gap bows away from the target's bulk, so it arcs over open
  // space; one routed around the card bows away from the card instead.
  const u = unit(from, to)
  const normal = horizontal ? u.x : -u.y
  const outward = between ? -dir : dir
  return { from, to, bend: normal * outward > 0 ? 1 : -1 }
}

/**
 * Paths for a connector from `from` (popover edge) to `to` (just outside the
 * target). `bend` flips curves to the other side (1 or -1).
 */
export function connectorShape(
  style: ConnectorStyle,
  from: Point,
  to: Point,
  bend = 1,
): ConnectorShape {
  const f = frame(from, to)
  const L = f.length
  const straight = `M${pt(from)}L${pt(to)}`
  const head = (dir: Point) => arrowHead(to, dir)

  switch (style) {
    case 'line':
      return { paths: [{ d: straight }], head: head(f.u) }
    case 'dashed':
      return { paths: [{ d: straight, dash: '5 5' }], head: head(f.u) }
    case 'dotted':
      return { paths: [{ d: straight, dash: '0 6', width: 2.4 }], head: head(f.u) }
    case 'curve':
    case 'curve-dashed': {
      const c = f.at(L / 2, bend * L * 0.32)
      const path: ConnectorPath = { d: `M${pt(from)}Q${pt(c)} ${pt(to)}` }
      if (style === 'curve-dashed') path.dash = '5 5'
      return { paths: [path], head: head(unit(c, to)) }
    }
    case 'squiggle': {
      const steps = Math.max(24, Math.round(L / 2))
      const wave = 15
      const points: Point[] = []
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const envelope = Math.min(1, t * 5, (1 - t) * 5)
        points.push(f.at(L * t, bend * 4.5 * envelope * Math.sin((2 * Math.PI * L * t) / wave)))
      }
      return {
        paths: [{ d: polyline(points) }],
        head: head(unit(points[points.length - 3] as Point, to)),
      }
    }
    case 'loop': {
      // A gentle curve with one round loop that crosses back over itself, then
      // runs on to the target so the head points at it.
      const R = Math.min(14, Math.max(8, L / 9))
      const half = Math.min(0.2, (2.4 * R) / L)
      const a = 0.48 - half
      const b = 0.48 + half
      const at = (t: number) => {
        const w = clamp((t - a) / (b - a), 0, 1)
        // Smootherstep, so the loop leaves and rejoins the curve without a kink.
        const turn = 2 * Math.PI * w * w * w * (w * (w * 6 - 15) + 10)
        return f.at(
          L * t + 1.3 * R * Math.sin(turn),
          bend * (0.4 * L * t * (1 - t) + R * (1 - Math.cos(turn))),
        )
      }
      // Sample the loop densely and the plain runs either side lightly.
      const ts: number[] = []
      for (let i = 0; i < 16; i++) ts.push((a * i) / 16)
      for (let i = 0; i < 48; i++) ts.push(a + ((b - a) * i) / 48)
      for (let i = 0; i <= 16; i++) ts.push(b + ((1 - b) * i) / 16)
      return { paths: [{ d: polyline(ts.map(at)) }], head: head(unit(at(0.97), to)) }
    }
    case 'elbow': {
      const dx = to.x - from.x
      const dy = to.y - from.y
      if (Math.abs(dx) < 6 || Math.abs(dy) < 6) return { paths: [{ d: straight }], head: head(f.u) }
      const vertical = Math.abs(dy) >= Math.abs(dx)
      const points = vertical
        ? [from, { x: from.x, y: from.y + dy / 2 }, { x: to.x, y: from.y + dy / 2 }, to]
        : [from, { x: from.x + dx / 2, y: from.y }, { x: from.x + dx / 2, y: to.y }, to]
      return { paths: [{ d: rounded(points, 10) }], head: head(unit(points[2] as Point, to)) }
    }
    case 'sketch': {
      // Two slightly different strokes read as hand-drawn; deterministic, so it never flickers.
      const c1 = f.at(L * 0.45, bend * L * 0.12)
      const c2 = f.at(L * 0.55, bend * L * 0.04 - 3)
      const start2 = f.at(2, 2)
      const end2 = { x: to.x + f.n.x * 2, y: to.y + f.n.y * 2 }
      return {
        paths: [
          { d: `M${pt(from)}Q${pt(c1)} ${pt(to)}` },
          { d: `M${pt(start2)}Q${pt(c2)} ${pt(end2)}`, opacity: 0.55, width: 1.2 },
        ],
        head: `${head(unit(c1, to))}${arrowHead(end2, unit(c2, end2), 6.5)}`,
      }
    }
    case 'pin': {
      const end = f.at(Math.max(0, L - 4), 0)
      return { paths: [{ d: `M${pt(from)}L${pt(end)}`, dash: '0 5', width: 2.2 }], dot: to }
    }
  }
}

/** Styles for the connector layer, injected into the shadow root when first used. */
export const CONNECTOR_STYLES_CSS = `
/* Connectors: drawn arrows from the popover to the target. */
.connector {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
  color: var(--docent-connector, oklch(98% 0.004 285 / 0.92));
}
:host([data-overlay="none"]) .connector { color: var(--docent-connector, var(--docent-accent)); }
.connector .stroke {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.connector .dot { fill: currentColor; }
.connector .dot-halo { fill: currentColor; opacity: 0.2; }
/* Drawn after the popover settles, so the line never trails it. */
.connector.animate .draw {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: docent-draw calc(var(--docent-duration) * 1.6) var(--docent-easing) var(--docent-duration) forwards;
}
.connector.animate .fade,
.connector.animate .head {
  opacity: 0;
  animation: docent-fade var(--docent-duration) ease-out calc(var(--docent-duration) * 1.6) forwards;
}
@keyframes docent-draw { to { stroke-dashoffset: 0; } }
@keyframes docent-fade { to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .connector.animate .draw, .connector.animate .fade, .connector.animate .head { animation: none; stroke-dashoffset: 0; opacity: 1; }
}
`

const SVG_NS = 'http://www.w3.org/2000/svg'

/** SVG layer in the shadow root that draws the current connector. */
export class Connector {
  readonly el: SVGSVGElement
  private readonly doc: Document

  constructor(doc: Document) {
    this.doc = doc
    this.el = doc.createElementNS(SVG_NS, 'svg')
    this.el.setAttribute('class', 'connector')
    this.el.setAttribute('part', 'connector')
    this.el.setAttribute('aria-hidden', 'true')
  }

  clear(): void {
    this.el.replaceChildren()
  }

  /** Draw a shape. `animate` plays the draw-in (after the popover settles). */
  render(shape: ConnectorShape, animate: boolean): void {
    const make = (d: string, cls: string) => {
      const path = this.doc.createElementNS(SVG_NS, 'path')
      path.setAttribute('d', d)
      path.setAttribute('class', cls)
      return path
    }
    const nodes: SVGElement[] = shape.paths.map((p) => {
      const path = make(p.d, p.dash ? 'stroke fade' : 'stroke draw')
      if (p.dash) path.setAttribute('stroke-dasharray', p.dash)
      // Solid strokes draw on by animating a normalised dash.
      else path.setAttribute('pathLength', '1')
      if (p.width) path.setAttribute('stroke-width', String(p.width))
      if (p.opacity) path.setAttribute('opacity', String(p.opacity))
      return path
    })
    if (shape.head) nodes.push(make(shape.head, 'stroke head'))
    if (shape.dot) {
      for (const [radius, cls] of [
        [8, 'dot-halo'],
        [3.5, 'dot'],
      ] as const) {
        const c = this.doc.createElementNS(SVG_NS, 'circle')
        c.setAttribute('cx', String(shape.dot.x))
        c.setAttribute('cy', String(shape.dot.y))
        c.setAttribute('r', String(radius))
        c.setAttribute('class', `${cls} head`)
        nodes.push(c)
      }
    }
    this.el.classList.toggle('animate', animate)
    this.el.replaceChildren(...nodes)
  }
}
