<script setup lang="ts">
import { type EventSink, provideDocentDefaults } from '@docentjs/vue'
import Console from './components/Console.vue'
import { rendererDefaults } from './tour-theme'

/** Every tour event arrives here; product analytics would go in its place. */
const analytics: EventSink = {
  emit: (event) => console.debug('[docent]', event.type, event.tourId, event.stepId ?? ''),
}

// Provided here, not in the console: a component cannot inject what it provides.
provideDocentDefaults({ renderer: rendererDefaults, sink: analytics })
</script>

<template>
  <Console />
</template>
