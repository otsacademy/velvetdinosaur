#!/usr/bin/env bash
# ops/scripts/nginx-media-carveout.sh — exempt public media reads from the API limits.
#
# /api/assets/file streams uploaded images. Every vhost stamped from
# installer/templates/nginx-site.conf.template puts it under the general API
# block: `limit_req zone=vd_api` (20 r/s, burst 40) and `limit_conn vd_conn 20`.
# Browsers negotiate HTTP/2 on the shared :443 socket and multiplex every image
# on a page over one connection, so a page with 20+ photos exceeds the
# connection cap (and a burst of them the request budget) and the overflow gets
# HTTP 429 (Corn Street Dental /about, customer test 13 Sep 2026).
#
# This gives /api/assets/file its own location in every vhost that has the
# standard `location /api/ {` block — cloned from that vhost's own block, so the
# proxy lines stay exactly as that vhost has them — with its own zones:
#   limit_req  zone=vd_media burst=240 nodelay   (60 r/s per IP)
#   limit_conn vd_media_conn 100                 (its own counter, not vd_conn)
#
# Idempotent: adds missing blocks/zones and upgrades a media block that still
# carries the old `limit_conn vd_conn` line. Backs up every file it changes,
# validates with `nginx -t` (restoring the backups if that fails), then reloads
# — no downtime. Needs passwordless sudo for /etc/nginx.
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

# 1. Zone definitions (inside http{} via conf.d).
sudo cat "$ZONE_FILE" > "$WORK/zone.conf"
python3 - "$WORK/zone.conf" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path).read()
if "zone=vd_media:" not in text:
    block = (
        "\n# Public media reads (/api/assets/file): cached, immutable uploads served to every\n"
        "# visitor. One image-heavy page exceeds the API burst, so they get their own zone.\n"
        "limit_req_zone $binary_remote_addr zone=vd_media:10m rate=60r/s;\n"
    )
    anchor = re.search(r"^limit_req_zone .*zone=vd_api.*$", text, re.M)
    text = text[: anchor.end()] + "\n" + block.rstrip("\n") + text[anchor.end() :] if anchor else text + block
if "zone=vd_media_conn:" not in text:
    block = (
        "\n# Media reads multiplex over HTTP/2: one page can hold 20+ image streams open, so\n"
        "# they must not share the API connection cap (vd_conn) or they 429 each other.\n"
        "limit_conn_zone $binary_remote_addr zone=vd_media_conn:10m;\n"
    )
    anchor = re.search(r"^limit_conn_zone .*zone=vd_conn.*$", text, re.M)
    text = text[: anchor.end()] + "\n" + block.rstrip("\n") + text[anchor.end() :] if anchor else text + block
open(path, "w").write(text)
PY
stage "$ZONE_FILE" "$WORK/zone.conf"

# 2. Every vhost with the standard API block.
for link in /etc/nginx/sites-enabled/*.conf; do
  target=$(sudo realpath "$link")
  sudo cat "$target" > "$WORK/vhost.conf"
  grep -q 'location /api/ {' "$WORK/vhost.conf" || continue
  python3 - "$WORK/vhost.conf" <<'PY'
import re, sys
path = sys.argv[1]
lines = open(path).read().split("\n")
API_START = re.compile(r"^(\s*)location /api/ \{\s*$")
MEDIA_START = re.compile(r"^(\s*)location \^~ /api/assets/file \{\s*$")

def block_end(start, indent):
    j = start + 1
    while j < len(lines) and not re.match("^" + re.escape(indent) + r"\}\s*$", lines[j]):
        j += 1
    return j

def media_limit_lines(line):
    if re.search(r"limit_req\s+zone=vd_api", line):
        return re.sub(r"limit_req\s+zone=vd_api\s+burst=\d+", "limit_req zone=vd_media burst=240", line)
    if re.search(r"limit_conn\s+vd_conn\s+\d+;", line):
        return re.sub(r"limit_conn\s+vd_conn\s+\d+;", "limit_conn vd_media_conn 100;", line)
    return line

# Upgrade media blocks that already exist (older run of this script).
i = 0
while i < len(lines):
    match = MEDIA_START.match(lines[i])
    if match:
        end = block_end(i, match.group(1))
        for k in range(i + 1, end):
            lines[k] = media_limit_lines(lines[k])
        i = end
    i += 1

has_media = any(MEDIA_START.match(line) for line in lines)
out, i = [], 0
while i < len(lines):
    match = API_START.match(lines[i])
    if not match or has_media:
        out.append(lines[i]); i += 1
        continue
    indent = match.group(1)
    j = block_end(i, indent)
    block = lines[i : j + 1]
    clone = [
        indent + "# Public media reads: cached, immutable uploads. Kept out of the API budget so",
        indent + "# an image-heavy page cannot 429 itself (zones vd_media and vd_media_conn,",
        indent + "# conf.d/vd-rate-limit.conf).",
        indent + "location ^~ /api/assets/file {",
    ] + [media_limit_lines(line) for line in block[1:]]
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
