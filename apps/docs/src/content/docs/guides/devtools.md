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

Open it with the **Docent** button in the corner or **Alt+Shift+D**.

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

## Simulate

Change the user id and traits and apply them, which calls `identify()` so targeting re-evaluates immediately. Fire an event as if your app called `track()`. Navigate to another path without a reload.

## Events

A live timeline of every lifecycle event: tours started, steps shown and completed, targets missing. Copy it as JSON to attach to a bug report.

## Options

```ts
const unmount = mount(docent, {
  open: true,                                   // start open (otherwise remembered per tab)
  shortcut: { key: 'k', ctrlKey: true },        // or false to disable
})
```
