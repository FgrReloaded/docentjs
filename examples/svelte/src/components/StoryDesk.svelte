<script lang="ts">
  import type { Story, StoryState } from '../data'

  let {
    story,
    state,
    time,
    blocked,
    onTime,
    onReview,
    onPublish,
    onClose,
  }: {
    story: Story
    state: StoryState
    time: string
    blocked: number
    onTime: (value: string) => void
    onReview: () => void
    onPublish: () => void
    onClose: () => void
  } = $props()

  const slug = $derived(
    story.headline
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .split('-')
      .slice(0, 4)
      .join('-'),
  )
</script>

<div class="editor">
  <div class="editor__head">
    <p class="kicker">On the desk · {story.slot}</p>
    <span class="pill" data-state={state}>{state}</span>
    <button type="button" class="btn btn--plain btn--small" onclick={onClose}>Close</button>
  </div>

  <div class="editor__body">
    <div>
      <h3>{story.headline}</h3>
      <p>{story.standfirst}</p>
      <p style="margin-top: 12px; font-size: 0.6875rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3)">
        {story.byline} · {story.desk} · {story.words.toLocaleString()} words · sub-edited
      </p>
    </div>

    <div>
      <label class="field" for="schedule-input">
        <span>Publish time</span>
        <input
          id="schedule-input"
          data-docent="schedule"
          value={time}
          placeholder="18:30"
          oninput={(e) => onTime(e.currentTarget.value)}
        />
      </label>
      <label class="field" for="slug-input">
        <span>Slug</span>
        <input id="slug-input" value={slug} readonly />
      </label>
    </div>
  </div>

  <div class="editor__foot">
    <p class="kicker">
      {blocked === 0 ? 'All checks clear' : `${blocked} checks still open`}
    </p>
    <button type="button" class="btn" disabled={state !== 'draft'} onclick={onReview}>
      Send to review
    </button>
    <button
      type="button"
      class="btn btn--live"
      data-docent="publish"
      disabled={blocked > 0 || state === 'live'}
      onclick={onPublish}
    >
      Publish now
    </button>
  </div>
</div>
