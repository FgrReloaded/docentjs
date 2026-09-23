---
"@docentjs/core": minor
"@docentjs/dom": minor
"@docentjs/devtools": patch
---

Add `minViewportWidth` to skip tours on small screens. Set it on `createDocent` for every tour or in a tour's `options` for one tour. Below that width, no trigger fires and `start()` does nothing. Triggers are checked again when the window grows past it. Devtools shows the viewport as the reason a tour is blocked.
