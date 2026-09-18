/**
 * Pure popover positioning: pick a side, align, keep it on screen, and place
 * the arrow. No DOM access, so it is unit-tested without a browser.
 */

import type { Alignment, Placement, Side } from '@docentjs/core'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

/**
 * The visible area, in the same coordinate space as the anchor. `x`/`y` are
 * the visual viewport's offset within the layout viewport (non-zero when the
 * page is pinch-zoomed or overflows horizontally on mobile).
 */
export interface Viewport extends Size {
  x?: number
  y?: number
}

export interface PositionInput {
  /** The spotlighted area, in viewport coordinates. */
  anchor: Rect
  floating: Size
  viewport: Viewport
  placement: Placement
  /** Distance between anchor and popover. */
  gap?: number
  /** Minimum distance from the viewport edges. */
  edgePadding?: number
  /** Arrow size; keeps the arrow clear of the popover corners. */
  arrowSize?: number
}

export interface PositionResult {
  x: number
  y: number
  side: Side
  align: Alignment
  /** Arrow offset along the popover's cross axis, from its top-left corner. */
  arrow: number
}

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

export function parsePlacement(placement: Placement): { side: Side | 'auto'; align: Alignment } {
  if (placement === 'auto') return { side: 'auto', align: 'center' }
  const [side, align] = placement.split('-') as [Side, Alignment | undefined]
  return { side, align: align ?? 'center' }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function isVertical(side: Side): boolean {
  return side === 'top' || side === 'bottom'
}

/** Free space between the anchor and the viewport edge on each side. */
export function availableSpace(anchor: Rect, viewport: Viewport): Record<Side, number> {
  const vx = viewport.x ?? 0
  const vy = viewport.y ?? 0
  return {
    top: anchor.y - vy,
    bottom: vy + viewport.height - (anchor.y + anchor.height),
    left: anchor.x - vx,
    right: vx + viewport.width - (anchor.x + anchor.width),
  }
}

function candidates(side: Side | 'auto', space: Record<Side, number>): Side[] {
  if (side === 'auto') {
    return (Object.keys(space) as Side[]).sort((a, b) => space[b] - space[a])
  }
  const perpendicular: Side[] = isVertical(side) ? ['right', 'left'] : ['bottom', 'top']
  return [side, OPPOSITE[side], ...perpendicular.sort((a, b) => space[b] - space[a])]
}

export function computePosition(input: PositionInput): PositionResult {
  const { anchor, floating, viewport } = input
  const gap = input.gap ?? 12
  const edge = input.edgePadding ?? 8
  const arrowSize = input.arrowSize ?? 8
  const { side: preferred, align } = parsePlacement(input.placement)
  const vx = viewport.x ?? 0
  const vy = viewport.y ?? 0

  const space = availableSpace(anchor, viewport)
  const order = candidates(preferred, space)
  const needed = (s: Side) => (isVertical(s) ? floating.height : floating.width) + gap + edge
  const side = order.find((s) => space[s] >= needed(s)) ?? (order[0] as Side)

  // Main axis
  let x = 0
  let y = 0
  if (side === 'top') y = anchor.y - gap - floating.height
  if (side === 'bottom') y = anchor.y + anchor.height + gap
  if (side === 'left') x = anchor.x - gap - floating.width
  if (side === 'right') x = anchor.x + anchor.width + gap

  // Cross axis
  if (isVertical(side)) {
    if (align === 'start') x = anchor.x
    else if (align === 'end') x = anchor.x + anchor.width - floating.width
    else x = anchor.x + anchor.width / 2 - floating.width / 2
    x = clamp(x, vx + edge, Math.max(vx + edge, vx + viewport.width - edge - floating.width))
  } else {
    if (align === 'start') y = anchor.y
    else if (align === 'end') y = anchor.y + anchor.height - floating.height
    else y = anchor.y + anchor.height / 2 - floating.height / 2
    y = clamp(y, vy + edge, Math.max(vy + edge, vy + viewport.height - edge - floating.height))
  }

  // Arrow points at the anchor centre, kept away from the popover corners.
  const margin = arrowSize * 2
  const arrow = isVertical(side)
    ? clamp(anchor.x + anchor.width / 2 - x, margin, floating.width - margin)
    : clamp(anchor.y + anchor.height / 2 - y, margin, floating.height - margin)

  return { x: Math.round(x), y: Math.round(y), side, align, arrow: Math.round(arrow) }
}

/** Centre a popover in the viewport, for steps without a target. */
export function centerPosition(floating: Size, viewport: Viewport): { x: number; y: number } {
  return {
    x: Math.round((viewport.x ?? 0) + Math.max(0, (viewport.width - floating.width) / 2)),
    y: Math.round((viewport.y ?? 0) + Math.max(0, (viewport.height - floating.height) / 2)),
  }
}

/** Grow a rect on every side. */
export function inflate(rect: Rect, by: number): Rect {
  return {
    x: rect.x - by,
    y: rect.y - by,
    width: rect.width + by * 2,
    height: rect.height + by * 2,
  }
}

/**
 * The part of a rect that is on screen. Positioning against this keeps the
 * popover and arrow near the visible portion of oversized targets.
 */
export function clipToViewport(rect: Rect, viewport: Viewport): Rect {
  const vx = viewport.x ?? 0
  const vy = viewport.y ?? 0
  const x1 = Math.max(vx, rect.x)
  const y1 = Math.max(vy, rect.y)
  const x2 = Math.min(vx + viewport.width, rect.x + rect.width)
  const y2 = Math.min(vy + viewport.height, rect.y + rect.height)
  if (x2 <= x1 || y2 <= y1) return rect
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
}
