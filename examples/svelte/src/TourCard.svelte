<script lang="ts">
import type { RenderContext } from '@docentjs/svelte'

let { ctx }: { ctx: RenderContext } = $props()
let liked = $state(false)
</script>

<div class="tour-card">
  <h3>{ctx.step.title}</h3>
  {#if ctx.step.body}<p>{ctx.step.body}</p>{/if}
  <footer>
    <span class="dots">
      {#each { length: ctx.progress.total } as _, i (i)}
        <i class:on={i + 1 === ctx.progress.current}></i>
      {/each}
    </span>
    <button type="button" aria-pressed={liked} onclick={() => (liked = !liked)}>{liked ? '♥' : '♡'}</button>
    {#if ctx.canGoBack}<button type="button" onclick={ctx.actions.back}>Back</button>{/if}
    <button type="button" class="primary" onclick={ctx.actions.next}>{ctx.isLast ? 'Done' : 'Next'}</button>
  </footer>
</div>
