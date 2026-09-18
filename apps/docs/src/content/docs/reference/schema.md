---
title: Tour schema
description: Every field of the tour JSON document.
---

All fields are optional unless marked. Types are exported from `@docentjs/core`.

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
| `spotlight` | `{ padding?, radius?, animate? }` | `6`, `6`, `true` |
| `overlay` | `{ color?, opacity? }` | `#000`, `0.55` |
| `scroll` | `{ enabled?, behavior?, block? }` | `true`, `'auto'`, `'center'` |
| `labels` | `Labels` | English defaults; `progress` supports `{current}` and `{total}` |
| `theme` | `Theme` | tokens applied on top of the renderer's theme |
| `template` | `string` | name of a template registered on the renderer |

## Step

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | required; unique within the tour |
| `target` | `Target` | omit for a centred modal step |
| `title`, `body` | `string` | |
| `format` | `'text' \| 'markdown'` | markdown subset: bold, italic, code, links, paragraphs; never raw HTML |
| `media` | `{ type: 'image' \| 'video', src, alt? }` | |
| `placement` | `Placement` | `'auto'`, a side, or `side-start` / `side-end` |
| `spotlight` | `SpotlightOptions` | per-step override |
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
{ type: 'custom', name, args? }           // registered on the controller
```

## Theme

Tokens map to `--docent-*` custom properties: `background`, `foreground`, `muted`, `accent`, `accentForeground`, `radius`, `shadow`, `font`, `width`, `overlay`, `overlayOpacity`, `duration`, `zIndex`. All are CSS strings.
