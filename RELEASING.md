# Releasing

Docent uses [Changesets](https://github.com/changesets/changesets) with npm **staged
publishing**. All `@docentjs/*` packages share one version. Versions stay on 0.x until the
tour schema and renderer options stabilise: **minor may break, patch is safe.**

## The flow

1. **Make a change, add a changeset.** Run `pnpm changeset`, pick a bump (patch or minor)
   and write a one-line summary. Commit the generated `.changeset/*.md` with the code.
   Docs, tests and examples need no changeset.
2. **Push to `main`.** CI opens or updates a **"chore: version packages"** PR that bumps the
   versions and writes the changelogs. Several changesets collect into one release.
3. **Merge the version PR.** CI builds, runs the publish checks, and **stages** every
   package on npm. Nothing is installable yet. The run summary lists what was staged.
4. **Approve on your machine.** `git pull`, then `pnpm release:approve`. It lists the staged
   versions, asks for confirmation, and approves each one (npm asks for your 2FA code).
   It then tags the version (`v0.2.1`) and pushes that one tag, which creates **one GitHub
   release per version** with notes merged from every package's changelog.

Only step 4 makes anything public, and it needs your 2FA. A compromised CI run can at most
stage a version, which you can reject on npmjs.com → package → Staged Packages.

## Why staged

Docent runs inside other people's websites. A malicious release would run on every site
using it, so no release goes live without a human and a second factor.

## Setup (done once)

Run `scripts/setup-trust.sh` (2FA prompt per package). It adds, for each package, a GitHub
trusted publisher for repository `FgrReloaded/docentjs`, workflow `release.yml`, stage publish
only. Fields are case-sensitive: the owner is `FgrReloaded`. CI authenticates with a
short-lived OIDC token; there is no npm token in the repo secrets.

If staging fails with `OIDC token exchange error - package not found`, the trusted publisher
entry does not match the workflow; rerun the script. Provenance is added automatically only
while the repository is public.

## If something goes wrong

- **A staged version is bad:** reject it on npmjs.com, fix, add a patch changeset, release again.
  A rejected version number is not reused automatically; bump it.
- **Approval failed halfway:** rerun `pnpm release:approve`; already-live versions are skipped.
- **Tag missing:** on the commit that set the version, `git tag -a vX.Y.Z -m vX.Y.Z && git push origin vX.Y.Z`.
  `pnpm release:approve` prints this command when it detects a live but untagged version.
- **Release missing or notes wrong:** Actions → GitHub release → Run workflow, enter the tag.
  It creates the release, or updates it if it exists. Preview notes with
  `node scripts/release-notes.mjs X.Y.Z`.

Tags are one per version (`v0.2.1`), not per package: all packages share a version, and
GitHub drops tag events when more than three tags are pushed at once.

## Prereleases

```sh
pnpm changeset pre enter beta   # version PRs now produce 0.2.0-beta.N, staged under the `beta` tag
pnpm changeset pre exit         # back to normal releases
```

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm changeset` | record a change for the next release |
| `pnpm changeset:version` | apply changesets (CI does this in the version PR) |
| `pnpm release:stage` | stage unpublished versions (CI); add `--dry-run` to preview |
| `pnpm release:approve` | approve staged versions with 2FA, push the `vX.Y.Z` tag |
| `node scripts/release-notes.mjs X.Y.Z` | print the combined release notes for a version |
| `pnpm check:publish` | `publint --strict` and `attw --pack --profile node16` |
