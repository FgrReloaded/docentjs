---
'@docentjs/core': minor
'@docentjs/dom': minor
---

On small screens the card now sits beside its target when it fits: as wide as the screen, directly above or below the element, pointing at it with the caret or the tour's connector arrow. It docks near the bottom only when it fits on neither side, and a docked card now points at its target too (caret lined up with it, or the connector drawn to it). A target pinned to the bottom of the screen, such as a tab bar, or at the very end of the page gets the card docked at the top instead. The choice is made once per step, so the card does not jump while the page scrolls. New tour option `options.mobile.layout` (`'auto'`, `'float'` or `'dock'`) and renderer option `mobile` choose the behaviour. A target shown after its step starts is now scrolled into view.
