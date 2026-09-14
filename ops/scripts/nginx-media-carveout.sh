#!/usr/bin/env bash
# ops/scripts/nginx-media-carveout.sh — exempt public media reads from the API rate limit.
#
# /api/assets/file streams uploaded images. One page with 25+ photos from a single
# IP overran the shared vd_api zone (20 r/s, burst 40) and the overflow got HTTP 429
# (Corn Street Dental /about, customer test 13 Sep 2026). Every vhost stamped from
# installer/templates/nginx-site.conf.template carries the same `location /api/ {`
# block; this gives /api/assets/file its own zone (vd_media: 60 r/s, burst 240) by
# cloning each vhost's own /api/ block, so the proxy lines stay exactly as that
# vhost has them.
#
# Idempotent: skips vhosts that already carry the block and a zone file that
# already defines vd_media. Backs up every file it changes, validates with
# `nginx -t` (restoring the backups if that fails), then reloads — no downtime.
# Needs passwordless sudo for /etc/nginx.
#
#   ops/scripts/nginx-media-carveout.sh --dry-run   # print the diffs, change nothing
#   ops/scripts/nginx-media-carveout.sh             # apply + reload
set -euo pipefail

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1
ZONE_FILE=/etc/nginx/conf.d/vd-rate-limit.conf
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_DIR=/etc/nginx/backups/media-carveout-$STAMP
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

changed=()

stage() { # stage <target> <candidate> — record a pending change and show its diff
  local target="$1" new="$2"
  if sudo cmp -s "$target" "$new"; then return 0; fi
  echo "== $target"
  sudo diff -u "$target" "$new" || true
  changed+=("$target|$new")
}

# 1. Zone definition (inside http{} via conf.d).
sudo cat "$ZONE_FILE" > "$WORK/zone.conf"
if ! grep -q 'zone=vd_media' "$WORK/zone.conf"; then
  python3 - "$WORK/zone.conf" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path).read()
block = (
    "\n# Public media reads (/api/assets/file): cached, immutable uploads served to every\n"
    "# visitor. One image-heavy page exceeds the API burst, so they get their own zone.\n"
    "limit_req_zone $binary_remote_addr zone=vd_media:10m rate=60r/s;\n"
)
anchor = re.search(r"^limit_req_zone .*zone=vd_api.*$", text, re.M)
text = text[: anchor.end()] + "\n" + block.rstrip("\n") + text[anchor.end() :] if anchor else text + block
open(path, "w").write(text)
PY
fi
stage "$ZONE_FILE" "$WORK/zone.conf"

# 2. Every vhost with the standard API block.
for link in /etc/nginx/sites-enabled/*.conf; do
  target=$(sudo realpath "$link")
  sudo cat "$target" > "$WORK/vhost.conf"
  grep -q 'location /api/ {' "$WORK/vhost.conf" || continue
  grep -q 'location \^~ /api/assets/file' "$WORK/vhost.conf" && continue
  python3 - "$WORK/vhost.conf" <<'PY'
import re, sys
path = sys.argv[1]
lines = open(path).read().split("\n")
out, i = [], 0
while i < len(lines):
    match = re.match(r"^(\s*)location /api/ \{\s*$", lines[i])
    if not match:
        out.append(lines[i]); i += 1
        continue
    indent = match.group(1)
    j = i + 1
    while j < len(lines) and not re.match("^" + re.escape(indent) + r"\}\s*$", lines[j]):
        j += 1
    block = lines[i : j + 1]
    clone = [
        indent + "# Public media reads: cached, immutable uploads. Kept out of the API budget so",
        indent + "# an image-heavy page cannot 429 itself (zone vd_media, conf.d/vd-rate-limit.conf).",
        indent + "location ^~ /api/assets/file {",
    ]
    for line in block[1:]:
        if re.search(r"limit_req\s+zone=vd_api", line):
            line = re.sub(r"limit_req\s+zone=vd_api\s+burst=\d+", "limit_req zone=vd_media burst=240", line)
        clone.append(line)
    # Keep the block's own leading comment lines attached to it, not to the clone.
    k = len(out)
    while k > 0 and out[k - 1].strip().startswith("#"):
        k -= 1
    comments, out = out[k:], out[:k]
    out.extend(clone)
    out.append("")
    out.extend(comments)
    out.extend(block)
    i = j + 1
open(path, "w").write("\n".join(out))
PY
  candidate="$WORK/$(basename "$target").new"
  cp "$WORK/vhost.conf" "$candidate"
  stage "$target" "$candidate"
done

if [ ${#changed[@]} -eq 0 ]; then
  echo "Nothing to change: every vhost already carries the media carve-out."
  exit 0
fi
if [ "$DRY_RUN" = 1 ]; then
  echo
  echo "Dry run: ${#changed[@]} file(s) would change. Re-run without --dry-run to apply."
  exit 0
fi

sudo mkdir -p "$BACKUP_DIR"
for entry in "${changed[@]}"; do
  target="${entry%%|*}"; new="${entry#*|}"
  sudo cp -p "$target" "$BACKUP_DIR/$(basename "$target")"
  sudo install -m 644 "$new" "$target"
done
if ! sudo nginx -t; then
  echo "nginx -t failed — restoring ${#changed[@]} file(s) from $BACKUP_DIR" >&2
  for entry in "${changed[@]}"; do
    target="${entry%%|*}"
    sudo cp -p "$BACKUP_DIR/$(basename "$target")" "$target"
  done
  sudo nginx -t
  exit 1
fi
sudo systemctl reload nginx
echo "Applied to ${#changed[@]} file(s); backups in $BACKUP_DIR"
