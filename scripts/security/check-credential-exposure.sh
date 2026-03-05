#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$repo_root"

bun run build
"$repo_root/scripts/security/bundle-secret-scan.sh"

if [ -n "${BASE_URL:-}" ]; then
  "$repo_root/scripts/security/http-secret-paths-check.sh"
fi
