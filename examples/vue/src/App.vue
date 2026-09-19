<script setup lang="ts">
import { minimal } from '@docentjs/vue/themes'
import { provideDocentDefaults, TourPopover, useTour } from '@docentjs/vue'
import TourCard from './TourCard.vue'
import { customTour, themedTour, welcomeTour } from './tours'

provideDocentDefaults({
  renderer: { templates: { minimal: { theme: minimal } } },
  sink: { emit: (e) => console.log('[docent]', e.type, e.stepId ?? '') },
})

const welcome = useTour(welcomeTour)
const custom = useTour(customTour, { popover: true })
const themed = useTour(themedTour)
</script>

<template>
  <header>
    <span class="brand">Acme</span>
    <span class="spacer" />
    <button type="button" @click="welcome.start()">Built-in tour</button>
    <button type="button" @click="custom.start()">Custom popover</button>
    <button type="button" @click="themed.start()">Themed</button>
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
          Tour status: <b>{{ welcome.state.value.status }}</b> / <b>{{ custom.state.value.status }}</b> /
          <b>{{ themed.state.value.status }}</b>
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
</template>
