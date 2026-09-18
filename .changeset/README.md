# Changesets

Run `pnpm changeset` to describe a change. All `@docentjs/*` packages are version-locked
together (`fixed`), so one changeset bumps every package. `pnpm version` applies pending
changesets; `pnpm release` builds and publishes.
