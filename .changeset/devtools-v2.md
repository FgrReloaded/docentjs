---
'@docentjs/devtools': minor
---

Devtools v2: a rebuilt panel with live editing, auditing and performance.

- **Edit**: change steps, targets, tour options, arrows, spotlight, overlay and theme, and the running tour updates as you type. Reorder, duplicate, add and delete steps. Copy or download the edited JSON.
- **Target picker**: click any element on the page and get selectors ranked by stability, with warnings for generated class names and structural paths.
- **Audit**: missing and fragile targets, text contrast, duplicate step ids, clicks the tour blocks, unknown conditions and more, ranked by severity.
- **Performance**: time to show each step, popover moves, long frames and DOM cost for a played tour.
- A now-playing bar with Back, Next, Edit this step and Stop; event filters; docking right, bottom or left with a resizable edge.

Built with Preact, bundled inside the package, so apps need no extra dependencies. Still loads only in development.
