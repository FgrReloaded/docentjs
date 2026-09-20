---
'@docentjs/dom': patch
---

Drawn arrows now point at large targets properly.

A connector aimed at the target's centre, so a sidebar or a full-width banner
stretched the line down or across the whole element: the head ended up far below
or beside the popover it was supposed to connect. It now lands on the part of the
target's edge that faces the popover, and on the visible part of a target taller
than the screen.

Every connector also leaves the card at a deliberate angle with a little space
before the line starts, instead of pointing dead-on.

A target too big to sit beside leaves the popover clamped on top of it, with no
band to draw a line in. The connector now leaves the card sideways and lands on
the stretch of the target's edge the card does not cover, instead of being
dropped — which made choosing an arrow in the devtools editor look like it did
nothing. The caret is used only when the card covers the target entirely.

Setting `gap` on the renderer no longer stops drawn arrows from appearing. The
option is written with the default caret in mind, so a value smaller than the
room a connector needs left no space to draw in; a connector now takes the
larger of the two. This is why the framework examples, which all set a small
gap, showed no arrow whatever style they asked for.
