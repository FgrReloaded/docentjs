---
'@docentjs/dom': patch
---

The popover now looks considered on small and short screens, not merely functional.

- **A docked card, not a drawer.** Below the sheet width it sits near the bottom with a margin on every side and its full corner radius, instead of stretching edge to edge. It takes at most 72% of the height, so the page and the spotlight stay visible behind it.
- **Never cut off.** The popover is capped to the screen height. Longer text scrolls inside the card, the last line fades while more remains, and the title and buttons stay in place. Images and video are capped too.
- **Tighter on small screens.** Padding, title size and spacing shrink a little below 420 px wide or 600 px tall, where the old sizes wasted space.
- **Always on screen.** When no side has room, the popover overlaps part of the target rather than hanging off the edge, where nothing could be read. It used to run off a short screen with a long step.
