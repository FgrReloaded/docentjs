/** @jsxImportSource preact */
/**
 * The live editor: change a tour and watch the running popover update.
 * Everything here produces plain tour JSON, ready to copy back into code.
 */

import type {
  Advance,
  ArrowStyle,
  OverlayStyle,
  Placement,
  SpotlightRing,
  SpotlightShape,
  Step,
  Target,
  Theme,
  ThemeName,
  ThemeSpec,
  Tour,
  Trigger,
} from '@docentjs/core'
import { THEME_VARS } from '@docentjs/dom'
import { presets } from '@docentjs/dom/themes'
import { useState } from 'preact/hooks'
import { toHex } from '../../contrast'
import { suggestName, type TargetCandidate, targetCandidates } from '../../selectors'
import { checkTarget } from '../../targets'
import type { Store } from '../store'
import {
  Area,
  Badge,
  Button,
  Check,
  Color,
  copyText,
  download,
  Empty,
  Field,
  IconButton,
  Section,
  Select,
  Slider,
  Text,
} from '../ui'

// ------------------------------------------------------------------ helpers

/** Copy with one key set, or removed when the value is undefined/empty. */
function with_<T extends object, K extends keyof T>(obj: T, key: K, value: T[K] | undefined): T {
  const next = { ...obj }
  if (value === undefined || value === '') delete next[key]
  else next[key] = value
  return next
}

