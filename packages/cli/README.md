# @docentjs/cli

Command line tools for [Docent](https://github.com/FgrReloaded/docentjs) tour files.

```sh
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

Options: `--json` for machine-readable output, `--quiet` to print only problems, `--allow-unknown` to ignore unknown fields.

A file may hold one tour or a list of tours.

```
tours/welcome.json
✗ steps[0].arrow: "curvy" is not one of: caret, none, line, … Did you mean "curve"?
! steps[1].titel: Unknown field, which Docent will ignore. Did you mean "title"?
1 file checked: 1 error, 1 warning.
```

MIT
