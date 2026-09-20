#!/usr/bin/env bash
# Adds the trusted publisher entry for every @docentjs package, exactly as the
# release workflow needs it. npm asks you to approve each one with 2FA.
# Fields are case-sensitive; the owner is `FgrReloaded`, not the npm username.
set -euo pipefail

REPO="FgrReloaded/docentjs"
WORKFLOW="release.yml"

for pkg in core dom react vue svelte devtools cli; do
  echo
  echo "== @docentjs/$pkg"
  npm trust github "@docentjs/$pkg" --repo "$REPO" --file "$WORKFLOW" --allow-stage-publish -y
done

echo
echo "Done. Existing entries with typos are harmless but can be removed on npmjs.com."
