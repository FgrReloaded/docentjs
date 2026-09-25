import { describe, expect, it } from 'vitest'
import {
  arrowGap,
  arrowHead,
  CONNECTOR_STYLES,
  connectorEndpoints,
  connectorShape,
  isConnector,
} from './connector'

const from = { x: 100, y: 200 }
const to = { x: 100, y: 140 }

describe('connectors', () => {
  it('knows which styles are drawn and how much room they need', () => {
    expect(CONNECTOR_STYLES).toHaveLength(10)
    expect(isConnector('caret')).toBe(false)
    expect(isConnector('none')).toBe(false)
    expect(isConnector('squiggle')).toBe(true)
    expect(arrowGap('caret')).toBe(12)
    expect(arrowGap('line')).toBe(60)
    expect(arrowGap('loop')).toBe(72)
  })

  it.each(CONNECTOR_STYLES)(
    '%s produces paths that start at the popover and end at the target',
    (style) => {
      const shape = connectorShape(style, from, to)
      expect(shape.paths.length).toBeGreaterThan(0)
      const d = shape.paths[0]?.d ?? ''
      expect(d.startsWith('M100 200')).toBe(true)
      expect(d).not.toMatch(/NaN|Infinity/)
      if (style === 'pin') {
        expect(shape.dot).toEqual(to)
        expect(shape.head).toBeUndefined()
      } else {
        // Ends at (or, for sketch, beside) the target and carries an arrowhead there.
        expect(shape.head).toMatch(/L100 140/)
      }
    },
  )

  it('uses dashes only for dashed and dotted styles', () => {
    expect(connectorShape('line', from, to).paths[0]?.dash).toBeUndefined()
    expect(connectorShape('dashed', from, to).paths[0]?.dash).toBe('5 5')
    expect(connectorShape('dotted', from, to).paths[0]?.dash).toBe('0 6')
    expect(connectorShape('curve-dashed', from, to).paths[0]?.dash).toBe('5 5')
  })

  it('curves bow to either side and elbows turn corners', () => {
    const left = connectorShape('curve', from, to, 1).paths[0]?.d
    const right = connectorShape('curve', from, to, -1).paths[0]?.d
    expect(left).not.toBe(right)
    const elbow = connectorShape('elbow', { x: 0, y: 0 }, { x: 80, y: 100 }).paths[0]?.d ?? ''
    expect(elbow.match(/Q/g)).toHaveLength(2)
    // Degenerates to a straight line when the ends are aligned.
    expect(connectorShape('elbow', from, to).paths[0]?.d).toBe('M100 200L100 140')
  })

  it.each([60, 90, 200, 400])(
    'a %ipx loop crosses itself and arrives heading at the target',
    (length) => {
      const shape = connectorShape('loop', { x: 0, y: 0 }, { x: length, y: 0 })
      const xs = [...(shape.paths[0]?.d ?? '').matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) =>
        Number(m[1]),
      )
      // A real loop runs backwards for a while.
      expect(xs.some((x, i) => i > 0 && x < (xs[i - 1] as number) - 0.5)).toBe(true)
      // Both chevron arms sit behind the tip, so the head points forward, not down or back.
      const head = [...(shape.head ?? '').matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) =>
        Number(m[1]),
      )
      expect(head[0]).toBeLessThan(length)
      expect(head[2]).toBeLessThan(length)
    },
  )

  it('points the arrowhead along the direction of travel', () => {
    // Travelling up: both chevron arms sit below the tip.
    const d = arrowHead({ x: 0, y: 0 }, { x: 0, y: -1 })
    const ys = [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => Number(m[2]))
    expect(ys[0]).toBeGreaterThan(0)
    expect(ys[2]).toBeGreaterThan(0)
  })
})

