<script lang="ts">
  let {
    items,
    onToggle,
  }: {
    items: Array<{ id: string; label: string; who: string; done: boolean }>
    onToggle: (id: string) => void
  } = $props()
</script>

<section aria-labelledby="checks-heading">
  <div class="section__head">
    <h2 id="checks-heading">Checks</h2>
    <p class="kicker">{items.filter((i) => i.done).length} of {items.length}</p>
  </div>

  <ul class="checks" data-docent="checks">
    {#each items as item (item.id)}
      <li data-done={item.done}>
        <span class="checks__mark" aria-hidden="true">{item.done ? '✓' : ''}</span>
        <button type="button" class="btn btn--plain" onclick={() => onToggle(item.id)}>
          {item.label}
        </button>
        <span class="checks__who">{item.who}</span>
      </li>
    {/each}
  </ul>
</section>
