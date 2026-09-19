/**
 * @docentjs/dom
 *
 * Web renderer for Docent: overlay, spotlight, popover, positioning.
 */

// Re-exported so browser users need a single import.
export { defineTour } from '@docentjs/core'
export { arrowGap, CONNECTOR_STYLES, type ConnectorStyle, isConnector } from './arrows'
export { isSafeUrl, renderBody, renderMedia } from './content'
export { type CreateTourOptions, createTour, DomTourController } from './create'
export { type CreateDocentOptions, createDocent } from './docent'
export { createDomEnvironment } from './environment'
export { findOccluder, type Occluder, uncover } from './occlusion'
export { holePath, Overlay } from './overlay'
export {
  buildHeadlessShell,
  buildPopover,
  DEFAULT_LABELS,
  formatProgress,
  resolveSlots,
} from './popover'
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
export {
  applyTheme,
  type HeadlessPopover,
  mergeThemes,
  type PopoverSlots,
  type PopoverTemplate,
  type SlotContent,
  type SlotName,
  type SlotRenderer,
  THEME_VARS,
} from './theme'
