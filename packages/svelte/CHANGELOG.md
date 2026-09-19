# @docentjs/svelte

## 0.5.2

### Patch Changes

- @docentjs/core@0.5.2
  - @docentjs/dom@0.5.2

## 0.5.1

### Patch Changes

- @docentjs/core@0.5.1
  - @docentjs/dom@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [dbb8495]
  - @docentjs/dom@0.5.0
  - @docentjs/core@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [c552df1]
  - @docentjs/dom@0.4.0
  - @docentjs/core@0.4.0

## 0.3.1

### Patch Changes

- Updated dependencies [f1c8224]
  - @docentjs/dom@0.3.1
  - @docentjs/core@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [9dde1a5]
- Updated dependencies [9dde1a5]
  - @docentjs/core@0.3.0
  - @docentjs/dom@0.3.0

## 0.2.1

### Patch Changes

- af0f00b: One install is now enough for framework apps. `@docentjs/react`, `@docentjs/vue` and `@docentjs/svelte` re-export `defineTour`, the tour and renderer types (`RenderContext`, `Step`, `Theme`, …) and `createLocalStorage`, and each has a `/themes` entry with the presets. Previously, importing these from `@docentjs/core` failed under pnpm unless core was installed separately. In React the tour type is exported as `TourDefinition`, since `Tour` is the component.
- @docentjs/core@0.2.1
  - @docentjs/dom@0.2.1

## 0.2.0

### Minor Changes

- 3d8fe95: Add the tour manager.
  
  `createDocent({ tours })` holds many tours and decides which one to show, to whom, and when. It watches each tour's `trigger` (page load, route, element appearing, `track()` events), checks tour `conditions` against the user's traits, applies `frequency` against per-user progress, and runs one tour at a time, queueing the rest. Tours can come from an array or a `TourSource` with live updates. `identify(id, traits)` stores progress per user.
  
  Framework bindings: `useDocent()` for React, Vue and Svelte, with custom popover support. Vue's `<TourPopover>` accepts either handle.
  
  `createTour()` is unchanged and still runs a single tour on demand.

### Patch Changes

- Updated dependencies [3d8fe95]
  - @docentjs/core@0.2.0
  - @docentjs/dom@0.2.0

## 0.1.0

### Minor Changes

- Initial release.
  
  - `@docentjs/core`: tour schema, engine (reducer, conditions, routes, persistence, events) and `TourController`.
  - `@docentjs/dom`: web renderer with custom positioning, clip-path spotlight, Shadow Root popover, keyboard and focus handling, occlusion avoidance, mobile bottom sheet, theme tokens, slots, templates and headless mode. `createTour()` for a browser-ready controller.
  - `@docentjs/react`, `@docentjs/vue`, `@docentjs/svelte`: thin framework bindings with custom popover support.

### Patch Changes

- Updated dependencies
  - @docentjs/core@0.1.0
  - @docentjs/dom@0.1.0
