# @docentjs/svelte

Svelte bindings for [Docent](https://github.com/FgrReloaded/docentjs), a guided product tour library. Svelte 4 and 5.

```sh
pnpm add @docentjs/svelte
```

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
<p>{$state.status}</p>
```

## Your own popover

```ts
const tour = useTour(welcomeTour, { popover: Card }) // mounted per step with `ctx` as a prop
```

## Many tours

```ts
const docent = useDocent({ tours: [welcome, invoices] })
docent.identify(user.id, { plan: user.plan })
```

Tours start from their own triggers, conditions and frequency.

Also the `use:tour={handle}` action, which starts on mount and destroys on removal.

MIT
