---
'@docentjs/core': minor
'@docentjs/dom': minor
---

A card laid out for phones. Below `sheetBreakpoint` the step counter becomes one segment per step across the top of the card, the current one filling as the step opens; the main button (Next or Done) is full width and 48px tall; Back and Skip sit beneath it as quiet text. A step with no target, such as a welcome or a finish, is centred on the screen instead of docked, with a larger title and its image at the top. New option `options.mobile.card`: `'stories'` (the default) or `'classic'` for the large-screen card. The count stays available to screen readers, and themes' own progress styles keep applying on large screens.
