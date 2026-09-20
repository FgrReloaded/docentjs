<script lang="ts">
  import type { Story, StoryState } from '../data'

  let {
    stories,
    states,
    openId,
    query,
    onOpen,
  }: {
    stories: Story[]
    states: Record<string, StoryState>
    openId: string | null
    query: string
    onOpen: (id: string) => void
  } = $props()

  const label: Record<StoryState, string> = {
    draft: 'Draft',
    review: 'In review',
    scheduled: 'Scheduled',
    live: 'Live',
  }
</script>

<section aria-labelledby="run-heading">
  <div class="section__head">
    <h2 id="run-heading">Run of show</h2>
    <p class="kicker">{stories.length} stories · 6,540 words</p>
  </div>

  <ol class="run" data-docent="run">
    {#each stories as story, i (story.id)}
      <li class="story" class:story--open={story.id === openId}>
        <span class="story__slot">{story.slot}</span>

        <div>
          <h3 class="story__headline">{story.headline}</h3>
          <p class="story__standfirst">{story.standfirst}</p>
          <p class="story__meta">
            <span>By {story.byline}</span>
            <span>·</span>
            <span>{story.desk}</span>
            <span>·</span>
            <span>{story.words.toLocaleString()} words</span>
          </p>
        </div>

        <div class="story__side">
          <span class="pill" data-state={states[story.id] ?? story.state}>
            {label[states[story.id] ?? story.state]}
          </span>
          <span class="story__time">{story.time}</span>
          <span class="story__actions">
            <button
              type="button"
              class="btn btn--small"
              data-docent={i === 1 ? 'open-second' : undefined}
              onclick={() => onOpen(story.id)}
            >
              Open
            </button>
          </span>
        </div>
      </li>
    {/each}

    {#if stories.length === 0}
      <li class="run__empty">
        <b>Nothing matches “{query}”</b>
        Search by headline, byline or desk. Spiked stories are kept for thirty days.
      </li>
    {/if}
  </ol>
</section>
