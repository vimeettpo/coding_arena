#!/bin/sh
# Builds every language sandbox image referenced by LanguageRuntime.java.
# Run this once before starting the backend (or as a CI/deploy step).
set -e
cd "$(dirname "$0")"

for lang in java python cpp c javascript; do
  echo "Building codearena/$lang..."
  docker build -t "codearena/$lang" -f "$lang/Dockerfile" "$lang"
done

echo "All judge images built."
