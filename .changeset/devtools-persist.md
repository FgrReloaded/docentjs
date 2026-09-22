---
'@docentjs/devtools': minor
---

`mount()` takes `persist: false` to keep the panel's preferences and unsaved
edits out of localStorage, for demos and embedded previews that should start
the same way every time.

A panel mounted into another document (`document: iframe.contentDocument`) now
follows that document's window: it docks at the bottom when the iframe is
narrow, not when the page around it is, and re-checks on the iframe's own
resizes and route changes.

Typing a target name in the Edit tab no longer skips the running step. Each
keystroke used to apply at once, so the first letter pointed the step at an
element that did not exist and the tour moved on; typed names now apply after
a short pause, like the other text fields.
