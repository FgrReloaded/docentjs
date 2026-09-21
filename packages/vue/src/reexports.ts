/**
 * Everything a vue app needs from the lower-level packages, so one install and
 * one import source is enough. Nothing here adds code: these are pass-through
 * exports of @docentjs/core and @docentjs/dom.
 */

export {
  type Advance,
  type Condition,
  type DocentEvent,
  type DocentEventType,
  type DocentState,
  defineTour,
  type EngineState,
  type EventSink,
  type Identity,
  type Labels,
  type Placement,
  type RenderActions,
  type RenderContext,
  type Step,
  type StepContext,
  type StepHooks,
  type StorageAdapter,
  type Target,
  type TargetSpec,
  type Theme,
  type Tour,
  type Tour as TourDefinition,
  type TourHooks,
  type TourOptions,
  type TourSource,
  type TourStatus,
  type TraitValue,
  type Trigger,
} from '@docentjs/core'
export {
  createLocalStorage,
  type DocentTheme,
  type DomRendererOptions,
  type HeadlessPopover,
  type PopoverSlots,
  type PopoverTemplate,
  type SlotContent,
  type SlotName,
  type SlotRenderer,
} from '@docentjs/dom'
