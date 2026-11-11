#!/bin/bash
# Verification script for Persian dictionary fix

cd "$(dirname "$0")"

echo "=== Verifying Persian dictionary fix ==="
echo ""

echo "1. Running TypeScript type check..."
./node_modules/.bin/tsc --noEmit
if [ $? -eq 0 ]; then
  echo "✓ TypeScript check passed"
else
  echo "✗ TypeScript check failed"
  exit 1
fi

echo ""
echo "2. Running Next.js lint..."
./node_modules/.bin/next lint
if [ $? -eq 0 ]; then
  echo "✓ Lint check passed"
else
  echo "✗ Lint check failed"
  exit 1
fi

echo ""
echo "3. Checking dictionary structure..."
# Count closing braces in fa.ts - should match en.ts
FA_BRACES=$(grep -c "^};" lib/i18n/dictionaries/fa.ts)
EN_BRACES=$(grep -c "^};" lib/i18n/dictionaries/en.ts)

if [ "$FA_BRACES" -eq "$EN_BRACES" ]; then
  echo "✓ Dictionary structure aligned (both have $FA_BRACES closing braces)"
else
  echo "✗ Dictionary structure mismatch (fa: $FA_BRACES, en: $EN_BRACES)"
  exit 1
fi

echo ""
echo "4. Checking for duplicate keys in auth section..."
# Extract auth section and check for duplicates
FA_AUTH_KEYS=$(awk '/auth: {/,/^  },/' lib/i18n/dictionaries/fa.ts | grep -oP '^\s+\K\w+(?=:)' | sort | uniq -d)
if [ -z "$FA_AUTH_KEYS" ]; then
  echo "✓ No duplicate keys found in Persian auth section"
else
  echo "✗ Duplicate keys found:"
  echo "$FA_AUTH_KEYS"
  exit 1
fi

echo ""
echo "=== All checks passed! ==="
