/**
 * Tour schema — the JSON contract shared by the core engine, every renderer,
 * the visual builder and the hosted service.
 *
 * Everything in this file must stay JSON-serialisable. Functions (hooks) live
 * in `hooks.ts` and are attached at runtime, keyed by step id.
 */

/** Current schema version. Bump only on breaking changes to this file. */
export const SCHEMA_VERSION = 1 as const

export type SchemaVersion = typeof SCHEMA_VERSION

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------

/**
 * Where a step points.
 *
 * - A bare string is a CSS selector (web only). Convenient for hand-written tours.
 * - A {@link TargetSpec} is the portable, self-healing form the builder produces.
 *
 * Prefer `{ name }` over raw selectors: on the web it resolves to
 * `[data-docent="<name>"]`, on native to a `testID`, so one tour works everywhere.
 */
export type Target = string | TargetSpec

export interface TargetSpec {
  /**
   * Logical name. Web: `[data-docent="<name>"]`. Native: `testID` / `nativeID`.
   * The most robust anchor; survives refactors and works cross-platform.
   */
  name?: string
  /**
   * Ordered CSS selector fallbacks (web only). Tried in order until one matches.
   * The builder fills several so a tour keeps working after markup changes.
   */
  selectors?: string[]
  /** Explicit native identifier when it differs from `name`. */
  native?: string
  /** Restrict the search to a container matched by this selector. */
  within?: string
  /** When a selector matches several elements, pick this index (default 0). */
  nth?: number
}

// ---------------------------------------------------------------------------
// Placement & visuals
// ---------------------------------------------------------------------------

export type Side = 'top' | 'right' | 'bottom' | 'left'
export type Alignment = 'start' | 'center' | 'end'

/**
 * Preferred popover position relative to the target. `auto` lets the renderer
 * pick the side with the most room. Any placement flips or shifts when it
 * would overflow the viewport.
 */
export type Placement = 'auto' | Side | `${Side}-${Exclude<Alignment, 'center'>}`

/**
 * What connects the popover to its target.
 * - `caret` (default): a small notch on the popover's edge.
 * - `none`: nothing.
 * - Connectors, drawn from the popover to the target: `line`, `dashed`,
 *   `dotted`, `curve`, `curve-dashed`, `squiggle`, `loop`, `elbow`, `sketch`
 *   (hand-drawn double stroke) and `pin` (dotted line ending in a dot).
 */
export type ArrowStyle =
  | 'caret'
  | 'none'
  | 'line'
  | 'dashed'
  | 'dotted'
  | 'curve'
  | 'curve-dashed'
  | 'squiggle'
  | 'loop'
  | 'elbow'
  | 'sketch'
  | 'pin'

/** Shape of the cutout around the target. `circle` circumscribes the target. */
export type SpotlightShape = 'rounded' | 'rect' | 'pill' | 'circle'

/** Outline drawn around the cutout. `pulse` gently repeats to draw the eye. */
export type SpotlightRing = 'hairline' | 'none' | 'glow' | 'pulse' | 'dashed' | 'solid'

/**
 * How the rest of the page is treated.
 * - `dim` (default): a tinted scrim.
 * - `blur`: scrim plus a soft blur of the page.
 * - `vignette`: clear near the target, darker toward the edges.
 * - `none`: no scrim and the page stays usable (hint-style tours).
 */
export type OverlayStyle = 'dim' | 'blur' | 'vignette' | 'none'

export interface SpotlightOptions {
  /** Space between the target's edge and the cutout, in px. */
  padding?: number
  /** Corner radius of the cutout, in px (for `rounded`). */
  radius?: number
  /** Animate the cutout moving between targets. */
  animate?: boolean
  shape?: SpotlightShape
  ring?: SpotlightRing
}

export interface OverlayOptions {
  style?: OverlayStyle
  /** Backdrop colour, any CSS colour. */
  color?: string
  /** Backdrop opacity, 0–1. */
  opacity?: number
  /** Blur radius for the `blur` style, in px. */
  blur?: number
}

export interface ScrollOptions {
  /** Scroll the target into view before showing the step. */
  enabled?: boolean
  behavior?: 'auto' | 'smooth'
  block?: 'start' | 'center' | 'end' | 'nearest'
}

export interface Media {
  type: 'image' | 'video'
  src: string
  alt?: string
}

// ---------------------------------------------------------------------------
// Behaviour
// ---------------------------------------------------------------------------

/**
 * How a step completes.
 *
 * - `'button'` (default): the user presses Next.
 * - `click` / `input`: the user interacts with the target (or another element).
 * - `event`: a named event is emitted through the runtime.
 * - `element`: an element appears (e.g. a menu the user was asked to open).
 * - `delay`: automatically after `ms`.
 */
export type Advance =
  | 'button'
  | { on: 'click'; target?: Target }
  | { on: 'input'; target?: Target; match?: string }
  | { on: 'event'; name: string }
  | { on: 'element'; target: Target }
  | { on: 'delay'; ms: number }

/** Whether the user can interact with the spotlighted target. */
export type Interaction = 'block' | 'allow'

