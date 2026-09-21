<script lang="ts">
  import { DocentDevtools } from '@docentjs/devtools/svelte'
  import { type EventSink, useDocent, useTour } from '@docentjs/svelte'
  import { onDestroy, onMount } from 'svelte'
  import Checks from './components/Checks.svelte'
  import FrontPage from './components/FrontPage.svelte'
  import Masthead from './components/Masthead.svelte'
  import RunOfShow from './components/RunOfShow.svelte'
  import StoryDesk from './components/StoryDesk.svelte'
  import { checks as initialChecks, stories, type StoryState } from './data'
  import TourCard from './TourCard.svelte'
  import { rendererDefaults } from './tour-theme'
  import { deskTour, publishTour, reviewTour } from './tours'

  /** Every tour event arrives here; product analytics would go in its place. */
  const analytics: EventSink = {
    emit: (event) => console.debug('[docent]', event.type, event.tourId, event.stepId ?? ''),
  }

  // Svelte has no provider, so shared options go to both controllers by hand.
  const shared = { renderer: rendererDefaults, sink: analytics }

  let edition = $state<'evening' | 'morning'>('evening')
  let desk = $state('All desks')
  let query = $state('')
  let openId = $state<string | null>(null)
  let time = $state('18:30')
  let toast = $state<string | null>(null)
  let states = $state<Record<string, StoryState>>(
    Object.fromEntries(stories.map((story) => [story.id, story.state])),
  )
  let checks = $state(initialChecks.map((check) => ({ ...check })))

  const visible = $derived(
    stories.filter((story) => {
      const onDesk = desk === 'All desks' || story.desk === desk
      const q = query.trim().toLowerCase()
      const found =
        !q ||
        story.headline.toLowerCase().includes(q) ||
        story.byline.toLowerCase().includes(q) ||
        story.desk.toLowerCase().includes(q)
      return onDesk && found
    }),
  )
  const open = $derived(stories.find((story) => story.id === openId))
  const blocked = $derived(checks.filter((check) => !check.done).length)

  let timer: ReturnType<typeof setTimeout> | undefined
  function say(message: string) {
    toast = message
    clearTimeout(timer)
    timer = setTimeout(() => {
      toast = null
    }, 3200)
  }

  // Watches triggers, checks conditions, runs one tour at a time. Hooks are keyed by tour id.
  const docent = useDocent({
    ...shared,
    tours: [deskTour, reviewTour],
    hooks: {
      [deskTour.id]: {
        steps: {
          // Open it anyway, so the step always has a target.
          schedule: {
            beforeShow: (): undefined => {
              openId ??= 'st-398'
            },
          },
        },
        onComplete: () => say('Desk guide finished — replay it from the masthead'),
      },
    },
  })

  // Drawn by our own component.
  const publish = useTour(publishTour, { ...shared, popover: TourCard })

  // Traits decide eligibility: the desk tour is for editors and producers.
  docent.identify('u_17', { role: 'editor', desk: 'news', edition: 'evening' })

  // Lets the docs link into a tour: ?start=<id>.
  onMount(() => {
    const wanted = new URLSearchParams(window.location.search).get('start')
    if (!wanted) return
    if (wanted === publishTour.id) {
      // It runs outside the manager, so stop the manager watching triggers.
      void docent.docent.disconnect()
      void publish.start()
    } else void docent.start(wanted)
  })

  onDestroy(() => {
    clearTimeout(timer)
    void docent.destroy()
    void publish.destroy()
  })

  function sendToReview() {
    if (!openId) return
    states = { ...states, [openId]: 'review' }
    say('Sent to the legal read')
    // Fires the review tour's `event` trigger.
    docent.track('story-submitted')
  }

  function publishStory() {
    if (!openId) return
    states = { ...states, [openId]: 'live' }
    say(`${open?.slot ?? 'Story'} is live`)
  }

  function toggleCheck(id: string) {
    checks = checks.map((check) => (check.id === id ? { ...check, done: !check.done } : check))
  }

  function guide(which: 'desk' | 'publish') {
    if (which === 'desk') {
      void docent.start(deskTour.id)
      return
    }
    // One tour at a time, even across two controllers.
    void docent.stop()
    void publish.start()
  }
</script>

<Masthead
  {edition}
  {desk}
  {query}
  onEdition={(value) => (edition = value)}
  onDesk={(value) => (desk = value)}
  onQuery={(value) => (query = value)}
  onGuide={guide}
/>

<main class="desk">
  <div>
    <RunOfShow stories={visible} {states} {openId} {query} onOpen={(id) => (openId = id)} />

    {#if open}
      <StoryDesk
        story={open}
        state={states[open.id] ?? open.state}
        {time}
        {blocked}
        onTime={(value) => (time = value)}
        onReview={sendToReview}
        onPublish={publishStory}
        onClose={() => (openId = null)}
      />
    {/if}
  </div>

  <aside class="rail">
    {#if stories[0]}
      <FrontPage lead={stories[0]} second={stories[1]} third={stories[2]} />
    {/if}
    <Checks items={checks} onToggle={toggleCheck} />
  </aside>
</main>

{#if toast}
  <output class="toast">{toast}</output>
{/if}

<!-- Dev only: renders nothing and drops out of production builds. -->
<DocentDevtools {docent} />
