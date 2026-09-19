// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDomEnvironment } from './environment'

const tick = () => new Promise((r) => setTimeout(r, 0))

afterEach(() => {
  document.body.innerHTML = ''
})

describe('createDomEnvironment', () => {
  it('reads the route and reports navigation', () => {
    const env = createDomEnvironment()
    history.pushState({}, '', '/invoices?tab=open')
    expect(env.currentRoute?.()).toBe('/invoices?tab=open')
    const listener = vi.fn()
    const off = env.onRouteChange?.(listener)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(listener).toHaveBeenCalledTimes(2)
    off?.()
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('reports element presence and fires on each appearance', async () => {
    const env = createDomEnvironment()
    const listener = vi.fn()
    expect(env.hasTarget('#menu')).toBe(false)
    const off = env.watchTarget?.('#menu', listener)
    expect(listener).not.toHaveBeenCalled()

    const menu = document.createElement('div')
    menu.id = 'menu'
    document.body.appendChild(menu)
    await tick()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(env.hasTarget('#menu')).toBe(true)

    menu.remove()
    await tick()
    document.body.appendChild(menu)
    await tick()
    expect(listener).toHaveBeenCalledTimes(2)

    off?.()
    menu.remove()
    await tick()
    document.body.appendChild(menu)
    await tick()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('fires immediately when the element is already present', () => {
    document.body.innerHTML = '<div data-docent="x"></div>'
    const listener = vi.fn()
    createDomEnvironment().watchTarget?.({ name: 'x' }, listener)()
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
