# @docentjs/devtools

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
