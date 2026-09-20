# @docentjs/dom

## 0.7.1

### Patch Changes

- 5d23354: Drawn arrows now point at large targets properly.
  
  A connector aimed at the target's centre, so a sidebar or a full-width banner
  stretched the line down or across the whole element: the head ended up far below
  or beside the popover it was supposed to connect. It now lands on the part of the
  target's edge that faces the popover, and on the visible part of a target taller
  than the screen.
  
  Every connector also leaves the card at a deliberate angle with a little space
  before the line starts, instead of pointing dead-on.
  
  A target too big to sit beside leaves the popover clamped on top of it, with no
  band to draw a line in. The connector now leaves the card sideways and lands on
  the stretch of the target's edge the card does not cover, instead of being
  dropped — which made choosing an arrow in the devtools editor look like it did
  nothing. The caret is used only when the card covers the target entirely.
  
  Setting `gap` on the renderer no longer stops drawn arrows from appearing. The
  option is written with the default caret in mind, so a value smaller than the
  room a connector needs left no space to draw in; a connector now takes the
  larger of the two. This is why the framework examples, which all set a small
  gap, showed no arrow whatever style they asked for.
- 5d23354: The popover now looks considered on small and short screens, not merely functional.
  
  - **A docked card, not a drawer.** Below the sheet width it sits near the bottom with a margin on every side and its full corner radius, instead of stretching edge to edge. It takes at most 72% of the height, so the page and the spotlight stay visible behind it.
  - **Never cut off.** The popover is capped to the screen height. Longer text scrolls inside the card, the last line fades while more remains, and the title and buttons stay in place. Images and video are capped too.
  - **Tighter on small screens.** Padding, title size and spacing shrink a little below 420 px wide or 600 px tall, where the old sizes wasted space.
  - **Always on screen.** When no side has room, the popover overlaps part of the target rather than hanging off the edge, where nothing could be read. It used to run off a short screen with a long step.
- @docentjs/core@0.7.1

## 0.7.0

### Minor Changes

- 3268d08: Fewer ways to be wrong without being told, and less typing for common looks.
  
  - **A command line checker.** `npx @docentjs/cli validate "tours/*.json"` checks tour files without a browser, for CI and for tools that write tours. It exits 1 on errors, `--json` reports for other programs, and `docent schema` prints or writes the JSON Schema. Tour files may also carry `$schema`, which is now a known field.
  - **Warnings for silent mistakes.** Starting a tour id that does not exist now says so and lists the ids it knows. A step skipped because its target is missing names the step and the target it looked for. Both only in development; production builds contain neither.
  - **Three looks under one name.** `options.template: 'hint'` keeps the page usable with a glowing ring and a curved arrow; `'announcement'` blurs the page for something to read; `'spotlight'` is the default spelled out. They are ordinary templates, so registering one of those names replaces it.
  - **Devtools Audit measures the page.** It now reports targets that exist but cannot be seen: no visible box, transparent, tiny, off screen, or covered by a fixed panel, plus a click step whose target is disabled.

### Patch Changes

- Updated dependencies [3268d08]
  - @docentjs/core@0.7.0

## 0.6.0

### Minor Changes

- c1a247c: Customization is more consistent and harder to get wrong.
  
  - **Numbers where numbers make sense.** Size and time tokens take a plain number as well as a CSS string: `radius: 12` is `12px`, `duration: 180` is `180ms`.
  - **Presets by name in the tour JSON.** `options.theme: 'dark'`, or `{ preset: 'dark', accent: '#7c3aed' }` to start from one and change it. Preset tokens load on demand, so tours that name none download nothing extra.
  - **Readable button text, automatically.** Set `accent` alone and Docent picks light or dark text for it, so a bright brand color no longer produces an unreadable Next button. Setting `accentForeground` still wins.
  - **`appearance: 'light' | 'dark' | 'auto'`.** With `auto` the popover follows the reader's system setting and switches with it mid-tour, while your own tokens stay on top.
  - **One home for overlay settings.** `options.overlay.color` and `.opacity` are the place to set the backdrop; the `overlay` and `overlayOpacity` theme tokens still work and are marked as preferring the options.
- c1a247c: Mistakes in a tour now say so instead of failing quietly.
  
  - **`validateTour(tour)`** reports unknown values, misspelled or missing fields, wrong types, out-of-range numbers and duplicate step ids, each with a path such as `steps[2].arrow` and the value that was probably meant: `"curvy" is not one of: caret, none, line, … Did you mean "curve"?`. Also `isValidTour` and `formatIssues`. It ships as `@docentjs/core/validate`, re-exported from `@docentjs/dom/validate`, so runtime bundles never carry it.
  - **Development warnings.** `createTour` and `createDocent` check each tour once and warn in the console. Production builds contain neither the call nor the checker.
  - **A published JSON Schema** at `https://docentjs.dev/schema/tour-v1.json`, generated from the same description the checker uses. Point a `.tour.json` file at it with `$schema` for completion and checking in your editor.
  - **Devtools**: the Audit tab now lists schema problems alongside its page checks.

### Patch Changes

- Updated dependencies [c1a247c]
- Updated dependencies [c1a247c]
  - @docentjs/core@0.6.0

## 0.5.2

### Patch Changes

- @docentjs/core@0.5.2

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
