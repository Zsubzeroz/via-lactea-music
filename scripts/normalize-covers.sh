#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "📁 Normalizing cover paths..."

# Move covers from subdirectories to covers/ root
moved=0
while IFS= read -r -d '' file; do
  mv "$file" covers/
  moved=$((moved + 1))
  echo "   Moved: $file → covers/"
done < <(find covers/ -mindepth 2 -type f -name "*.jpg" -print0)

# Remove empty subdirectories
while IFS= read -r -d '' dir; do
  rmdir "$dir" 2>/dev/null && echo "   Removed empty dir: $dir"
done < <(find covers/ -mindepth 1 -type d -empty -print0)

echo "✅ Done. Moved $moved files."
