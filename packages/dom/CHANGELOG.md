# @docentjs/dom

## 0.5.1

### Patch Changes

- @docentjs/core@0.5.1

## 0.5.0

### Minor Changes

- dbb8495: Customizable arrows, spotlight and overlay, set in tour JSON per tour or per step. The current look stays the default.
  
  - **`arrow`**: `caret` (default), `none`, or one of ten drawn connectors from the popover to the target: `line`, `dashed`, `dotted`, `curve`, `curve-dashed`, `squiggle`, `loop`, `elbow`, `sketch`, `pin`. Connectors draw in after the popover settles and respect reduced motion. Their code loads on first use as a separate 1.8 kB chunk, so tours that keep the caret never download it.
  - **`spotlight.shape`**: `rounded` (default), `rect`, `pill`, `circle`. **`spotlight.ring`**: `hairline` (default), `none`, `glow`, `pulse`, `dashed`, `solid`.
  - **`overlay.style`**: `dim` (default), `blur`, `vignette`, or `none`, which leaves the page usable for hint-style tours. `overlay.blur` sets the blur radius.
  - Renderer options and templates accept `arrow`, `spotlight` and `overlay` too. Precedence is renderer, template, tour, then step.
  - New theme tokens `connector` and `ring`, and a `connector` styling part.
  - Fix: renderer `overlay` options (color and opacity) were ignored.
  
  `@docentjs/core`: new schema types `ArrowStyle`, `SpotlightShape`, `SpotlightRing`, `OverlayStyle` and `OverlayOptions`. `TourController.updateTour()` and `Docent.updateTour()` replace a tour's definition while it runs, keeping the current step, without re-arming triggers.
  
  The initial bundle grows by about 1.5 kB compressed.

### Patch Changes

- Updated dependencies [dbb8495]
  - @docentjs/core@0.5.0

## 0.4.0

### Minor Changes

- c552df1: A redesigned default look: quiet, precise, and at home in any product.
  
  - **Inherits your site's font.** Hierarchy comes from a tuned type scale (18 px titles, 14 px body, 13 px buttons, 12 px meta), weight, tracking and balanced line breaks. `--docent-font` still overrides it.
  - **Ink on paper.** OKLCH colors tinted toward the Docent hue, an ink primary button, hairline edges (the arrow included) and a softer layered shadow.
  - **Clear actions.** Skip is quiet text, Back is a ghost button, Next is solid with a small forward arrow; reading order now matches visual order (Skip, Back, Next). The close icon is drawn, not typed.
  - **Progress** pairs the step count with a slim meter.
  - **Spotlight** gets a light hairline ring that stays visible in every theme; default padding 8 px and radius 10 px.
  - **Light by default.** Dark no longer switches on automatically from the OS; use the `dark` preset (now tinted, with an inverted accent) on dark products.
  - Touch devices get 44 px targets and 15 px text; the entrance scales in subtly from 97%.
  
  New styling parts: `ring`, `meter`, `count`.

### Patch Changes

- @docentjs/core@0.4.0

## 0.3.1

### Patch Changes

- f1c8224: Smoother step changes. The popover used to disappear on Next and fade back in from nothing while the spotlight moved alone, which read as lag. It now stays visible and slides from its previous spot to the next one, arriving together with the spotlight, while only its content cross-fades briefly. Transitions use a fast-start easing (`--docent-easing`) and a 220 ms default duration. Reduced-motion users still get no animation.
- @docentjs/core@0.3.1

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
