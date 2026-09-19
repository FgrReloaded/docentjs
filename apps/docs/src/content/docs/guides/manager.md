---
title: Tour manager
description: Hand Docent all your tours and let it decide which one to show, to whom, and when.
---

`createTour` runs one tour when you call `start()`. Most apps have several tours with rules about who sees them and when. The manager applies those rules for you.

```ts
import { createDocent } from '@docentjs/dom'
import { invoices, welcome, whatsNew } from './tours'

const docent = createDocent({ tours: [welcome, invoices, whatsNew] })
docent.identify(user.id, { plan: user.plan, role: user.role })
```

That is the whole integration. The rules live in each tour's JSON.

## What it does

1. Holds your tours, from an array or a [`TourSource`](#loading-tours-from-anywhere).
2. Watches each tour's `trigger`: a route, an element appearing, an event your app reports, or page load.
3. When a trigger fires, checks the tour's `conditions` against the user's traits and the page.
4. Checks the tour's `frequency` against that user's stored progress.
5. If everything passes and no other tour is running, starts it. Otherwise it queues the tour and tries again when the current one ends.

## Describing the rules

```ts
defineTour({
  id: 'invoices',
  trigger: { type: 'route', pattern: '/invoices/**', delay: 800 },
  conditions: [{ type: 'trait', key: 'plan', op: 'eq', value: 'trial' }],
  options: { frequency: 'until-completed', persist: true },
  steps: [ … ],
})
```

| Trigger | Starts the tour when |
| --- | --- |
| `{ type: 'auto', delay? }` | the page loads, once per page load |
| `{ type: 'route', pattern, delay? }` | the user is on, or navigates to, a matching path |
| `{ type: 'element', target, delay? }` | the element appears in the page |
| `{ type: 'event', name }` | your code calls `docent.track(name)` |
| `{ type: 'manual' }` or none | only `docent.start(id)` |

Tours without a trigger never start on their own. See [Triggers and conditions](/guides/triggers-and-conditions/) for every condition type and the frequency rules.

## Identifying users

```ts
docent.identify(user.id, { plan: 'trial', seats: 5, beta: true })
```

Traits feed `trait` conditions. Progress is stored per user id, so on a shared browser, or when you switch test accounts, each user gets their own history. Call `identify` again when the user or their traits change; triggers are re-checked immediately. Anonymous visitors use unscoped progress.

## Reporting events

```ts
docent.track('invoice-saved')
```

Starts tours with a matching `event` trigger, and advances a running step waiting on `{ on: 'event', name: 'invoice-saved' }`.

## Starting by hand

```ts
docent.start('welcome')   // "Take the tour again" buttons
```

A manual start ignores the trigger, conditions, and frequency, and replaces any tour already running. The outcome is still recorded.

## Chained tours

When a tour ends, triggers are re-checked, so a tour with `conditions: [{ type: 'tour', id: 'welcome', state: 'completed' }]` starts right after `welcome` finishes, if its trigger still holds.

## Routers

Navigation is detected through `popstate`, `hashchange`, and the Navigation API, which covers most client-side routers. If yours changes the URL without any of those, call `docent.refresh()` after each navigation.

## Loading tours from anywhere

`tours` also accepts a `TourSource`: an object with `load()`, and optionally `subscribe()` for live updates. Use it to fetch tours from your API, and changes apply without a deploy.

```ts
createDocent({
  tours: {
    load: () => fetch('/api/tours').then((r) => r.json()),
  },
})
```

## Other methods

| Method | Purpose |
| --- | --- |
| `docent.ready` | promise that resolves once tours and progress are loaded |
| `getState()`, `subscribe(fn)` | `{ active, tours }` |
| `isEligible(id)` | would this tour show now, per conditions and frequency |
| `tourState(id)` | `not-started`, `in-progress`, `completed`, or `skipped` for this user |
| `reset(id?)` | forget progress so a tour shows again |
| `stop()` | end the running tour, recorded as skipped |
| `activeController` | the running tour's controller, for fine control |
| `destroy()` | stop watching and remove everything |

Shared options: `storage`, `sink`, `custom` predicates, `hooks` keyed by tour id, and `renderer` for theme, templates, slots, and headless mode across every tour.
