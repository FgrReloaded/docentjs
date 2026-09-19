# @docentjs/core

The platform-agnostic engine behind [Docent](https://github.com/FgrReloaded/docentjs): tour schema, state machine, conditions, routes, persistence and events. No DOM access. You normally install a renderer package instead (`@docentjs/dom` for the web) and use this one for its types and helpers.

```sh
pnpm add @docentjs/core
```

```ts
import { defineTour, type Tour } from '@docentjs/core'

export const welcome: Tour = defineTour({
  id: 'welcome',
  version: 1,
  steps: [
    { id: 'intro', title: 'Welcome', body: 'This takes about a minute.' },
    { id: 'sidebar', target: { name: 'sidebar' }, title: 'Navigation' },
  ],
})
```

## What's here

- **Schema types**: `Tour`, `Step`, `Target`, `Condition`, `Trigger`, `Theme`, and the rest of the JSON contract.
- **`Docent`**: the tour manager. Watches triggers, checks conditions and frequency per user, runs one tour at a time. Use `createDocent` from `@docentjs/dom` in the browser.
- **`TourController`**: drives one tour against a `Renderer`; handles hooks, lazy targets, route pauses, persistence and events.
- **Engine helpers**: `reduce`, `evaluateCondition`, `matchRoute`, `shouldShow`, `ProgressStore`, `createEvent`.
- **Seams**: `TourSource`, `Identity`, `StorageAdapter`, `EventSink` so tours can come from and report to anywhere.

Docs: https://github.com/FgrReloaded/docentjs#readme

MIT
