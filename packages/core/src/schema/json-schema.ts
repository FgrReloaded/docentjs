/**
 * The tour schema as JSON Schema, generated from the same spec the validator
 * walks. The docs site serves it, so editors can complete and check
 * `.tour.json` files, and tools that write tours have something to check against.
 */

import type { Spec, SpecName } from './spec'
import { SPECS } from './spec'

export const SCHEMA_ID = 'https://docentjs.dev/schema/tour-v1.json'

type Json = Record<string, unknown>

/** The whole schema document, ready to write to a file. */
export function tourJsonSchema(): Json {
  const definitions: Json = {}
  for (const name of Object.keys(SPECS) as SpecName[]) {
    if (name === 'tour') continue
    definitions[name] = convert(SPECS[name])
  }
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: SCHEMA_ID,
    title: 'Docent tour',
    description: 'A guided product tour. See https://docentjs.dev/reference/schema/.',
    ...convert(SPECS.tour),
    $defs: definitions,
  }
}

function convert(spec: Spec): Json {
  const doc = spec.doc ? { description: spec.doc } : {}
  switch (spec.kind) {
    case 'ref':
      return { $ref: `#/$defs/${spec.name}`, ...doc }
    case 'any':
      return { ...doc }
    case 'string':
      return { type: 'string', ...doc }
    case 'boolean':
      return { type: 'boolean', ...doc }
    case 'number':
      return {
        type: 'number',
        ...(spec.min === undefined ? {} : { minimum: spec.min }),
        ...(spec.max === undefined ? {} : { maximum: spec.max }),
        ...doc,
      }
    case 'enum':
      return { enum: [...spec.values], ...doc }
    case 'array':
      return { type: 'array', items: convert(spec.items), ...doc }
    case 'record':
      return { type: 'object', additionalProperties: convert(spec.values), ...doc }
    case 'union':
      return { anyOf: spec.of.map(convert), ...doc }
    case 'object': {
      const properties: Json = {}
      const requiredKeys: string[] = []
      for (const [key, field] of Object.entries(spec.fields)) {
        const description = field.deprecated
          ? `${field.doc ? `${field.doc} ` : ''}${field.deprecated}`
          : field.doc
        properties[key] = {
          ...convert(field.spec),
          ...(description ? { description } : {}),
          ...(field.deprecated ? { deprecated: true } : {}),
        }
        if (field.required) requiredKeys.push(key)
      }
      return {
        type: 'object',
        properties,
        ...(requiredKeys.length > 0 ? { required: requiredKeys } : {}),
        ...doc,
      }
    }
  }
}
