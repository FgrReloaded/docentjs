// @vitest-environment jsdom
import { createMemoryStorage, defineTour } from '@docentjs/core'
import { createDocent } from '@docentjs/dom'
import { afterEach, describe, expect, it } from 'vitest'
import { auditTours } from './audit'
import { contrastRatio } from './contrast'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('auditTours', () => {
  it('reports the classic mistakes with severities', async () => {
    document.body.innerHTML = '<button data-docent="here">x</button>'
    const tours = [
      defineTour({
        id: 't',
        trigger: { type: 'auto' },
        options: { frequency: 'always', theme: { foreground: '#999999', background: '#aaaaaa' } },
        conditions: [
          { type: 'custom', name: 'nope' },
          { type: 'tour', id: 'ghost', state: 'completed' },
        ],
        steps: [
          { id: 'a', target: { name: 'here' }, title: 'ok' },
          { id: 'a', target: '#missing', title: 'dup' },
          { id: 'c', target: 'main > div:nth-of-type(2) > span', body: 'x'.repeat(260) },
          {
            id: 'd',
            title: 'blocked',
            target: { name: 'here' },
            advance: { on: 'click' },
            interaction: 'block',
          },
          { id: 'e' },
        ],
      }),
    ]
    const docent = createDocent({ tours, storage: createMemoryStorage(), connect: false })
    await docent.ready
    const issues = auditTours(docent, tours).map(
      (i) => `${i.severity}|${i.stepId ?? '-'}|${i.message}`,
    )
    expect(issues).toEqual(
      expect.arrayContaining([
        'error|a|id: Duplicate step id "a". Ids must be unique within a tour.',
        'error|d|Advances on click, but interaction is blocked.',
        'error|-|Custom condition "nope" is not registered.',
        'warning|-|Condition refers to unknown tour "ghost".',
        'warning|a|Target is not on this page.',
        'warning|c|Target relies on a structural selector.',
        'info|c|Body is 260 characters.',
        'warning|e|Step has no title or body.',
        'info|-|Shows on every page load (auto trigger, frequency always).',
        'error|-|Text contrast is 1.23:1 (needs 4.5:1).',
      ]),
    )
    expect(issues[0]?.startsWith('error')).toBe(true)
  })

  it('treats a target on another route as info', async () => {
    const tours = [
      defineTour({ id: 'r', steps: [{ id: 's', title: 'x', target: '#x', route: '/billing' }] }),
    ]
    const docent = createDocent({ tours, storage: createMemoryStorage(), connect: false })
    await docent.ready
    expect(auditTours(docent, tours).find((i) => i.stepId === 's')).toMatchObject({
      severity: 'info',
      message: 'Target is on /billing, not this page.',
    })
  })
})

describe('contrastRatio', () => {
  it('computes WCAG ratios for hex colors', () => {
    expect(contrastRatio('#000000', '#ffffff')?.toFixed(1)).toBe('21.0')
    expect(contrastRatio('#777777', '#ffffff')?.toFixed(2)).toBe('4.48')
  })
})
