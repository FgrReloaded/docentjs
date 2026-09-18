/**
 * Detects fixed or sticky elements (headers, footers, banners) covering a
 * target after it was scrolled into view, and scrolls the page so the
 * target is fully uncovered.
 */

import type { Viewport } from './position'

export interface Occluder {
  el: Element
  rect: DOMRect
  /** Which edge of the target it covers. */
  edge: 'top' | 'bottom'
}

function isPinned(el: Element): boolean {
  const view = el.ownerDocument.defaultView
  if (!view) return false
  const position = view.getComputedStyle(el).position
  return position === 'fixed' || position === 'sticky'
}

/** Nearest pinned ancestor (inclusive), or null. */
function pinnedAncestor(el: Element | null): Element | null {
  let cur: Element | null = el
  while (cur && cur !== cur.ownerDocument.documentElement) {
    if (isPinned(cur)) return cur
    cur = cur.parentElement
  }
  return null
}

/**
 * Find a pinned element covering the target's top or bottom edge.
 * `ignore` is our own host, which sits above everything.
 */
export function findOccluder(
  target: Element,
  ignore: Element | null,
  viewport: Viewport,
): Occluder | null {
  const doc = target.ownerDocument
  const r = target.getBoundingClientRect()
  const vx = viewport.x ?? 0
  const vy = viewport.y ?? 0
  const x = Math.min(Math.max(r.left + r.width / 2, vx + 1), vx + viewport.width - 1)
  const probes: Array<{ y: number; edge: 'top' | 'bottom' }> = [
    { y: r.top + 1, edge: 'top' },
    { y: r.bottom - 1, edge: 'bottom' },
  ]
  for (const { y, edge } of probes) {
    if (y < vy || y > vy + viewport.height) continue
    const stack = doc.elementsFromPoint(x, y).filter((el) => el !== ignore)
    const top = stack[0]
    if (!top || top === target || target.contains(top) || top.contains(target)) continue
    const pinned = pinnedAncestor(top)
    if (!pinned || pinned.contains(target)) continue
    return { el: pinned, rect: pinned.getBoundingClientRect(), edge }
  }
  return null
}

/**
 * Scroll so nothing pinned covers the target. Returns true if it scrolled.
 * Runs at most twice to handle a header and a footer together.
 */
export function uncover(
  target: Element,
  ignore: Element | null,
  viewport: Viewport,
  margin = 8,
): boolean {
  const win = target.ownerDocument.defaultView
  if (!win || typeof target.ownerDocument.elementsFromPoint !== 'function') return false
  let scrolled = false
  for (let i = 0; i < 2; i++) {
    const occluder = findOccluder(target, ignore, viewport)
    if (!occluder) break
    const r = target.getBoundingClientRect()
    const delta =
      occluder.edge === 'top'
        ? -(occluder.rect.bottom - r.top + margin)
        : r.bottom - occluder.rect.top + margin
    win.scrollBy({ top: delta, behavior: 'auto' })
    scrolled = true
  }
  return scrolled
}
