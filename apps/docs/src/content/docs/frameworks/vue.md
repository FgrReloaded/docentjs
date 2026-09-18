---
title: Vue
description: A composable and a teleporting component for Vue 3.
---

```sh
pnpm add @docentjs/vue
```

## `useTour`

```vue
<script setup lang="ts">
import { useTour } from '@docentjs/vue'
import { welcomeTour } from './tours'

const tour = useTour(welcomeTour)
</script>

<template>
  <button @click="tour.start()">Take the tour</button>
  <p>Status: {{ tour.state.value.status }}</p>
</template>
```

Called inside `setup()`, the controller is destroyed with the component. Outside a component, call `tour.destroy()` yourself.

## Custom popover

Enable headless mode with `popover: true` and place a `<TourPopover>` anywhere. Its default slot is teleported into the positioned container and receives the render context.

```vue
<script setup lang="ts">
import { TourPopover, useTour } from '@docentjs/vue'
import Card from './Card.vue'

const tour = useTour(welcomeTour, { popover: true })
</script>

<template>
  <button @click="tour.start()">Start</button>
  <TourPopover :tour="tour" v-slot="{ ctx }">
    <Card :ctx="ctx" />
  </TourPopover>
</template>
```

## Shared defaults

```ts
// in a parent setup()
provideDocentDefaults({
  renderer: { theme: minimal, templates: { card } },
  identity: { id: user.id, traits: { plan: user.plan } },
})
```
