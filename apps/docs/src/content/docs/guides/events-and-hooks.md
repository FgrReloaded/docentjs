---
title: Events and hooks
description: React to what happens, and prepare the page before a step shows.
---

## Events

Every lifecycle event goes to the `sink` you pass. Wire it to your analytics.

```ts
createTour(tour, {
  sink: { emit: (e) => analytics.track(e.type, { tour: e.tourId, step: e.stepId }) },
})
```

Types: `tour:started`, `tour:completed`, `tour:skipped`, `tour:aborted`, `step:shown`, `step:completed`, `step:skipped`, `step:missing`. Each event carries the tour id and version, the step id and index when relevant, a timestamp, and the identity.

`combineSinks(a, b)` fans out to several sinks.

## Hooks

Hooks are functions, so they attach in code rather than in the tour JSON.

```ts
createTour(tour, {
  hooks: {
    onStart: (tour) => …,
    onStepChange: ({ step, index }) => …,
    onComplete: (tour) => …,
    onSkip: ({ step }) => …,
    onAbort: (tour, reason) => …,
    steps: {
      'menu-item': {
        beforeShow: async () => { await openMenu() },   // return false to skip the step
        afterShow: () => …,
        beforeHide: () => closeMenu(),
      },
    },
  },
})
```

`beforeShow` runs before the target is looked up, so it is the place to open menus, expand sections, or fetch data the step needs.

## State

Subscribe for the engine state, or read it on demand:

```ts
const off = controller.subscribe((s) => console.log(s.status, s.index))
controller.getState() // { status, index, history, reason? }
```

Statuses: `idle`, `running`, `paused`, `completed`, `skipped`, `aborted`.
