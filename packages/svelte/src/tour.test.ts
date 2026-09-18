// @vitest-environment jsdom
import { defineTour } from '@docentjs/core'
import { get } from 'svelte/store'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mountSpy = vi.fn(
  (_c: unknown, opts: { target: HTMLElement; props: { ctx: { step: { id: string } } } }) => {
    opts.target.textContent = `mounted ${opts.props.ctx.step.id}`
    return { id: opts.props.ctx.step.id }
  },
)
const unmountSpy = vi.fn()
vi.mock('svelte', () => ({ mount: mountSpy, unmount: unmountSpy }))

const { tour: tourAction, useTour } = await import('./tour')

const def = defineTour({
  id: 'svelte-test',
  steps: [
    { id: 'a', title: 'First' },
    { id: 'b', title: 'Second' },
  ],
})

const host = () => document.querySelector('[data-docent-host]')

afterEach(() => {
  document.body.innerHTML = ''
  mountSpy.mockClear()
  unmountSpy.mockClear()
})

describe('useTour', () => {
  it('exposes state stores and controls', async () => {
    const t = useTour(def)
    const seen: string[] = []
    const off = t.state.subscribe((s) => seen.push(s.status))
    expect(get(t.active)).toBe(false)
    await t.start()
    expect(get(t.state)).toMatchObject({ status: 'running', index: 0 })
    expect(get(t.active)).toBe(true)
    await t.next()
    await t.next()
    expect(seen).toEqual(['idle', 'running', 'running', 'completed'])
    expect(get(t.active)).toBe(false)
    off()
    await t.destroy()
    expect(host()).toBeNull()
  })

  it('mounts a custom popover component per step and unmounts it', async () => {
    const Card = (() => {}) as unknown as Parameters<typeof useTour>[1] extends infer O
      ? O extends { popover?: infer C }
        ? NonNullable<C>
        : never
      : never
    const t = useTour(def, { popover: Card })
    await t.start()
    expect(mountSpy).toHaveBeenCalledTimes(1)
    expect(document.querySelector('[data-docent-popover]')?.textContent).toBe('mounted a')
    await t.next()
    expect(unmountSpy).toHaveBeenCalledWith({ id: 'a' })
    expect(document.querySelector('[data-docent-popover]')?.textContent).toBe('mounted b')
    await t.skip()
    expect(unmountSpy).toHaveBeenCalledTimes(2)
    await t.destroy()
  })

  it('action starts on mount and destroys on removal', async () => {
    const t = useTour(def)
    const node = document.createElement('div')
    const action = tourAction(node, t)
    await new Promise((r) => setTimeout(r, 0))
    expect(get(t.state).status).toBe('running')
    action.destroy()
    await new Promise((r) => setTimeout(r, 0))
    expect(host()).toBeNull()
  })
})
