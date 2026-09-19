---
'@docentjs/dom': patch
---

Smoother step changes. The popover used to disappear on Next and fade back in from nothing while the spotlight moved alone, which read as lag. It now stays visible and slides from its previous spot to the next one, arriving together with the spotlight, while only its content cross-fades briefly. Transitions use a fast-start easing (`--docent-easing`) and a 220 ms default duration. Reduced-motion users still get no animation.
