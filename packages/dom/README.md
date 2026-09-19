# @docentjs/dom

Web renderer for [Docent](https://github.com/FgrReloaded/docentjs), a guided product tour library. Overlay with a rounded spotlight, custom positioning, an accessible popover in a Shadow Root, keyboard and focus handling, a mobile bottom sheet, and a customization layer with theme tokens, slots, templates and headless mode. About 11 kB compressed including the core.

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

## Also

- `createLocalStorage()` persistence adapter.
- `resolveTarget`, `waitForTarget`, `computePosition` if you build your own renderer pieces.
- Framework bindings: `@docentjs/react`, `@docentjs/vue`, `@docentjs/svelte`.

MIT
