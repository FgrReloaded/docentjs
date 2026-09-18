import { SCHEMA_VERSION, type Tour } from './schema/tour'

/**
 * Identity helper that gives hand-written tours full type inference and
 * fills in the schema version. Returns the same object.
 */
export function defineTour(tour: Omit<Tour, 'schemaVersion'> & { schemaVersion?: never }): Tour {
  return { schemaVersion: SCHEMA_VERSION, ...tour }
}
