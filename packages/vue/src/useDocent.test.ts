// @vitest-environment jsdom
import { createMemoryStorage, defineTour } from '@docentjs/core'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { TourPopover } from './TourPopover'
import { useDocent } from './useDocent'

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
  it('runs auto tours with reactive state', async () => {
    const d = useDocent({ tours, storage: createMemoryStorage() })
    await settle()
    expect(d.state.value).toEqual({ active: 'w', tours: ['w'] })
    await d.stop()
    await settle()
    expect(d.state.value.active).toBeNull()
    await d.destroy()
  })

  it('teleports a custom popover through TourPopover', async () => {
    let handle: ReturnType<typeof useDocent> | undefined
    const App = defineComponent({
      setup() {
        handle = useDocent({ tours, storage: createMemoryStorage(), popover: true })
        const d = handle
        return () =>
          h(
            TourPopover,
            { tour: d },
            {
              default: ({ ctx }: { ctx: { step: { title?: string } } }) =>
                h('b', { class: 'card' }, ctx.step.title),
            },
          )
      },
    })
    const wrapper = mount(App, { attachTo: document.body })
    await settle()
    await nextTick()
    expect(document.querySelector('[data-docent-popover] .card')?.textContent).toBe('Hi')
    wrapper.unmount()
  })
})
