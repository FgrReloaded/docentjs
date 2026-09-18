---
title: API
description: Exports of each package.
---

## `@docentjs/core`

- `defineTour(tour)` returns the tour with `schemaVersion` set.
- `TourController` drives one tour against a `Renderer`. Methods: `start(at?)`, `resume()`, `next()`, `back()`, `skip()`, `goTo(step)`, `abort(reason)`, `notify(event)`, `routeChanged()`, `subscribe(fn)`, `getState()`, `destroy()`.
- `ControllerOptions`: `tour`, `renderer`, `identity`, `storage`, `sink`, `hooks`, `custom`, `tourState`, `defaultWaitMs`, `now`.
- Engine helpers: `reduce`, `evaluateCondition`, `evaluateAll`, `matchRoute`, `shouldShow`, `ProgressStore`, `createMemoryStorage`, `createEvent`, `combineSinks`, `NOOP_SINK`.
- Types: everything in the [schema](/reference/schema/), plus `Renderer`, `RenderContext`, `EngineState`, `TourHooks`, `StepHooks`, the four seams, and `DocentEvent`.

## `@docentjs/dom`

- `createTour(tour, options?)` returns a `DomTourController` with the DOM renderer, `localStorage`, and route tracking wired. `options` extends `ControllerOptions` with `renderer: DomRendererOptions` and `followRoutes`.
- `DomRenderer` implements `Renderer`. Options: `document`, `labels`, `gap`, `spotlight`, `theme`, `slots`, `templates`, `template`, `headless`, `css`, `sheetBreakpoint`, `avoidOcclusion`.
- `createLocalStorage()` returns a `StorageAdapter` over `localStorage` with a memory fallback.
- Positioning and target helpers: `computePosition`, `resolveTarget`, `waitForTarget`, and friends, for building your own renderer pieces.
- `@docentjs/dom/themes` exports the presets `light`, `dark`, `minimal`, `contrast`, and `presets`.

## `@docentjs/react`

- `useTour(tour, options?)` returns `{ state, active, start, resume, next, back, skip, goTo, notify, controller, portal }`. `options.popover` is a render function for a custom popover; render `portal` once in your tree.
- `<Tour tour autoStart popover>{(handle) => …}</Tour>` component form.
- `<DocentProvider renderer identity storage sink>` shares defaults with every tour below it.

## `@docentjs/vue`

- `useTour(tour, options?)` returns refs `state`, `active`, `popoverContext`, `popoverTarget`, plus the controls and `destroy`. Auto-destroys with the component when called in `setup()`.
- `<TourPopover :tour v-slot="{ ctx }">` teleports its slot into the positioned container when `popover: true`.
- `provideDocentDefaults(defaults)` shares defaults with descendants.

## `@docentjs/svelte`

- `useTour(tour, options?)` returns stores `state` and `active`, the controls, and `destroy`. `options.popover` is a component mounted with `ctx` as a prop.
- `use:tour={handle}` action starts on mount and destroys on removal.
