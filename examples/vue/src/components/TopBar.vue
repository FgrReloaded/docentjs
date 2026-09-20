<script setup lang="ts">
defineProps<{ env: 'prod' | 'staging' }>()
const emit = defineEmits<{
  (e: 'update:env', value: 'prod' | 'staging'): void
  (e: 'guide', value: 'triage' | 'postmortem'): void
}>()
</script>

<template>
  <header class="bar">
    <span class="bar__brand">
      <svg class="bar__spark" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          d="M9 1.5c2.2 3 1.2 4.6.2 5.8C8 8.8 7 9.9 7 11.4a2 2 0 0 0 4 0c0-.6-.2-1-.4-1.4 2 1 3.4 2.6 3.4 4.4a5 5 0 0 1-10 0c0-2.4 1.3-3.8 2.6-5.2C7.9 7.8 9.1 6.4 9 1.5Z"
          fill="currentColor"
        />
      </svg>
      Cinder
    </span>

    <fieldset class="bar__env" data-docent="env">
      <legend class="visually-hidden">Environment</legend>
      <button type="button" :aria-pressed="env === 'prod'" @click="emit('update:env', 'prod')">
        prod
      </button>
      <button
        type="button"
        :aria-pressed="env === 'staging'"
        @click="emit('update:env', 'staging')"
      >
        staging
      </button>
    </fieldset>

    <span class="bar__clock">03:30 UTC · rota W38</span>

    <button type="button" class="btn btn--ghost" @click="emit('guide', 'triage')">
      Replay triage
    </button>
    <button type="button" class="btn btn--ghost" @click="emit('guide', 'postmortem')">
      Close-out guide
    </button>

    <span class="bar__who">
      <span class="bar__avatar">AV</span>
      <span class="bar__role">Primary on call</span>
    </span>
  </header>
</template>
