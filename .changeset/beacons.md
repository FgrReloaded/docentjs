---
"@docentjs/core": minor
"@docentjs/dom": minor
"@docentjs/devtools": minor
---

Add beacons: `trigger: { type: 'beacon' }` puts a small mark on the first step's target that opens the tour on click, or on hover and keyboard focus with `open: 'hover'`. `options.beacon` sets the style (`pulse`, `dot`, `ring`, `badge`, or `none` for a plain tooltip), position, offset, size and badge text, and the `beacon` theme token its colour. A beacon's tip keeps the page usable, closes on an outside click (the new `closeOnOutsideClick` option) and, with one step, drops the counter and says "Got it". New events `beacon:shown` and `beacon:opened`, a `focus` renderer option, and devtools support in the Tours, Edit and Audit tabs. The beacon code loads only on pages that have a beacon tour.
