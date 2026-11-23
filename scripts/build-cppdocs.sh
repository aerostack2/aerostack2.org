#!/usr/bin/env bash
# Generates the C++ API reference into public/cppdocs, served at /cppdocs.
set -euo pipefail
cd "$(dirname "$0")/.."

DOXYGEN_VERSION=1.18.0
DOXYGEN_SHA256=14fa81bdc34171edb5f1f02b1d60e74802f0439b77fa44e592565d517d72df90
CACHE=.cache/cppdocs
mkdir -p "$CACHE"

DOXYGEN=doxygen
if [ "$(doxygen --version 2>/dev/null | cut -d' ' -f1)" != "$DOXYGEN_VERSION" ]; then
  if [ "$(uname -s)" != Linux ]; then
    echo "Doxygen $DOXYGEN_VERSION is required" >&2
    exit 1
  fi
  DOXYGEN="$PWD/$CACHE/doxygen-$DOXYGEN_VERSION/bin/doxygen"
  if [ ! -x "$DOXYGEN" ]; then
    ARCHIVE="$CACHE/doxygen.tar.gz"
    curl -fsSL -o "$ARCHIVE" "https://github.com/doxygen/doxygen/releases/download/Release_${DOXYGEN_VERSION//./_}/doxygen-$DOXYGEN_VERSION.linux.bin.tar.gz"
    echo "$DOXYGEN_SHA256  $ARCHIVE" | sha256sum -c --quiet
    tar -xzf "$ARCHIVE" -C "$CACHE" "doxygen-$DOXYGEN_VERSION/bin/doxygen"
  fi
fi

# Cleared so pages for symbols removed upstream don't linger.
rm -rf public/cppdocs
mkdir -p public/cppdocs
cp content/api-versions.json public/cppdocs/versions.json

VERSIONS=$(bun -e 'const versions = await Bun.file("content/api-versions.json").json();
for (const [version, ref] of Object.entries(versions)) console.log(version, ref);')

while read -r version ref; do
  SOURCE=$(bash scripts/fetch-aerostack2.sh "$version" "$ref")
  mkdir -p "public/cppdocs/$version"
  CPPDOCS_VERSION="$version" CPPDOCS_INPUT="$SOURCE" "$DOXYGEN" content/cppdocs/Doxyfile
done <<<"$VERSIONS"
