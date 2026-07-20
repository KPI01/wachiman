#!/usr/bin/env bash
set -euo pipefail

ENV_PATH=".env"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      [[ $# -ge 2 ]] || { echo "Error: Missing value for --env"; exit 1; }
      ENV_PATH="$2"
      shift 2
      ;;
    --env=*)
      ENV_PATH="${1#--env=}"
      shift
      ;;
    --)
      shift
      ;;
    *)
      echo "Error: Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ ! -f "$ENV_PATH" ]]; then
  echo "Error: Environment file not found: $ENV_PATH"
  exit 1
fi

ENCRYPTION_KEY=$(awk -F= '$1 == "ENCRYPTION_KEY" {sub(/^[^=]*=/, ""); print; exit}' "$ENV_PATH")
SESSION_SECRET=$(awk -F= '$1 == "SESSION_SECRET" {sub(/^[^=]*=/, ""); print; exit}' "$ENV_PATH")

if [ -z "$ENCRYPTION_KEY" ]; then
  echo "Error: ENCRYPTION_KEY not found in $ENV_PATH"
  exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
  echo "Error: SESSION_SECRET not found in $ENV_PATH"
  exit 1
fi

echo "Setting secrets..."

echo "$ENCRYPTION_KEY" | npx wrangler secret put ENCRYPTION_KEY
echo "$SESSION_SECRET" | npx wrangler secret put SESSION_SECRET

echo "Done. Secrets deployed."
