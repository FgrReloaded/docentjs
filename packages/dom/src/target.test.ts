// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { candidateSelectors, queryAllDeep, resolveTarget, waitForTarget } from './target'

beforeEach(() => {
  document.body.innerHTML = `
    <nav>
      <a id="first" class="link" href="/a">A</a>
      <a id="second" class="link" href="/b">B</a>
    </nav>
    <main>
      <button data-docent="save">Save</button>
      <a class="link" href="/c">C</a>
    </main>
    <div id="shadow-host"></div>
  `
  const host = document.getElementById('shadow-host') as HTMLElement
  const root = host.attachShadow({ mode: 'open' })
  root.innerHTML = '<span class="inside">hidden</span>'
})

describe('candidateSelectors', () => {
  it('turns a name into the data attribute and keeps fallbacks in order', () => {
    expect(candidateSelectors('#x')).toEqual(['#x'])
    expect(candidateSelectors({ name: 'save', selectors: ['#s', '.s'] })).toEqual([
      '[data-docent="save"]',
      '#s',
      '.s',
    ])
  })
})

describe('resolveTarget', () => {
  it('resolves selectors, names and fallbacks', () => {
    expect(resolveTarget('#first')?.id).toBe('first')
    expect(resolveTarget({ name: 'save' })?.textContent).toBe('Save')
    expect(resolveTarget({ selectors: ['#missing', '#second'] })?.id).toBe('second')
  })

  it('returns null for missing or invalid selectors', () => {
    expect(resolveTarget('#nope')).toBeNull()
    expect(resolveTarget(':::bad')).toBeNull()
    expect(resolveTarget({ selectors: [':::bad', '#first'] })?.id).toBe('first')
  })

  it('supports within and nth', () => {
    expect(resolveTarget({ selectors: ['.link'], within: 'main' })?.getAttribute('href')).toBe('/c')
    expect(resolveTarget({ selectors: ['.link'], nth: 1 })?.id).toBe('second')
    expect(resolveTarget({ selectors: ['.link'], nth: 9 })).toBeNull()
    expect(resolveTarget({ selectors: ['.link'], within: '#nope' })).toBeNull()
  })

  it('pierces open shadow roots when nothing matches in the light DOM', () => {
    expect(resolveTarget('.inside')?.textContent).toBe('hidden')
    expect(queryAllDeep(document, '.inside')).toHaveLength(1)
  })
})

describe('waitForTarget', () => {
  it('resolves immediately when present', async () => {
    expect((await waitForTarget('#first', 100))?.id).toBe('first')
  })

  it('resolves when the element appears later', async () => {
    const p = waitForTarget('#later', 1000)
    setTimeout(() => {
      const el = document.createElement('div')
      el.id = 'later'
      document.body.appendChild(el)
    }, 5)
    expect((await p)?.id).toBe('later')
  })

  it('times out with null', async () => {
    expect(await waitForTarget('#never', 10)).toBeNull()
  })

  it('aborts with null', async () => {
    const ac = new AbortController()
    const p = waitForTarget('#never', 1000, ac.signal)
    ac.abort()
    expect(await p).toBeNull()
  })
})
