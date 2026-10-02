---
'@docentjs/core': minor
'@docentjs/dom': minor
'@docentjs/devtools': minor
---

A compact card for phones: `options.mobile.card: 'compact'`. Instead of a card as wide as the screen, the popover becomes a coachmark that sits right beside its target and points at it, as on a large screen, so most of the page stays in view. It is sized by its content, up to about 70% of the screen. The counter becomes a row of dots with the current step as a pill, Back is a round chevron (its label stays for screen readers), Next is a small pill, and Skip steps aside for the close button, which does the same. The card springs open from its caret and lands with a small spring on each step. Buttons are drawn small but keep a ~44px area to tap. It never docks unless `layout` is `'dock'`: when no side of the target has room, it overlaps the target's edge from above or below, without a caret. Connector arrows show on it, so themes keep their character on phones. Themes can set it too, and the devtools Edit tab lists it under Phone card.
