#!/usr/bin/env bash
set -euo pipefail

source .env

echo "Setting secrets..."

echo "$ENCRYPTION_KEY" | npx wrangler secret put ENCRYPTION_KEY
echo "$SESSION_SECRET" | npx wrangler secret put SESSION_SECRET

echo "Done. Secrets deployed."
