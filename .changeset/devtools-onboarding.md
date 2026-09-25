---
"@docentjs/devtools": patch
"@docentjs/dom": patch
---

Devtools: a short guided tour of the panel, built with Docent, runs the first time the panel opens. It covers the Tours and Edit tabs, drafts, and what each step and tour setting means (target, element picker, placement, advance, interaction, route, tour settings, look and theme). The new "?" button in the header replays it, and `mount(docent, { onboarding: false })` turns off the first-run start. The tour runs on its own controller, so it never appears in your tours, events, audit or perf. The panel also moves from violet to a darker slate palette with a blue accent.

A popover now follows its target when the target scrolls inside a shadow root, such as a scrolling area in a web component. Before, it stayed where it was.
