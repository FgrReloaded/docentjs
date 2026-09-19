import { defineTour } from '@docentjs/core'

export const welcomeTour = defineTour({
  id: 'svelte-welcome',
  version: 1,
  options: { showProgress: true, spotlight: { padding: 8, radius: 8 } },
  steps: [
    { id: 'intro', title: 'Welcome', body: 'A tour rendered by the built-in popover.' },
    { id: 'sidebar', target: { name: 'sidebar' }, title: 'Navigation', placement: 'right' },
    {
      id: 'new',
      target: '#new-project',
      title: 'Create a project',
      body: 'Click it to continue.',
      advance: { on: 'click' },
    },
    {
      id: 'search',
      target: '#search',
      title: 'Search',
      body: 'Type to move on.',
      advance: { on: 'input' },
    },
    { id: 'done', title: 'Done', body: 'That is the built-in UI.' },
  ],
})

export const customTour = defineTour({
  id: 'svelte-custom',
  version: 1,
  options: { spotlight: { padding: 6, radius: 6 } },
  steps: [
    {
      id: 'intro',
      title: 'Custom popover',
      body: 'This card is a Svelte component with app state and CSS.',
    },
    { id: 'import', target: '#import', title: 'Import', body: 'Bring data in from a file.' },
    { id: 'export', target: '#export', title: 'Export', body: 'Download everything as CSV.' },
  ],
})

export const themedTour = defineTour({
  id: 'svelte-themed',
  version: 1,
  options: {
    theme: { accent: '#0d9488', radius: '4px', width: '280px' },
    template: 'minimal',
  },
  steps: [
    {
      id: 'cards',
      target: '.card',
      title: 'Themed',
      body: 'Tokens from the tour JSON, template from the provider.',
    },
    { id: 'done', title: 'Finished' },
  ],
})