/** What to do when a step's target cannot be found. */
export type OnMissing = 'skip' | 'wait' | 'abort'

export interface StepButtons {
  back?: boolean
  next?: boolean
  skip?: boolean
  close?: boolean
}

// ---------------------------------------------------------------------------
// Conditions & triggers
// ---------------------------------------------------------------------------

export type TraitValue = string | number | boolean | null | string[]

export type TraitOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'exists'
  | 'missing'

/**
 * Serialisable predicate evaluated by the core at runtime.
 * `custom` predicates are registered by name on the runtime.
 */
export type Condition =
  | { type: 'trait'; key: string; op: TraitOperator; value?: TraitValue }
  | { type: 'route'; pattern: string }
  | { type: 'element'; target: Target; exists?: boolean }
  | { type: 'tour'; id: string; state: TourProgressState }
  | { type: 'all'; conditions: Condition[] }
  | { type: 'any'; conditions: Condition[] }
  | { type: 'not'; condition: Condition }
  | { type: 'custom'; name: string; args?: Record<string, TraitValue> }

export type TourProgressState = 'not-started' | 'in-progress' | 'completed' | 'skipped'

/** What starts a tour. `manual` means only through the runtime API. */
export type Trigger =
  | { type: 'manual' }
  | { type: 'auto'; delay?: number }
  | { type: 'route'; pattern: string; delay?: number }
  | { type: 'element'; target: Target; delay?: number }
  | { type: 'event'; name: string }

/**
 * How often an eligible user sees the tour.
 * - `once`: show once per {@link Tour.version}, however it ended.
 * - `until-completed`: keep offering it until the user finishes it.
 * - `always`: every time the trigger fires.
 */
export type Frequency = 'once' | 'until-completed' | 'always'

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

/**
 * Visual tokens, serialisable so a builder or customizer can produce them.
 * Each maps to a CSS custom property in the renderer (`--docent-*`).
 * Values are CSS strings, e.g. `'#111'`, `'12px'`, `'0 4px 12px rgba(0,0,0,.2)'`.
 */
export interface Theme {
  /** Color of drawn connectors (arrow styles other than caret). */
  connector?: string
  /** Color of the spotlight ring. */
  ring?: string
  background?: string
  foreground?: string
  muted?: string
  accent?: string
  accentForeground?: string
  radius?: string
  shadow?: string
  font?: string
  width?: string
  overlay?: string
  overlayOpacity?: string
  duration?: string
  zIndex?: string
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export interface Labels {
  next?: string
  back?: string
  skip?: string
  done?: string
  close?: string
  /** Supports `{current}` and `{total}` placeholders. */
  progress?: string
}

// ---------------------------------------------------------------------------
// Step
// ---------------------------------------------------------------------------

export interface Step {
  /** Unique within the tour. Used for persistence, hooks and analytics. */
  id: string
  /** Omit for a centred modal step (welcome / finish screens). */
  target?: Target
  title?: string
  body?: string
  /** How `body` is interpreted. Renderers never inject raw HTML. */
  format?: 'text' | 'markdown'
  media?: Media
  placement?: Placement
  /** Per-step override of the tour's arrow style. */
  arrow?: ArrowStyle
  /** Per-step override of the tour's spotlight options. */
  spotlight?: SpotlightOptions
  /** Per-step override of the tour's overlay options. */
  overlay?: OverlayOptions
  advance?: Advance
  interaction?: Interaction
  /** Skip this step when the condition is false. */
  condition?: Condition
  onMissing?: OnMissing
  /** How long to wait for the target when `onMissing` is `wait`, in ms. */
  waitFor?: number
  /** URL pattern this step belongs to. Enables multi-page tours. */
  route?: string
  buttons?: StepButtons
  scroll?: ScrollOptions
  /** Free-form extension bag for the builder or integrations. */
  meta?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Tour
// ---------------------------------------------------------------------------

export interface TourOptions {
  /** Persist progress so the tour survives navigation and reloads. */
  persist?: boolean
  frequency?: Frequency
  showProgress?: boolean
  /** Allow closing with Escape or the close button. */
  allowClose?: boolean
  closeOnOverlayClick?: boolean
  keyboard?: boolean
  arrow?: ArrowStyle
  spotlight?: SpotlightOptions
  overlay?: OverlayOptions
  scroll?: ScrollOptions
  labels?: Labels
  /** Visual tokens applied on top of the renderer's theme. */
  theme?: Theme
  /** Name of a template registered on the renderer (slots, css, theme). */
  template?: string
}

export interface Tour {
  schemaVersion: SchemaVersion
  /** Stable identifier. Used for persistence, targeting and analytics. */
  id: string
  /** Bump to re-show the tour to users who already saw an older version. */
  version?: number
  /** Human-readable name, mainly for the builder and dashboards. */
  name?: string
  description?: string
  steps: Step[]
  trigger?: Trigger
  /** All must hold for the tour to be eligible. */
  conditions?: Condition[]
  options?: TourOptions
  /** Free-form extension bag for the builder or integrations. */
  meta?: Record<string, unknown>
}
