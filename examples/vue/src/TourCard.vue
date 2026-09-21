<script setup lang="ts">
import type { RenderContext } from '@docentjs/vue'

/**
 * Our own popover (headless mode). Docent keeps the overlay, spotlight,
 * positioning, focus and keys; everything inside the card is ours.
 */
defineProps<{ ctx: RenderContext }>()
</script>

<template>
  <div class="pm">
    <div class="pm__bar">
      <span class="pm__lamp" aria-hidden="true"></span>
      <span>close-out</span>
      <span class="pm__step">{{ ctx.progress.current }}/{{ ctx.progress.total }}</span>
    </div>

    <div class="pm__body">
      <h3>{{ ctx.step.title }}</h3>
      <p v-if="ctx.step.body">{{ ctx.step.body }}</p>
      <code v-if="ctx.isLast" class="pm__cmd">cinder postmortem draft INC-2291</code>
    </div>

    <div class="pm__foot">
      <button
        v-if="ctx.canGoBack"
        type="button"
        class="btn btn--ghost"
        @click="ctx.actions.back()"
      >
        Back
      </button>
      <button type="button" class="btn btn--ember" @click="ctx.actions.next()">
        {{ ctx.isLast ? 'Finish' : 'Next' }}
      </button>
    </div>
  </div>
</template>
