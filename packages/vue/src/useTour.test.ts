// @vitest-environment jsdom
import { defineTour } from '@docentjs/core'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { TourPopover } from './TourPopover'
import { provideDocentDefaults, useTour } from './useTour'

const tour = defineTour({
  id: 'vue-test',
  steps: [
    { id: 'a', title: 'First' },
    { id: 'b', title: 'Second' },
  ],
})

const host = () => document.querySelector('[data-docent-host]') as HTMLElement | null

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useTour', () => {
  it('controls a tour with reactive state outside a component', async () => {
    const t = useTour(tour)
    expect(t.state.value.status).toBe('idle')
    await t.start()
    expect(t.state.value).toMatchObject({ status: 'running', index: 0 })
    expect(t.active.value).toBe(true)
    expect(host()?.shadowRoot?.querySelector('.title')?.textContent).toBe('First')
    await t.next()
    await t.next()
    expect(t.state.value.status).toBe('completed')
    expect(t.active.value).toBe(false)
    await t.destroy()
  })

  it('destroys with the owning component and inherits provided defaults', async () => {
    let handle: ReturnType<typeof useTour> | undefined
    const Child = defineComponent({
      setup() {
        handle = useTour(tour)
        return () => h('span', handle?.state.value.status)
      },
    })
    const Parent = defineComponent({
      setup() {
        provideDocentDefaults({ renderer: { theme: { accent: 'hotpink' } } })
        return () => h(Child)
      },
    })
    const wrapper = mount(Parent)
    await handle?.start()
    await nextTick()
    expect(wrapper.text()).toBe('running')
    expect(host()?.style.getPropertyValue('--docent-accent')).toBe('hotpink')
    wrapper.unmount()
    await flushPromises()
    expect(host()).toBeNull()
  })

  it('teleports a custom popover into the positioned container', async () => {
    let handle: ReturnType<typeof useTour> | undefined
    const App = defineComponent({
      setup() {
        handle = useTour(tour, { popover: true })
        const t = handle
        return () =>
          h('div', [
            h(
              TourPopover,
              { tour: t },
              {
                default: ({
                  ctx,
                }: {
                  ctx: { step: { title?: string }; progress: { current: number } }
                }) => h('b', { class: 'card' }, `${ctx.step.title} #${ctx.progress.current}`),
              },
            ),
          ])
      },
    })
    mount(App, { attachTo: document.body })
    await handle?.start()
    await nextTick()
    const card = document.querySelector('[data-docent-popover] .card')
    expect(card?.textContent).toBe('First #1')
    expect(host()?.shadowRoot?.querySelector('.popover.headless')).not.toBeNull()
    await handle?.next()
    await nextTick()
    expect(document.querySelector('[data-docent-popover] .card')?.textContent).toBe('Second #2')
    await handle?.skip()
    await nextTick()
    expect(document.querySelector('[data-docent-popover]')).toBeNull()
  })
})