function uniqueId(tour: Tour, base: string): string {
  const ids = new Set(tour.steps.map((s) => s.id))
  if (!ids.has(base)) return base
  let n = 2
  while (ids.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

const PLACEMENTS: ReadonlyArray<readonly [Placement, string]> = [
  ['auto', 'Auto'],
  ['top', 'Top'],
  ['top-start', 'Top start'],
  ['top-end', 'Top end'],
  ['bottom', 'Bottom'],
  ['bottom-start', 'Bottom start'],
  ['bottom-end', 'Bottom end'],
  ['left', 'Left'],
  ['left-start', 'Left start'],
  ['left-end', 'Left end'],
  ['right', 'Right'],
  ['right-start', 'Right start'],
  ['right-end', 'Right end'],
]

const ARROWS: ReadonlyArray<readonly [ArrowStyle, string]> = [
  ['caret', 'Caret (default)'],
  ['none', 'None'],
  ['line', 'Line'],
  ['dashed', 'Dashed line'],
  ['dotted', 'Dotted line'],
  ['curve', 'Curve'],
  ['curve-dashed', 'Dashed curve'],
  ['squiggle', 'Squiggle'],
  ['loop', 'Loop'],
  ['elbow', 'Elbow'],
  ['sketch', 'Sketch'],
  ['pin', 'Pin'],
]
const SHAPES: ReadonlyArray<readonly [SpotlightShape, string]> = [
  ['rounded', 'Rounded (default)'],
  ['rect', 'Rectangle'],
  ['pill', 'Pill'],
  ['circle', 'Circle'],
]
const RINGS: ReadonlyArray<readonly [SpotlightRing, string]> = [
  ['hairline', 'Hairline (default)'],
  ['none', 'None'],
  ['glow', 'Glow'],
  ['pulse', 'Pulse'],
  ['dashed', 'Dashed'],
  ['solid', 'Solid'],
]
const OVERLAYS: ReadonlyArray<readonly [OverlayStyle, string]> = [
  ['dim', 'Dim (default)'],
  ['blur', 'Blur'],
  ['vignette', 'Vignette'],
  ['none', 'None (page stays usable)'],
]
/** Prepend a "use the tour's setting" choice for step-level overrides. */
function inherit<T extends string>(
  options: ReadonlyArray<readonly [T, string]>,
): ReadonlyArray<readonly [T | 'inherit', string]> {
  return [
    ['inherit', "Tour's setting"],
    ...options.map(([v, l]) => [v, l.replace(' (default)', '')] as const),
  ]
}

/**
 * Edits are kept in this browser until they reach the code. Say so, and warn
 * when the code has changed underneath restored edits.
 */
function DraftNotice({ store, tourId }: { store: Store; tourId: string }) {
  if (store.stale.value.has(tourId)) {
    return (
      <p class="notice warn-notice" role="status">
        <strong>The code for this tour changed after these edits.</strong> Review them, or discard
        to use the version in your code.
      </p>
    )
  }
  const restored = store.restored.value.has(tourId)
  return (
    <p class="notice" role="status">
      {restored
        ? 'Restored unsaved edits from your last session. '
        : 'Edits are kept in this browser. '}
      Copy or download the JSON into your code to keep them for good.
    </p>
  )
}

/** Tokens of a theme that may be a preset's name, keeping the preset. */
function asTokens(spec: ThemeSpec | undefined): Theme & { preset?: ThemeName } {
  if (spec === undefined) return {}
  return typeof spec === 'string' ? { preset: spec } : spec
}

/** Defaults of the built-in look (styles.ts in @docentjs/dom). */
const DEFAULT_THEME = { radius: 14, width: 344, overlayOpacity: 0.52, duration: 220 }

// ---------------------------------------------------------------------- tab

export function EditTab({ store }: { store: Store }) {
  store.tick.value
  const tours = store.tours.value
  const first = tours[0]
  if (!first) return <Empty>No tours to edit.</Empty>
  const sel = store.selection.value
  const tour = tours.find((t) => t.id === sel.tourId) ?? first
  const step = tour.steps.find((s) => s.id === sel.stepId) ?? tour.steps[0]
  const edited = store.edited.value.has(tour.id)
  const json = () => JSON.stringify(tour, null, 2)

  const editSteps = (change: (steps: Step[]) => Step[], immediate = true) =>
    store.editTour(tour.id, (t) => ({ ...t, steps: change(t.steps) }), immediate)
  const index = step ? tour.steps.indexOf(step) : -1
  const move = (by: number) =>
    editSteps((steps) => {
      const next = [...steps]
      const [s] = next.splice(index, 1)
      if (s) next.splice(index + by, 0, s)
      return next
    })
  const addStep = () => {
    const id = uniqueId(tour, 'new-step')
    editSteps((steps) => {
      const next = [...steps]
      next.splice(index + 1, 0, { id, title: 'New step', body: 'Describe what this does.' })
      return next
    })
    store.select(tour.id, id)
  }

  return (
    <div class="stack">
      <div class="toolbar">
        <Select<string>
          value={tour.id}
          onChange={(id) => store.select(id)}
          options={tours.map((t) => [t.id, t.name ?? t.id] as const)}
        />
        {edited && <Badge tone="eligible">edited</Badge>}
        <span class="grow" />
        <IconButton
          icon="play"
          label="Preview from this step"
          onClick={() => void store.docent.start(tour.id, step ? { at: step.id } : {})}
        />
        <IconButton icon="copy" label="Copy tour JSON" onClick={() => copyText(json())} />
        <IconButton
          icon="download"
          label="Download tour JSON"
          onClick={() => download(`${tour.id}.tour.json`, json())}
        />
        <IconButton
          icon="reset"
          label="Discard edits"
          disabled={!edited}
          onClick={() => store.resetTour(tour.id)}
        />
      </div>

      {edited && <DraftNotice store={store} tourId={tour.id} />}

      <Section
        title={`Steps (${tour.steps.length})`}
        actions={
          <span class="inline tight">
            <IconButton icon="up" label="Move up" disabled={index <= 0} onClick={() => move(-1)} />
            <IconButton
              icon="down"
              label="Move down"
              disabled={index < 0 || index >= tour.steps.length - 1}
              onClick={() => move(1)}
            />
            <IconButton
              icon="duplicate"
              label="Duplicate step"
              disabled={!step}
              onClick={() => {
                if (!step) return
                const id = uniqueId(tour, step.id)
                editSteps((steps) => {
                  const next = [...steps]
                  next.splice(index + 1, 0, { ...step, id })
                  return next
                })
                store.select(tour.id, id)
              }}
            />
            <IconButton
              icon="trash"
              label="Delete step"
              disabled={!step}
              onClick={() => {
                if (!step) return
                editSteps((steps) => steps.filter((s) => s !== step))
                store.select(tour.id, tour.steps[index + 1]?.id ?? tour.steps[index - 1]?.id)
              }}
            />
            <IconButton icon="plus" label="Add step after this one" onClick={addStep} />
          </span>
        }
      >
        <div class="step-list">
          {tour.steps.map((s, i) => (
            <button
              type="button"
              key={s.id}
              class={`step-item ${s === step ? 'on' : ''}`}
              onClick={() => store.select(tour.id, s.id)}
              onMouseEnter={() => store.highlight(checkTarget(s, undefined).element)}
              onMouseLeave={() => store.highlight(null)}
            >
              <span class="index mono">{String(i + 1).padStart(2, '0')}</span>
              <span class="grow">{s.title || <span class="muted">{s.id}</span>}</span>
              {s.target === undefined && <span class="muted small">modal</span>}
            </button>
          ))}
        </div>
      </Section>

      {step ? (
        <StepForm key={`${tour.id}/${step.id}`} store={store} tour={tour} step={step} />
      ) : (
        <Empty>This tour has no steps. Add one.</Empty>
      )}
      <TourForm store={store} tour={tour} />
    </div>
  )
}

// --------------------------------------------------------------- step form

function StepForm({ store, tour, step }: { store: Store; tour: Tour; step: Step }) {
  const patch = (change: (s: Step) => Step, immediate = false) =>
    store.editTour(
      tour.id,
      (t) => ({ ...t, steps: t.steps.map((s) => (s.id === step.id ? change(s) : s)) }),
      immediate,
    )
  const set = <K extends keyof Step>(key: K, value: Step[K] | undefined, immediate = false) =>
    patch((s) => with_(s, key, value), immediate)
  const spotlight = step.spotlight ?? {}
  const buttons = step.buttons ?? {}

  return (
    <Section title={`Step · ${step.id}`}>
      <Field label="Id" hint="Used for progress and analytics; keep it stable once shipped.">
        <Text
          mono
          value={step.id}
          onInput={(id) => {
            const clean = id.trim().replace(/\s+/g, '-')
            if (!clean || tour.steps.some((s) => s !== step && s.id === clean)) return
            patch((s) => ({ ...s, id: clean }), true)
            store.select(tour.id, clean)
          }}
        />
      </Field>
      <Field label="Title">
        <Text value={step.title ?? ''} onInput={(v) => set('title', v)} />
      </Field>
      <Field label="Body">
        <Area value={step.body ?? ''} onInput={(v) => set('body', v)} rows={3} />
      </Field>
      <div class="grid2">
        <Field label="Format">
          <Select<'text' | 'markdown'>
            value={step.format ?? 'text'}
            onChange={(v) => set('format', v === 'text' ? undefined : v, true)}
            options={[
              ['text', 'Plain text'],
              ['markdown', 'Markdown'],
            ]}
          />
        </Field>
        <Field label="Placement">
          <Select<Placement>
            value={step.placement ?? 'auto'}
            onChange={(v) => set('placement', v === 'auto' ? undefined : v, true)}
            options={PLACEMENTS}
          />
        </Field>
      </div>

      <TargetField
        store={store}
        target={step.target}
        onChange={(t, immediate) => set('target', t, immediate)}
      />
      <AdvanceField advance={step.advance} onChange={(a) => set('advance', a, true)} />

      <div class="grid2">
        <Field label="Interaction with target">
          <Select<'auto' | 'block' | 'allow'>
            value={step.interaction ?? 'auto'}
            onChange={(v) => set('interaction', v === 'auto' ? undefined : v, true)}
            options={[
              ['auto', 'Automatic'],
              ['block', 'Block clicks'],
              ['allow', 'Allow clicks'],
            ]}
          />
        </Field>
        <Field label="If target is missing">
          <Select<'skip' | 'wait' | 'abort'>
            value={step.onMissing ?? 'skip'}
            onChange={(v) => set('onMissing', v === 'skip' ? undefined : v, true)}
            options={[
              ['skip', 'Skip the step'],
              ['wait', 'Wait for it'],
              ['abort', 'Abort the tour'],
            ]}
          />
        </Field>
      </div>
      <Field label="Route" hint="Path pattern this step belongs to, e.g. /invoices/**">
        <Text
          mono
          value={step.route ?? ''}
          placeholder="any page"
          onInput={(v) => set('route', v.trim() || undefined)}
        />
      </Field>

      <Field label="Buttons">
        <span class="checks">
          {(['back', 'skip', 'next', 'close'] as const).map((b) => (
            <Check
              key={b}
              label={b[0]?.toUpperCase() + b.slice(1)}
              checked={buttons[b] !== false}
              onChange={(on) => set('buttons', with_(buttons, b, on ? undefined : false), true)}
            />
          ))}
        </span>
      </Field>
      <div class="grid2">
        <Field label="Spotlight padding">
          <Slider
            value={spotlight.padding ?? 8}
            min={0}
            max={32}
            unit="px"
            onInput={(v) => set('spotlight', { ...spotlight, padding: v })}
          />
        </Field>
        <Field label="Spotlight radius">
          <Slider
            value={spotlight.radius ?? 10}
            min={0}
            max={32}
            unit="px"
            onInput={(v) => set('spotlight', { ...spotlight, radius: v })}
          />
        </Field>
      </div>
      <div class="grid2">
        <Field label="Arrow">
          <Select<ArrowStyle | 'inherit'>
            value={step.arrow ?? 'inherit'}
            onChange={(v) => set('arrow', v === 'inherit' ? undefined : v, true)}
            options={inherit(ARROWS)}
          />
        </Field>
        <Field label="Spotlight shape">
          <Select<SpotlightShape | 'inherit'>
            value={spotlight.shape ?? 'inherit'}
            onChange={(v) =>
              set('spotlight', with_(spotlight, 'shape', v === 'inherit' ? undefined : v), true)
            }
            options={inherit(SHAPES)}
          />
        </Field>
        <Field label="Ring">
          <Select<SpotlightRing | 'inherit'>
            value={spotlight.ring ?? 'inherit'}
            onChange={(v) =>
              set('spotlight', with_(spotlight, 'ring', v === 'inherit' ? undefined : v), true)
            }
            options={inherit(RINGS)}
          />
        </Field>
      </div>
    </Section>
  )
}

// ------------------------------------------------------------ target field

type TargetKind = 'none' | 'name' | 'selector' | 'advanced'

function targetKind(t: Target | undefined): TargetKind {
  if (t === undefined) return 'none'
  if (typeof t === 'string') return 'selector'
  const keys = Object.keys(t)
  if (keys.length === 1 && t.name !== undefined) return 'name'
  if (keys.length === 1 && t.selectors?.length === 1) return 'selector'
  return 'advanced'
}

function TargetField({
  store,
  target,
  onChange,
}: {
  store: Store
  target: Target | undefined
  /** `immediate` is false while typing, so a half-typed name does not skip the step. */
  onChange: (t: Target | undefined, immediate: boolean) => void
}) {
  const kind = targetKind(target)
  const [candidates, setCandidates] = useState<TargetCandidate[] | null>(null)
  const [suggested, setSuggested] = useState('')
  const [jsonError, setJsonError] = useState('')
  const value =
    kind === 'name'
      ? ((target as { name: string }).name ?? '')
      : kind === 'selector'
        ? typeof target === 'string'
          ? target
          : ((target as { selectors: string[] }).selectors[0] ?? '')
        : kind === 'advanced'
          ? JSON.stringify(target, null, 2)
          : ''

  const pick = async () => {
    const el = await store.pick()
    if (!el) return
    setCandidates(targetCandidates(el))
    setSuggested(suggestName(el))
  }
  const use = (c: TargetCandidate) => {
    onChange(c.kind === 'name' ? { name: c.value } : c.value, true)
    setCandidates(null)
  }

  return (
    <div class="field">
      <span class="field-label">Target</span>
      <div class="inline">
        <Select<TargetKind>
          value={kind}
          onChange={(k) =>
            onChange(
              k === 'none'
                ? undefined
                : k === 'name'
                  ? { name: '' }
                  : k === 'selector'
                    ? ''
                    : { selectors: [''] },
              true,
            )
          }
          options={[
            ['none', 'None (centred)'],
            ['name', 'data-docent name'],
            ['selector', 'CSS selector'],
            ['advanced', 'Advanced (JSON)'],
          ]}
        />
        <Button icon="pick" onClick={() => void pick()}>
          Pick
        </Button>
      </div>
      {(kind === 'name' || kind === 'selector') && (
        <Text
          mono
          value={value}
          placeholder={kind === 'name' ? 'save-button' : '#save'}
          onInput={(v) => onChange(kind === 'name' ? { name: v } : v, false)}
        />
      )}
      {kind === 'advanced' && (
        <>
          <textarea
            class="mono"
            rows={4}
            value={value}
            onChange={(e) => {
              try {
                onChange(JSON.parse((e.target as HTMLTextAreaElement).value) as Target, true)
                setJsonError('')
              } catch {
                setJsonError('Not valid JSON')
              }
            }}
          />
          <div class="error">{jsonError}</div>
        </>
      )}
      {candidates && (
        <div class="candidates">
          {candidates.map((c) => (
            <button
              type="button"
              class="candidate"
              key={`${c.kind}:${c.value}`}
              onClick={() => use(c)}
              title={c.note}
            >
              <span class="mono grow">{c.kind === 'name' ? `name: ${c.value}` : c.value}</span>
              {!c.unique && <Badge tone="blocked">not unique</Badge>}
              <Badge
                tone={
                  c.robustness === 'high'
                    ? 'running'
                    : c.robustness === 'medium'
                      ? 'eligible'
                      : 'waiting'
                }
              >
                {c.robustness}
              </Badge>
            </button>
          ))}
          {!candidates.some((c) => c.kind === 'name') && (
            <div class="hint-row">
              Most robust: add <code>data-docent="{suggested}"</code> to this element.
              <Button variant="ghost" onClick={() => copyText(`data-docent="${suggested}"`)}>
                Copy
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------- advance field

type AdvanceKind = 'button' | 'click' | 'input' | 'event' | 'delay' | 'element'

function AdvanceField({
  advance,
  onChange,
}: {
  advance: Advance | undefined
  onChange: (a: Advance | undefined) => void
}) {
  const kind: AdvanceKind = typeof advance === 'object' ? advance.on : 'button'
  const defaults: Record<AdvanceKind, Advance | undefined> = {
    button: undefined,
    click: { on: 'click' },
    input: { on: 'input' },
    event: { on: 'event', name: 'my-event' },
    delay: { on: 'delay', ms: 3000 },
    element: { on: 'element', target: '' },
  }
  return (
    <div class="grid2">
      <Field label="Advance when">
        <Select<AdvanceKind>
          value={kind}
          onChange={(k) => onChange(defaults[k])}
          options={[
            ['button', 'Next is pressed'],
            ['click', 'Target is clicked'],
            ['input', 'Target receives input'],
            ['event', 'An event is tracked'],
            ['delay', 'After a delay'],
            ['element', 'An element appears'],
          ]}
        />
      </Field>
      {typeof advance === 'object' && advance.on === 'event' && (
        <Field label="Event name">
          <Text mono value={advance.name} onInput={(name) => onChange({ ...advance, name })} />
        </Field>
      )}
      {typeof advance === 'object' && advance.on === 'delay' && (
        <Field label="Delay">
          <Slider
            value={advance.ms}
            min={500}
            max={15000}
            step={250}
            unit="ms"
            onInput={(ms) => onChange({ ...advance, ms })}
          />
        </Field>
      )}
      {typeof advance === 'object' && advance.on === 'input' && (
        <Field label="Value must match (regex)">
          <Text
            mono
            value={advance.match ?? ''}
            placeholder="any value"
            onInput={(m) => onChange(with_(advance, 'match', m || undefined))}
          />
        </Field>
      )}
      {typeof advance === 'object' && advance.on === 'element' && (
        <Field label="Element selector">
          <Text
            mono
            value={typeof advance.target === 'string' ? advance.target : ''}
            onInput={(target) => onChange({ ...advance, target })}
          />
        </Field>
      )}
    </div>
  )
}

// --------------------------------------------------------------- tour form

type TriggerKind = 'none' | Trigger['type']

function TourForm({ store, tour }: { store: Store; tour: Tour }) {
  const edit = (change: (t: Tour) => Tour, immediate = false) =>
    store.editTour(tour.id, change, immediate)
  const options = tour.options ?? {}
  const setOption = <K extends keyof NonNullable<Tour['options']>>(
    key: K,
    value: NonNullable<Tour['options']>[K] | undefined,
    immediate = true,
  ) => edit((t) => with_(t, 'options', with_(t.options ?? {}, key, value)), immediate)
  const trigger = tour.trigger
  const triggerKind: TriggerKind = trigger?.type ?? 'none'
  const triggerDefaults: Record<TriggerKind, Trigger | undefined> = {
    none: undefined,
    manual: { type: 'manual' },
    auto: { type: 'auto' },
    route: { type: 'route', pattern: '/' },
    element: { type: 'element', target: '' },
    event: { type: 'event', name: 'my-event' },
  }

  return (
    <>
      <Section title="Tour">
        <Field label="Name">
          <Text
            value={tour.name ?? ''}
            placeholder={tour.id}
            onInput={(v) => edit((t) => with_(t, 'name', v || undefined))}
          />
        </Field>
        <div class="grid2">
          <Field label="Starts">
            <Select<TriggerKind>
              value={triggerKind}
              onChange={(k) => edit((t) => with_(t, 'trigger', triggerDefaults[k]), true)}
              options={[
                ['none', 'From code only'],
                ['manual', 'Manual'],
                ['auto', 'On page load'],
                ['route', 'On a route'],
                ['element', 'When an element appears'],
                ['event', 'On an event'],
              ]}
            />
          </Field>
          <Field label="Frequency">
            <Select<'once' | 'until-completed' | 'always'>
              value={options.frequency ?? 'once'}
              onChange={(v) => setOption('frequency', v === 'once' ? undefined : v)}
              options={[
                ['once', 'Once'],
                ['until-completed', 'Until completed'],
                ['always', 'Every time'],
              ]}
            />
          </Field>
        </div>
        {trigger?.type === 'route' && (
          <Field label="Route pattern">
            <Text
              mono
              value={trigger.pattern}
              onInput={(pattern) => edit((t) => ({ ...t, trigger: { ...trigger, pattern } }))}
            />
          </Field>
        )}
        {trigger?.type === 'event' && (
          <Field label="Event name">
            <Text
              mono
              value={trigger.name}
              onInput={(name) => edit((t) => ({ ...t, trigger: { ...trigger, name } }))}
            />
          </Field>
        )}
        {trigger?.type === 'element' && (
          <Field label="Element selector">
            <Text
              mono
              value={typeof trigger.target === 'string' ? trigger.target : ''}
              onInput={(target) => edit((t) => ({ ...t, trigger: { ...trigger, target } }))}
            />
          </Field>
        )}
        <span class="checks">
          <Check
            label="Show progress"
            checked={options.showProgress !== false}
            onChange={(v) => setOption('showProgress', v ? undefined : false)}
          />
          <Check
            label="Allow close"
            checked={options.allowClose !== false}
            onChange={(v) => setOption('allowClose', v ? undefined : false)}
          />
          <Check
            label="Close on overlay click"
            checked={!!options.closeOnOverlayClick}
            onChange={(v) => setOption('closeOnOverlayClick', v || undefined)}
          />
          <Check
            label="Arrow keys"
            checked={options.keyboard !== false}
            onChange={(v) => setOption('keyboard', v ? undefined : false)}
          />
          <Check
            label="Remember progress"
            checked={!!options.persist}
            onChange={(v) => setOption('persist', v || undefined)}
          />
        </span>
      </Section>
      <LookForm store={store} tour={tour} />
      <ThemeForm store={store} tour={tour} />
    </>
  )
}

// -------------------------------------------------------------- theme form

function ThemeForm({ store, tour }: { store: Store; tour: Tour }) {
  // A theme can be a preset's name; the form edits tokens, so normalise first.
  const spec = tour.options?.theme
  const preset = typeof spec === 'string' ? spec : spec?.preset
  const theme: Theme = typeof spec === 'string' ? {} : (spec ?? {})
  // The built-in defaults (styles.ts); the light preset spells out all but the scrim.
  const base: Theme = { ...presets.light, overlay: 'oklch(20% 0.02 285)' }
  const live = (key: keyof Theme, value: string) => {
    // Instant feedback while dragging; the debounced edit re-renders shortly after.
    if (store.state.value.active !== tour.id) return
    const host = document.querySelector<HTMLElement>('[data-docent-host]')
    host?.style.setProperty(`--docent-${THEME_VARS[key]}`, value)
  }
  const setToken = (key: keyof Theme, value: string | undefined, immediate = false) => {
    if (value !== undefined) live(key, value)
    store.editTour(
      tour.id,
      (t) =>
        with_(
          t,
          'options',
          with_(t.options ?? {}, 'theme', with_(asTokens(t.options?.theme), key, value)),
        ),
      immediate,
    )
  }
  const color = (key: keyof Theme) =>
    toHex(String(theme[key] ?? base[key] ?? '#000000')) ?? '#000000'
  const px = (v: string | number | undefined, fallback: number) =>
    v === undefined ? fallback : typeof v === 'number' ? v : Number.parseFloat(v)

  return (
    <Section
      title="Theme"
      actions={
        <Button
          variant="ghost"
          onClick={() =>
            store.editTour(
              tour.id,
              (t) => with_(t, 'options', with_(t.options ?? {}, 'theme', undefined)),
              true,
            )
          }
        >
          Reset theme
        </Button>
      }
    >
      <div class="inline wrap">
        {Object.keys(presets).map((name) => (
          <Button
            key={name}
            class={`chip ${preset === name ? 'on' : ''}`}
            onClick={() =>
              store.editTour(
                tour.id,
                // Name the preset rather than copying its tokens, so the JSON
                // stays short and keeps working when a preset improves.
                (t) => with_(t, 'options', with_(t.options ?? {}, 'theme', name as ThemeName)),
                true,
              )
            }
          >
            {name[0]?.toUpperCase()}
            {name.slice(1)}
          </Button>
        ))}
      </div>
      <div class="grid2">
        {(
          [
            ['background', 'Background'],
            ['foreground', 'Text'],
            ['muted', 'Muted text'],
            ['accent', 'Accent'],
            ['accentForeground', 'Accent text'],
            ['overlay', 'Overlay'],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label}>
            <Color value={color(key)} onInput={(v) => setToken(key, v)} />
          </Field>
        ))}
        <Field label="Corner radius">
          <Slider
            value={px(theme.radius, DEFAULT_THEME.radius)}
            min={0}
            max={28}
            unit="px"
            onInput={(v) => setToken('radius', `${v}px`)}
          />
        </Field>
        <Field label="Width">
          <Slider
            value={px(theme.width, DEFAULT_THEME.width)}
            min={240}
            max={520}
            step={4}
            unit="px"
            onInput={(v) => setToken('width', `${v}px`)}
          />
        </Field>
        <Field label="Overlay opacity">
          <Slider
            value={px(theme.overlayOpacity, DEFAULT_THEME.overlayOpacity)}
            min={0}
            max={0.9}
            step={0.02}
            onInput={(v) => setToken('overlayOpacity', String(v))}
          />
        </Field>
        <Field label="Animation">
          <Slider
            value={px(theme.duration, DEFAULT_THEME.duration)}
            min={0}
            max={600}
            step={10}
            unit="ms"
            onInput={(v) => setToken('duration', `${v}ms`)}
          />
        </Field>
      </div>
      <Field label="Font" hint="Empty inherits the page's font.">
        <Text
          value={theme.font ?? ''}
          placeholder="inherit"
          onInput={(v) => setToken('font', v || undefined)}
        />
      </Field>
    </Section>
  )
}

// --------------------------------------------------------------- look form

function LookForm({ store, tour }: { store: Store; tour: Tour }) {
  const options = tour.options ?? {}
  const spotlight = options.spotlight ?? {}
  const overlay = options.overlay ?? {}
  const edit = (change: (o: NonNullable<Tour['options']>) => NonNullable<Tour['options']>) =>
    store.editTour(tour.id, (t) => ({ ...t, options: change(t.options ?? {}) }), true)
  return (
    <Section title="Look">
      <div class="grid2">
        <Field label="Arrow">
          <Select<ArrowStyle>
            value={options.arrow ?? 'caret'}
            onChange={(v) => edit((o) => with_(o, 'arrow', v === 'caret' ? undefined : v))}
            options={ARROWS}
          />
        </Field>
        <Field label="Overlay">
          <Select<OverlayStyle>
            value={overlay.style ?? 'dim'}
            onChange={(v) =>
              edit((o) => with_(o, 'overlay', with_(overlay, 'style', v === 'dim' ? undefined : v)))
            }
            options={OVERLAYS}
          />
        </Field>
        <Field label="Spotlight shape">
          <Select<SpotlightShape>
            value={spotlight.shape ?? 'rounded'}
            onChange={(v) =>
              edit((o) =>
                with_(o, 'spotlight', with_(spotlight, 'shape', v === 'rounded' ? undefined : v)),
              )
            }
            options={SHAPES}
          />
        </Field>
        <Field label="Ring">
          <Select<SpotlightRing>
            value={spotlight.ring ?? 'hairline'}
            onChange={(v) =>
              edit((o) =>
                with_(o, 'spotlight', with_(spotlight, 'ring', v === 'hairline' ? undefined : v)),
              )
            }
            options={RINGS}
          />
        </Field>
        {overlay.style === 'blur' && (
          <Field label="Blur">
            <Slider
              value={overlay.blur ?? 4}
              min={0}
              max={16}
              unit="px"
              onInput={(v) =>
                store.editTour(tour.id, (t) => ({
                  ...t,
                  options: with_(t.options ?? {}, 'overlay', { ...overlay, blur: v }),
                }))
              }
            />
          </Field>
        )}
      </div>
    </Section>
  )
}
