---
title: Tour schema
description: Every field of the tour JSON document.
---

A tour is one JSON document. This page lists every field. All fields are optional unless marked required, and every type is exported from `@docentjs/core` and re-exported by the other packages.

The schema is published at [docentjs.dev/schema/tour-v1.json](https://docentjs.dev/schema/tour-v1.json). Tours written as `.json` files can point at it, which gives most editors completion and checking as you type:

```json
{
  "$schema": "https://docentjs.dev/schema/tour-v1.json",
  "id": "welcome",
  "steps": [{ "id": "intro", "title": "Welcome" }]
}
```

The guides explain each area with examples: [steps](/guides/steps/), [targets](/guides/targets/), [triggers and conditions](/guides/triggers-and-conditions/), [theming](/customize/theming/), and [arrows, spotlight and overlay](/customize/arrows-and-spotlight/).

## Tour

| Field | Type | Notes |
| --- | --- | --- |
| `schemaVersion` | `1` | required; `defineTour` sets it |
| `id` | `string` | required; used for persistence, targeting, analytics |
| `version` | `number` | bump to re-show the tour to users who saw an older version |
| `name`, `description` | `string` | for the builder and dashboards |
| `steps` | `Step[]` | required |
| `trigger` | `Trigger` | what starts the tour |
| `conditions` | `Condition[]` | all must hold for the tour to be eligible |
| `options` | `TourOptions` | see below |
| `meta` | `Record<string, unknown>` | free-form extension bag |

## TourOptions

| Field | Type | Default |
| --- | --- | --- |
| `persist` | `boolean` | – |
| `frequency` | `'once' \| 'until-completed' \| 'always'` | `'once'` |
| `showProgress` | `boolean` | `true` |
| `allowClose` | `boolean` | `true` (Escape and the close button) |
| `closeOnOverlayClick` | `boolean` | `false` |
| `keyboard` | `boolean` | `true` (arrow keys) |
| `arrow` | `ArrowStyle` | `'caret'`; see [Arrows, spotlight and overlay](/customize/arrows-and-spotlight/) |
| `spotlight` | `{ padding?, radius?, shape?, ring?, animate? }` | `8`, `10`, `'rounded'`, `'hairline'`, `true` |
| `overlay` | `{ style?, color?, opacity?, blur? }` | `'dim'`, tinted ink, `0.52`, `4` |
| `scroll` | `{ enabled?, behavior?, block? }` | `true`, `'auto'`, `'center'` |
| `labels` | `Labels` | English defaults; `progress` supports `{current}` and `{total}` |
| `theme` | `ThemeSpec` | a preset name, tokens, or `{ preset, ...tokens }` |
| `appearance` | `'light' \| 'dark' \| 'auto'` | `'light'`; `auto` follows the system setting |
| `template` | `string` | a built-in look (`spotlight`, `hint`, `announcement`) or a template the app registered |

## Step

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | required; unique within the tour |
| `target` | `Target` | omit for a centred modal step |
| `title`, `body` | `string` | |
| `format` | `'text' \| 'markdown'` | markdown subset: bold, italic, code, links, paragraphs; never raw HTML |
| `media` | `{ type: 'image' \| 'video', src, alt? }` | |
| `placement` | `Placement` | `'auto'`, a side, or `side-start` / `side-end` |
| `arrow` | `ArrowStyle` | per-step override |
| `spotlight` | `SpotlightOptions` | per-step override |
| `overlay` | `OverlayOptions` | per-step override |
| `advance` | `Advance` | how the step completes; see [Steps](/guides/steps/) |
| `interaction` | `'block' \| 'allow'` | default: `allow` for click/input advances, else `block` |
| `condition` | `Condition` | skip the step when false |
| `onMissing` | `'skip' \| 'wait' \| 'abort'` | default `skip` |
| `waitFor` | `number` | ms to wait for the target; `wait` defaults to 3000 |
| `route` | `string` | path pattern the step belongs to |
| `buttons` | `{ back?, next?, skip?, close? }` | hide individual buttons |
| `scroll` | `ScrollOptions` | per-step override |
| `meta` | `Record<string, unknown>` | |

## Target

A string is a CSS selector. An object is the portable form:

| Field | Type | Notes |
| --- | --- | --- |
| `name` | `string` | resolves to `[data-docent="name"]` on the web, a test id on native |
| `selectors` | `string[]` | CSS fallbacks tried in order |
| `native` | `string` | native id when it differs from `name` |
| `within` | `string` | restrict the search to a container |
| `nth` | `number` | pick among multiple matches |

## Advance

```ts
'button'                                  // Next button (default)
{ on: 'click', target? }                  // user clicks the target
{ on: 'input', target?, match? }          // typed value matches a regex
{ on: 'event', name }                     // controller.notify(name)
{ on: 'element', target }                 // an element appears
{ on: 'delay', ms }
```

## Trigger

```ts
{ type: 'manual' }
{ type: 'auto', delay? }
{ type: 'route', pattern, delay? }
{ type: 'element', target, delay? }
{ type: 'event', name }
```

## Condition

```ts
{ type: 'trait', key, op, value? }        // op: eq neq gt gte lt lte in nin contains exists missing
{ type: 'route', pattern }
{ type: 'element', target, exists? }
{ type: 'tour', id, state }               // not-started | in-progress | completed | skipped
{ type: 'all' | 'any', conditions }
{ type: 'not', condition }
{ type: 'custom', name, args? }           // registered with the `custom` option
```

## Theme

Sizes and times accept a CSS string or a number (`radius: 12` is `12px`, `duration: 180` is `180ms`). Tokens map to `--docent-*` custom properties: `background`, `foreground`, `muted`, `accent`, `accentForeground`, `radius`, `shadow`, `font`, `width`, `overlay`, `overlayOpacity`, `duration`, `zIndex`, `connector`, `ring`. All are CSS strings.

## Looks

```ts
type ArrowStyle = 'caret' | 'none' | 'line' | 'dashed' | 'dotted' | 'curve' | 'curve-dashed'
  | 'squiggle' | 'loop' | 'elbow' | 'sketch' | 'pin'
type SpotlightShape = 'rounded' | 'rect' | 'pill' | 'circle'
type SpotlightRing = 'hairline' | 'none' | 'glow' | 'pulse' | 'dashed' | 'solid'
type OverlayStyle = 'dim' | 'blur' | 'vignette' | 'none'
```

## Checking a tour

`validateTour` reports anything that does not match this page, in plain words, with the value that was probably meant:

```ts
import { formatIssues, validateTour } from '@docentjs/dom/validate'

const issues = validateTour(tour)
// [{ level: 'error', path: 'steps[0].arrow',
//    message: '"curvy" is not one of: caret, none, line, …', suggestion: 'curve' }]
console.log(formatIssues(issues))
```

It catches unknown values, missing and misspelled fields, wrong types, out-of-range numbers and duplicate step ids. It says nothing about whether a step's target is on the page, which the [devtools](/guides/devtools/#audit) Audit tab checks.

**This already runs for you in development.** `createTour` and `createDocent` check each tour once and warn in the console. Production builds contain neither the check nor the code behind it, as long as your bundler sets `process.env.NODE_ENV`, which Vite, webpack, Next.js, Rollup and esbuild setups do.

### From the command line

```sh
npx @docentjs/cli validate "tours/*.json"
```

Checks tour files without a browser, which suits CI and tools that write tours. It exits 1 when anything is wrong. `--json` reports for other tools to read, and `docent schema tour-schema.json` writes the schema to a file for offline use.

```
tours/welcome.json
✗ steps[0].arrow: "curvy" is not one of: caret, none, line, … Did you mean "curve"?
! steps[1].titel: Unknown field, which Docent will ignore. Did you mean "title"?
1 file checked: 1 error, 1 warning.
```

### Warnings while you build

Besides the schema check, Docent warns in development when something would otherwise fail in silence:

- starting a tour id that does not exist, listing the ids it knows,
- a step skipped because its target is not on the page, naming the step and the target.

The same rule applies: production builds contain neither the checks nor their messages.

The validate function is exported from `@docentjs/core/validate` and re-exported from `@docentjs/dom/validate`. `isValidTour(tour)` returns a boolean, and `tourJsonSchema()` returns the JSON Schema published at [docentjs.dev/schema/tour-v1.json](https://docentjs.dev/schema/tour-v1.json).

The documentation is also published as plain text for AI tools: see [Using Docent with AI](/reference/for-ai/).
