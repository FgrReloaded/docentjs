# @docentjs/devtools

A development panel for [Docent](https://github.com/FgrReloaded/docentjs). See every tour, why it is or is not showing for the current user, replay any tour from any step, simulate users, events and routes, check that every step's target is on the page, and watch the event timeline.

```sh
pnpm add -D @docentjs/devtools
```

## Framework components

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

### Without a framework

```ts
import { createDocent } from '@docentjs/dom'

const docent = createDocent({ tours })

if (import.meta.env.DEV) {
  import('@docentjs/devtools').then(({ mount }) => mount(docent))
}
```

Toggle the panel with the **Docent** button or **Alt+Shift+D**.

## What it shows

- **Tours**: a verdict per tour (running, eligible, waiting, blocked, manual) and the reason, e.g. `Condition failed: trait plan eq "trial" (user has "pro")`. Expand for trigger, frequency, each condition, and each step's target health. Play from any step, reset progress, copy the tour JSON.
- **Edit**: change steps, targets, tour options, arrows, spotlight, overlay and theme, and watch the running tour update live. Pick a target by clicking the page and get stable selector suggestions. Copy or download the edited JSON.
- **Simulate**: change the user id and traits, fire `track()` events, navigate client-side.
- **Events**: every lifecycle event with timestamps; copy as JSON.
- **Audit**: missing and fragile targets, contrast, duplicate ids, clicks the tour blocks and other mistakes, ranked by severity.
- **Performance**: time to show each step, long frames, popover moves and DOM cost for a played tour.

The panel docks right, bottom or left and resizes. It is built with Preact, bundled inside the package, so your app needs no extra dependencies.

`mount(docent, { open, shortcut })` returns a function that removes the panel.

MIT
