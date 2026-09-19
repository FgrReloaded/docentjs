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

import type { ConnectorStyle } from './arrows'

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
      // A prolate cycloid: one small loop, then on to the target.
      const R = Math.min(22, Math.max(9, L / 5.5))
      const steps = 48
      const points: Point[] = []
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        points.push(
          f.at(
            L * t - R * Math.sin(2 * Math.PI * t),
            bend * 0.75 * R * (1 - Math.cos(2 * Math.PI * t)),
          ),
        )
      }
      return {
        paths: [{ d: polyline(points) }],
        head: head(unit(points[points.length - 3] as Point, to)),
      }
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
