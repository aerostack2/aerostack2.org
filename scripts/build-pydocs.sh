#!/usr/bin/env bash
# Generates the Python API reference into public/pydocs, served at /pydocs.
set -euo pipefail
cd "$(dirname "$0")/.."

CACHE=.cache/pydocs
VENV="$CACHE/venv"
if ! cmp -s content/pydocs/requirements.txt "$VENV/requirements.txt"; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q --require-hashes -r content/pydocs/requirements.txt
  cp content/pydocs/requirements.txt "$VENV/requirements.txt"
fi

# Cleared so pages for symbols removed upstream don't linger.
rm -rf public/pydocs
mkdir -p public/pydocs
cp content/api-versions.json public/pydocs/versions.json

VERSIONS=$(bun -e 'const versions = await Bun.file("content/api-versions.json").json();
for (const [version, ref] of Object.entries(versions)) console.log(version, ref);')

while read -r version ref; do
  SOURCE=$(bash scripts/fetch-aerostack2.sh "$version" "$ref")
  # AutoAPI writes its pages next to conf.py, so it runs on a copy.
  WORK="$CACHE/work/$version"
  rm -rf "$WORK"
  mkdir -p "$WORK"
  cp -R content/pydocs/. "$WORK"
  cp src/app/og/fonts/IBMPlex*.ttf "$WORK/_static/"
  PYDOCS_VERSION="$version" PYDOCS_INPUT="$SOURCE" "$VENV/bin/sphinx-build" -q -E \
    -b dirhtml -d "$WORK/.doctrees" "$WORK" "public/pydocs/$version"
  rm -f "public/pydocs/$version/.buildinfo"
done <<<"$VERSIONS"
