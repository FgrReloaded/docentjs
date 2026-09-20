<script setup lang="ts">
import { ref } from 'vue'
import type { Event, Incident, IncidentState } from '../data'
import { runbook } from '../data'

defineProps<{
  incident: Incident
  state: IncidentState
  events: Event[]
  runbookOpen: boolean
  checked: string[]
}>()

const emit = defineEmits<{
  (e: 'ack'): void
  (e: 'resolve'): void
  (e: 'escalate'): void
  (e: 'toggle-runbook'): void
  (e: 'check', id: string): void
  (e: 'note', text: string): void
}>()

const note = ref('')

function submitNote() {
  if (!note.value.trim()) return
  emit('note', note.value.trim())
  note.value = ''
}
</script>

<template>
  <section class="pane pane--detail" aria-label="Incident detail">
    <div class="detail__head">
      <div>
        <div class="detail__id">
          <span class="sev" :data-sev="incident.sev">SEV{{ incident.sev }}</span>
          <span class="mono" style="color: var(--text-3)">{{ incident.id }}</span>
          <span class="state" :data-state="state">{{ state }}</span>
        </div>
        <h1>{{ incident.title }}</h1>
      </div>

      <div class="detail__actions">
        <button type="button" class="btn btn--ghost" @click="emit('escalate')">Escalate</button>
        <button
          type="button"
          class="btn"
          data-docent="resolve"
          :disabled="state === 'resolved'"
          @click="emit('resolve')"
        >
          Resolve
        </button>
        <button
          type="button"
          class="btn btn--ember"
          data-docent="ack"
          :disabled="state !== 'firing'"
          @click="emit('ack')"
        >
          {{ state === 'firing' ? 'Acknowledge' : 'Acknowledged' }}
        </button>
      </div>
    </div>

    <div v-if="state !== 'firing'" class="ack" data-docent="ack-confirm">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <circle cx="7.5" cy="7.5" r="6.2" stroke="currentColor" stroke-width="1.4" />
        <path
          d="M4.8 7.8 6.7 9.6 10.3 5.8"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>
        Escalation paused. You own <b>{{ incident.id }}</b> until it is resolved or handed over.
      </span>
    </div>

    <div class="facts" data-docent="facts">
      <div class="fact">
        <span class="label">Service</span>
        <b>{{ incident.service }}</b>
      </div>
      <div class="fact">
        <span class="label">Region</span>
        <b>{{ incident.region }}</b>
      </div>
      <div class="fact">
        <span class="label">Started</span>
        <b>{{ incident.started }} · {{ incident.age }}</b>
      </div>
      <div class="fact" :class="{ 'fact--breach': incident.breached }">
        <span class="label">Against budget</span>
        <b>{{ incident.budget }}</b>
      </div>
    </div>

    <div class="card" data-docent="timeline">
      <div class="card__head">
        <p class="label">Timeline</p>
        <span class="mono" style="color: var(--text-3)">{{ events.length }} entries</span>
      </div>
      <div class="card__body">
        <ul class="timeline">
          <li v-for="(event, i) in events" :key="`${event.time}-${i}`" :data-kind="event.kind">
            <time>{{ event.time }}</time>
            <span class="timeline__dot" aria-hidden="true"></span>
            <span class="timeline__text">
              <b>{{ event.title }}</b>
              {{ event.detail }}
            </span>
          </li>
        </ul>
      </div>
      <div class="note">
        <label class="visually-hidden" for="note-input">Add a note</label>
        <input
          id="note-input"
          v-model="note"
          data-docent="note"
          placeholder="What did you try?"
          @keyup.enter="submitNote"
        />
        <button type="button" class="btn" @click="submitNote">Add note</button>
      </div>
    </div>

    <div class="card">
      <div class="card__head">
        <p class="label">Runbook · checkout-latency</p>
        <button
          type="button"
          class="btn btn--ghost"
          data-docent="runbook-toggle"
          :aria-expanded="runbookOpen"
          @click="emit('toggle-runbook')"
        >
          {{ runbookOpen ? 'Hide' : 'Open runbook' }}
        </button>
      </div>
      <div v-if="runbookOpen" class="card__body">
        <ul class="runbook" data-docent="runbook-steps">
          <li v-for="step in runbook" :key="step.id">
            <input
              :id="`rb-${step.id}`"
              type="checkbox"
              :checked="checked.includes(step.id)"
              @change="emit('check', step.id)"
            />
            <label :for="`rb-${step.id}`">
              {{ step.text }}<code v-if="step.code">{{ step.code }}</code>
            </label>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
