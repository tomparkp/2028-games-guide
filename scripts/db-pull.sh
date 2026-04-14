#!/usr/bin/env bash
# Sync local D1 from remote. Upserts only — rows deleted remotely will
# persist locally. Run `wrangler d1 execute la28 --local --command='DELETE ...'`
# first if you need a strict mirror.
#
# Requires an authenticated wrangler CLI (run `pnpm wrangler login` once).
#
# Reorders the export so `sessions` rows are imported before `session_content`,
# since wrangler runs statements in separate transactions (PRAGMA
# defer_foreign_keys doesn't persist across them) and session_content has an
# FK to sessions.
set -euo pipefail

TMP_DIR=".wrangler/tmp"
RAW="$TMP_DIR/la28-pull-raw.sql"
SESSIONS="$TMP_DIR/la28-pull-sessions.sql"
CONTENT="$TMP_DIR/la28-pull-content.sql"

mkdir -p "$TMP_DIR"

echo "Exporting remote D1..."
pnpm wrangler d1 export la28 --remote --no-schema --output="$RAW"

echo "Splitting by table and rewriting INSERTs as upserts..."
grep 'INTO "sessions"' "$RAW" | sed 's/^INSERT INTO/INSERT OR REPLACE INTO/' > "$SESSIONS"
grep 'INTO "session_content"' "$RAW" | sed 's/^INSERT INTO/INSERT OR REPLACE INTO/' > "$CONTENT"

echo "Importing sessions into local D1..."
pnpm wrangler d1 execute la28 --local --file="$SESSIONS"

echo "Importing session_content into local D1..."
pnpm wrangler d1 execute la28 --local --file="$CONTENT"

echo "Done."
