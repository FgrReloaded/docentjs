---
'@docentjs/dom': minor
'@docentjs/core': minor
---

Customizable arrows, spotlight and overlay, set in tour JSON per tour or per step. The current look stays the default.

- **`arrow`**: `caret` (default), `none`, or one of ten drawn connectors from the popover to the target: `line`, `dashed`, `dotted`, `curve`, `curve-dashed`, `squiggle`, `loop`, `elbow`, `sketch`, `pin`. Connectors draw in after the popover settles and respect reduced motion. Their code loads on first use as a separate 1.8 kB chunk, so tours that keep the caret never download it.
- **`spotlight.shape`**: `rounded` (default), `rect`, `pill`, `circle`. **`spotlight.ring`**: `hairline` (default), `none`, `glow`, `pulse`, `dashed`, `solid`.
- **`overlay.style`**: `dim` (default), `blur`, `vignette`, or `none`, which leaves the page usable for hint-style tours. `overlay.blur` sets the blur radius.
- Renderer options and templates accept `arrow`, `spotlight` and `overlay` too. Precedence is renderer, template, tour, then step.
- New theme tokens `connector` and `ring`, and a `connector` styling part.
- Fix: renderer `overlay` options (color and opacity) were ignored.

`@docentjs/core`: new schema types `ArrowStyle`, `SpotlightShape`, `SpotlightRing`, `OverlayStyle` and `OverlayOptions`. `TourController.updateTour()` and `Docent.updateTour()` replace a tour's definition while it runs, keeping the current step, without re-arming triggers.

The initial bundle grows by about 1.5 kB compressed.
