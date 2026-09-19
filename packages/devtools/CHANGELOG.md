# @docentjs/devtools

## 0.5.2

### Patch Changes

- 96ff731: Choose the panel's position directly with three layout buttons (left, bottom, right) instead of cycling through them. Each layout remembers its own size. In windows narrower than 640 px the panel docks at the bottom, capped at 60% of the height, and returns to your chosen side when the window is wider.
- @docentjs/core@0.5.2
  - @docentjs/dom@0.5.2

## 0.5.1

### Patch Changes

- 8b3ff62: Devtools edits survive reloads. Unsaved edits are kept in this browser's localStorage and restored on the next load, with a notice in the Edit tab. If the tour's code changed since the edits were made, the panel warns you so you can review or discard them. Once the code matches the edits, for example after pasting the copied JSON in, the saved copy is dropped. Discard edits removes it too.
- @docentjs/core@0.5.1
  - @docentjs/dom@0.5.1

## 0.5.0

### Minor Changes

- dbb8495: Devtools v2: a rebuilt panel with live editing, auditing and performance.
  
  - **Edit**: change steps, targets, tour options, arrows, spotlight, overlay and theme, and the running tour updates as you type. Reorder, duplicate, add and delete steps. Copy or download the edited JSON.
  - **Target picker**: click any element on the page and get selectors ranked by stability, with warnings for generated class names and structural paths.
  - **Audit**: missing and fragile targets, text contrast, duplicate step ids, clicks the tour blocks, unknown conditions and more, ranked by severity.
  - **Performance**: time to show each step, popover moves, long frames and DOM cost for a played tour.
  - A now-playing bar with Back, Next, Edit this step and Stop; event filters; docking right, bottom or left with a resizable edge.
  
  Built with Preact, bundled inside the package, so apps need no extra dependencies. Still loads only in development.

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

### Minor Changes

- 9dde1a5: Add `@docentjs/devtools`, a development panel for the tour manager. It shows every tour with a verdict and the reason it is or is not showing (failed conditions with the user's actual values, frequency, trigger), each step's target health, and a live event timeline. It can play any tour from any step, reset progress, and simulate user traits, `track()` events and navigation.
  
  Use it as a component, `<DocentDevtools docent={…} />`, from `@docentjs/devtools/react`, `/vue` or `/svelte`: it renders nothing, loads the panel only in development, and production builds drop it. Or call `mount(docent)` directly.
  
  `@docentjs/core`: the manager gains `getTours()`, `getConditionEnv()` and `onEvent()` for tooling.
  
  `@docentjs/dom`: tour keyboard shortcuts no longer fire while typing in inputs inside shadow roots, and elements marked `data-docent-ignore-keys` keep their keys.

### Patch Changes

- Updated dependencies [9dde1a5]
- Updated dependencies [9dde1a5]
  - @docentjs/core@0.3.0
  - @docentjs/dom@0.3.0
