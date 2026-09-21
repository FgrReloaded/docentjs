/** Ledgerline's tours, as data. Nothing here touches React. */

import { defineTour } from '@docentjs/react'

/** First run. Starts itself, once per person, and hands over for search and new-invoice. */
export const onboardingTour = defineTour({
  id: 'ledgerline-onboarding',
  version: 3,
  name: 'First run',
  description: 'Orients a new studio owner around receivables.',
  trigger: { type: 'auto', delay: 700 },
  options: {
    persist: true,
    frequency: 'until-completed',
    showProgress: true,
    template: 'ledgerline',
    spotlight: { padding: 10, radius: 10, animate: true },
    scroll: { enabled: true, behavior: 'smooth', block: 'center' },
    labels: { next: 'Continue', back: 'Back', skip: 'Not now', done: 'Start working' },
  },
  steps: [
    {
      id: 'welcome',
      title: 'Your books, on one sheet',
      body: 'Four minutes now saves the monthly chase later. You can leave at any point — we keep your place.',
      arrow: 'none',
    },
    {
      id: 'figures',
      target: { name: 'figures' },
      title: 'The three numbers',
      body: 'Outstanding, overdue, collected. They recompute as invoices move; nothing here is entered by hand.',
      placement: 'bottom-start',
    },
    {
      id: 'ledger',
      target: { name: 'receivables' },
      title: 'The ledger',
      body: 'Sorted by what needs you first. Hover a row for **Remind** and **Open** without leaving the page.',
      format: 'markdown',
      placement: 'top',
      spotlight: { padding: 14, radius: 12 },
    },
    {
      id: 'aging',
      target: { name: 'aging' },
      title: 'Where the money is stuck',
      body: 'Anything in the last band has been outstanding for two months. That is the row to call about.',
      placement: 'left',
    },
    {
      id: 'search',
      target: '#global-search',
      title: 'Find anything',
      body: 'Client, reference, amount. Type a letter to carry on.',
      placement: 'bottom-end',
      advance: { on: 'input' },
      interaction: 'allow',
      buttons: { next: false },
    },
    {
      id: 'new-invoice',
      target: { name: 'new-invoice' },
      title: 'Raise one now',
      body: 'A draft opens with your last rate card filled in. Go ahead — click it.',
      placement: 'bottom-end',
      advance: { on: 'click' },
      interaction: 'allow',
      buttons: { next: false },
    },
    {
      id: 'draft-total',
      target: { name: 'draft-total' },
      title: 'Totals as you type',
      body: 'Tax and retainer credits are applied live, so the number you send is the number you agreed.',
      placement: 'left',
      // The drawer mounts only after the click above.
      onMissing: 'wait',
      waitFor: 3000,
    },
    {
      id: 'send',
      target: { name: 'draft-send' },
      title: 'Send it',
      body: 'We chase politely on day 3, 14 and 30 unless you tell us otherwise.',
      placement: 'top-end',
      advance: { on: 'click' },
      interaction: 'allow',
      buttons: { next: false },
    },
    {
      id: 'done',
      title: 'That is the whole loop',
      body: 'Raise, send, chase, reconcile. Replay this from **Help → Guided tour** whenever you like.',
      format: 'markdown',
      arrow: 'none',
    },
  ],
})

/** After a reminder. No scrim, so the page stays usable. */
export const remindersTour = defineTour({
  id: 'ledgerline-reminders',
  version: 1,
  name: 'After a reminder',
  trigger: { type: 'event', name: 'reminder-sent' },
  options: {
    persist: true,
    frequency: 'once',
    showProgress: false,
    template: 'margin-note',
    allowClose: true,
    labels: { next: 'Got it', done: 'Got it', close: 'Dismiss' },
  },
  steps: [
    {
      id: 'logged',
      target: { name: 'activity' },
      title: 'Logged here',
      body: 'Every reminder is on the client record, so nobody sends the same note twice.',
      placement: 'left',
      interaction: 'allow',
    },
  ],
})

/** A release note: reading, not doing. */
export const releaseTour = defineTour({
  id: 'ledgerline-release-14',
  version: 1,
  name: 'What changed in 14',
  // Owners on a paid plan only.
  conditions: [
    { type: 'trait', key: 'role', op: 'eq', value: 'owner' },
    { type: 'trait', key: 'plan', op: 'in', value: ['studio', 'agency'] },
  ],
  options: {
    persist: true,
    frequency: 'once',
    showProgress: true,
    template: 'bulletin',
    labels: { next: 'Next', back: 'Back', skip: 'Skip', done: 'Close' },
  },
  steps: [
    {
      id: 'import',
      title: 'Bank statements import themselves',
      body: 'Connect an account once and matched payments settle overnight. Unmatched ones queue up for a two-second decision.',
    },
    {
      id: 'aging-band',
      title: 'A 60+ band, finally',
      body: 'Aging now runs a fourth band so the genuinely old debt stops hiding inside 31–60.',
    },
  ],
})

/** Drawn by a React component (headless). Overlay, spotlight, positioning and keys stay. */
export const reconcileTour = defineTour({
  id: 'ledgerline-reconcile',
  version: 1,
  name: 'Month-end reconcile',
  options: {
    showProgress: true,
    spotlight: { padding: 8, radius: 9, ring: 'hairline' },
    overlay: { style: 'dim', opacity: 0.44 },
  },
  steps: [
    {
      id: 'period',
      target: { name: 'period' },
      title: 'Close on the period you report on',
      body: 'Switch to the quarter you are filing. Everything below follows the selection.',
      placement: 'bottom-end',
    },
    {
      id: 'accounts',
      target: { name: 'accounts' },
      title: 'Match against the right account',
      body: 'Operating takes fees; the reserve only ever receives transfers you make yourself.',
      placement: 'right',
    },
    {
      id: 'overdue',
      target: { name: 'figure-overdue' },
      title: 'Clear this before you file',
      body: 'Three invoices, the oldest 23 days out. Write them off or chase them — do not carry them.',
      placement: 'bottom-start',
    },
  ],
})
