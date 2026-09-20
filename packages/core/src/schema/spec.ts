/**
 * A description of the tour schema as data.
 *
 * The types in `tour.ts` are the contract for TypeScript users; this is the
 * same contract in a form code can walk, so one source drives both
 * `validateTour` and the published JSON Schema. Keep the two in step: a test
 * checks the generated schema against the file the docs site serves.
 */

/** Named specs that `{ kind: 'ref' }` can point at, so conditions can nest. */
export type SpecName = 'tour' | 'step' | 'target' | 'advance' | 'trigger' | 'condition' | 'theme'

export type Spec =
  | { kind: 'string'; doc?: string }
  | { kind: 'number'; min?: number; max?: number; doc?: string }
  | { kind: 'boolean'; doc?: string }
  | { kind: 'enum'; values: readonly string[]; doc?: string }
  /** Anything JSON: extension bags and trait values. */
  | { kind: 'any'; doc?: string }
  | { kind: 'array'; items: Spec; doc?: string }
  | { kind: 'record'; values: Spec; doc?: string }
  | { kind: 'object'; fields: Fields; doc?: string }
  | { kind: 'union'; of: readonly Spec[]; by?: string; doc?: string }
  | { kind: 'ref'; name: SpecName; doc?: string }

export interface Field {
  spec: Spec
  required?: boolean
  doc?: string
  /** Set when a field still works but something else is preferred. */
  deprecated?: string
}

export type Fields = Record<string, Field>

const field = (spec: Spec, doc?: string, extra: Partial<Field> = {}): Field => ({
  spec,
  ...(doc === undefined ? {} : { doc }),
  ...extra,
})
const required = (spec: Spec, doc?: string): Field => field(spec, doc, { required: true })
const ref = (name: SpecName): Spec => ({ kind: 'ref', name })
const str: Spec = { kind: 'string' }
const num: Spec = { kind: 'number' }
const bool: Spec = { kind: 'boolean' }
const enums = (...values: string[]): Spec => ({ kind: 'enum', values })
/** A size, time or opacity token: a CSS string, or a number in the token's unit. */
const themeValue: Spec = { kind: 'union', of: [str, num] }

export const ARROW_STYLES = [
  'caret',
  'none',
  'line',
  'dashed',
  'dotted',
  'curve',
  'curve-dashed',
  'squiggle',
  'loop',
  'elbow',
  'sketch',
  'pin',
] as const
export const SPOTLIGHT_SHAPES = ['rounded', 'rect', 'pill', 'circle'] as const
export const SPOTLIGHT_RINGS = ['hairline', 'none', 'glow', 'pulse', 'dashed', 'solid'] as const
export const OVERLAY_STYLES = ['dim', 'blur', 'vignette', 'none'] as const
export const THEME_NAMES = ['light', 'dark', 'minimal', 'contrast'] as const
export const PLACEMENTS = [
  'auto',
  'top',
  'right',
  'bottom',
  'left',
  'top-start',
  'top-end',
  'right-start',
  'right-end',
  'bottom-start',
  'bottom-end',
  'left-start',
  'left-end',
] as const
export const TRAIT_OPERATORS = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'nin',
  'contains',
  'exists',
  'missing',
] as const
export const TOUR_STATES = ['not-started', 'in-progress', 'completed', 'skipped'] as const

const target: Spec = {
  kind: 'union',
  of: [
    { kind: 'string', doc: 'A CSS selector.' },
    {
      kind: 'object',
      fields: {
        name: field(str, 'Logical name, matching `data-docent="<name>"`. The sturdiest anchor.'),
        selectors: field({ kind: 'array', items: str }, 'CSS fallbacks, tried in order.'),
        native: field(str, 'Native identifier, when it differs from the name.'),
        within: field(str, 'Selector of a container to search inside.'),
        nth: field(num, 'Which match to use, counting from 0.'),
      },
    },
  ],
}

const advance: Spec = {
  kind: 'union',
  by: 'on',
  of: [
    { kind: 'enum', values: ['button'], doc: 'The reader presses Next (the default).' },
    {
      kind: 'object',
      doc: 'The reader clicks the target.',
      fields: { on: required(enums('click')), target: field(ref('target')) },
    },
    {
      kind: 'object',
      doc: 'What the reader types matches a regular expression.',
      fields: {
        on: required(enums('input')),
        target: field(ref('target')),
        match: field(str, 'Regular expression the value must match.'),
      },
    },
    {
      kind: 'object',
      doc: 'Your code reports a named event.',
      fields: { on: required(enums('event')), name: required(str) },
    },
    {
      kind: 'object',
      doc: 'An element appears on the page.',
      fields: { on: required(enums('element')), target: required(ref('target')) },
    },
    {
      kind: 'object',
      doc: 'After a delay.',
      fields: { on: required(enums('delay')), ms: required({ kind: 'number', min: 0 }) },
    },
  ],
}