describe('connector endpoints', () => {
  // A sidebar taller than the popover, with the popover beside its middle.
  const sidebar = { x: 0, y: 0, width: 220, height: 800 }
  const beside = { x: 280, y: 320, width: 320, height: 200 }

  it('lands on the edge facing the popover, not the middle of a tall target', () => {
    const ends = connectorEndpoints({ side: 'right', popover: beside, target: sidebar })
    if (!ends) throw new Error('expected a connector')
    // The target's centre is at y 400; the popover's is at 420.
    expect(ends.to.x).toBe(226)
    expect(Math.abs(ends.to.y - 420)).toBeLessThanOrEqual(52)
    // Short: the line spans the gap, not the height of the sidebar.
    expect(Math.hypot(ends.to.x - ends.from.x, ends.to.y - ends.from.y)).toBeLessThan(120)
  })

  it('does not run along a full-width target either', () => {
    const banner = { x: 0, y: 0, width: 1200, height: 90 }
    const below = { x: 820, y: 150, width: 320, height: 180 }
    const ends = connectorEndpoints({ side: 'bottom', popover: below, target: banner })
    if (!ends) throw new Error('expected a connector')
    expect(ends.to.y).toBe(96)
    // Near the popover (centre x 980), nowhere near the banner's centre at 600.
    expect(Math.abs(ends.to.x - 980)).toBeLessThanOrEqual(52)
  })

  it('always arrives at an angle, and stays clear of the card', () => {
    const target = { x: 400, y: 300, width: 60, height: 40 }
    for (const [side, popover] of [
      ['top', { x: 380, y: 160, width: 300, height: 80 }],
      ['bottom', { x: 380, y: 400, width: 300, height: 80 }],
      ['left', { x: 60, y: 260, width: 280, height: 120 }],
      ['right', { x: 520, y: 260, width: 280, height: 120 }],
    ] as const) {
      const ends = connectorEndpoints({ side, popover, target })
      if (!ends) throw new Error(`expected a connector on the ${side}`)
      const horizontal = side === 'left' || side === 'right'
      const lean = horizontal ? ends.to.y - ends.from.y : ends.to.x - ends.from.x
      expect(Math.abs(lean)).toBeGreaterThan(8)
      // The line starts outside the popover, so it reads as drawn onto the page.
      const exit = horizontal ? ends.from.x : ends.from.y
      const near = horizontal
        ? side === 'right'
          ? popover.x
          : popover.x + popover.width
        : side === 'bottom'
          ? popover.y
          : popover.y + popover.height
      expect(Math.abs(exit - near)).toBe(5)
      expect(ends.bend === 1 || ends.bend === -1).toBe(true)
    }
  })

  it('routes around the card when the target is too big to sit beside', () => {
    // A panel wider than the room left for the popover: the card is clamped to
    // the screen edge and overlaps it, so there is no band to cross.
    const panel = { x: 224, y: 183, width: 800, height: 400 }
    const card = { x: 928, y: 328, width: 344, height: 111 }
    const ends = connectorEndpoints({ side: 'right', popover: card, target: panel })
    if (!ends) throw new Error('expected a connector')
    // It still lands on the panel's right edge, on the stretch above the card.
    expect(ends.to.x).toBe(1030)
    expect(ends.to.y).toBeLessThan(card.y)
    expect(ends.to.y).toBeGreaterThan(panel.y)
    // And it leaves through the card's top edge, near the side facing the panel.
    expect(ends.from.y).toBe(card.y - 5)
    expect(ends.from.x).toBe(card.x + 16)
  })

  it('reaches past whichever side of the card leaves more edge uncovered', () => {
    const panel = { x: 224, y: 183, width: 800, height: 400 }
    const high = { x: 928, y: 200, width: 344, height: 111 }
    const ends = connectorEndpoints({ side: 'right', popover: high, target: panel })
    if (!ends) throw new Error('expected a connector')
    // Little room above the card, plenty below it.
    expect(ends.to.y).toBeGreaterThan(high.y + high.height)
    expect(ends.from.y).toBe(high.y + high.height + 5)
  })

  it('gives up when the card covers the target with nothing to point at', () => {
    const target = { x: 400, y: 300, width: 60, height: 40 }
    const over = { x: 450, y: 290, width: 300, height: 60 }
    expect(connectorEndpoints({ side: 'right', popover: over, target })).toBeNull()
  })
})
