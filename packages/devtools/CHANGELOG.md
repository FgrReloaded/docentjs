# @docentjs/devtools

## 0.10.2

### Patch Changes

- 0eee360: Devtools: a short guided tour of the panel, built with Docent, runs the first time the panel opens. It covers the Tours and Edit tabs, drafts, and what each step and tour setting means (target, element picker, placement, advance, interaction, route, tour settings, look and theme). The new "?" button in the header replays it, and `mount(docent, { onboarding: false })` turns off the first-run start. The tour runs on its own controller, so it never appears in your tours, events, audit or perf. The panel also moves from violet to a darker slate palette with a blue accent.
  
  A popover now follows its target when the target scrolls inside a shadow root, such as a scrolling area in a web component. Before, it stayed where it was.
- Updated dependencies [0eee360]
  - @docentjs/dom@0.10.2
  - @docentjs/core@0.10.2

## 0.10.1

### Patch Changes

- dab509f: Devtools: the Edit tab follows the running tour to the step that is showing, and marks it in the step list. The draft notice now says where edits are kept (this browser's localStorage), that they are not in your code, and how to keep them, with labelled Copy JSON, Download and Discard draft buttons.
  
  The `loop` arrow is redrawn as a curve with one round loop that crosses itself, and its head now points at the target instead of down or back.
- Updated dependencies [dab509f]
  - @docentjs/dom@0.10.1
  - @docentjs/core@0.10.1

## 0.10.0

### Patch Changes

- 3a5e597: Add `minViewportWidth` to skip tours on small screens. Set it on `createDocent` for every tour or in a tour's `options` for one tour. Below that width, no trigger fires and `start()` does nothing. Triggers are checked again when the window grows past it. Devtools shows the viewport as the reason a tour is blocked.
- Updated dependencies [3a5e597]
  - @docentjs/core@0.10.0
  - @docentjs/dom@0.10.0

## 0.9.0

### Minor Changes

- f1dae52: `mount()` takes `persist: false` to keep the panel's preferences and unsaved
  edits out of localStorage, for demos and embedded previews that should start
  the same way every time.
  
  A panel mounted into another document (`document: iframe.contentDocument`) now
  follows that document's window: it docks at the bottom when the iframe is
  narrow, not when the page around it is, and re-checks on the iframe's own
  resizes and route changes.
  
  Typing a target name in the Edit tab no longer skips the running step. Each
  keystroke used to apply at once, so the first letter pointed the step at an
  element that did not exist and the tour moved on; typed names now apply after
  a short pause, like the other text fields.

### Patch Changes

- Updated dependencies [3582b62]
  - @docentjs/core@0.9.0
  - @docentjs/dom@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [eeaa8a4]
  - @docentjs/core@0.8.0
  - @docentjs/dom@0.8.0

## 0.7.1

### Patch Changes

- Updated dependencies [5d23354]
- Updated dependencies [5d23354]
  - @docentjs/dom@0.7.1
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
  - @docentjs/dom@0.7.0

## 0.6.0

### Patch Changes

- c1a247c: Mistakes in a tour now say so instead of failing quietly.
  
  - **`validateTour(tour)`** reports unknown values, misspelled or missing fields, wrong types, out-of-range numbers and duplicate step ids, each with a path such as `steps[2].arrow` and the value that was probably meant: `"curvy" is not one of: caret, none, line, … Did you mean "curve"?`. Also `isValidTour` and `formatIssues`. It ships as `@docentjs/core/validate`, re-exported from `@docentjs/dom/validate`, so runtime bundles never carry it.
  - **Development warnings.** `createTour` and `createDocent` check each tour once and warn in the console. Production builds contain neither the call nor the checker.
  - **A published JSON Schema** at `https://docentjs.dev/schema/tour-v1.json`, generated from the same description the checker uses. Point a `.tour.json` file at it with `$schema` for completion and checking in your editor.
  - **Devtools**: the Audit tab now lists schema problems alongside its page checks.
- Updated dependencies [c1a247c]
- Updated dependencies [c1a247c]
  - @docentjs/core@0.6.0
  - @docentjs/dom@0.6.0

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
