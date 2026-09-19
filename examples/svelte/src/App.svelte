<script lang="ts">
import { minimal } from '@docentjs/svelte/themes'
import { useTour } from '@docentjs/svelte'
import { onDestroy } from 'svelte'
import TourCard from './TourCard.svelte'
import { customTour, themedTour, welcomeTour } from './tours'

const shared = {
  renderer: { templates: { minimal: { theme: minimal } } },
  sink: {
    emit: (e: { type: string; stepId?: string }) => console.log('[docent]', e.type, e.stepId ?? ''),
  },
}
const welcome = useTour(welcomeTour, shared)
const custom = useTour(customTour, { ...shared, popover: TourCard })
const themed = useTour(themedTour, shared)
onDestroy(() => {
  welcome.destroy()
  custom.destroy()
  themed.destroy()
})
const welcomeState = welcome.state
const customState = custom.state
const themedState = themed.state
</script>

<header>
  <span class="brand">Acme</span>
  <span class="spacer"></span>
  <button type="button" onclick={() => welcome.start()}>Built-in tour</button>
  <button type="button" onclick={() => custom.start()}>Custom popover</button>
  <button type="button" onclick={() => themed.start()}>Themed</button>
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
      <p>Tour status: <b>{$welcomeState.status}</b> / <b>{$customState.status}</b> / <b>{$themedState.status}</b></p>
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
