#!/usr/bin/env bash
set -euo pipefail

ENCRYPTION_KEY=$(grep '^ENCRYPTION_KEY=' .env | cut -d'=' -f2-)
SESSION_SECRET=$(grep '^SESSION_SECRET=' .env | cut -d'=' -f2-)

if [ -z "$ENCRYPTION_KEY" ]; then
  echo "Error: ENCRYPTION_KEY not found in .env"
  exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
  echo "Error: SESSION_SECRET not found in .env"
  exit 1
fi

echo "Setting secrets..."

echo "$ENCRYPTION_KEY" | npx wrangler secret put ENCRYPTION_KEY
echo "$SESSION_SECRET" | npx wrangler secret put SESSION_SECRET

echo "Done. Secrets deployed."
