// @vitest-environment jsdom
import { createMemoryStorage, defineTour } from '@docentjs/core'
import { createDocent } from '@docentjs/dom'
import { afterEach, describe, expect, it } from 'vitest'
import { mount } from './panel'

const settle = async () => {
  for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0))
}
const shadow = () => document.querySelector('[data-docent-devtools]')?.shadowRoot as ShadowRoot
const text = () => shadow().querySelector('.panel')?.textContent ?? ''
const click = (label: string, scope: ParentNode = shadow()) => {
  const b = Array.from(scope.querySelectorAll('button')).find(
    (x) => x.textContent?.trim() === label,
  )
  if (!b) throw new Error(`no button ${label}`)
  b.click()
}

afterEach(() => {
  document.body.innerHTML = ''
  sessionStorage.clear()
})

function setup() {
  document.body.innerHTML = '<button data-docent="save">Save</button>'
  const docent = createDocent({
    storage: createMemoryStorage(),
    identity: { id: 'u', traits: { plan: 'pro' } },
    tours: [
      defineTour({
        id: 'trial',
        name: 'Trial tour',
        trigger: { type: 'auto' },
        conditions: [{ type: 'trait', key: 'plan', op: 'eq', value: 'trial' }],
        steps: [
          { id: 'hello', title: 'Hello' },
          { id: 'save', target: { name: 'save' }, title: 'Save' },
          { id: 'gone', target: '#gone', title: 'Gone' },
        ],
      }),
    ],
  })
  const unmount = mount(docent, { open: true })
  return { docent, unmount }
}

describe('devtools panel', () => {
  it('lists tours with the reason they are not showing', async () => {
    const { docent, unmount } = setup()
    await settle()
    expect(text()).toContain('Trial tour')
    expect(text()).toContain('Condition failed: trait plan eq "trial" (user has "pro")')
    expect(shadow().querySelector('.badge')?.textContent).toBe('blocked')
    unmount()
    await docent.destroy()
  })

  it('shows target health per step and plays from a step', async () => {
    const { docent, unmount } = setup()
    await settle()
    shadow().querySelector<HTMLElement>('.card .head')?.click()
    await settle()
    expect(text()).toContain('centred modal, no target')
    expect(text()).toContain('found via [data-docent="save"]')
    expect(text()).toContain('not found (tried #gone)')

    const rows = Array.from(shadow().querySelectorAll('.detail .row'))
    const saveRow = rows.find((r) => r.textContent?.includes('found via'))
    saveRow?.querySelector('button')?.click()
    await settle()
    expect(docent.getState().active).toBe('trial')
    expect(shadow().querySelector('.now')?.textContent).toContain('step 2/3')

    click('Stop')
    await settle()
    expect(docent.getState().active).toBeNull()
    unmount()
    await docent.destroy()
  })

  it('simulates identity so the tour qualifies and logs events', async () => {
    const { docent, unmount } = setup()
    await settle()
    click('Simulate')
    const textarea = shadow().querySelector('textarea') as HTMLTextAreaElement
    textarea.value = '{"plan":"trial"}'
    click('Apply identity')
    await settle()
    expect(docent.getState().active).toBe('trial')

    click('Events')
    await settle()
    expect(text()).toContain('tour:started trial')
    expect(text()).toContain('step:shown trial')

    const bad = () => {
      click('Simulate')
      ;(shadow().querySelector('textarea') as HTMLTextAreaElement).value = '[1]'
      click('Apply identity')
    }
    bad()
    expect(shadow().querySelector('.error')?.textContent).toBe('Traits must be a JSON object')
    unmount()
    await docent.destroy()
  })

  it('toggles with the button and the shortcut, and unmounts cleanly', async () => {
    const docent = createDocent({ storage: createMemoryStorage(), tours: [] })
    const unmount = mount(docent)
    await settle()
    const panel = () => shadow().querySelector('.panel') as HTMLElement
    expect(panel().hidden).toBe(true)
    ;(shadow().querySelector('.toggle') as HTMLButtonElement).click()
    expect(panel().hidden).toBe(false)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'D', altKey: true, shiftKey: true }))
    expect(panel().hidden).toBe(true)
    unmount()
    expect(document.querySelector('[data-docent-devtools]')).toBeNull()
    expect(document.querySelector('[data-docent-devtools-highlight]')).toBeNull()
    await docent.destroy()
  })
})
