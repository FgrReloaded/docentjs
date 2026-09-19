import { describe, expect, it } from 'vitest'
import { arrowGap, arrowHead, CONNECTOR_STYLES, connectorShape, isConnector } from './connector'

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

  it('points the arrowhead along the direction of travel', () => {
    // Travelling up: both chevron arms sit below the tip.
    const d = arrowHead({ x: 0, y: 0 }, { x: 0, y: -1 })
    const ys = [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => Number(m[2]))
    expect(ys[0]).toBeGreaterThan(0)
    expect(ys[2]).toBeGreaterThan(0)
  })
})
