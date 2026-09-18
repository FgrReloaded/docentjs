// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { applyTheme, mergeThemes, THEME_VARS } from './theme'
import { presets } from './themes'

describe('applyTheme', () => {
  it('writes tokens as custom properties and clears unset ones', () => {
    const el = document.createElement('div')
    applyTheme(el, { accent: 'red', radius: '4px' })
    expect(el.style.getPropertyValue('--docent-accent')).toBe('red')
    expect(el.style.getPropertyValue('--docent-radius')).toBe('4px')
    applyTheme(el, { accent: 'blue' })
    expect(el.style.getPropertyValue('--docent-accent')).toBe('blue')
    expect(el.style.getPropertyValue('--docent-radius')).toBe('')
    applyTheme(el, undefined)
    expect(el.style.getPropertyValue('--docent-accent')).toBe('')
  })

  it('maps every token to a distinct variable', () => {
    const vars = Object.values(THEME_VARS)
    expect(new Set(vars).size).toBe(vars.length)
  })
})

describe('mergeThemes', () => {
  it('layers later themes over earlier ones and skips undefined', () => {
    expect(mergeThemes({ accent: 'a', radius: '1px' }, undefined, { accent: 'b' })).toEqual({
      accent: 'b',
      radius: '1px',
    })
  })
})

describe('presets', () => {
  it('only use known tokens', () => {
    for (const theme of Object.values(presets)) {
      for (const key of Object.keys(theme)) expect(THEME_VARS).toHaveProperty(key)
    }
  })
})