const trigger: Spec = {
  kind: 'union',
  by: 'type',
  of: [
    { kind: 'object', doc: 'Only starts from code.', fields: { type: required(enums('manual')) } },
    {
      kind: 'object',
      doc: 'When the page loads.',
      fields: { type: required(enums('auto')), delay: field({ kind: 'number', min: 0 }) },
    },
    {
      kind: 'object',
      doc: 'On a matching path.',
      fields: {
        type: required(enums('route')),
        pattern: required(str, 'Path pattern, such as `/invoices/**`.'),
        delay: field({ kind: 'number', min: 0 }),
      },
    },
    {
      kind: 'object',
      doc: 'When an element appears.',
      fields: {
        type: required(enums('element')),
        target: required(ref('target')),
        delay: field({ kind: 'number', min: 0 }),
      },
    },
    {
      kind: 'object',
      doc: 'When your code reports an event.',
      fields: { type: required(enums('event')), name: required(str) },
    },
  ],
}

const traitValue: Spec = {
  kind: 'union',
  of: [str, num, bool, { kind: 'array', items: str }],
}

const condition: Spec = {
  kind: 'union',
  by: 'type',
  of: [
    {
      kind: 'object',
      doc: "Compare one of the user's traits.",
      fields: {
        type: required(enums('trait')),
        key: required(str),
        op: required({ kind: 'enum', values: TRAIT_OPERATORS }),
        value: field(traitValue),
      },
    },
    {
      kind: 'object',
      doc: 'The current path matches.',
      fields: { type: required(enums('route')), pattern: required(str) },
    },
    {
      kind: 'object',
      doc: 'An element is, or is not, on the page.',
      fields: {
        type: required(enums('element')),
        target: required(ref('target')),
        exists: field(bool, 'Set false to require the element to be absent.'),
      },
    },
    {
      kind: 'object',
      doc: "Another tour's progress for this user.",
      fields: {
        type: required(enums('tour')),
        id: required(str),
        state: required({ kind: 'enum', values: TOUR_STATES }),
      },
    },
    {
      kind: 'object',
      doc: 'Every condition holds.',
      fields: {
        type: required(enums('all')),
        conditions: required({ kind: 'array', items: ref('condition') }),
      },
    },
    {
      kind: 'object',
      doc: 'At least one condition holds.',
      fields: {
        type: required(enums('any')),
        conditions: required({ kind: 'array', items: ref('condition') }),
      },
    },
    {
      kind: 'object',
      doc: 'The inner condition does not hold.',
      fields: { type: required(enums('not')), condition: required(ref('condition')) },
    },
    {
      kind: 'object',
      doc: 'A predicate your app registered by name.',
      fields: {
        type: required(enums('custom')),
        name: required(str),
        args: field({ kind: 'record', values: traitValue }),
      },
    },
  ],
}

const theme: Spec = {
  kind: 'object',
  doc: 'Visual tokens. Each becomes a `--docent-*` custom property.',
  fields: {
    preset: field(
      { kind: 'enum', values: THEME_NAMES },
      'Start from a built-in preset, then override tokens below.',
    ),
    background: field(str),
    foreground: field(str),
    muted: field(str, 'Secondary text.'),
    accent: field(str, 'The Next button. Its text colour is chosen for you unless you set one.'),
    accentForeground: field(str),
    connector: field(str, 'Colour of drawn arrows.'),
    ring: field(str, 'Colour of the spotlight ring.'),
    radius: field(themeValue, 'Popover corners. A number means px.'),
    shadow: field(str),
    font: field(str, "Defaults to the page's own font."),
    width: field(themeValue, 'Popover width. A number means px.'),
    overlay: field(str, 'Backdrop colour.', { deprecated: 'Prefer `options.overlay.color`.' }),
    overlayOpacity: field(themeValue, 'Backdrop opacity, 0 to 1.', {
      deprecated: 'Prefer `options.overlay.opacity`.',
    }),
    duration: field(themeValue, 'Transition time. A number means ms.'),
    zIndex: field(themeValue),
  },
}

const themeSpec: Spec = {
  kind: 'union',
  of: [{ kind: 'enum', values: THEME_NAMES, doc: 'A built-in preset by name.' }, theme],
}

