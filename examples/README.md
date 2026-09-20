# Examples

Four small products, one library. Each app is a plausible slice of a real
interface with its own design language, so you can see what a tour looks like
when it has to live inside someone else's brand rather than next to it.

| Folder | Product | Stack | Run |
| --- | --- | --- | --- |
| `react/` | **Ledgerline** — receivables for a design studio | Vite + React 19 | `pnpm --filter @docentjs/example-react dev` |
| `vue/` | **Cinder** — an on-call incident console | Vite + Vue 3 | `pnpm --filter @docentjs/example-vue dev` |
| `svelte/` | **Pressroom** — a newsroom run of show | Vite + Svelte 5 | `pnpm --filter @docentjs/example-svelte dev` |
| `vanilla/` | **Nocturne** — an overnight radio playout desk | Plain HTML + import map | serve the repo root, open `examples/vanilla/index.html` |

Build the packages first (`pnpm build` at the root builds packages and examples
in order). The vanilla example loads the built `dist/` output through an import
map, so it needs `pnpm build:packages` and a static server at the repo root.

## What each one shows

Every app runs the manager (`useDocent` / `createDocent`) alongside one tour
drawn by the app itself, so both halves of the API are in every example.

**Ledgerline (React)** — an `auto` trigger that fires once per person and
survives a reload; steps that hand control back to the user (`advance` on
`click` and `input`); a step that waits for a drawer to mount (`onMissing:
'wait'`); step hooks that open and close that drawer; `identify()` traits
gating a release note; `track()` raising an event tour; three templates
(a house style, a `hint`-style margin note, an announcement with a drawn
figure in the `media` slot); a custom React popover in headless mode.

**Cinder (Vue)** — a tour triggered by an *element appearing* rather than a
timer; `advance: { on: 'element' }` waiting for a checklist the user has to
reveal; `appearance: 'dark'` as the base surface with brand tokens layered on
top by the template; slots for the title and a segmented progress bar; a
`signal` template with no scrim, a pulsing ring and a `pin` connector; a
custom Vue popover teleported through `<TourPopover>`.

**Pressroom (Svelte)** — the `buttons` slot fully replaced with the paper's
own controls, a folio counter in roman numerals, a `sketch` connector and a
dashed ring for the galley note, and a custom Svelte popover component passed
straight to `useTour({ popover })`.

**Nocturne (vanilla)** — no framework at all: templates, slots and a headless
popover built with `document.createElement`, plus a `custom` condition
predicate (`onAir`) that keeps a tour from running when the studio is not live.
Open it with `?start=<tour-id>` to jump straight into one.

The Playwright fixture used by `pnpm test:e2e` lives in `e2e/fixtures/`, not here.
