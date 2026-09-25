/**
 * A short tour of the devtools panel, built with Docent itself. It runs on its
 * own controller, not the app's manager, so it never shows up in the app's
 * tours, events, audit or perf, and its progress is kept in memory only.
 */

import { createMemoryStorage, SCHEMA_VERSION, type Tour } from '@docentjs/core'
import { createTour, type DomTourController } from '@docentjs/dom'
import type { Store, Tab } from './store'

/** `data-docent` names inside the panel, prefixed so they never clash with the app's. */
export const MARK = {
  now: 'docent-devtools-now',
  tabs: 'docent-devtools-tabs',
  tab: (id: Tab) => `docent-devtools-tab-${id}`,
  steps: 'docent-devtools-steps',
  draft: 'docent-devtools-draft',
  target: 'docent-devtools-target',
  pick: 'docent-devtools-pick',
  placement: 'docent-devtools-placement',
  advance: 'docent-devtools-advance',
  interaction: 'docent-devtools-interaction',
  route: 'docent-devtools-route',
  tourSettings: 'docent-devtools-tour-settings',
  look: 'docent-devtools-look',
  theme: 'docent-devtools-theme',
  layout: 'docent-devtools-layout',
  help: 'docent-devtools-help',
} as const

const ONBOARDING: Tour = {
  schemaVersion: SCHEMA_VERSION,
  id: 'docent-devtools-onboarding',
  name: 'Devtools tour',
  options: {
    // Above the panel, which sits at the top of the stacking order.
    theme: { preset: 'dark', zIndex: 2147483647 },
    overlay: { opacity: 0.35 },
    arrow: 'curve',
    persist: false,
  },
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Docent devtools',
      body: 'This panel shows what your tours are doing and lets you edit them live. A quick look around takes under a minute.',
    },
    {
      id: 'now',
      target: { name: MARK.now },
      title: 'What is running',
      body: 'The tour and step on screen right now. Step through it, jump to the editor for this step, or stop it.',
      placement: 'bottom',
    },
    {
      id: 'tours',
      target: { name: MARK.tab('tours') },
      title: 'Every tour, explained',
      body: 'Tours lists what is registered and says why each one would or would not show for this user: trigger, frequency and conditions.',
      placement: 'bottom',
    },
    {
      id: 'open-edit',
      target: { name: MARK.tab('edit') },
      title: 'Open the editor',
      body: 'Click Edit to change a tour and watch it update on the page.',
      placement: 'bottom',
      advance: { on: 'click' },
      interaction: 'allow',
      buttons: { next: false },
    },
    {
      id: 'steps',
      target: { name: MARK.steps },
      title: 'Pick a step',
      body: 'Choose a step to edit. While a tour is playing, the step on screen is selected for you and tagged "showing".',
      placement: 'bottom',
    },
    {
      id: 'draft',
      target: { name: MARK.draft },
      title: 'Edits are a draft',
      body: 'Changes stay in this browser until you copy or download the JSON into your code. Discard goes back to the code’s version.',
      placement: 'bottom',
    },
    {
      id: 'target',
      target: { name: MARK.target },
      title: 'Target: what the step points at',
      body: 'None centres the step as a modal. A data-docent name is the most robust: it survives redesigns. A CSS selector works for markup you cannot change. Advanced (JSON) adds fallback selectors, a container to search within, or which match to use.',
    },
    {
      id: 'pick',
      target: { name: MARK.pick },
      title: 'Pick it on the page',
      body: 'Click Pick, then click any element. You get selectors ranked by how likely they are to keep working, with a warning when one matches more than one element. Esc cancels.',
    },
    {
      id: 'placement',
      target: { name: MARK.placement },
      title: 'Placement',
      body: 'Which side of the target the popover sits on. Auto takes the side with the most room. Start and end line it up with an edge. If the chosen side has no room, it moves to the opposite one.',
    },
    {
      id: 'advance',
      target: { name: MARK.advance },
      title: 'Advance when',
      body: 'What moves the tour on. By default the Next button. It can also wait for the user to click the target, type into it (optionally matching a pattern), for your app to track an event, for a delay, or for an element to appear.',
    },
    {
      id: 'interaction',
      target: { name: MARK.interaction },
      title: 'Clicks and missing targets',
      body: 'Interaction decides whether the highlighted element can be clicked. Automatic allows it only when the step waits for a click or typing. If the target is missing, the step is skipped, waited for, or the tour ends.',
    },
    {
      id: 'route',
      target: { name: MARK.route },
      title: 'Route',
      body: 'The page this step belongs to, like /invoices/**. On any other page the tour pauses, and it picks up again when the user comes back. Leave it empty for any page.',
    },
    {
      id: 'tour-settings',
      target: { name: MARK.tourSettings },
      title: 'Tour settings',
      body: 'These apply to the whole tour. Starts sets what launches it: your code, page load, a route, an element appearing, or an event. Frequency is once, until completed, or every time. Remember progress lets a reload resume at the same step.',
    },
    {
      id: 'look',
      target: { name: MARK.look },
      title: 'Look',
      body: 'The default arrow, overlay and spotlight for every step. Overlay None keeps the page usable while the tour runs. A step can still pick its own arrow, spotlight shape and ring.',
    },
    {
      id: 'theme',
      target: { name: MARK.theme },
      title: 'Theme',
      body: 'Start from a preset, then adjust colours, corner radius, width, overlay opacity, animation speed and font. It is saved in the tour JSON with everything else.',
    },
    {
      id: 'more',
      target: { name: MARK.tabs },
      title: 'Test and check',
      body: 'Simulate pretends to be another user, Events logs what fired, Audit flags broken targets and weak contrast, Perf times each step.',
      placement: 'bottom',
    },
    {
      id: 'layout',
      target: { name: MARK.layout },
      title: 'Make room',
      body: 'Dock the panel left, right or at the bottom, and drag its edge to resize. Alt+Shift+D shows or hides it.',
      placement: 'bottom-end',
    },
    {
      id: 'help',
      target: { name: MARK.help },
      title: 'That’s it',
      body: 'Run this tour again any time from here.',
      placement: 'bottom-end',
      buttons: { back: false },
    },
  ],
}

/** Steps that point into the Edit tab. */
const EDIT_STEPS = [
  'steps',
  'draft',
  'target',
  'pick',
  'placement',
  'advance',
  'interaction',
  'route',
  'tour-settings',
  'look',
  'theme',
]

/** Let the panel re-render after switching tabs, so the next target exists. */
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

export function startOnboarding(store: Store): DomTourController {
  const on = (tab: Tab) => async () => {
    store.tab.value = tab
    await frame()
    return undefined
  }
  const tour = createTour(ONBOARDING, {
    storage: createMemoryStorage(),
    followRoutes: false,
    hooks: {
      steps: {
        tours: { beforeShow: on('tours') },
        'open-edit': { beforeShow: on('tours') },
        ...Object.fromEntries(EDIT_STEPS.map((id) => [id, { beforeShow: on('edit') }])),
      },
    },
  })
  void tour.start()
  return tour
}
