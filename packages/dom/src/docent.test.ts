// @vitest-environment jsdom
import { createMemoryStorage, defineTour } from '@docentjs/core'
import { afterEach, describe, expect, it } from 'vitest'
import { createDocent } from './docent'

const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
}
const title = () =>
  document.querySelector('[data-docent-host]')?.shadowRoot?.querySelector('.title')?.textContent ??
  null

afterEach(() => {
  document.body.innerHTML = ''
  history.pushState({}, '', '/')
})

describe('createDocent', () => {
  it('starts a route-triggered tour on navigation and renders it', async () => {
    const docent = createDocent({
      storage: createMemoryStorage(),
      tours: [
        defineTour({
          id: 'inv',
          trigger: { type: 'route', pattern: '/invoices' },
          steps: [{ id: 's', title: 'Invoices' }],
        }),
      ],
    })
    await docent.ready
    expect(title()).toBeNull()
    history.pushState({}, '', '/invoices')
    window.dispatchEvent(new PopStateEvent('popstate'))
    await settle()
    expect(title()).toBe('Invoices')
    expect(docent.getState().active).toBe('inv')
    await docent.destroy()
    expect(title()).toBeNull()
  })

  it('refresh() re-checks triggers for routers without navigation events', async () => {
    const docent = createDocent({
      storage: createMemoryStorage(),
      tours: [
        defineTour({
          id: 'r',
          trigger: { type: 'route', pattern: '/quiet' },
          steps: [{ id: 's', title: 'Quiet' }],
        }),
      ],
    })
    await docent.ready
    history.pushState({}, '', '/quiet') // no event dispatched
    await settle()
    expect(title()).toBeNull()
    await docent.refresh()
    await settle()
    expect(title()).toBe('Quiet')
    await docent.destroy()
  })

  it('starts an element-triggered tour when the element appears', async () => {
    const docent = createDocent({
      storage: createMemoryStorage(),
      tours: [
        defineTour({
          id: 'el',
          trigger: { type: 'element', target: { name: 'panel' } },
          steps: [{ id: 's', target: { name: 'panel' }, title: 'Panel' }],
        }),
      ],
    })
    await docent.ready
    const panel = document.createElement('section')
    panel.setAttribute('data-docent', 'panel')
    document.body.appendChild(panel)
    await settle()
    expect(title()).toBe('Panel')
    await docent.destroy()
  })
})
