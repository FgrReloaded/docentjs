---
title: Triggers and conditions
description: Decide who sees a tour, when, and which steps they get.
---

These rules live in the tour JSON. The [tour manager](/guides/manager/) applies them; a single tour started with `createTour(...).start()` runs regardless of its trigger, tour conditions, and frequency.

## Triggers

```ts
trigger: { type: 'auto', delay: 1000 }                 // on page load
trigger: { type: 'route', pattern: '/invoices/**' }    // on a matching path
trigger: { type: 'element', target: '#new-menu' }      // when an element appears
trigger: { type: 'event', name: 'invoice-saved' }      // docent.track('invoice-saved')
trigger: { type: 'manual' }                            // only docent.start(id)
```

A delay is re-checked when it elapses: a route tour does not start if the user already left the page.

## Conditions

A condition is data, so it can live in the tour JSON and be evaluated anywhere. Tour-level `conditions` must all hold for the tour to be eligible. A step-level `condition` skips just that step, and works with `createTour` too.

```ts
conditions: [
  { type: 'trait', key: 'plan', op: 'eq', value: 'trial' },
  { type: 'trait', key: 'role', op: 'in', value: ['owner', 'admin'] },
  { type: 'not', condition: { type: 'tour', id: 'welcome', state: 'completed' } },
]
```

Traits come from `docent.identify(id, traits)`. Operators: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `contains`, `exists`, `missing`.

Element conditions check the page, route conditions match the current path, and `tour` conditions look at other tours' progress for the same user. Combine with `all`, `any`, and `not`. For anything else, register a predicate by name:

```ts
createDocent({ tours, custom: { isWeekend: () => [0, 6].includes(new Date().getDay()) } })
// { type: 'custom', name: 'isWeekend' }
```

## Frequency

```ts
options: { frequency: 'once' }             // default: once per version, however it ended
options: { frequency: 'until-completed' }  // keep offering after skips
options: { frequency: 'always' }           // every time the trigger fires
```

Bumping `version` re-shows a tour to everyone who saw an older one. An `auto` trigger fires at most once per page load even with `always`.
