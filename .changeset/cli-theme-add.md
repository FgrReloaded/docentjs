---
'@docentjs/cli': minor
'@docentjs/core': minor
---

Install a theme with one command.

```sh
npx @docentjs/cli theme add ledger
```

`docent theme add <name|url>` checks the theme and writes it to
`docent-theme.json` (`--out` to put it elsewhere, `--force` to replace one);
`docent theme list` shows what is available. The named themes are bundled into
the CLI, so it works offline and a given version always installs the same files.
Any URL works too, so anyone can publish a theme.

A theme is checked before anything is written, and a broken one is refused, with
the value that was probably meant: `"tick" is not one of … Did you mean "ticks"?`.
CSS that loads from elsewhere (`@import`, `url()`) is flagged for a second look,
since it runs in your reader's page.

The check is `validateTheme()`, new in `@docentjs/core/validate` alongside
`validateTour()`. It caught that every shipped theme set the scrim through the
older `theme.overlay` token; they now use `overlay.color` and `overlay.opacity`.
