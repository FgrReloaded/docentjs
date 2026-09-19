// @vitest-environment jsdom
import { createMemoryStorage, defineTour } from '@docentjs/core'
import { createDocent } from '@docentjs/dom'
import { act, render } from '@testing-library/react'
import { mount as mountVue } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { DocentDevtools as ReactDevtools } from './react'
import { DocentDevtools as VueDevtools } from './vue'

const settle = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0))
}
const panel = () => document.querySelector('[data-docent-devtools]')
const docent = () =>
  createDocent({
    storage: createMemoryStorage(),
    tours: [defineTour({ id: 't', steps: [{ id: 's' }] })],
  })

afterEach(() => {
  vi.unstubAllEnvs()
  document.body.innerHTML = ''
})

describe('<DocentDevtools /> for React', () => {
  it('mounts the panel for a manager or a useDocent handle and removes it on unmount', async () => {
    const d = docent()
    const { unmount } = render(<ReactDevtools docent={{ docent: d }} />)
    await act(settle)
    expect(panel()).not.toBeNull()
    unmount()
    expect(panel()).toBeNull()
  })

  it('renders nothing in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    render(<ReactDevtools docent={docent()} />)
    await act(settle)
    expect(panel()).toBeNull()
  })
})

describe('<DocentDevtools /> for Vue', () => {
  it('mounts the panel and removes it on unmount', async () => {
    const d = docent()
    const wrapper = mountVue({ render: () => h(VueDevtools, { docent: d, open: true }) })
    await settle()
    expect(panel()).not.toBeNull()
    expect(panel()?.shadowRoot?.querySelector<HTMLElement>('.panel')?.hidden).toBe(false)
    wrapper.unmount()
    expect(panel()).toBeNull()
  })

  it('renders nothing in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mountVue({ render: () => h(VueDevtools, { docent: docent() }) })
    await settle()
    expect(panel()).toBeNull()
  })
})
