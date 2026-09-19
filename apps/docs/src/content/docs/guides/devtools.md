---
title: Devtools
description: See why a tour is or isn't showing, replay steps, and simulate users while you build.
---

`@docentjs/devtools` is a panel for development. It is a separate package you load only in development, so production bundles never include it.

```sh
pnpm add -D @docentjs/devtools
```

Render the component anywhere. It shows nothing on the page itself, loads the panel only in development, and production builds drop it entirely.

```tsx
// React
import { DocentDevtools } from '@docentjs/devtools/react'

const docent = useDocent({ tours })
return <DocentDevtools docent={docent} />
```

```vue
<!-- Vue -->
<script setup lang="ts">
import { DocentDevtools } from '@docentjs/devtools/vue'
const docent = useDocent({ tours })
</script>

<template>
  <DocentDevtools :docent="docent" />
</template>
```

```svelte
<!-- Svelte 5 -->
<script lang="ts">
  import { DocentDevtools } from '@docentjs/devtools/svelte'
  const docent = useDocent({ tours })
</script>

<DocentDevtools {docent} />
```

`docent` accepts the handle from `useDocent()` or a manager from `createDocent()`. Props `open` and `shortcut` match the `mount()` options. Production detection relies on your bundler replacing `process.env.NODE_ENV`, which Vite, webpack, Next.js, Rollup and esbuild setups do.

Without a framework, mount it yourself inside a development-only branch:

```ts
import { createDocent } from '@docentjs/dom'

const docent = createDocent({ tours })

if (import.meta.env.DEV) {
  import('@docentjs/devtools').then(({ mount }) => mount(docent))
}
```

Open it with the **Docent** button in the corner or **Alt+Shift+D**. The panel docks right, bottom or left, resizes by dragging its edge, and remembers both. A bar at the top always shows the running tour and step, with Back, Next, Edit this step and Stop.

## Tours

Every tour the manager knows, with a verdict and the reason:

| Verdict | Meaning |
| --- | --- |
| running | showing now |
| eligible | conditions and frequency pass and the trigger holds; it should show, or is queued |
| waiting | eligible, but its trigger has not fired: another route, an element not on the page yet, an event not tracked |
| blocked | a condition failed, or frequency says this user has seen it |
| manual | no trigger; start it from code |

Expand a tour for its trigger, frequency, and each condition with the user's actual values, for example `trait plan eq "trial" (user has "pro")`. Each step shows whether its target is on this page, which selector matched, or what was tried. Hover a step to outline its target.

**Play** starts a tour regardless of its rules, **▶** starts from a specific step, **Reset progress** makes it show again, and **Copy JSON** copies the definition.

## Edit

A live editor for any tour. Changes apply to the running tour as you type, so you see the popover, spotlight and arrow update in place.

- **Steps**: reorder, duplicate, add and delete steps; preview from any step.
- **Step fields**: title, body, placement, target, how the step advances, what happens when the target is missing, and per-step arrow, spotlight shape and ring.
- **Target picker**: click **Pick** and then any element on the page. The panel suggests selectors ranked by stability, preferring `data-docent` names and ids over generated class names and structural paths, and tells you when one looks fragile.
- **Tour**: trigger, frequency, progress, close and keyboard options.
- **Look**: arrow style, overlay style and blur, spotlight shape, ring, padding and radius. See [Arrows, spotlight and overlay](/customize/arrows-and-spotlight/).
- **Theme**: start from a preset and adjust colors, radius, width and font.

Edits live in the panel, not in your code. Tours you changed are marked as edited. **Copy JSON** or **Download** the result and paste it back into your source; **Discard edits** returns to the original.

## Simulate

Change the user id and traits and apply them, which calls `identify()` so targeting re-evaluates immediately. Fire an event as if your app called `track()`. Navigate to another path without a reload.

## Events

A live timeline of every lifecycle event: tours started, steps shown and completed, targets missing. Filter it, and copy it as JSON to attach to a bug report.

## Audit

Checks every tour against the current page, sorted by severity. The tab shows a count of errors and warnings.

- **Errors**: duplicate step ids, a tour with no steps, a step that advances on a click the tour blocks, an unregistered custom condition, and text contrast below 3:1 when a tour overrides colors.
- **Warnings**: targets missing from this page, structural selectors likely to break, steps with no text, conditions pointing at unknown tours, and contrast below the WCAG AA ratio.
- **Info**: long bodies, tours with no trigger, and tours that show on every page load.

## Performance

Play a tour to record it. The tab shows the time to show each step, how often the popover moved, long frames and the worst frame while a step was visible, and how many DOM nodes the tour added.

## Options

```ts
const unmount = mount(docent, {
  open: true,                                   // start open (otherwise remembered per tab)
  shortcut: { key: 'k', ctrlKey: true },        // or false to disable
})
```
