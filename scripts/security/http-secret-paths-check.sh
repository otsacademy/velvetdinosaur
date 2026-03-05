#!/usr/bin/env bash
set -euo pipefail

if [ -z "${BASE_URL:-}" ]; then
  echo "BASE_URL is required (e.g. https://example.com)" >&2
  exit 2
fi

base="${BASE_URL%/}"
paths=(
  "/.env"
  "/.env.production"
  "/.env.local"
  "/.git/HEAD"
  "/.git/config"
  "/package.json"
)

failed=0

for path in "${paths[@]}"; do
  result=$(curl -sS -o /dev/null -w "%{http_code} %{content_type}" "${base}${path}")
  status="${result%% *}"
  content_type="${result#* }"
  if [ "$content_type" = "$result" ]; then
    content_type="-"
  fi
  printf "%s %s %s\n" "$path" "$status" "$content_type"
  case "$status" in
    403|404) ;;
    *) failed=1 ;;
  esac
done

exit "$failed"
