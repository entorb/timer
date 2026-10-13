#!/bin/sh
# screenshots of all sub-apps (mobile) into tmp/screens/<lang>/
# usage: scripts/run_screens.sh [en|de]
set -e
cd "$(dirname "$0")/.."

lang=${1:-en}
case $lang in
  en | de) ;;
  *)
    echo "usage: $0 [en|de]" >&2
    exit 1
    ;;
esac

SCREEN_LANG=$lang pnpm exec playwright test --config playwright.screens.config.ts
echo "screens in tmp/screens/$lang/"
