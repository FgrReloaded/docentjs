// @vitest-environment jsdom
import { createMemoryStorage, defineTour } from '@docentjs/core'
import { createDocent } from '@docentjs/dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from './mount'

const shadow = () => document.querySelector('[data-docent-devtools]')?.shadowRoot as ShadowRoot
const panelText = () => shadow().querySelector('.panel')?.textContent ?? ''
const popoverTitle = () =>
  document.querySelector('[data-docent-host]')?.shadowRoot?.querySelector('.title')?.textContent ??
  null
function button(label: string, scope: ParentNode = shadow()): HTMLButtonElement {
  const b = Array.from(scope.querySelectorAll('button')).find(
    (x) => x.textContent?.trim() === label || x.getAttribute('aria-label') === label,
  )
  if (!b) throw new Error(`no button ${label}`)
  return b
}
const tab = (label: string) => {
  const t = Array.from(shadow().querySelectorAll('[role="tab"]')).find((x) =>
    x.textContent?.startsWith(label),
  )
  ;(t as HTMLElement).click()
}
async function type(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  // Let Preact re-render with the new value, as it would between keystrokes and a click.
  await new Promise((r) => setTimeout(r, 0))
}
const stepItem = (text: string) =>
  Array.from(shadow().querySelectorAll<HTMLElement>('.step-item')).find((x) =>
    x.textContent?.includes(text),
  ) as HTMLElement

