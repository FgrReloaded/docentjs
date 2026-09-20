import { describe, expect, it } from 'vitest'

/** The schema is plain JSON, so reading into it needs loose typing. */
// biome-ignore lint/suspicious/noExplicitAny: walking a generated JSON document in a test
type Json = Record<string, any>

import { tourJsonSchema } from './json-schema'

describe('tour JSON Schema', () => {
  it('describes the tour and keeps every enum in one place', () => {
    const schema = tourJsonSchema() as Json
    expect(schema.required).toEqual(['id', 'steps'])
    expect(schema.properties.steps.items.$ref).toBe('#/$defs/step')
    expect(schema.$defs.step.properties.arrow.enum).toContain('curve')
    expect(schema.$defs.condition.anyOf[4].properties.conditions.items.$ref).toBe(
      '#/$defs/condition',
    )
  })

  it('marks deprecated tokens and carries their advice', () => {
    const theme = tourJsonSchema().$defs as Json
    expect(theme.theme.properties.overlayOpacity.deprecated).toBe(true)
    expect(theme.theme.properties.overlayOpacity.description).toContain('options.overlay.opacity')
  })
})
