<script lang="ts">
  import { desks } from '../data'

  let {
    edition,
    desk,
    query,
    onEdition,
    onDesk,
    onQuery,
    onGuide,
  }: {
    edition: 'evening' | 'morning'
    desk: string
    query: string
    onEdition: (value: 'evening' | 'morning') => void
    onDesk: (value: string) => void
    onQuery: (value: string) => void
    onGuide: (which: 'desk' | 'publish') => void
  } = $props()
</script>

<header class="masthead">
  <div class="masthead__top">
    <fieldset class="masthead__edition" data-docent="edition">
      <legend class="visually-hidden">Edition</legend>
      <button type="button" aria-pressed={edition === 'evening'} onclick={() => onEdition('evening')}>
        Evening
      </button>
      <button type="button" aria-pressed={edition === 'morning'} onclick={() => onEdition('morning')}>
        Morning
      </button>
    </fieldset>

    <span>Thursday 20 September · 17:20</span>

    <div class="masthead__tools">
      <button type="button" class="btn btn--plain btn--small" onclick={() => onGuide('desk')}>
        Desk guide
      </button>
      <button type="button" class="btn btn--plain btn--small" onclick={() => onGuide('publish')}>
        Publish check
      </button>
      <label class="search" for="desk-search">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="6.2" cy="6.2" r="4.2" stroke="currentColor" stroke-width="1.4" />
          <path d="M9.4 9.4 12 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
        </svg>
        <input
          id="desk-search"
          type="search"
          placeholder="Search stories"
          value={query}
          oninput={(e) => onQuery(e.currentTarget.value)}
        />
      </label>
    </div>
  </div>

  <h1 class="masthead__name">Pressroom</h1>
  <p class="masthead__strap">Edition desk · {edition} · four hours to deadline</p>

  <nav class="desks" aria-label="Desks">
    {#each desks as name (name)}
      <button type="button" aria-current={desk === name} onclick={() => onDesk(name)}>
        {name}
      </button>
    {/each}
  </nav>
</header>
