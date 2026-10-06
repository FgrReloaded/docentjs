// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { Connector, connectorShape } from './connector'

const from = { x: 100, y: 200 }
const to = { x: 100, y: 140 }

describe('Connector', () => {
  it('sets widths inline, so they win over the stylesheet default', () => {
    const connector = new Connector(document)
    connector.render(connectorShape('marker', from, to), false)
    const [line, head] = connector.el.querySelectorAll('path')
    expect(line?.style.strokeWidth).toBe('4.2')
    expect(head?.style.strokeWidth).toBe('4.2')
  })

  it('paints fills and solid heads, and squares off blocks', () => {
    const connector = new Connector(document)
    connector.render(connectorShape('swoosh', from, to), true)
    expect(connector.el.querySelector('path')?.getAttribute('class')).toBe('fill fade')
    connector.render(connectorShape('block', from, to), true)
    const [bar, head] = connector.el.querySelectorAll('path')
    expect(bar?.getAttribute('class')).toBe('stroke square draw')
    expect(head?.getAttribute('class')).toBe('stroke head solid square')
  })

  it('turns the glow on for glow only', () => {
    const connector = new Connector(document)
    connector.render(connectorShape('glow', from, to), false)
    expect(connector.el.classList.contains('glow')).toBe(true)
    connector.render(connectorShape('line', from, to), false)
    expect(connector.el.classList.contains('glow')).toBe(false)
  })
})