const spotlight: Spec = {
  kind: 'object',
  fields: {
    padding: field(num, 'Space around the target, in px.'),
    radius: field(num, 'Corner radius of the cutout, in px.'),
    shape: field({ kind: 'enum', values: SPOTLIGHT_SHAPES }),
    ring: field({ kind: 'enum', values: SPOTLIGHT_RINGS }),
    animate: field(bool, 'Animate the cutout as it moves between steps.'),
  },
}

const overlay: Spec = {
  kind: 'object',
  fields: {
    style: field({ kind: 'enum', values: OVERLAY_STYLES }),
    color: field(str),
    opacity: field({ kind: 'number', min: 0, max: 1 }),
    blur: field({ kind: 'number', min: 0 }, 'Blur radius for the `blur` style, in px.'),
  },
}

const scroll: Spec = {
  kind: 'object',
  fields: {
    enabled: field(bool),
    behavior: field(enums('auto', 'smooth')),
    block: field(enums('start', 'center', 'end', 'nearest')),
  },
}

const labels: Spec = {
  kind: 'object',
  fields: {
    next: field(str),
    back: field(str),
    skip: field(str),
    done: field(str),
    close: field(str),
    progress: field(str, 'Supports `{current}` and `{total}`.'),
  },
}

const options: Spec = {
  kind: 'object',
  fields: {
    persist: field(bool, 'Remember the current step so `resume()` can continue.'),
    frequency: field(enums('once', 'until-completed', 'always')),
    showProgress: field(bool),
    allowClose: field(bool, 'Allow Escape and the close button.'),
    closeOnOverlayClick: field(bool),
    keyboard: field(bool, 'Arrow-key navigation.'),
    arrow: field({ kind: 'enum', values: ARROW_STYLES }),
    spotlight: field(spotlight),
    overlay: field(overlay),
    scroll: field(scroll),
    labels: field(labels),
    theme: field(themeSpec),
    appearance: field(
      enums('light', 'dark', 'auto'),
      "`auto` follows the reader's system setting.",
    ),
    template: field(str, 'Name of a template registered on the renderer.'),
  },
}

const step: Spec = {
  kind: 'object',
  fields: {
    id: required(str, 'Unique within the tour. Keep it stable once shipped.'),
    target: field(ref('target'), 'Leave out for a centred card.'),
    title: field(str),
    body: field(str),
    format: field(enums('text', 'markdown'), 'Markdown is a safe subset; HTML is never injected.'),
    media: field({
      kind: 'object',
      fields: {
        type: required(enums('image', 'video')),
        src: required(str),
        alt: field(str),
      },
    }),
    placement: field({ kind: 'enum', values: PLACEMENTS }),
    arrow: field({ kind: 'enum', values: ARROW_STYLES }),
    spotlight: field(spotlight),
    overlay: field(overlay),
    advance: field(advance, 'How the step finishes.'),
    interaction: field(enums('block', 'allow'), 'Whether the target can be used during the step.'),
    condition: field(ref('condition'), 'Skip this step when the condition is false.'),
    onMissing: field(enums('skip', 'wait', 'abort'), 'When the target is not on the page.'),
    waitFor: field({ kind: 'number', min: 0 }, 'How long to wait for the target, in ms.'),
    route: field(str, 'Path pattern this step belongs to.'),
    buttons: field({
      kind: 'object',
      fields: { back: field(bool), next: field(bool), skip: field(bool), close: field(bool) },
    }),
    scroll: field(scroll),
    meta: field({ kind: 'record', values: { kind: 'any' } }),
  },
}

const tour: Spec = {
  kind: 'object',
  doc: 'A guided tour: what to show, to whom, and when.',
  fields: {
    schemaVersion: field({ kind: 'number', min: 1, max: 1 }, '`defineTour` sets this for you.'),
    id: required(str, 'Stable identifier, used for progress and analytics.'),
    version: field(num, 'Bump to show the tour again to people who saw an older one.'),
    name: field(str),
    description: field(str),
    steps: required({ kind: 'array', items: ref('step') }),
    trigger: field(ref('trigger'), 'What starts the tour. Without one, only code can.'),
    conditions: field({ kind: 'array', items: ref('condition') }, 'All must hold.'),
    options: field(options),
    meta: field({ kind: 'record', values: { kind: 'any' } }),
  },
}

export const SPECS: Record<SpecName, Spec> = {
  tour,
  step,
  target,
  advance,
  trigger,
  condition,
  theme,
}
