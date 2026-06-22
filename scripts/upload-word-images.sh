#!/bin/bash
set -euo pipefail

BUCKET="tavuilu-content-504641295432-eu-north-1-an"
SIZE=512

if [ $# -eq 0 ]; then
  echo "Usage: $0 <folder-or-file> [folder-or-file...]"
  echo "Resizes PNG images to ${SIZE}px and uploads them to S3."
  exit 1
fi

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

for arg in "$@"; do
  if [ -d "$arg" ]; then
    files=("$arg"/*.png)
  else
    files=("$arg")
  fi

  for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
      echo "Skipping: $file (not found)"
      continue
    fi

    name=$(basename "$file")
    cp "$file" "$TMPDIR/$name"
    sips --resampleWidth "$SIZE" "$TMPDIR/$name" --out "$TMPDIR/$name" >/dev/null 2>&1
    aws s3 cp "$TMPDIR/$name" "s3://$BUCKET/words/$name" --profile tavuilu-dev
    echo "Uploaded: $name (${SIZE}px)"
  done
done
