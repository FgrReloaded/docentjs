<script setup lang="ts">
import { DocentDevtools } from '@docentjs/devtools/vue'
import { provideDocentDefaults, TourPopover, useDocent, useTour } from '@docentjs/vue'
import { minimal } from '@docentjs/vue/themes'
import TourCard from './TourCard.vue'
import { customTour, themedTour, welcomeTour } from './tours'

provideDocentDefaults({
  renderer: { templates: { minimal: { theme: minimal } } },
  sink: { emit: (e) => console.log('[docent]', e.type, e.stepId ?? '') },
})

// The manager runs tours from their rules: the welcome tour starts itself on page load.
const docent = useDocent({ tours: [welcomeTour, themedTour] })
// A single tour on demand, drawn with our own Vue component.
const custom = useTour(customTour, { popover: true })
</script>

<template>
  <header>
    <span class="brand">Acme</span>
    <span class="spacer" />
    <button type="button" @click="docent.start(welcomeTour.id)">Built-in tour</button>
    <button type="button" @click="custom.start()">Custom popover</button>
    <button type="button" @click="docent.start(themedTour.id)">Themed</button>
  </header>
  <div class="layout">
    <aside data-docent="sidebar">
      <a href="#dashboard">Dashboard</a>
      <a href="#projects">Projects</a>
      <a href="#team">Team</a>
    </aside>
    <main>
      <div class="toolbar">
        <button type="button" id="new-project" class="primary">New project</button>
        <button type="button" id="import">Import</button>
        <button type="button" id="export">Export</button>
      </div>
      <div class="card">
        <h2 style="margin-top: 0">Welcome back</h2>
        <p>
          Manager: <b>{{ docent.state.value.active ?? 'idle' }}</b> · Custom tour:
          <b>{{ custom.state.value.status }}</b>
        </p>
      </div>
      <div class="card far">
        <label>
          Search projects
          <br />
          <input id="search" placeholder="Type anything" />
        </label>
      </div>
    </main>
  </div>
  <TourPopover :tour="custom" v-slot="{ ctx }">
    <TourCard :ctx="ctx" />
  </TourPopover>
  <!-- Development only: renders nothing and is removed from production builds. -->
  <DocentDevtools :docent="docent" />
</template>
