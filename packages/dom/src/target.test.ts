// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { candidateSelectors, isVisible, queryAllDeep, resolveTarget, waitForTarget } from './target'

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

describe('visibility', () => {
  it('sees display: none on the element or an ancestor, and visibility: hidden', () => {
    document.body.innerHTML = `
      <aside style="display: none"><a id="inner">x</a></aside>
      <b id="invisible" style="visibility: hidden">x</b>
      <b id="shown">x</b>`
    expect(isVisible(document.getElementById('inner') as Element)).toBe(false)
    expect(isVisible(document.getElementById('invisible') as Element)).toBe(false)
    expect(isVisible(document.getElementById('shown') as Element)).toBe(true)
  })

  it('still returns a hidden target: it may be shown a moment later', () => {
    document.body.innerHTML = '<aside data-docent="nav" style="display: none">nav</aside>'
    expect(resolveTarget({ name: 'nav' })?.tagName).toBe('ASIDE')
  })

  it('prefers the rendered match, so one name can mark desktop and mobile variants', () => {
    document.body.innerHTML = `
      <aside data-docent="nav" style="display: none">sidebar</aside>
      <button data-docent="nav">menu</button>`
    expect(resolveTarget({ name: 'nav' })?.tagName).toBe('BUTTON')
  })

  it('looks past a selector whose matches are all hidden for a rendered one', () => {
    document.body.innerHTML = '<aside id="side" style="display: none"></aside><nav id="bar"></nav>'
    expect(resolveTarget({ selectors: ['#side', '#bar'] })?.id).toBe('bar')
    expect(resolveTarget({ selectors: ['#side', '#nope'] })?.id).toBe('side')
  })

  it('keeps nth exact, hidden or not', () => {
    document.body.innerHTML = '<i class="x"></i><i id="second" class="x" style="display: none"></i>'
    expect(resolveTarget({ selectors: ['.x'], nth: 1 })?.id).toBe('second')
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
