// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  looksGenerated,
  looksHashed,
  structuralPath,
  suggestName,
  targetCandidates,
} from './selectors'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('targetCandidates', () => {
  it('ranks names and test ids above ids, labels and structure', () => {
    document.body.innerHTML = `
      <main><section>
        <button id="save-btn" data-docent="save" data-testid="save" aria-label="Save draft" class="btn btn-primary css-1x2y3z">Save</button>
      </section></main>`
    const el = document.querySelector('button') as Element
    const c = targetCandidates(el)
    expect(c.map((x) => `${x.kind}:${x.value}`)).toEqual(
      [
        'name:save',
        'selector:[data-testid="save"]',
        'selector:#save-btn',
        'selector:button[aria-label="Save draft"]',
        'selector:button.btn.btn-primary',
        'selector:#save-btn',
      ].filter((v, i, a) => a.indexOf(v) === i),
    )
    expect(c.every((x) => x.unique)).toBe(true)
    expect(c[0]?.robustness).toBe('high')
  })

  it('marks non-unique candidates and sorts unique ones first', () => {
    document.body.innerHTML = '<ul><li class="item">a</li><li class="item">b</li></ul>'
    const el = document.querySelectorAll('li')[1] as Element
    const c = targetCandidates(el)
    expect(c[0]).toMatchObject({ value: 'ul > li:nth-of-type(2)', unique: true, robustness: 'low' })
    expect(c.find((x) => x.value === 'li.item')?.unique).toBe(false)
  })

  it('flags generated ids as low robustness', () => {
    document.body.innerHTML = '<div id=":r12:">x</div>'
    const c = targetCandidates(document.querySelector('div') as Element)
    expect(c.find((x) => x.value.startsWith('#'))?.robustness).toBe('low')
  })
})

describe('helpers', () => {
  it('detects generated ids and hashed classes', () => {
    expect(looksGenerated(':r1:')).toBe(true)
    expect(looksGenerated('ember1234')).toBe(true)
    expect(looksGenerated('checkout')).toBe(false)
    expect(looksHashed('css-1a2b3c')).toBe(true)
    expect(looksHashed('Button_root__a1b2c')).toBe(true)
    expect(looksHashed('btn-primary')).toBe(false)
  })

  it('builds a structural path that stops at a stable id', () => {
    document.body.innerHTML = '<div id="app"><p>x</p><p><span>y</span></p></div>'
    expect(structuralPath(document.querySelector('span') as Element)).toBe(
      '#app > p:nth-of-type(2) > span',
    )
  })

  it('suggests a name from label or text', () => {
    document.body.innerHTML =
      '<button aria-label="Create new invoice now please">+</button><a>Billing &amp; plans</a>'
    expect(suggestName(document.querySelector('button') as Element)).toBe('create-new-invoice')
    expect(suggestName(document.querySelector('a') as Element)).toBe('billing-plans')
  })
})
