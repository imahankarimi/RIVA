#!/bin/bash
# Comprehensive verification for RIVA webapp fixes

cd "$(dirname "$0")"

echo "=== RIVA Webapp Fix Verification ==="
echo ""

# TypeScript check
echo "1. TypeScript type check..."
./node_modules/.bin/tsc --noEmit
TS_EXIT=$?
if [ $TS_EXIT -eq 0 ]; then
  echo "✓ TypeScript check passed"
else
  echo "✗ TypeScript check failed (exit $TS_EXIT)"
fi
echo ""

# Lint check
echo "2. Next.js lint check..."
./node_modules/.bin/next lint
LINT_EXIT=$?
if [ $LINT_EXIT -eq 0 ]; then
  echo "✓ Lint check passed"
else
  echo "✗ Lint check failed (exit $LINT_EXIT)"
fi
echo ""

# Design system validation
echo "3. Design system validation..."
npm run design:check
DESIGN_EXIT=$?
if [ $DESIGN_EXIT -eq 0 ]; then
  echo "✓ Design system check passed"
else
  echo "✗ Design system check failed (exit $DESIGN_EXIT)"
fi
echo ""

# Summary
echo "=== Verification Summary ==="
if [ $TS_EXIT -eq 0 ] && [ $LINT_EXIT -eq 0 ] && [ $DESIGN_EXIT -eq 0 ]; then
  echo "✓ All checks passed"
  exit 0
else
  echo "✗ Some checks failed"
  exit 1
fi
