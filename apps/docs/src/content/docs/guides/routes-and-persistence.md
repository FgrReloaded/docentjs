---
title: Routes and persistence
description: Tours that span pages and survive reloads.
---

## Multi-page tours

Give each step a `route` pattern. When the current path does not match, the controller pauses and hides everything; when the user arrives, it resumes.

```ts
steps: [
  { id: 'open', route: '/app', target: { name: 'nav-invoices' }, advance: { on: 'click' } },
  { id: 'new', route: '/app/invoices', target: { name: 'new-invoice' } },
]
```

Patterns are path globs: `/settings`, `/users/:id`, `/users/*`, `/docs/**`. Query strings and hashes are ignored.

`createTour` listens to `popstate`, `hashchange`, and the Navigation API, which covers most routers including `pushState`-based ones. If your router bypasses those, call `controller.routeChanged()` after navigation.

## Persistence

With `options.persist` the current step is stored, so `resume()` continues after a navigation or reload. Progress is keyed by tour id in `localStorage` with a memory fallback. The stored record also drives frequency rules.

```ts
createTour(tour).resume()
```

Swap the storage for anything with `get`, `set`, and `remove`, sync or async:

```ts
createTour(tour, { storage: { get: (k) => api.get(k), set: (k, v) => api.put(k, v), remove: (k) => api.del(k) } })
```
