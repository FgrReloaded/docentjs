import { describe, expect, it } from 'vitest'
import * as pkg from './index'
import * as themes from './themes'

describe('pass-through exports', () => {
  it('offers defineTour and the storage helper so one install is enough', () => {
    expect(typeof pkg.defineTour).toBe('function')
    expect(typeof pkg.createLocalStorage).toBe('function')
    expect(pkg.defineTour({ id: 't', steps: [] }).schemaVersion).toBe(1)
  })

  it('re-exports the theme presets', () => {
    expect(Object.keys(themes.presets).sort()).toEqual(['contrast', 'dark', 'light', 'minimal'])
  })
})
