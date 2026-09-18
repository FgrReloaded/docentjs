import { defineTour } from '../define'

/**
 * Exercises the harder parts of the schema: trigger, targeting conditions,
 * self-healing target specs, advance-on-action, multi-page routes, per-step
 * visual overrides and the builder's meta bag.
 */
export const advancedTour = defineTour({
  id: 'first-invoice',
  version: 3,
  name: 'Send your first invoice',
  description: 'Shown to trial admins who have not sent an invoice yet.',
  trigger: { type: 'route', pattern: '/dashboard', delay: 1500 },
  conditions: [
    { type: 'trait', key: 'plan', op: 'eq', value: 'trial' },
    { type: 'trait', key: 'role', op: 'in', value: ['owner', 'admin'] },
    { type: 'not', condition: { type: 'tour', id: 'first-invoice', state: 'completed' } },
  ],
  options: {
    persist: true,
    frequency: 'until-completed',
    showProgress: true,
    spotlight: { padding: 8, radius: 6, animate: true },
    overlay: { color: '#000', opacity: 0.6 },
    labels: { progress: '{current} / {total}' },
    theme: { accent: '#7c3aed', radius: '16px' },
    template: 'card',
  },
  steps: [
    {
      id: 'open-invoices',
      route: '/dashboard',
      target: {
        name: 'nav-invoices',
        selectors: ['[data-testid="nav-invoices"]', 'nav a[href="/invoices"]'],
      },
      title: 'Invoices',
      body: 'Click **Invoices** to continue.',
      format: 'markdown',
      advance: { on: 'click' },
      interaction: 'allow',
      buttons: { next: false },
    },
    {
      id: 'new-invoice',
      route: '/invoices',
      target: { name: 'new-invoice' },
      title: 'Create one',
      body: 'Press this button to start a new invoice.',
      advance: { on: 'click' },
      interaction: 'allow',
      onMissing: 'wait',
      waitFor: 5000,
      spotlight: { padding: 12 },
    },
    {
      id: 'customer-field',
      route: '/invoices/new',
      target: { selectors: ['#customer', 'input[name="customer"]'] },
      title: 'Pick a customer',
      body: 'Type a name and choose from the list.',
      advance: { on: 'input', match: '.+' },
      placement: 'top',
      condition: { type: 'element', target: '#customer', exists: true },
    },
    {
      id: 'send',
      route: '/invoices/new',
      target: { name: 'send-invoice' },
      title: 'Send it',
      body: 'Your customer gets an email with a payment link.',
      media: { type: 'image', src: '/help/send.png', alt: 'The send button' },
      meta: { builder: { createdBy: 'nitish', note: 'confirm copy with marketing' } },
    },
  ],
})
