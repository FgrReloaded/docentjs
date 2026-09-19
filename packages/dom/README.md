# @docentjs/dom

Web renderer for [Docent](https://github.com/FgrReloaded/docentjs), a guided product tour library. Overlay with a rounded spotlight, custom positioning, an accessible popover in a Shadow Root, keyboard and focus handling, a mobile bottom sheet, and a customization layer with theme tokens, slots, templates and headless mode. About 13 kB compressed including the core.

```sh
pnpm add @docentjs/dom
```

```ts
import { createTour, defineTour } from '@docentjs/dom'

const tour = defineTour({
  id: 'welcome',
  options: { showProgress: true },
  steps: [
    { id: 'intro', title: 'Welcome', body: 'This takes about a minute.' },
    { id: 'sidebar', target: { name: 'sidebar' }, title: 'Navigation', placement: 'right' },
    { id: 'new', target: '#new-project', title: 'Create a project', advance: { on: 'click' } },
  ],
})

createTour(tour).start()
```

Mark targets with `data-docent="sidebar"` or use CSS selectors.

## Many tours: the manager

```ts
import { createDocent } from '@docentjs/dom'

const docent = createDocent({ tours: [welcome, invoices, whatsNew] })
docent.identify(user.id, { plan: user.plan })
docent.track('invoice-saved')
```

It starts tours from their `trigger` (page load, route, element, event), checks `conditions` against the user's traits, respects `frequency` per user, and runs one tour at a time.

## Customize

```ts
import { minimal } from '@docentjs/dom/themes'

createTour(tour, {
  renderer: {
    theme: minimal,                                  // presets or your own tokens
    slots: { progress: (ctx) => `${ctx.progress.current}/${ctx.progress.total}` },
    templates: { card: { theme: { radius: '16px' }, css: '.popover { border: 1px solid #ddd }' } },
    headless: { render: (ctx, container) => { /* draw your own popover */ } },
  },
})
```

Tours can also carry `options.theme` and `options.template` in their JSON.

## Arrows, spotlight and overlay

```ts
defineTour({
  id: 'welcome',
  options: {
    arrow: 'curve',                                  // caret, none, line, dashed, dotted, curve,
                                                     // curve-dashed, squiggle, loop, elbow, sketch, pin
    spotlight: { shape: 'pill', ring: 'pulse' },     // rounded, rect, pill, circle / hairline, none, glow, pulse, dashed, solid
    overlay: { style: 'blur', blur: 6 },             // dim, blur, vignette, none
  },
  steps: [{ id: 'save', target: '#save', title: 'Save', arrow: 'pin' }],  // or per step
})
```

The default is a small caret, a rounded spotlight with a hairline ring, and a dimmed page. Drawn arrows load on first use as a separate 1.8 kB chunk, so tours that keep the caret never download them.

## Also

- `createLocalStorage()` persistence adapter.
- `resolveTarget`, `waitForTarget`, `computePosition` if you build your own renderer pieces.
- Framework bindings: `@docentjs/react`, `@docentjs/vue`, `@docentjs/svelte`.

MIT
