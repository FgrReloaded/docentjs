// @vitest-environment jsdom
import { createMemoryStorage, defineTour } from '@docentjs/core'
import { get } from 'svelte/store'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mountSpy = vi.fn(
  (_c: unknown, opts: { target: HTMLElement; props: { ctx: { step: { id: string } } } }) => {
    opts.target.textContent = `mounted ${opts.props.ctx.step.id}`
    return {}
  },
)
vi.mock('svelte', () => ({ mount: mountSpy, unmount: vi.fn() }))
const { useDocent } = await import('./docent')

const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
}
const tours = [
  defineTour({ id: 'w', trigger: { type: 'auto' }, steps: [{ id: 'a', title: 'Hi' }] }),
]

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useDocent', () => {
  it('runs auto tours with a state store and mounts a custom popover', async () => {
    const Card = (() => {}) as unknown as NonNullable<Parameters<typeof useDocent>[0]>['popover']
    const d = useDocent({
      tours,
      storage: createMemoryStorage(),
      ...(Card ? { popover: Card } : {}),
    })
    await settle()
    expect(get(d.state)).toEqual({ active: 'w', tours: ['w'] })
    expect(document.querySelector('[data-docent-popover]')?.textContent).toBe('mounted a')
    await d.destroy()
  })
})
