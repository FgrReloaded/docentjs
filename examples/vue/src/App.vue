<script setup lang="ts">
import { type EventSink, provideDocentDefaults } from '@docentjs/vue'
import Console from './components/Console.vue'
import { rendererDefaults } from './tour-theme'

/** Where product analytics would go. Every tour event arrives here. */
const analytics: EventSink = {
  emit: (event) => console.debug('[docent]', event.type, event.tourId, event.stepId ?? ''),
}

// Shared with every tour below: the theme, the templates and the sink.
// Provided here rather than inside the console, because a component cannot
// inject what it provides itself.
provideDocentDefaults({ renderer: rendererDefaults, sink: analytics })
</script>

<template>
  <Console />
</template>
