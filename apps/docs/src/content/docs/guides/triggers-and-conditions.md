---
title: Triggers and conditions
description: Decide who sees a tour, when, and which steps they get.
---

## Conditions

A condition is data, so it can live in the tour JSON and be evaluated anywhere. Tour-level `conditions` must all hold for the tour to be eligible. A step-level `condition` skips just that step.

```ts
conditions: [
  { type: 'trait', key: 'plan', op: 'eq', value: 'trial' },
  { type: 'trait', key: 'role', op: 'in', value: ['owner', 'admin'] },
  { type: 'not', condition: { type: 'tour', id: 'welcome', state: 'completed' } },
]
```

Traits come from the identity you pass to the controller:

```ts
createTour(tour, { identity: { id: 'u_42', traits: { plan: 'trial', role: 'admin', seats: 5 } } })
```

Element conditions check the page, route conditions match the current path, and `tour` conditions look at other tours' progress through the `tourState` option. For anything else, register a predicate by name:

```ts
createTour(tour, { custom: { isWeekend: () => [0, 6].includes(new Date().getDay()) } })
// { type: 'custom', name: 'isWeekend' }
```

## Frequency

```ts
options: { frequency: 'once' }             // default: one outcome per version
options: { frequency: 'until-completed' }  // keep offering after skips
options: { frequency: 'always' }
```

Bumping `version` re-shows a tour to everyone who saw an older one. `shouldShow(tour, record)` from core encodes these rules if you want to apply them yourself.

## Triggers

Triggers describe what should start a tour. They are part of the schema today so builders can author them; automatic firing is handled by the runtime layer, which is on the roadmap. Until then, start tours from your own code:

```ts
const c = createTour(tour)
if (location.pathname === '/dashboard') c.resume()
```
