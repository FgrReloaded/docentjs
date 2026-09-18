import { describe, expect, it } from 'vitest'
import {
  availableSpace,
  centerPosition,
  clipToViewport,
  computePosition,
  inflate,
  parsePlacement,
} from './position'

const viewport = { width: 1000, height: 800 }
const floating = { width: 300, height: 100 }
const anchor = { x: 400, y: 350, width: 200, height: 50 } // centred-ish

describe('parsePlacement', () => {
  it('splits side and alignment', () => {
    expect(parsePlacement('auto')).toEqual({ side: 'auto', align: 'center' })
    expect(parsePlacement('top')).toEqual({ side: 'top', align: 'center' })
    expect(parsePlacement('bottom-start')).toEqual({ side: 'bottom', align: 'start' })
    expect(parsePlacement('left-end')).toEqual({ side: 'left', align: 'end' })
  })
})

describe('computePosition', () => {
  it('honours the preferred side when it fits', () => {
    const r = computePosition({ anchor, floating, viewport, placement: 'bottom' })
    expect(r.side).toBe('bottom')
    expect(r.y).toBe(350 + 50 + 12)
    expect(r.x).toBe(400 + 100 - 150) // centred on anchor
    expect(r.arrow).toBe(150)
  })

  it('aligns start and end', () => {
    expect(computePosition({ anchor, floating, viewport, placement: 'top-start' }).x).toBe(400)
    expect(computePosition({ anchor, floating, viewport, placement: 'top-end' }).x).toBe(300)
    expect(computePosition({ anchor, floating, viewport, placement: 'right-start' }).y).toBe(350)
    expect(computePosition({ anchor, floating, viewport, placement: 'right-end' }).y).toBe(300)
  })

  it('flips to the opposite side when there is no room', () => {
    const nearTop = { ...anchor, y: 20 }
    const r = computePosition({ anchor: nearTop, floating, viewport, placement: 'top' })
    expect(r.side).toBe('bottom')
  })

  it('falls back to a perpendicular side when neither fits', () => {
    const tall = { width: 300, height: 700 }
    const r = computePosition({ anchor, floating: tall, viewport, placement: 'top' })
    expect(['left', 'right']).toContain(r.side)
  })

  it('picks the roomiest side for auto', () => {
    const nearLeftTop = { x: 10, y: 10, width: 50, height: 50 }
    expect(
      computePosition({ anchor: nearLeftTop, floating, viewport, placement: 'auto' }).side,
    ).toBe('right')
    const nearRight = { x: 900, y: 10, width: 50, height: 50 }
    expect(computePosition({ anchor: nearRight, floating, viewport, placement: 'auto' }).side).toBe(
      'left',
    )
    const bottomCentre = { x: 475, y: 700, width: 50, height: 50 }
    expect(
      computePosition({ anchor: bottomCentre, floating, viewport, placement: 'auto' }).side,
    ).toBe('top')
  })

  it('shifts along the cross axis to stay inside the viewport', () => {
    const atEdge = { x: 950, y: 350, width: 40, height: 40 }
    const r = computePosition({ anchor: atEdge, floating, viewport, placement: 'bottom' })
    expect(r.x).toBe(1000 - 8 - 300)
    expect(r.arrow).toBeLessThanOrEqual(300 - 16)
    expect(r.arrow).toBeGreaterThanOrEqual(16)
  })

  it('keeps the arrow clear of the corners', () => {
    const tiny = { x: 0, y: 350, width: 10, height: 10 }
    const r = computePosition({ anchor: tiny, floating, viewport, placement: 'bottom' })
    expect(r.arrow).toBe(16)
  })

  it('respects custom gap and edge padding', () => {
    const r = computePosition({
      anchor,
      floating,
      viewport,
      placement: 'right',
      gap: 20,
      edgePadding: 0,
    })
    expect(r.x).toBe(600 + 20)
  })

  it('uses the best available side when nothing fits', () => {
    const huge = { width: 2000, height: 2000 }
    const r = computePosition({ anchor, floating: huge, viewport, placement: 'top' })
    expect(r.side).toBe('top')
    expect(r.x).toBe(8)
  })
})

describe('helpers', () => {
  it('availableSpace measures each side', () => {
    expect(availableSpace(anchor, viewport)).toEqual({
      top: 350,
      bottom: 400,
      left: 400,
      right: 400,
    })
  })

  it('centerPosition centres and never goes negative', () => {
    expect(centerPosition(floating, viewport)).toEqual({ x: 350, y: 350 })
    expect(centerPosition({ width: 2000, height: 100 }, viewport)).toEqual({ x: 0, y: 350 })
  })

  it('clipToViewport keeps the on-screen part and leaves off-screen rects alone', () => {
    expect(clipToViewport({ x: -10, y: -100, width: 200, height: 2000 }, viewport)).toEqual({
      x: 0,
      y: 0,
      width: 190,
      height: 800,
    })
    const off = { x: 2000, y: 0, width: 10, height: 10 }
    expect(clipToViewport(off, viewport)).toBe(off)
  })

  it('inflate grows on every side', () => {
    expect(inflate({ x: 10, y: 10, width: 20, height: 20 }, 5)).toEqual({
      x: 5,
      y: 5,
      width: 30,
      height: 30,
    })
  })
})
