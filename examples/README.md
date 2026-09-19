# Examples

Each example is a small app with three tours: the built-in popover, a fully custom popover
rendered by the framework (headless mode), and a themed tour using a template.

| Folder | Stack | Run |
| --- | --- | --- |
| `vanilla/` | Plain HTML + import map over the built packages | serve the repo root and open `examples/vanilla/index.html` |
| `react/` | Vite + React 19 | `pnpm --filter @docentjs/example-react dev` |
| `vue/` | Vite + Vue 3 | `pnpm --filter @docentjs/example-vue dev` |
| `svelte/` | Vite + Svelte 5 | `pnpm --filter @docentjs/example-svelte dev` |

Build the packages first (`pnpm build` at the root builds packages and examples in order).
The Playwright fixture used by `pnpm test:e2e` lives in `e2e/fixtures/`, not here.
