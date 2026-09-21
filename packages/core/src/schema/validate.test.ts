import { describe, expect, it } from 'vitest'
import { defineTour } from '../define'
import { formatIssues, isValidTour, validateTheme, validateTour } from './validate'

const valid = defineTour({
  id: 'welcome',
  trigger: { type: 'route', pattern: '/app/**', delay: 500 },
  conditions: [
    { type: 'all', conditions: [{ type: 'trait', key: 'plan', op: 'eq', value: 'trial' }] },
  ],
  options: {
    theme: 'dark',
    appearance: 'auto',
    arrow: 'curve',
    spotlight: { shape: 'pill', ring: 'pulse', padding: 8 },
    overlay: { style: 'blur', opacity: 0.5 },
  },
  steps: [
    { id: 'intro', title: 'Welcome' },
    {
      id: 'save',
      target: { name: 'save', selectors: ['#save'], nth: 0 },
      advance: { on: 'click' },
      arrow: 'pin',
    },
    { id: 'wait', target: '#late', onMissing: 'wait', waitFor: 4000 },
  ],
})

describe('validateTour', () => {
  it('accepts a tour that uses the whole schema', () => {
    expect(validateTour(valid)).toEqual([])
    expect(isValidTour(valid)).toBe(true)
  })

  it('names the value that was probably meant', () => {
    const issues = validateTour({ ...valid, steps: [{ id: 'a', arrow: 'curvy' }] })
    expect(issues).toEqual([
      {
        level: 'error',
        path: 'steps[0].arrow',
        message: expect.stringContaining('"curvy" is not one of: caret, none'),
        suggestion: 'curve',
      },
    ])
  })

  it('reports missing required fields, wrong types and bad ranges', () => {
    const issues = validateTour({
      id: 'x',
      steps: [
        { title: 'No id' },
        { id: 'b', title: 7 },
        { id: 'c', overlay: { opacity: 4 } },
        { id: 'd', advance: { on: 'delay' } },
      ],
    })
    expect(issues.map((i) => `${i.path}: ${i.message}`)).toEqual([
      'steps[0].id: Required field is missing.',
      'steps[1].title: Expected a string, found 7.',
      'steps[2].overlay.opacity: 4 is above the maximum 1.',
      'steps[3].advance.ms: Required field is missing.',
    ])
  })

  it('flags an unknown discriminator and an unknown field', () => {
    const issues = validateTour({
      id: 'x',
      steps: [{ id: 'a', titel: 'typo', advance: { on: 'clicked' } }],
    })
    expect(issues).toContainEqual({
      level: 'error',
      path: 'steps[0].advance.on',
      message: expect.stringContaining('"clicked" is not one of: click, input'),
      suggestion: 'click',
    })
    expect(issues).toContainEqual({
      level: 'warning',
      path: 'steps[0].titel',
      message: 'Unknown field, which Docent will ignore.',
      suggestion: 'title',
    })
    expect(
      validateTour({ id: 'x', steps: [{ id: 'a', titel: 'x' }] }, { unknownFields: false }),
    ).toEqual([])
  })

  it('catches duplicate step ids and deprecated tokens', () => {
    const issues = validateTour({
      id: 'x',
      steps: [{ id: 'a' }, { id: 'a' }],
      options: { theme: { overlayOpacity: 0.4 } },
    })
    expect(issues).toContainEqual({
      level: 'error',
      path: 'steps[1].id',
      message: 'Duplicate step id "a". Ids must be unique within a tour.',
    })
    expect(issues).toContainEqual({
      level: 'warning',
      path: 'options.theme.overlayOpacity',
      message: 'Prefer `overlay.opacity`, next to the other scrim settings.',
    })
  })

  it('accepts both forms of a target and a theme', () => {
    expect(validateTour({ id: 'x', steps: [{ id: 'a', target: '#css' }] })).toEqual([])
    expect(validateTour({ id: 'x', steps: [], options: { theme: 'minimal' } })).toEqual([])
    expect(
      validateTour({ id: 'x', steps: [], options: { theme: { preset: 'dark', accent: '#111' } } }),
    ).toEqual([])
    const bad = validateTour({ id: 'x', steps: [], options: { theme: 'darkk' } })
    expect(bad[0]?.suggestion).toBe('dark')
  })

  it('formats issues for a console warning', () => {
    const issues = validateTour({ id: 'x', steps: [{ id: 'a', arrow: 'curvy' }] })
    expect(formatIssues(issues)).toBe(
      '✗ steps[0].arrow: "curvy" is not one of: caret, none, line, dashed, dotted, curve, curve-dashed, squiggle, loop, elbow, sketch, pin. Did you mean "curve"?',
    )
  })
})

describe('validateTheme', () => {
  it('accepts a theme made only of known fields', () => {
    const theme = {
      name: 'Ledger',
      theme: { accent: '#0d9488', radius: 12, padding: '18px' },
      eyebrow: '{tour}',
      progress: 'ticks',
      count: '{current2} / {total2}',
      arrow: 'curve',
      spotlight: { ring: 'glow', padding: 6 },
      overlay: { style: 'none' },
      css: '.title { font-size: 20px }',
    }
    expect(validateTheme(theme)).toEqual([])
  })

  it('says what was probably meant', () => {
    const issues = validateTheme({ progress: 'tick', arrow: 'curvy' })
    expect(issues.map((i) => [i.path, i.suggestion])).toEqual([
      ['progress', 'ticks'],
      ['arrow', 'curve'],
    ])
  })

  it('catches a misspelled field and a token of the wrong kind', () => {
    const issues = validateTheme({ eyebrw: '{tour}', theme: { radius: true } })
    expect(issues.some((i) => i.path === 'eyebrw')).toBe(true)
    expect(issues.some((i) => i.path === 'theme.radius' && i.level === 'error')).toBe(true)
  })

  it('flags CSS that loads from elsewhere, without refusing it', () => {
    const issues = validateTheme({ css: '@import url(https://example.com/x.css);' })
    expect(issues).toEqual([expect.objectContaining({ level: 'warning', path: 'css' })])
  })
})
