---
'@docentjs/dom': patch
---

Small-screen fixes. A step whose target is hidden (`display: none`, e.g. a desktop sidebar on a phone) shows a centred card instead of a stray spotlight in the corner, and spotlights the target once it is shown. When several elements match a target, the one on screen wins, so one `data-docent` name can mark a desktop and a mobile variant. The popover keeps clear of the notch and home indicator on pages with `viewport-fit=cover`. On touch screens the dialog takes focus instead of Next, so no keyboard focus ring appears unasked. A target taller than the screen has its spotlight framed to the visible part, and the docked card no longer scrolls its top out of view.
