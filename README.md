# Docent

**Guided product tours for the web.** Docent dims the page, spotlights one element, explains it in
a small popover, and gets out of the way.

[![npm](https://img.shields.io/npm/v/@docentjs/dom?label=npm)](https://www.npmjs.com/package/@docentjs/dom)
[![CI](https://github.com/FgrReloaded/docentjs/actions/workflows/ci.yml/badge.svg)](https://github.com/FgrReloaded/docentjs/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A tour is a plain JSON document, so tours can be written by hand, reviewed in a pull request,
generated, stored in a repo or served from an API. About 15 kB for the engine and the web renderer
together.

**[Documentation](https://docentjs.dev)** · [Getting started](https://docentjs.dev/getting-started/)
· [Live examples](https://docentjs.dev/examples/) · [Tour schema](https://docentjs.dev/reference/schema/)

## Quick start

```sh
pnpm add @docentjs/dom     # or @docentjs/react, @docentjs/vue, @docentjs/svelte
```

One package is enough: each framework package includes the engine and the web renderer.

```ts
import { createTour, defineTour } from '@docentjs/dom'

const welcome = defineTour({
  id: 'welcome',
  options: { showProgress: true },
  steps: [
    { id: 'intro', title: 'Welcome', body: 'This takes about a minute.' },
    { id: 'sidebar', target: { name: 'sidebar' }, title: 'Navigation', placement: 'right' },
    { id: 'new', target: '#new-project', title: 'Create a project', advance: { on: 'click' } },
    { id: 'done', title: 'All set' },
  ],
})

createTour(welcome).start()
```

Steps point at elements by name, which survives a redesign better than a CSS class:

```html
<aside data-docent="sidebar">…</aside>
```

For several tours, with rules about who sees which one and when, use the manager:

```ts
import { createDocent } from '@docentjs/dom'

const docent = createDocent({ tours: [welcome, billing] })
docent.identify(user.id, { plan: user.plan })
```

## Why

- **Tours are data.** Every visual choice — arrow, spotlight shape and ring, overlay, the step
  counter, theme tokens — is a field in the JSON, not CSS in your app. A whole look is one file: a
  [theme](https://docentjs.dev/customize/themes/), installable with
  `npx @docentjs/cli theme add ledger`.
- **Small.** About 15 kB compressed for engine and renderer. Drawn arrows and theme presets load
  only when a tour uses one.
- **Accessible.** Dialog semantics, focus kept in the popover and returned afterwards, full
  keyboard control, reduced motion, 44 px touch targets.
- **Isolated.** The popover renders in a shadow root, so your CSS cannot break it and its CSS
  cannot leak into your page.
- **Any framework, or none.** Thin adapters for React, Vue and Svelte over one engine, or bring
  your own popover with [headless mode](https://docentjs.dev/customize/headless/).
- **Checked.** `npx @docentjs/cli validate "tours/*.json"` in CI, a published
  [JSON Schema](https://docentjs.dev/schema/tour-v1.json), and the same checks in development.
- **Good with AI.** Plain-text docs at [llms.txt](https://docentjs.dev/llms.txt) and a checker, so
  an assistant can write tours and prove they are valid.

## Packages

| Package | Description |
| --- | --- |
| [`@docentjs/dom`](packages/dom) | Web renderer: overlay, spotlight, popover, positioning. Start here. |
| [`@docentjs/core`](packages/core) | Platform-agnostic engine: schema, state machine, triggers, persistence, events. No DOM. |
| [`@docentjs/react`](packages/react) | React bindings. |
| [`@docentjs/vue`](packages/vue) | Vue bindings. |
| [`@docentjs/svelte`](packages/svelte) | Svelte bindings. |
| [`@docentjs/devtools`](packages/devtools) | Development panel: why a tour is not showing, live editing, replay, simulated users, target and contrast checks. |
| [`@docentjs/cli`](packages/cli) | `docent validate`, `docent schema`, `docent theme add`. |

Every `@docentjs/*` package shares one version. While on 0.x: **minor may break, patch is safe.**

## Development

Node 24 (a `mise.toml` is included) and pnpm 10.

```sh
pnpm install
pnpm build         # every package
pnpm test          # unit tests (Vitest)
pnpm test:e2e      # browser tests (Playwright)
pnpm typecheck
pnpm lint          # Biome
pnpm size          # bundle budgets
```

- `pnpm --filter @docentjs/docs dev` runs the documentation site (Astro + Starlight) with live demos.
- `examples/` holds vanilla, React, Vue and Svelte apps.

[CONTRIBUTING.md](CONTRIBUTING.md) has the longer version, [RELEASING.md](RELEASING.md) explains how
a release happens, [SECURITY.md](SECURITY.md) is for reporting a vulnerability, and
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) covers how people treat each other here.

## License

[MIT](LICENSE)
