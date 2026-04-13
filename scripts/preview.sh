#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

echo "Building..."
node "$ROOT/build.mjs"

echo "Launching mdwow with README.md..."
node "$ROOT/dist/cli.js" "$ROOT/README.md"
