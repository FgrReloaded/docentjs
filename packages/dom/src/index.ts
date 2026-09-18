/**
 * @docentjs/dom
 *
 * Web renderer for Docent: overlay, spotlight, popover, positioning.
 */

// Re-exported so browser users need a single import.
export { defineTour } from '@docentjs/core'
export { isSafeUrl, renderBody, renderMedia } from './content'
export { type CreateTourOptions, createTour, DomTourController } from './create'
export { holePath, Overlay } from './overlay'
export { buildPopover, DEFAULT_LABELS, formatProgress } from './popover'
export {
  availableSpace,
  centerPosition,
  computePosition,
  inflate,
  type PositionInput,
  type PositionResult,
  parsePlacement,
  type Rect,
  type Size,
} from './position'
export { DomRenderer, type DomRendererOptions } from './renderer'
export { createLocalStorage } from './storage'
export {
  candidateSelectors,
  NAME_ATTRIBUTE,
  type QueryRoot,
  queryAllDeep,
  resolveTarget,
  toSpec,
  waitForTarget,
} from './target'
