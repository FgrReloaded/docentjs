// @vitest-environment jsdom
import { type BeaconRequest, defineTour } from '@docentjs/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { showBeacon } from './beacon'
import { anchorPoint } from './position'

const rect = { x: 100, y: 200, width: 80, height: 40 }

describe('anchorPoint', () => {
  it('sits on a corner, an edge or the centre', () => {
    expect(anchorPoint(rect)).toEqual({ x: 180, y: 200 })
    expect(anchorPoint(rect, 'bottom-left')).toEqual({ x: 100, y: 240 })
    expect(anchorPoint(rect, 'left')).toEqual({ x: 100, y: 220 })
    expect(anchorPoint(rect, 'center', 10)).toEqual({ x: 140, y: 220 })
  })

  it('moves outward by a number, or by an exact shift', () => {
    expect(anchorPoint(rect, 'top', 6)).toEqual({ x: 140, y: 194 })
    const corner = anchorPoint(rect, 'top-right', Math.SQRT2)
    expect(corner.x).toBeCloseTo(181)
    expect(corner.y).toBeCloseTo(199)
    expect(anchorPoint(rect, 'top-right', { x: -4, y: 2 })).toEqual({ x: 176, y: 202 })
  })
})

const frame = () => new Promise((r) => setTimeout(r, 40))
const beacon = () =>
  document
    .querySelector('[data-docent-beacons]')
    ?.shadowRoot?.querySelector<HTMLButtonElement>('.beacon')

function request(overrides: Partial<BeaconRequest> = {}): BeaconRequest {
  return {
    tour: defineTour({
      id: 'export',
      trigger: { type: 'beacon' },
      options: { beacon: { style: 'badge', text: 'New' } },
      steps: [{ id: 'tip', target: '#export', title: 'Export' }],
    }),
    target: '#export',
    open: 'click',
    label: 'Export tip',
    onShown: vi.fn(),
    onOpen: vi.fn(() => true),
    onClose: vi.fn(),
    ...overrides,
  }
}

describe('showBeacon', () => {
  let handle: ReturnType<typeof showBeacon> | undefined

  beforeEach(() => {
    document.body.innerHTML = '<button id="export">Export</button>'
    const target = document.getElementById('export') as HTMLElement
    target.getBoundingClientRect = () => ({ ...rect, top: 200, left: 100 }) as DOMRect
    for (const key of ['clientWidth', 'clientHeight'] as const) {
      Object.defineProperty(document.documentElement, key, { value: 800, configurable: true })
    }
  })

  afterEach(() => {
    handle?.remove()
    handle = undefined
  })

  it('draws an accessible button on the target and reports it once', async () => {
    const r = request()
    handle = showBeacon(document, r, {})
    await frame()
    const el = beacon()
    expect(el?.hidden).toBe(false)
    expect(el?.getAttribute('aria-label')).toBe('Export tip')
    expect(el?.dataset.style).toBe('badge')
    expect(el?.textContent).toBe('New')
    expect(el?.style.transform).toBe('translate(158px, 178px)')
    document.body.append(document.createElement('div'))
    await frame()
    expect(r.onShown).toHaveBeenCalledTimes(1)
  })

  it('opens on click and closes on a second click', async () => {
    const r = request()
    handle = showBeacon(document, r, {})
    await frame()
    beacon()?.click()
    expect(r.onOpen).toHaveBeenCalledWith('click')
    expect(beacon()?.getAttribute('aria-expanded')).toBe('true')
    beacon()?.click()
    expect(r.onClose).toHaveBeenCalled()
  })

  it('opens a hover preview after a pause and closes it when the pointer leaves', async () => {
    vi.useFakeTimers()
    const r = request({ open: 'hover' })
    handle = showBeacon(document, r, {})
    await vi.advanceTimersByTimeAsync(40)
    beacon()?.dispatchEvent(new Event('pointerenter'))
    await vi.advanceTimersByTimeAsync(150)
    expect(r.onOpen).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(100)
    expect(r.onOpen).toHaveBeenCalledWith('hover')
    document.body.dispatchEvent(new Event('pointerover', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(300)
    expect(r.onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('hides while the target is missing and removes its layer when done', async () => {
    handle = showBeacon(document, request({ target: '#later' }), {})
    await frame()
    expect(beacon()?.hidden).toBe(true)
    handle.remove()
    handle = undefined
    expect(document.querySelector('[data-docent-beacons]')).toBeNull()
  })
})
