# @docentjs/dom

## 0.3.0

### Patch Changes

- 9dde1a5: Add `@docentjs/devtools`, a development panel for the tour manager. It shows every tour with a verdict and the reason it is or is not showing (failed conditions with the user's actual values, frequency, trigger), each step's target health, and a live event timeline. It can play any tour from any step, reset progress, and simulate user traits, `track()` events and navigation.
  
  Use it as a component, `<DocentDevtools docent={…} />`, from `@docentjs/devtools/react`, `/vue` or `/svelte`: it renders nothing, loads the panel only in development, and production builds drop it. Or call `mount(docent)` directly.
  
  `@docentjs/core`: the manager gains `getTours()`, `getConditionEnv()` and `onEvent()` for tooling.
  
  `@docentjs/dom`: tour keyboard shortcuts no longer fire while typing in inputs inside shadow roots, and elements marked `data-docent-ignore-keys` keep their keys.
- 9dde1a5: Fix React StrictMode, which builds components twice and runs effect cleanups once in development.
  
  - `useDocent` created a second, hidden manager that started its own tours, and the cleanup destroyed the manager the app used, so its tours never auto-started. The manager is now created without side effects and connects on mount.
  - The manager has `connect()` and `disconnect()`, and a `connect: false` option to defer watching until connected. `createDocent()` still connects immediately. Loading now starts on first use of `ready`.
  - `TourController.destroy()` reset state after an await, so a `start()` right after it could be overwritten back to idle. It now resets first.
  - Browser controllers attach navigation listeners when a tour starts instead of on construction, so route following survives StrictMode's cleanup in `useTour`.
  - `tourState()` now reports `in-progress` for a tour the manager is running.
  - Scrolling past sticky headers now waits until a smooth scroll has actually settled (the target stops moving), instead of a fixed 600 ms that could be too short on slow devices.
- Updated dependencies [9dde1a5]
- Updated dependencies [9dde1a5]
  - @docentjs/core@0.3.0

## 0.2.1

### Patch Changes

- @docentjs/core@0.2.1

## 0.2.0

### Minor Changes

- 3d8fe95: Add the tour manager.
  
  `createDocent({ tours })` holds many tours and decides which one to show, to whom, and when. It watches each tour's `trigger` (page load, route, element appearing, `track()` events), checks tour `conditions` against the user's traits, applies `frequency` against per-user progress, and runs one tour at a time, queueing the rest. Tours can come from an array or a `TourSource` with live updates. `identify(id, traits)` stores progress per user.
  
  Framework bindings: `useDocent()` for React, Vue and Svelte, with custom popover support. Vue's `<TourPopover>` accepts either handle.
  
  `createTour()` is unchanged and still runs a single tour on demand.

### Patch Changes

- Updated dependencies [3d8fe95]
  - @docentjs/core@0.2.0

## 0.1.0

### Minor Changes

- Initial release.
  
  - `@docentjs/core`: tour schema, engine (reducer, conditions, routes, persistence, events) and `TourController`.
  - `@docentjs/dom`: web renderer with custom positioning, clip-path spotlight, Shadow Root popover, keyboard and focus handling, occlusion avoidance, mobile bottom sheet, theme tokens, slots, templates and headless mode. `createTour()` for a browser-ready controller.
  - `@docentjs/react`, `@docentjs/vue`, `@docentjs/svelte`: thin framework bindings with custom popover support.

### Patch Changes

- Updated dependencies
  - @docentjs/core@0.1.0
