<script lang="ts">
  import type { RenderContext } from '@docentjs/svelte'

  /**
   * The publish check, drawn by Svelte rather than the built-in popover.
   * Docent still owns the overlay, the spotlight, positioning and keys.
   */
  let { ctx }: { ctx: RenderContext } = $props()
</script>

<div class="proof">
  <div class="proof__head">
    <span>Proof</span>
    <span class="proof__folio">{ctx.progress.current} / {ctx.progress.total}</span>
  </div>

  <div class="proof__body">
    <h3>{ctx.step.title}</h3>
    {#if ctx.step.body}<p>{ctx.step.body}</p>{/if}
    <div class="proof__rule" aria-hidden="true">
      {#each { length: ctx.progress.total } as _, i (i)}
        <i data-done={i < ctx.progress.current}></i>
      {/each}
    </div>
  </div>

  <div class="proof__foot">
    {#if ctx.canGoBack}
      <button type="button" class="btn btn--plain btn--small" onclick={ctx.actions.back}>Back</button>
    {/if}
    <button type="button" class="btn btn--live btn--small" onclick={ctx.actions.next}>
      {ctx.isLast ? 'Send to press' : 'Next'}
    </button>
  </div>
</div>
