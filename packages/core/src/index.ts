/**
 * @docentjs/core
 *
 * Platform-agnostic tour engine: schema, state machine, triggers, persistence, events.
 * No DOM access.
 */

export { defineTour } from './define'
export * from './engine'
export type { StepContext, StepHooks, TourHooks } from './hooks'
export * from './manager'
export {
  type Advance,
  type Alignment,
  type ArrowStyle,
  type Condition,
  type Frequency,
  type Interaction,
  type Labels,
  type Media,
  type OnMissing,
  type OverlayOptions,
  type OverlayStyle,
  type Placement,
  SCHEMA_VERSION,
  type SchemaVersion,
  type ScrollOptions,
  type Side,
  type SpotlightOptions,
  type SpotlightRing,
  type SpotlightShape,
  type Step,
  type StepButtons,
  type Target,
  type TargetSpec,
  type Theme,
  type Tour,
  type TourOptions,
  type TourProgressState,
  type TraitOperator,
  type TraitValue,
  type Trigger,
} from './schema/tour'
export {
  ANONYMOUS_IDENTITY,
  type DocentEvent,
  type DocentEventType,
  type EventSink,
  type Identity,
  type MaybePromise,
  type StorageAdapter,
  type TourSource,
} from './seams'
