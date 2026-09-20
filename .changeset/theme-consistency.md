---
'@docentjs/core': minor
'@docentjs/dom': minor
---

Customization is more consistent and harder to get wrong.

- **Numbers where numbers make sense.** Size and time tokens take a plain number as well as a CSS string: `radius: 12` is `12px`, `duration: 180` is `180ms`.
- **Presets by name in the tour JSON.** `options.theme: 'dark'`, or `{ preset: 'dark', accent: '#7c3aed' }` to start from one and change it. Preset tokens load on demand, so tours that name none download nothing extra.
- **Readable button text, automatically.** Set `accent` alone and Docent picks light or dark text for it, so a bright brand color no longer produces an unreadable Next button. Setting `accentForeground` still wins.
- **`appearance: 'light' | 'dark' | 'auto'`.** With `auto` the popover follows the reader's system setting and switches with it mid-tour, while your own tokens stay on top.
- **One home for overlay settings.** `options.overlay.color` and `.opacity` are the place to set the backdrop; the `overlay` and `overlayOpacity` theme tokens still work and are marked as preferring the options.
