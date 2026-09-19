# Releasing

Docent uses [Changesets](https://github.com/changesets/changesets). All `@docentjs/*` packages
share one version (fixed group). Versions stay on 0.x until the tour schema and renderer
options stabilise: **minor may break, patch is safe.**

## Every change

1. Make the change.
2. `pnpm changeset` — pick the packages and a bump (patch / minor), write one or two lines
   for the changelog. Commit the generated `.changeset/*.md` with the code.

Docs-only, test-only or example-only changes need no changeset.

## Releasing

Merging to `main` runs `.github/workflows/release.yml`:

- With pending changesets it opens or updates a **"chore: version packages"** PR that bumps
  versions, writes `CHANGELOG.md` files and removes the consumed changesets.
- Merging that PR runs the workflow again, which builds, runs `publint` and
  `@arethetypeswrong/cli`, publishes every changed package to npm, tags the commit
  (`@docentjs/core@x.y.z`) and creates GitHub releases from the changelog.

Nothing ships until the version PR is merged.

## Authentication

Publishing uses npm **trusted publishing** (OIDC), so there is no token in secrets and every
package gets a provenance attestation. Configure once per package on npmjs.com →
package → Settings → Trusted publishing: repository `FgrReloaded/docentjs`, workflow
`release.yml`. Trusted publishing can only be set up for packages that already exist, so:

### First release (manual, once)

```sh
npm login
pnpm changeset:version        # applies .changeset/initial-release.md → 0.1.0
git add -A && git commit -m "chore: version packages"
pnpm changeset:publish        # builds, checks, publishes all five packages
git push --follow-tags
```

Then enable trusted publishing for each package on npm. Every later release goes through
the workflow.

## Prereleases

```sh
pnpm changeset pre enter beta   # version PRs now produce 0.2.0-beta.N under the `beta` tag
pnpm changeset pre exit         # back to normal releases
```

## Snapshots (try a branch build without releasing)

```sh
pnpm changeset version --snapshot canary
pnpm changeset:publish --tag canary   # publishes 0.0.0-canary-<timestamp>
```

Do not commit the snapshot version bumps.

## Checks that run before publishing

- `pnpm build:packages` — packages only, not examples or docs.
- `pnpm check:publish` — `publint --strict` (exports, files, types fields) and
  `attw --pack` (type resolution under every module mode).
- `pnpm size` runs in CI on every PR and enforces the bundle budget.
