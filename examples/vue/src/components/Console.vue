<script setup lang="ts">
import { DocentDevtools } from '@docentjs/devtools/vue'
import { TourPopover, useDocent, useTour } from '@docentjs/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Event, IncidentState } from '../data'
import { incidents, timelines } from '../data'
import TourCard from '../TourCard.vue'
import { escalationTour, postmortemTour, triageTour } from '../tours'
import IncidentDetail from './IncidentDetail.vue'
import IncidentQueue from './IncidentQueue.vue'
import SignalPanel from './SignalPanel.vue'
import TopBar from './TopBar.vue'

const env = ref<'prod' | 'staging'>('prod')
const filter = ref<'all' | 'firing' | 'acked'>('all')
const selectedId = ref(incidents[0]?.id ?? '')
const states = reactive<Record<string, IncidentState>>(
  Object.fromEntries(incidents.map((incident) => [incident.id, incident.state])),
)
const added = reactive<Record<string, Event[]>>({})
const runbookOpen = ref(false)
const checked = ref<string[]>([])
const toast = ref<string | null>(null)

const incident = computed(
  () => incidents.find((item) => item.id === selectedId.value) ?? incidents[0],
)
const state = computed<IncidentState>(() => states[selectedId.value] ?? 'firing')
const events = computed<Event[]>(() => [
  ...(timelines[selectedId.value] ?? []),
  ...(added[selectedId.value] ?? []),
])
/** The element trigger on the triage tour watches for this banner. */
const sev1Open = computed(() =>
  incidents.some((item) => item.sev === 1 && states[item.id] !== 'resolved'),
)

// The manager watches triggers (an element appearing, an app event) and runs
// one tour at a time. Defaults come from the provider above.
const docent = useDocent({
  tours: [triageTour, escalationTour],
  hooks: {
    [triageTour.id]: {
      onComplete: () => say('Triage guide finished — replay it from the top bar'),
    },
  },
})

// The close-out guide is drawn by our own Vue component.
const postmortem = useTour(postmortemTour, { popover: true })

// Traits decide eligibility: the triage tour is for whoever holds the pager.
docent.identify('u_88', { role: 'oncall', team: 'platform', rota: 'W38' })

// Lets the docs link straight into a tour: /examples/vue/?start=<id>
onMounted(() => {
  const wanted = new URLSearchParams(window.location.search).get('start')
  if (!wanted) return
  if (wanted === postmortemTour.id) {
    // The close-out guide runs outside the manager, so stop the manager
    // watching triggers for this visit: the link asked for one tour.
    void docent.docent.disconnect()
    void postmortem.start()
  } else void docent.start(wanted)
})

let timer: ReturnType<typeof setTimeout> | undefined
function say(message: string) {
  toast.value = message
  clearTimeout(timer)
  timer = setTimeout(() => {
    toast.value = null
  }, 3200)
}

function record(entry: Event) {
  added[selectedId.value] = [...(added[selectedId.value] ?? []), entry]
}

function acknowledge() {
  states[selectedId.value] = 'acked'
  record({
    time: '03:30',
    kind: 'action',
    title: 'Acknowledged by you',
    detail: 'Escalation timer stopped · primary on call',
  })
  say(`${selectedId.value} acknowledged`)
}

function resolve() {
  states[selectedId.value] = 'resolved'
  record({
    time: '03:41',
    kind: 'action',
    title: 'Resolved by you',
    detail: 'p99 inside budget for 10 minutes',
  })
  say(`${selectedId.value} resolved`)
}

function escalate() {
  record({
    time: '03:33',
    kind: 'alert',
    title: 'Escalated to secondary',
    detail: 'M. Lindqvist paged · 10 minute response clock',
  })
  say('Secondary paged')
  // Fires the `event` trigger on the escalation tour.
  docent.track('incident-escalated')
}

function addNote(text: string) {
  record({ time: '03:36', kind: 'note', title: 'Note from you', detail: text })
}

function check(id: string) {
  checked.value = checked.value.includes(id)
    ? checked.value.filter((item) => item !== id)
    : [...checked.value, id]
}

function guide(which: 'triage' | 'postmortem') {
  if (which === 'triage') {
    void docent.start(triageTour.id)
    return
  }
  // Only one tour at a time, even across two controllers.
  void docent.stop()
  void postmortem.start()
}

// Switching incidents closes the runbook: it belongs to one alert rule.
watch(selectedId, () => {
  runbookOpen.value = false
})
</script>

<template>
  <TopBar :env="env" @update:env="env = $event" @guide="guide" />

  <div v-if="sev1Open" class="banner" data-docent="sev1-banner">
    <span class="sev" data-sev="1">SEV1</span>
    <span>
      <b>checkout-api</b> is burning its latency budget in eu-west-1.
    </span>
    <span class="banner__age">page opened 03:12 · 18m ago</span>
  </div>

  <div class="console">
    <IncidentQueue
      :incidents="incidents"
      :states="states"
      :selected="selectedId"
      :filter="filter"
      @select="selectedId = $event"
      @filter="filter = $event"
    />

    <IncidentDetail
      v-if="incident"
      :incident="incident"
      :state="state"
      :events="events"
      :runbook-open="runbookOpen"
      :checked="checked"
      @ack="acknowledge"
      @resolve="resolve"
      @escalate="escalate"
      @toggle-runbook="runbookOpen = !runbookOpen"
      @check="check"
      @note="addNote"
    />

    <SignalPanel />
  </div>

  <output v-if="toast" class="toast">
    <span class="pm__lamp" aria-hidden="true"></span>
    {{ toast }}
  </output>

  <!-- Teleports the card above into the container Docent positions. -->
  <TourPopover :tour="postmortem" v-slot="{ ctx }">
    <TourCard :ctx="ctx" />
  </TourPopover>

  <!-- Development only: renders nothing and drops out of production builds. -->
  <DocentDevtools :docent="docent" />
</template>
