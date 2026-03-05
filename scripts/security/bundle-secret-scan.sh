#!/usr/bin/env bash
set -euo pipefail

root=".next/static"
if [ ! -d "$root" ]; then
  echo "Missing $root; run build first." >&2
  exit 2
fi

set +e
matches=$(rg -a -F --count-matches \
  -e 'mongodb://' \
  -e 'mongodb+srv://' \
  -e 'BEGIN PRIVATE KEY' \
  -e 'sk_live_' \
  -e 'AKIA' \
  -e 'AIza' \
  -e 'ghp_' \
  -e 'xoxb-' \
  "$root")
status=$?
set -e

if [ "$status" -eq 2 ]; then
  echo "rg failed while scanning bundles." >&2
  exit 2
fi

if [ -n "$matches" ]; then
  printf "%s\n" "$matches"
  exit 1
fi
