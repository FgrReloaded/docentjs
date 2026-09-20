<script setup lang="ts">
import { computed } from 'vue'
import { dependencies, deploys, latency, latencyBudget } from '../data'

/* One measure, one axis: p99 latency for the last 30 minutes against the
   budget it is meant to stay under. The dashed line is the budget, the solid
   line is reality, and the only number spelled out is the current one. */
const W = 268
const H = 92
const PAD = 6
const floor = 700
const ceiling = 2600

const y = (value: number) => H - PAD - ((value - floor) / (ceiling - floor)) * (H - PAD * 2)
const x = (index: number) => PAD + (index / (latency.length - 1)) * (W - PAD * 2)

const line = computed(() => latency.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)} ${y(v)}`).join(' '))
const budgetY = computed(() => y(latencyBudget))
const current = computed(() => latency[latency.length - 1] ?? 0)
const peak = computed(() => Math.max(...latency))

const stateLabel: Record<'ok' | 'degraded', string> = { ok: 'healthy', degraded: 'degraded' }
</script>

<template>
  <section class="pane pane--signals" data-docent="signals" aria-label="Signals">
    <div>
      <div class="pane__head">
        <p class="label">p99 latency · 30 min</p>
      </div>
      <p class="chart__value">
        <b>{{ (current / 1000).toFixed(2) }}s</b>
        <span>peak {{ (peak / 1000).toFixed(2) }}s · budget 1.20s</span>
      </p>
      <svg
        class="chart"
        :viewBox="`0 0 ${W} ${H}`"
        role="img"
        aria-label="p99 latency over the last 30 minutes, above the 1.2 second budget for most of it"
      >
        <line
          :x1="0"
          :x2="W"
          :y1="budgetY"
          :y2="budgetY"
          stroke="var(--text-3)"
          stroke-width="1"
          stroke-dasharray="3 4"
        />
        <path :d="line" fill="none" stroke="var(--crit)" stroke-width="2" stroke-linejoin="round" />
        <circle :cx="W - PAD" :cy="y(current)" r="3.5" fill="var(--crit)" />
      </svg>
    </div>

    <div>
      <div class="pane__head">
        <p class="label">Dependencies</p>
      </div>
      <ul class="deps">
        <li v-for="dep in dependencies" :key="dep.name">
          <span class="deps__name">{{ dep.name }}</span>
          <span
            class="state deps__state"
            :data-state="dep.state === 'ok' ? 'resolved' : 'acked'"
          >
            {{ stateLabel[dep.state] }}
          </span>
        </li>
      </ul>
    </div>

    <div>
      <div class="pane__head">
        <p class="label">Deploys · 6 hours</p>
      </div>
      <ul class="deploys">
        <li v-for="deploy in deploys" :key="deploy.sha">
          <span class="deploys__sha">{{ deploy.sha }}</span>
          <span class="deploys__meta">
            {{ deploy.service }}<br />
            {{ deploy.at }} · {{ deploy.author }}
          </span>
          <span v-if="deploy.suspect" class="deploys__flag">suspect</span>
        </li>
      </ul>
    </div>
  </section>
</template>
