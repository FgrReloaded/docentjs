---
'@docentjs/react': patch
'@docentjs/vue': patch
'@docentjs/svelte': patch
---

One install is now enough for framework apps. `@docentjs/react`, `@docentjs/vue` and `@docentjs/svelte` re-export `defineTour`, the tour and renderer types (`RenderContext`, `Step`, `Theme`, …) and `createLocalStorage`, and each has a `/themes` entry with the presets. Previously, importing these from `@docentjs/core` failed under pnpm unless core was installed separately. In React the tour type is exported as `TourDefinition`, since `Tour` is the component.
