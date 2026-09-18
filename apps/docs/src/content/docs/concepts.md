---
title: Concepts
description: How Docent is put together and why.
---

## A tour is data

Everything about a tour that can be serialized lives in one JSON document: steps, targets, placement, behaviour, triggers, conditions, theme tokens, and a template name. The engine, every renderer, the visual builder, and the hosted service all agree on this one schema. It carries a `schemaVersion` so it can evolve.

The only things that are not data are functions: lifecycle hooks and custom slot renderers. Those attach in code, keyed by step id.

## Three layers

**Core** (`@docentjs/core`) is the engine. It owns the schema types, a pure reducer for tour state, condition evaluation, route matching, persistence rules, and event creation. It never touches the DOM, so it runs anywhere and is unit tested without a browser.

**Renderer** (`@docentjs/dom`) draws. It resolves targets, positions the popover with custom logic, cuts the spotlight into the overlay, handles keyboard and focus, and follows the target through scroll and resize. A future React Native renderer implements the same small interface.

**Adapters** (`@docentjs/react`, `@docentjs/vue`, `@docentjs/svelte`) are thin. They hold no logic; they bind a controller's lifecycle and state to the framework and let you render your own popover component.

## The controller

`TourController` in core drives one tour: it runs the reducer, asks the renderer to show steps, waits for lazy targets, runs hooks, emits events, and persists progress. `createTour` from the dom package returns a browser-ready subclass with `localStorage` and route tracking already wired.

```ts
const c = createTour(tour)
c.start()      // or c.resume()
c.next(); c.back(); c.skip(); c.goTo('step-id')
c.notify('saved')   // advances a step waiting on { on: 'event', name: 'saved' }
c.subscribe((state) => …)
c.destroy()
```

## Seams

Four interfaces let the same tour run against different backends:

| Seam | Purpose | Default on the web |
| --- | --- | --- |
| `TourSource` | Where tours come from | inline objects |
| `Identity` | User id and traits for targeting | anonymous |
| `StorageAdapter` | Progress and seen-state | `localStorage`, memory fallback |
| `EventSink` | Lifecycle events for analytics | none |

Wire them to your own backend, or to a hosted service later, without changing tours.

## Rendering model

The overlay, spotlight, and built-in popover render inside a Shadow Root, so your page CSS cannot break them and theirs cannot leak out. Theme tokens are CSS custom properties, which cross that boundary on purpose. Custom content you provide, through slots or headless mode, lives in your page's DOM so your styling and framework behaviour keep working.
