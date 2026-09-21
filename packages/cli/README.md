# @docentjs/cli

Command line tools for [Docent](https://github.com/FgrReloaded/docentjs): check tour files, and install themes.

```sh
npx @docentjs/cli theme add ledger
npx @docentjs/cli validate "tours/*.json"
```

Or add it to a project and run it from scripts and CI:

```sh
pnpm add -D @docentjs/cli
pnpm exec docent validate "tours/*.json"
```

## Commands

| Command | What it does |
| --- | --- |
| `docent validate <files...>` | Check tour files against the schema. Exits 1 when anything is wrong. |
| `docent schema [file]` | Print the tour JSON Schema, or write it to a file. |
| `docent theme list` | List the ready-made themes. |
| `docent theme add <name\|url>` | Check a theme and write it to `docent-theme.json`. |

Options: `--json` for machine-readable output, `--quiet` to print only problems, `--allow-unknown` to ignore unknown fields.

A file may hold one tour or a list of tours.

```
tours/welcome.json
✗ steps[0].arrow: "curvy" is not one of: caret, none, line, … Did you mean "curve"?
! steps[1].titel: Unknown field, which Docent will ignore. Did you mean "title"?
1 file checked: 1 error, 1 warning.
```

## Themes

A theme is one JSON file that sets how every tour looks. Add one by name, or from any URL:

```sh
docent theme add ledger
docent theme add nocturne --out src/tour-theme.json
docent theme add https://example.com/my-theme.json
```

It is checked before anything is written, so a broken theme is refused rather than installed. Then:

```ts
import theme from './docent-theme.json'

createTour(tour, { renderer: { template: theme } })
```

`--force` replaces an existing file. The named themes are bundled into the CLI, so this works offline and a given version always installs the same files. Browse them at [docentjs.dev/customize/themes](https://docentjs.dev/customize/themes/).

MIT
