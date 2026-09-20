/**
 * Pressroom's tours. Three shapes of guidance from one schema: a walkthrough,
 * a note that does not block the page, and a publish check drawn by the app.
 */

import { defineTour } from '@docentjs/svelte'

/** First shift on the desk. Starts itself, once, and remembers where you got to. */
export const deskTour = defineTour({
  id: 'pressroom-desk',
  version: 2,
  name: 'The desk',
  description: 'How a story moves from draft to the front page.',
  trigger: { type: 'auto', delay: 700 },
  conditions: [{ type: 'trait', key: 'role', op: 'in', value: ['editor', 'producer'] }],
  options: {
    persist: true,
    frequency: 'until-completed',
    showProgress: true,
    template: 'broadsheet',
    scroll: { enabled: true, behavior: 'smooth', block: 'center' },
  },
  steps: [
    {
      id: 'welcome',
      title: 'Tonight’s run of show',
      body: 'Five stories, one front page and about ninety minutes. This is the order they go out in.',
      arrow: 'none',
    },
    {
      id: 'edition',
      target: { name: 'edition' },
      title: 'Everything is scoped to an edition',
      body: 'Switch it and the run of show, the front page and the push queue all follow.',
      placement: 'bottom-start',
    },
    {
      id: 'run',
      target: { name: 'run' },
      title: 'Slots, not a backlog',
      body: 'Each story holds a named slot. Reordering here reorders the page — there is no second list to keep in step.',
      placement: 'right',
      spotlight: { padding: 12, radius: 4 },
    },
    {
      id: 'open',
      target: { name: 'open-second' },
      title: 'Open the bus piece',
      body: 'It is the one waiting on you. Click **Open** to bring it onto the desk.',
      format: 'markdown',
      placement: 'left',
      advance: { on: 'click' },
      interaction: 'allow',
      buttons: { next: false },
    },
    {
      id: 'schedule',
      target: { name: 'schedule' },
      title: 'Publish time is a promise',
      body: 'Newsletter and push both read this field. Type a time to carry on.',
      placement: 'top',
      onMissing: 'wait',
      waitFor: 3000,
      advance: { on: 'input' },
      interaction: 'allow',
      buttons: { next: false },
    },
    {
      id: 'checks',
      target: { name: 'checks' },
      title: 'Two checks still open',
      body: 'Photo rights and push copy. Publishing is blocked until both clear — deliberately.',
      placement: 'left',
    },
    {
      id: 'front',
      target: { name: 'front' },
      title: 'The page, as readers will get it',
      body: 'Live preview of the front. If a headline does not fit here, it does not fit.',
      placement: 'left',
    },
    {
      id: 'done',
      title: 'That is the desk',
      body: 'Open, schedule, clear the checks, publish. Replay this from **Guides** in the masthead.',
      format: 'markdown',
      arrow: 'none',
    },
  ],
})

/** Raised by the app after a story is sent for review. Never blocks the page. */
export const reviewTour = defineTour({
  id: 'pressroom-review',
  version: 1,
  name: 'In review',
  trigger: { type: 'event', name: 'story-submitted' },
  options: {
    persist: true,
    frequency: 'once',
    showProgress: false,
    template: 'galley',
    labels: { next: 'Right', done: 'Right' },
  },
  steps: [
    {
      id: 'queue',
      target: { name: 'checks' },
      title: 'It is with the legal read now',
      body: 'You keep the story on your desk. The checks panel turns green as each one clears.',
      placement: 'left',
      interaction: 'allow',
    },
  ],
})

/**
 * The publish check, drawn by a Svelte component. Docent keeps the overlay,
 * the spotlight, positioning and keys; the card is ours.
 */
export const publishTour = defineTour({
  id: 'pressroom-publish',
  version: 1,
  name: 'Before you publish',
  options: {
    showProgress: true,
    spotlight: { padding: 9, radius: 3, ring: 'solid' },
    overlay: { style: 'dim', color: 'oklch(24% 0.03 60)', opacity: 0.5 },
  },
  steps: [
    {
      id: 'checks',
      target: { name: 'checks' },
      title: 'Clear the checks first',
      body: 'Legal and facts are signed. Photo rights and push copy are not, and both block the button.',
      placement: 'left',
    },
    {
      id: 'front',
      target: { name: 'front' },
      title: 'Read the page cold',
      body: 'Headline, standfirst, byline. Most corrections we issue would have been caught here.',
      placement: 'left',
    },
    {
      id: 'publish',
      target: { name: 'publish' },
      title: 'Publishing is not the end',
      body: 'The edition stays editable for twenty minutes, and every change is versioned.',
      placement: 'top-end',
    },
  ],
})
