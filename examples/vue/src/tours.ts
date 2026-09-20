/**
 * Cinder's tours. Everything here is data — the same JSON drives the built-in
 * popover, the app's own Vue popover, and (eventually) the hosted builder.
 */

import { defineTour } from '@docentjs/vue'

/**
 * Triage. It does not start on a timer: it starts when a SEV1 banner appears
 * in the page, which is the moment the guidance is actually worth reading.
 */
export const triageTour = defineTour({
  id: 'cinder-triage',
  version: 2,
  name: 'Triage',
  description: 'How to take a page from alert to acknowledged.',
  trigger: { type: 'element', target: { name: 'sev1-banner' }, delay: 800 },
  // Only the person holding the pager needs this.
  conditions: [{ type: 'trait', key: 'role', op: 'in', value: ['oncall', 'sre'] }],
  options: {
    persist: true,
    frequency: 'until-completed',
    showProgress: true,
    template: 'cinder',
    keyboard: true,
    labels: { next: 'Next', back: 'Back', skip: 'Dismiss', done: 'Take the page' },
  },
  steps: [
    {
      id: 'welcome',
      title: 'You are on call',
      body: 'One SEV1 is open and unassigned. This walks the first four minutes of it.',
      arrow: 'none',
    },
    {
      id: 'queue',
      target: { name: 'queue' },
      title: 'The queue is sorted by consequence',
      body: 'Severity first, then age. Anything acknowledged drops below anything still firing.',
      placement: 'right',
      spotlight: { padding: 6, radius: 10 },
    },
    {
      id: 'facts',
      target: { name: 'facts' },
      title: 'Budget, not raw numbers',
      body: 'Every incident is measured against the budget it burns, so 2.4s means something without context.',
      placement: 'bottom',
    },
    {
      id: 'ack',
      target: { name: 'ack' },
      title: 'Acknowledge first, investigate second',
      body: 'It stops the escalation timer and tells the rest of the rota you have it. Click it.',
      placement: 'bottom-end',
      advance: { on: 'click' },
      interaction: 'allow',
      buttons: { next: false },
    },
    {
      id: 'runbook-open',
      target: { name: 'runbook-toggle' },
      title: 'Open the runbook',
      body: 'Every alert rule carries one. This step waits until it is on screen.',
      placement: 'top',
      interaction: 'allow',
      buttons: { next: false },
      // The step completes when the checklist exists, however the user got there.
      advance: { on: 'element', target: { name: 'runbook-steps' } },
    },
    {
      id: 'runbook',
      target: { name: 'runbook-steps' },
      title: 'Work it top to bottom',
      body: 'Ticks are shared: the rest of the rota sees where you got to.',
      placement: 'top',
      onMissing: 'wait',
      waitFor: 3000,
    },
    {
      id: 'note',
      target: { name: 'note' },
      title: 'Say what you tried',
      body: 'Notes land in the timeline and in the postmortem draft. Type a word to carry on.',
      placement: 'top',
      advance: { on: 'input' },
      interaction: 'allow',
      buttons: { next: false },
    },
    {
      id: 'done',
      title: 'That is the loop',
      body: 'Acknowledge, mitigate, note. **Escalate** if the budget keeps burning after the runbook.',
      format: 'markdown',
      arrow: 'none',
    },
  ],
})

/** Fires from the app, not from a timer: `docent.track('incident-escalated')`. */
export const escalationTour = defineTour({
  id: 'cinder-escalation',
  version: 1,
  name: 'Escalated',
  trigger: { type: 'event', name: 'incident-escalated' },
  options: {
    persist: true,
    frequency: 'once',
    showProgress: false,
    template: 'signal',
    labels: { next: 'Understood', done: 'Understood' },
  },
  steps: [
    {
      id: 'who',
      target: { name: 'timeline' },
      title: 'Secondary has been paged',
      body: 'The escalation is on the timeline with a 10 minute response clock. Keep working — the page stays live.',
      placement: 'left',
      interaction: 'allow',
    },
  ],
})

/**
 * The close-out walkthrough, drawn by a Vue component instead of the built-in
 * popover. Docent keeps the overlay, spotlight, positioning and keys.
 */
export const postmortemTour = defineTour({
  id: 'cinder-postmortem',
  version: 1,
  name: 'Close out',
  options: {
    showProgress: true,
    spotlight: { padding: 8, radius: 8, ring: 'glow' },
    overlay: { style: 'dim', color: 'oklch(12% 0.014 60)', opacity: 0.7 },
  },
  steps: [
    {
      id: 'resolve',
      target: { name: 'resolve' },
      title: 'Resolve when the budget stops burning',
      body: 'Not when the graph looks better — when it has been inside budget for ten minutes.',
      placement: 'bottom-end',
    },
    {
      id: 'timeline',
      target: { name: 'timeline' },
      title: 'The timeline is the first draft',
      body: 'Alerts, mitigations and notes become the postmortem skeleton. Nothing to retype.',
      placement: 'right',
    },
    {
      id: 'signals',
      target: { name: 'signals' },
      title: 'Attach what you were looking at',
      body: 'The graph window is captured with the incident so the numbers survive retention.',
      placement: 'left',
    },
  ],
})
