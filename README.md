# Docent

Guided product tours for the web. Spotlight an element, explain it, move on.

Docs: [docentjs.dev](https://docentjs.dev)

## Packages

| Package | Description |
| --- | --- |
| `@docentjs/core` | Platform-agnostic engine: schema, state machine, triggers, persistence, events. No DOM. |
| `@docentjs/dom` | Web renderer: overlay, spotlight, popover, positioning. |
| `@docentjs/react` | React bindings. |
| `@docentjs/vue` | Vue bindings. |
| `@docentjs/svelte` | Svelte bindings. |
| `@docentjs/devtools` | Development panel: why a tour is not showing, replay, simulate, target checks. |
| `@docentjs/cli` | `docent validate` checks tour files; `docent schema` prints the JSON Schema; `docent theme add` installs a theme. |

## Development

Requires Node 24 (a `mise.toml` is included) and pnpm 10.

```sh
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
pnpm size
```

## Docs and examples

- `pnpm --filter @docentjs/docs dev` runs the documentation site (Astro + Starlight) with live demos.
- `examples/` holds vanilla, React, Vue and Svelte apps. `pnpm test:e2e` runs the Playwright suite.

See [docs/VISION.md](docs/VISION.md) for the roadmap and architecture decisions.
