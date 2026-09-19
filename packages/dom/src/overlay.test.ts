// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { holeFor, holePath, Overlay } from './overlay'

const viewport = { width: 100, height: 50 }

describe('holePath', () => {
  it('builds an even-odd path with an outer rect and a rounded hole', () => {
    const p = holePath(viewport, { x: 10, y: 10, width: 20, height: 10 }, 2)
    expect(p.startsWith('path(evenodd, "M0 0H100V50H0Z')).toBe(true)
    expect(p).toContain(
      'M12 10H28A2 2 0 0 1 30 12V18A2 2 0 0 1 28 20H12A2 2 0 0 1 10 18V12A2 2 0 0 1 12 10Z',
    )
  })

  it('clamps the radius to the hole size', () => {
    const p = holePath(viewport, { x: 0, y: 0, width: 4, height: 10 }, 50)
    expect(p).toContain('A2 2 0 0 1')
  })
})

describe('Overlay', () => {
  it('pads the hole and positions the blocker only when blocking', () => {
    const o = new Overlay(document)
    o.update(
      viewport,
      { target: { x: 10, y: 10, width: 20, height: 10 }, padding: 5, radius: 0 },
      true,
    )
    expect(o.hole).toEqual({ x: 5, y: 5, width: 30, height: 20 })
    expect(o.blocker.hidden).toBe(false)
    expect(o.blocker.style.transform).toBe('translate(5px, 5px)')
    expect(o.blocker.style.width).toBe('30px')

    o.update(
      viewport,
      { target: { x: 10, y: 10, width: 20, height: 10 }, padding: 0, radius: 0 },
      false,
    )
    expect(o.blocker.hidden).toBe(true)
  })

  it('collapses to a point for modal steps, centred on the last hole', () => {
    const o = new Overlay(document)
    o.update(
      viewport,
      { target: { x: 10, y: 10, width: 20, height: 10 }, padding: 0, radius: 0 },
      false,
    )
    o.update(viewport, { target: null, padding: 0, radius: 0 }, false)
    expect(o.hole).toBeNull()
    expect(o.el.style.clipPath).toContain('M20 15H20')
    expect(o.blocker.hidden).toBe(true)
  })
})

describe('holeFor', () => {
  const t = { x: 10, y: 20, width: 40, height: 20 }
  it('pads, and sets the radius per shape', () => {
    expect(holeFor(t, 5, 10, 'rounded')).toEqual({
      hole: { x: 5, y: 15, width: 50, height: 30 },
      radius: 10,
    })
    expect(holeFor(t, 5, 10, 'rect').radius).toBe(0)
    expect(holeFor(t, 5, 10, 'pill').radius).toBe(15)
    const c = holeFor(t, 0, 10, 'circle')
    expect(c.hole.width).toBe(c.hole.height)
    expect(c.radius).toBeCloseTo(Math.hypot(40, 20) / 2)
    expect(c.hole.x + c.hole.width / 2).toBe(30)
  })
})
