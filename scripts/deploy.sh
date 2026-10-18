#!/bin/sh
set -e
cd "$(dirname "$0")/.."

# cleanup
rm -f .DS_Store
rm -f -- ./*/.DS_Store

echo "## Checks"
echo "### Spelling"
./scripts/run_spelling.sh
echo "### Code checks"
./scripts/run_checks.sh

echo "### E2E tests"
./scripts/run_e2e.sh

echo "## Frontend Build and Transfer"
pnpm run build
rsync -rhv --delete --no-perms dist/ entorb@entorb.net:html/timer/

echo "## DONE"
