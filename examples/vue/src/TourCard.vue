<script setup lang="ts">
import type { RenderContext } from '@docentjs/core'
import { ref } from 'vue'

defineProps<{ ctx: RenderContext }>()
const liked = ref(false)
</script>

<template>
  <div class="tour-card">
    <h3>{{ ctx.step.title }}</h3>
    <p v-if="ctx.step.body">{{ ctx.step.body }}</p>
    <footer>
      <span class="dots">
        <i v-for="i in ctx.progress.total" :key="i" :class="{ on: i === ctx.progress.current }" />
      </span>
      <button type="button" :aria-pressed="liked" @click="liked = !liked">{{ liked ? '♥' : '♡' }}</button>
      <button v-if="ctx.canGoBack" type="button" @click="ctx.actions.back()">Back</button>
      <button type="button" class="primary" @click="ctx.actions.next()">{{ ctx.isLast ? 'Done' : 'Next' }}</button>
    </footer>
  </div>
</template>
