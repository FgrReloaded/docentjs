import { describe, expect, expectTypeOf, it } from 'vitest'
import { defineTour } from './define'
import { advancedTour } from './fixtures/advanced'
import { basicTour } from './fixtures/basic'
import { SCHEMA_VERSION, type Step, type Tour } from './schema/tour'

const fixtures: Tour[] = [basicTour, advancedTour]

describe('schema', () => {
  it('pins the current schema version', () => {
    expect(SCHEMA_VERSION).toBe(1)
  })

  it('fixtures are valid Tour objects', () => {
    expectTypeOf(basicTour).toEqualTypeOf<Tour>()
    expectTypeOf(advancedTour).toEqualTypeOf<Tour>()
    expectTypeOf(basicTour.steps[0]).toEqualTypeOf<Step | undefined>()
  })

  it.each(fixtures)('$id has unique step ids', (tour) => {
    const ids = tour.steps.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(fixtures)('$id survives a JSON round trip', (tour) => {
    expect(JSON.parse(JSON.stringify(tour))).toEqual(tour)
  })
})

describe('defineTour', () => {
  it('stamps the schema version and keeps everything else', () => {
    const tour = defineTour({ id: 't', steps: [{ id: 's' }] })
    expect(tour).toEqual({ schemaVersion: 1, id: 't', steps: [{ id: 's' }] })
  })

  it('accepts a step without a target as a modal step', () => {
    const tour = defineTour({ id: 't', steps: [{ id: 'welcome', title: 'Hi' }] })
    expect(tour.steps[0]?.target).toBeUndefined()
  })
})
