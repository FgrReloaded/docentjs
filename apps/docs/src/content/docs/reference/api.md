---
title: API
description: Exports of each package.
---

## `@docentjs/core`

- `defineTour(tour)` returns the tour with `schemaVersion` set.
- `TourController` drives one tour against a `Renderer`. Methods: `start(at?)`, `resume()`, `next()`, `back()`, `skip()`, `goTo(step)`, `abort(reason)`, `notify(event)`, `routeChanged()`, `subscribe(fn)`, `getState()`, `destroy()`.
- `Docent` is the tour manager: `ready`, `identify(id, traits)`, `track(event)`, `start(id, { at })`, `stop()`, `reset(id?)`, `refresh()`, `isEligible(id)`, `tourState(id)`, `getState()`, `subscribe(fn)`, `activeController`, `destroy()`. It needs a `DocentEnvironment` and a controller factory; use `createDocent` from the dom package.
- `ControllerOptions`: `tour`, `renderer`, `identity`, `storage`, `sink`, `hooks`, `custom`, `tourState`, `defaultWaitMs`, `now`.
- Engine helpers: `reduce`, `evaluateCondition`, `evaluateAll`, `matchRoute`, `shouldShow`, `ProgressStore`, `createMemoryStorage`, `createEvent`, `combineSinks`, `NOOP_SINK`.
- Types: everything in the [schema](/reference/schema/), plus `Renderer`, `RenderContext`, `EngineState`, `TourHooks`, `StepHooks`, the four seams, and `DocentEvent`.

## `@docentjs/dom`

- `createDocent(options?)` returns a browser-ready `Docent`. Options: `tours` (array or `TourSource`), `identity`, `storage`, `sink`, `hooks` keyed by tour id, `custom`, `renderer`, `document`.
- `createTour(tour, options?)` returns a `DomTourController` with the DOM renderer, `localStorage`, and route tracking wired. `options` extends `ControllerOptions` with `renderer: DomRendererOptions` and `followRoutes`.
- `DomRenderer` implements `Renderer`. Options: `document`, `labels`, `gap`, `spotlight`, `theme`, `slots`, `templates`, `template`, `headless`, `css`, `sheetBreakpoint`, `avoidOcclusion`.
- `createLocalStorage()` returns a `StorageAdapter` over `localStorage` with a memory fallback.
- Positioning and target helpers: `computePosition`, `resolveTarget`, `waitForTarget`, and friends, for building your own renderer pieces.
- `@docentjs/dom/themes` exports the presets `light`, `dark`, `minimal`, `contrast`, and `presets`.

## `@docentjs/react`

- `useTour(tour, options?)` returns `{ state, active, start, resume, next, back, skip, goTo, notify, controller, portal }`. `options.popover` is a render function for a custom popover; render `portal` once in your tree.
- `useDocent(options?)` creates the manager for the component's lifetime and returns `{ state, docent, identify, track, start, stop, reset, refresh, portal }`. Accepts `popover` like `useTour`.
- `<Tour tour autoStart popover>{(handle) => …}</Tour>` component form.
- `<DocentProvider renderer identity storage sink>` shares defaults with every tour below it.

## `@docentjs/vue`

- `useTour(tour, options?)` returns refs `state`, `active`, `popoverContext`, `popoverTarget`, plus the controls and `destroy`. Auto-destroys with the component when called in `setup()`.
- `useDocent(options?)` returns a reactive `state` ref, the manager methods, `popoverContext`, `popoverTarget`, and `destroy`.
- `<TourPopover :tour v-slot="{ ctx }">` accepts the handle from `useTour` or `useDocent` teleports its slot into the positioned container when `popover: true`.
- `provideDocentDefaults(defaults)` shares defaults with descendants.

## `@docentjs/svelte`

- `useTour(tour, options?)` returns stores `state` and `active`, the controls, and `destroy`. `options.popover` is a component mounted with `ctx` as a prop.
- `useDocent(options?)` returns a `state` store, the manager methods, and `destroy`. Accepts `popover` as a component.
- `use:tour={handle}` action starts on mount and destroys on removal.
