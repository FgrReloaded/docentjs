<script setup lang="ts">
import { computed } from 'vue'
import type { Incident, IncidentState } from '../data'

const props = defineProps<{
  incidents: Incident[]
  states: Record<string, IncidentState>
  selected: string
  filter: 'all' | 'firing' | 'acked'
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'filter', value: 'all' | 'firing' | 'acked'): void
}>()

const order: Record<IncidentState, number> = { firing: 0, acked: 1, resolved: 2 }

const visible = computed(() =>
  props.incidents
    .filter((incident) => {
      const state = props.states[incident.id] ?? incident.state
      if (props.filter === 'all') return true
      return state === props.filter
    })
    .sort((a, b) => {
      const byState = order[props.states[a.id] ?? a.state] - order[props.states[b.id] ?? b.state]
      return byState !== 0 ? byState : a.sev - b.sev
    }),
)
</script>

<template>
  <section class="pane pane--queue" aria-label="Incident queue">
    <div class="pane__head">
      <p class="label">Queue</p>
      <div class="chips" role="group" aria-label="Filter">
        <button
          v-for="option in (['all', 'firing', 'acked'] as const)"
          :key="option"
          type="button"
          class="chip"
          :aria-pressed="filter === option"
          @click="emit('filter', option)"
        >
          {{ option }}
        </button>
      </div>
    </div>

    <div class="queue" data-docent="queue">
      <button
        v-for="incident in visible"
        :key="incident.id"
        type="button"
        class="queue__item"
        :aria-current="incident.id === selected"
        @click="emit('select', incident.id)"
      >
        <span class="sev" :data-sev="incident.sev">SEV{{ incident.sev }}</span>
        <span class="queue__title">{{ incident.title }}</span>
        <span class="queue__meta">
          <span class="queue__service">{{ incident.service }}</span>
          <span>·</span>
          <span>{{ incident.age }}</span>
          <span class="state" :data-state="states[incident.id] ?? incident.state">
            {{ states[incident.id] ?? incident.state }}
          </span>
        </span>
      </button>

      <p v-if="visible.length === 0" class="queue__empty">
        Nothing {{ filter }}. The rota is quiet — this is the state you want at 03:30.
      </p>
    </div>

    <p class="queue__foot">4 alerts silenced · 2 maintenance windows</p>
  </section>
</template>
