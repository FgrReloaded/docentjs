---
'@docentjs/core': minor
'@docentjs/dom': patch
'@docentjs/react': patch
---

Fix React StrictMode, which builds components twice and runs effect cleanups once in development.

- `useDocent` created a second, hidden manager that started its own tours, and the cleanup destroyed the manager the app used, so its tours never auto-started. The manager is now created without side effects and connects on mount.
- The manager has `connect()` and `disconnect()`, and a `connect: false` option to defer watching until connected. `createDocent()` still connects immediately. Loading now starts on first use of `ready`.
- `TourController.destroy()` reset state after an await, so a `start()` right after it could be overwritten back to idle. It now resets first.
- Browser controllers attach navigation listeners when a tour starts instead of on construction, so route following survives StrictMode's cleanup in `useTour`.
- `tourState()` now reports `in-progress` for a tour the manager is running.
- Scrolling past sticky headers now waits until a smooth scroll has actually settled (the target stops moving), instead of a fixed 600 ms that could be too short on slow devices.
