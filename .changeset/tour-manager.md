---
'@docentjs/core': minor
'@docentjs/dom': minor
'@docentjs/react': minor
'@docentjs/vue': minor
'@docentjs/svelte': minor
---

Add the tour manager.

`createDocent({ tours })` holds many tours and decides which one to show, to whom, and when. It watches each tour's `trigger` (page load, route, element appearing, `track()` events), checks tour `conditions` against the user's traits, applies `frequency` against per-user progress, and runs one tour at a time, queueing the rest. Tours can come from an array or a `TourSource` with live updates. `identify(id, traits)` stores progress per user.

Framework bindings: `useDocent()` for React, Vue and Svelte, with custom popover support. Vue's `<TourPopover>` accepts either handle.

`createTour()` is unchanged and still runs a single tour on demand.
