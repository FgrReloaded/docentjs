<script lang="ts">
  import { DocentDevtools } from '@docentjs/devtools/svelte'
  import { useDocent, useTour } from '@docentjs/svelte'
  import { minimal } from '@docentjs/svelte/themes'
  import { onDestroy } from 'svelte'
  import TourCard from './TourCard.svelte'
  import { customTour, themedTour, welcomeTour } from './tours'

  const shared = {
    renderer: { templates: { minimal: { theme: minimal } } },
    sink: { emit: (e: { type: string; stepId?: string }) => console.log('[docent]', e.type, e.stepId ?? '') },
  }
  // The manager runs tours from their rules: the welcome tour starts itself on page load.
  const docent = useDocent({ ...shared, tours: [welcomeTour, themedTour] })
  // A single tour on demand, drawn with our own Svelte component.
  const custom = useTour(customTour, { ...shared, popover: TourCard })
  onDestroy(() => {
    docent.destroy()
    custom.destroy()
  })
  const managerState = docent.state
  const customState = custom.state
</script>

<header>
  <span class="brand">Acme</span>
  <span class="spacer"></span>
  <button type="button" onclick={() => docent.start(welcomeTour.id)}>Built-in tour</button>
  <button type="button" onclick={() => custom.start()}>Custom popover</button>
  <button type="button" onclick={() => docent.start(themedTour.id)}>Themed</button>
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
      <p>Manager: <b>{$managerState.active ?? 'idle'}</b> · Custom tour: <b>{$customState.status}</b></p>
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

<!-- Development only: renders nothing and is removed from production builds. -->
<DocentDevtools {docent} />
