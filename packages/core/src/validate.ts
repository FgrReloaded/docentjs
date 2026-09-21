/**
 * Checking tours. A separate entry point (`@docentjs/core/validate`) so the
 * runtime never carries it: the browser packages load it only in development.
 */

export { SCHEMA_ID, tourJsonSchema } from './schema/json-schema'
export {
  ARROW_STYLES,
  OVERLAY_STYLES,
  PLACEMENTS,
  SPOTLIGHT_RINGS,
  SPOTLIGHT_SHAPES,
  THEME_NAMES,
  TOUR_STATES,
  TRAIT_OPERATORS,
} from './schema/spec'
export {
  formatIssues,
  type IssueLevel,
  isValidTour,
  nearest,
  type TourIssue,
  type ValidateOptions,
  validateTheme,
  validateTour,
} from './schema/validate'
