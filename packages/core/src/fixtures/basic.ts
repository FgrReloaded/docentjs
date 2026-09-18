import { defineTour } from '../define'

/** Smallest realistic tour: welcome modal, two spotlighted steps, finish modal. */
export const basicTour = defineTour({
  id: 'welcome',
  version: 1,
  name: 'Welcome tour',
  steps: [
    {
      id: 'intro',
      title: 'Welcome to Acme',
      body: 'This takes about a minute. Let us show you around.',
    },
    {
      id: 'sidebar',
      target: { name: 'sidebar' },
      title: 'Navigation',
      body: 'Everything you own lives here.',
      placement: 'right',
    },
    {
      id: 'new-project',
      target: '#new-project-button',
      title: 'Create a project',
      body: 'Start here when you are ready.',
      placement: 'bottom-start',
    },
    {
      id: 'done',
      title: 'That is it',
      body: 'You can replay this tour from the help menu.',
      buttons: { back: false, skip: false },
    },
  ],
})
