// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { findOccluder, uncover } from './occlusion'

const viewport = { x: 0, y: 0, width: 800, height: 600 }

function rect(el: Element, r: { top: number; height: number; left?: number; width?: number }) {
  const left = r.left ?? 0
  const width = r.width ?? 100
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    top: r.top,
    bottom: r.top + r.height,
    left,
    right: left + width,
    width,
    height: r.height,
    x: left,
    y: r.top,
    toJSON: () => ({}),
  } as DOMRect)
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

function setup() {
  document.body.innerHTML = `
    <header id="h" style="position: sticky">Header</header>
    <button id="t">Target</button>
    <div id="host"></div>
  `
  const header = document.getElementById('h') as HTMLElement
  const target = document.getElementById('t') as HTMLElement
  const host = document.getElementById('host') as HTMLElement
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    (el) => ({ position: el === header ? 'sticky' : 'static' }) as CSSStyleDeclaration,
  )
  return { header, target, host }
}

describe('findOccluder', () => {
  it('reports a pinned element covering the top edge, ignoring our host', () => {
    const { header, target, host } = setup()
    rect(header, { top: 0, height: 64 })
    rect(target, { top: 40, height: 30 })
    document.elementsFromPoint = vi.fn((_x: number, y: number) =>
      y < 64 ? [host, header, target] : [host, target],
    )
    const occ = findOccluder(target, host, viewport)
    expect(occ?.el).toBe(header)
    expect(occ?.edge).toBe('top')
  })

  it('returns null when the target itself is on top or the cover is not pinned', () => {
    const { header, target, host } = setup()
    rect(header, { top: 0, height: 64 })
    rect(target, { top: 100, height: 30 })
    document.elementsFromPoint = vi.fn(() => [target])
    expect(findOccluder(target, host, viewport)).toBeNull()
    const plain = document.createElement('div')
    document.body.appendChild(plain)
    document.elementsFromPoint = vi.fn(() => [plain, target])
    expect(findOccluder(target, host, viewport)).toBeNull()
  })
})

describe('uncover', () => {
  it('scrolls up by the overlap plus margin', () => {
    const { header, target, host } = setup()
    rect(header, { top: 0, height: 64 })
    rect(target, { top: 40, height: 30 })
    let calls = 0
    document.elementsFromPoint = vi.fn((_x: number, y: number) =>
      calls++ === 0 && y < 64 ? [header, target] : [target],
    )
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
    expect(uncover(target, host, viewport)).toBe(true)
    expect(scrollBy).toHaveBeenCalledWith({ top: -(64 - 40 + 8), behavior: 'auto' })
  })

  it('does nothing without elementsFromPoint support', () => {
    const { target, host } = setup()
    // biome-ignore lint/suspicious/noExplicitAny: simulate an old engine
    ;(document as any).elementsFromPoint = undefined
    expect(uncover(target, host, viewport)).toBe(false)
  })
})
