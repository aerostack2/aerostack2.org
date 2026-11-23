#!/usr/bin/env bash
# Checks out an upstream ref for a docs version and prints where it is.
# Usage: fetch-aerostack2.sh <version> <ref>
set -euo pipefail
cd "$(dirname "$0")/.."

SOURCE=".cache/aerostack2/$1"
if [ "$(cat "$SOURCE/.git/docs-ref" 2>/dev/null || true)" != "$2" ]; then
  mkdir -p "$SOURCE"
  git -C "$SOURCE" init -q
  git -C "$SOURCE" fetch -q --depth 1 https://github.com/aerostack2/aerostack2 "$2"
  git -C "$SOURCE" checkout -q --force FETCH_HEAD
  echo "$2" >"$SOURCE/.git/docs-ref"
fi
echo "$PWD/$SOURCE"
