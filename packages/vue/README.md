# @docentjs/vue

Vue 3 bindings for [Docent](https://github.com/FgrReloaded/docentjs), a guided product tour library.

```sh
pnpm add @docentjs/vue
```

```vue
<script setup lang="ts">
import { useTour } from '@docentjs/vue'
import { welcomeTour } from './tours'

const tour = useTour(welcomeTour)
</script>

<template>
  <button @click="tour.start()">Take the tour</button>
</template>
```

## Your own popover

```vue
<script setup lang="ts">
import { TourPopover, useTour } from '@docentjs/vue'
const tour = useTour(welcomeTour, { popover: true })
</script>

<template>
  <TourPopover :tour="tour" v-slot="{ ctx }">
    <Card :ctx="ctx" />
  </TourPopover>
</template>
```

Also `provideDocentDefaults()` to share renderer defaults, identity, storage and sink.

MIT
