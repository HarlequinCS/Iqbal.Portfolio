#!/usr/bin/env bash
# Deploy this checkout to the live web root on this server.
#   tools/deploy.sh            build, check, copy
#   tools/deploy.sh --dry-run  show what would change, copy nothing
# Files that only belong in the repository (docs, tools, git files, README, drafts)
# are never copied. api/config.php on the server (the Telegram secrets) is kept.
set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${DEST:-/var/www/saifuliqbal.io}"
DRY=""
[[ "${1:-}" == "--dry-run" ]] && DRY="--dry-run"

python3 -I "$SRC/tools/build.py"

rsync -rlt --delete --itemize-changes $DRY \
  --exclude='.git*' --exclude='.htaccess' --exclude='.claude/' \
  --exclude='docs/' --exclude='tools/' --exclude='README.md' --exclude='LICENSE' \
  --exclude='wip.*' --exclude='api/config.php' --exclude='api/config.example.php' \
  --exclude='api/.htaccess' \
  "$SRC/" "$DEST/" | grep -v '^\.' || true

if [[ -z "$DRY" ]]; then
  nginx -t -q && systemctl reload nginx
  echo "Deployed $(git -C "$SRC" rev-parse --short HEAD) to $DEST."
  echo "If js/fx/* changed, purge the Cloudflare cache."
fi
