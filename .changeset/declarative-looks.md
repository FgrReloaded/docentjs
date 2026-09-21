---
'@docentjs/core': minor
'@docentjs/dom': minor
---

Themes: the popover's most-changed parts are now fields, not code.

Every template in every example replaced the same two slots — the title, to put
the tour's name above the heading, and the progress bar, to make it a counter.
That took about 40 lines of `document.createElement` and 60 lines of CSS per app,
and it could not be published, shared or edited by anything but a person with the
repo open.

Both are now declared:

- **`eyebrow`** — a small line above the title. `{tour}` becomes the tour's name.
  Set it on the tour, a template or the renderer; a step can override or clear it.
- **`progress`** — `meter` (the default), `count`, `ticks`, `dots` or `none`.
  `dots` closes a long-standing gap; it carries the count as an ARIA label, since
  it has no text of its own.
- **`count`** — the counter's format for a look that wants its own, with
  `{current2}` / `{total2}` for two-digit numbers (`03 / 09`).
- **`padding`** — a theme token, since every template was setting it in CSS.

Because none of this needs a function, a whole look is now plain JSON. A theme is
a template with no slots, exported as `DocentTheme`, and `renderer.template` takes
one directly:

```ts
import theme from './docent-theme.json'
createTour(tour, { renderer: { template: theme } })
```

Seven themes ship in `themes/`, with a gallery at `/customize/themes/`.

All four examples are ported. Two slot functions remain across the repo, and both
earn one: the React release note's SVG diagram, and the Svelte folio set in roman
numerals. Everything else is data.

Nothing changes for tours that set none of this: without an eyebrow the heading
renders exactly as before. The initial-load budget moves 250 B to 15 kB / 16.75 kB
brotli to cover it.
