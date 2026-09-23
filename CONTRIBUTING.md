# Contributing

Thanks for taking the time. Issues, questions and pull requests are all welcome.

Docent runs inside other people's products, so the bar is: small surface, no surprises, and
everything visual expressible as data. If a change is large or changes the tour schema, open an
issue first so we can agree on the shape before you write it.

## Setup

Node 24 and pnpm 10. A `mise.toml` is included, so [mise](https://mise.jdx.dev) users can run
`mise install`.

```sh
pnpm install
pnpm build
```

Browser tests need their browser once: `pnpm exec playwright install chromium`.

## The checks

These are exactly what CI runs, so run them before pushing:

```sh
pnpm lint          # Biome: formatting and lint rules
pnpm build
pnpm typecheck
pnpm gen:schema --check   # the published JSON Schema matches the spec
pnpm test          # Vitest
pnpm size          # bundle budgets
pnpm check:publish # publint + are-the-types-wrong
pnpm test:e2e      # Playwright, desktop and mobile
```

`pnpm lint:fix` formats and fixes what it can. Biome settings live in `biome.json`: two spaces,
single quotes, no semicolons, 100 columns. Please don't reformat unrelated code.

## Where things live

| Path | What it is |
| --- | --- |
| `packages/core` | The engine: schema, state machine, triggers, conditions, persistence, events. **No DOM access.** |
| `packages/dom` | The web renderer: overlay, spotlight, popover, positioning, keyboard and focus. |
| `packages/react`, `vue`, `svelte` | Thin adapters over the same engine. |
| `packages/devtools` | The development panel (Preact, bundled). |
| `packages/cli` | `docent validate`, `docent schema`, `docent theme add`. |
| `apps/docs` | The documentation site (Astro + Starlight) and its live demos. |
| `examples/` | Vanilla, React, Vue and Svelte apps, also used by the e2e suite. |
| `themes/` | The ready-made themes, as JSON. |
| `e2e/` | Playwright specs and fixtures. |

Two rules worth knowing before you move code around:

- **`core` never touches the DOM.** It has to run anywhere, including on a server and, later, in a
  native renderer. Anything that measures or draws belongs in `dom`.
- **A look is data, not code.** Prefer a new field in the tour schema over a slot or CSS, so the
  whole appearance can still travel as one JSON file.

## Tests

- Unit tests sit next to the code as `*.test.ts`, run by Vitest.
- Browser behaviour (positioning, focus, scrolling, small screens) belongs in `e2e/`. The suite
  runs against a desktop and a mobile project, and both must pass.
- A bug fix should come with the test that fails without it.

## Changesets

Anything that changes a published package needs a changeset:

```sh
pnpm changeset
```

Pick the bump, write one line in plain words about what changed for the person using it. Commit the
generated `.changeset/*.md` alongside the code. All `@docentjs/*` packages share one version, so one
changeset bumps them all. **Docs, tests and examples need no changeset.**

While Docent is on 0.x: minor may break, patch is safe.

## Pull requests

- One topic per pull request; keep unrelated cleanup in its own commit.
- Say what changed and why. If it is visible, a screenshot or a short clip helps.
- Update the docs in `apps/docs` in the same pull request when behaviour or options change. Docs
  that drift from the code are treated as a bug.
- CI must be green.

Releases are described in [RELEASING.md](RELEASING.md) and are done by the maintainer; nothing is
published from a pull request.

## Reporting bugs

Open an issue with a minimal reproduction: the tour JSON, what you expected, and what happened.
`npx @docentjs/cli validate` output helps. For anything security-related, follow
[SECURITY.md](SECURITY.md) instead of opening an issue.

## Conduct

Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