afterEach(() => {
  document.body.innerHTML = ''
  localStorage.clear()
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
    await vi.waitFor(() =>
      expect(panelText()).toContain('Condition failed: trait plan eq "trial" (user has "pro")'),
    )
    expect(shadow().querySelector('.card .badge')?.textContent).toBe('blocked')
    unmount()
    await docent.destroy()
  })

  it('shows target health per step and plays from a step', async () => {
    const { docent, unmount } = setup()
    await vi.waitFor(() => expect(shadow().querySelector('.card .head')).not.toBeNull())
    ;(shadow().querySelector('.card .head') as HTMLElement).click()
    await vi.waitFor(() => expect(panelText()).toContain('found via [data-docent="save"]'))
    expect(panelText()).toContain('centred modal, no target')
    expect(panelText()).toContain('not found (tried #gone)')
    const rows = Array.from(shadow().querySelectorAll('.step-row'))
    button('Play from this step', rows[1]).click()
    await vi.waitFor(() => expect(docent.getState().active).toBe('trial'))
    await vi.waitFor(() =>
      expect(shadow().querySelector('.now')?.textContent).toContain('step 2/3'),
    )
    button('Stop').click()
    await vi.waitFor(() => expect(docent.getState().active).toBeNull())
    unmount()
    await docent.destroy()
  })

  it('edits a running step live and exports JSON', async () => {
    const { docent, unmount } = setup()
    await docent.start('trial', { at: 'save' })
    await vi.waitFor(() => expect(popoverTitle()).toBe('Save'))
    tab('Edit')
    await vi.waitFor(() => expect(panelText()).toContain('Step · hello'))
    stepItem('Save').click()
    await vi.waitFor(() => expect(panelText()).toContain('Step · save'))
    const title = Array.from(shadow().querySelectorAll('.field')).find((f) =>
      f.textContent?.startsWith('Title'),
    )
    await type(title?.querySelector('input') as HTMLInputElement, 'Save your work')
    await vi.waitFor(() => expect(popoverTitle()).toBe('Save your work'), { timeout: 2000 })
    expect(docent.getTours()[0]?.steps[1]?.title).toBe('Save your work')
    expect(shadow().querySelector('.badge.eligible')?.textContent).toBe('edited')

    button('Discard edits').click()
    await vi.waitFor(() => expect(popoverTitle()).toBe('Save'))
    unmount()
    await docent.destroy()
  })

  it('keeps unsaved edits across a reload and drops them once discarded', async () => {
    const first = setup()
    tab('Edit')
    await vi.waitFor(() => expect(panelText()).toContain('Step · hello'))
    const title = Array.from(shadow().querySelectorAll('.field')).find((f) =>
      f.textContent?.startsWith('Title'),
    )
    await type(title?.querySelector('input') as HTMLInputElement, 'Hello again')
    await vi.waitFor(() => expect(panelText()).toContain('Edits are kept in this browser'))
    expect(localStorage.getItem('docent-devtools-drafts')).toContain('Hello again')
    first.unmount()
    await first.docent.destroy()

    // A fresh page: same code, new manager, new panel.
    const second = setup()
    await vi.waitFor(() => expect(second.docent.getTours()[0]?.steps[0]?.title).toBe('Hello again'))
    await vi.waitFor(() => expect(panelText()).toContain('Restored unsaved edits'))
    button('Discard edits').click()
    await vi.waitFor(() => expect(second.docent.getTours()[0]?.steps[0]?.title).toBe('Hello'))
    expect(localStorage.getItem('docent-devtools-drafts')).toBeNull()
    second.unmount()
    await second.docent.destroy()
  })

  it('changes the arrow, spotlight and overlay look live', async () => {
    const { docent, unmount } = setup()
    await docent.start('trial', { at: 'save' })
    const tourHost = () => document.querySelector('[data-docent-host]') as HTMLElement
    await vi.waitFor(() => expect(tourHost().getAttribute('data-arrow')).toBe('caret'))
    tab('Edit')
    const look = () =>
      Array.from(shadow().querySelectorAll('.section')).find(
        (x) => x.querySelector('h4')?.textContent === 'Look',
      ) as HTMLElement
    await vi.waitFor(() => expect(look()).toBeTruthy())
    const choose = (label: string, value: string) => {
      const field = Array.from(look().querySelectorAll('.field')).find((f) =>
        f.textContent?.startsWith(label),
      )
      const select = field?.querySelector('select') as HTMLSelectElement
      select.value = value
      select.dispatchEvent(new Event('change', { bubbles: true }))
    }
    choose('Arrow', 'squiggle')
    choose('Overlay', 'vignette')
    choose('Ring', 'pulse')
    await vi.waitFor(() => expect(tourHost().getAttribute('data-arrow')).toBe('squiggle'))
    expect(tourHost().getAttribute('data-overlay')).toBe('vignette')
    expect(tourHost().getAttribute('data-ring')).toBe('pulse')
    expect(docent.getTours()[0]?.options).toMatchObject({
      arrow: 'squiggle',
      overlay: { style: 'vignette' },
      spotlight: { ring: 'pulse' },
    })
    unmount()
    await docent.destroy()
  })

  it('adds, moves and deletes steps', async () => {
    const { docent, unmount } = setup()
    tab('Edit')
    await vi.waitFor(() => expect(shadow().querySelectorAll('.step-item')).toHaveLength(3))
    button('Add step after this one').click()
    await vi.waitFor(() => expect(shadow().querySelectorAll('.step-item')).toHaveLength(4))
    expect(docent.getTours()[0]?.steps.map((s) => s.id)).toEqual([
      'hello',
      'new-step',
      'save',
      'gone',
    ])
    button('Move up').click()
    await vi.waitFor(() => expect(docent.getTours()[0]?.steps[0]?.id).toBe('new-step'))
    button('Delete step').click()
    await vi.waitFor(() =>
      expect(docent.getTours()[0]?.steps.map((s) => s.id)).toEqual(['hello', 'save', 'gone']),
    )
    unmount()
    await docent.destroy()
  })

  it('simulates identity and logs events', async () => {
    const { docent, unmount } = setup()
    tab('Simulate')
    await vi.waitFor(() => expect(shadow().querySelector('textarea')).not.toBeNull())
    await type(shadow().querySelector('textarea') as HTMLTextAreaElement, '{"plan":"trial"}')
    button('Apply identity').click()
    await vi.waitFor(() => expect(docent.getState().active).toBe('trial'))
    tab('Events')
    await vi.waitFor(() => expect(panelText()).toContain('tour:started trial'))
    tab('Simulate')
    await vi.waitFor(() => expect(shadow().querySelector('textarea')).not.toBeNull())
    await type(shadow().querySelector('textarea') as HTMLTextAreaElement, '[1]')
    button('Apply identity').click()
    await vi.waitFor(() =>
      expect(shadow().querySelector('.error')?.textContent).toBe('Traits must be a JSON object'),
    )
    unmount()
    await docent.destroy()
  })

  it('audits tours and links issues to the editor', async () => {
    const { docent, unmount } = setup()
    await vi.waitFor(() => expect(shadow().querySelector('.pill')?.textContent).toBe('1'))
    tab('Audit')
    await vi.waitFor(() => expect(panelText()).toContain('Target is not on this page.'))
    ;(shadow().querySelector('.issue.warning') as HTMLElement).click()
    await vi.waitFor(() => expect(panelText()).toContain('Step · gone'))
    unmount()
    await docent.destroy()
  })

  it('toggles, docks, remembers preferences, and unmounts cleanly', async () => {
    const docent = createDocent({ storage: createMemoryStorage(), tours: [] })
    const unmount = mount(docent)
    await vi.waitFor(() => expect(shadow().querySelector('.toggle')).not.toBeNull())
    ;(shadow().querySelector('.toggle') as HTMLElement).click()
    await vi.waitFor(() => expect(shadow().querySelector('.panel.dock-right')).not.toBeNull())
    button('Dock bottom').click()
    await vi.waitFor(() => expect(shadow().querySelector('.panel.dock-bottom')).not.toBeNull())
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'D', altKey: true, shiftKey: true }))
    await vi.waitFor(() => expect(shadow().querySelector('.panel')).toBeNull())
    expect(JSON.parse(localStorage.getItem('docent-devtools') ?? '{}')).toMatchObject({
      open: false,
      dock: 'bottom',
    })
    unmount()
    expect(document.querySelector('[data-docent-devtools]')).toBeNull()
    expect(document.querySelector('[data-docent-devtools-highlight]')).toBeNull()
    await docent.destroy()
  })
})
