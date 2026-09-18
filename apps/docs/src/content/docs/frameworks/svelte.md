---
title: Svelte
description: Stores, a component prop, and an action for Svelte 4 and 5.
---

```sh
pnpm add @docentjs/svelte
```

## `useTour`

Returns readable stores for state, plus the controls.

```svelte
<script lang="ts">
  import { useTour } from '@docentjs/svelte'
  import { onDestroy } from 'svelte'
  import { welcomeTour } from './tours'

  const tour = useTour(welcomeTour)
  const state = tour.state
  onDestroy(tour.destroy)
</script>

<button onclick={() => tour.start()}>Take the tour</button>
<p>Status: {$state.status}</p>
```

## Custom popover

Pass a component. It is mounted into the positioned container for every step with `ctx` as a prop, and unmounted before the next one.

```svelte
<script lang="ts">
  import Card from './Card.svelte'
  const tour = useTour(welcomeTour, { popover: Card })
</script>
```

```svelte
<!-- Card.svelte -->
<script lang="ts">
  import type { RenderContext } from '@docentjs/core'
  let { ctx }: { ctx: RenderContext } = $props()
</script>

<div class="card">
  <h3>{ctx.step.title}</h3>
  <button onclick={ctx.actions.next}>{ctx.isLast ? 'Done' : 'Next'}</button>
</div>
```

## Action

`use:tour` starts the tour when the element mounts and destroys it when the element is removed.

```svelte
<div use:tour={handle}>…</div>
```
