#!/bin/bash
# Final verification for RIVA webapp UI refinements

cd "$(dirname "$0")"

echo "=== RIVA Webapp UI Refinements Verification ==="
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
echo "Files Changed:"
echo "  - webapp/app/(auth)/reset-password/page.tsx (auth contrast fixes)"
echo "  - webapp/app/(auth)/forgot-password/page.tsx (auth contrast fixes)"
echo "  - webapp/app/(shell)/home/page.tsx (removed greeting and description)"
echo "  - webapp/app/(shell)/cash/page.tsx (removed greeting and description)"
echo "  - webapp/app/(shell)/reports/page.tsx (removed greeting and description)"
echo "  - webapp/app/(shell)/more/page.tsx (removed greeting and description)"
echo "  - webapp/app/(shell)/settings/page.tsx (removed greeting and description)"
echo ""

if [ $TS_EXIT -eq 0 ] && [ $LINT_EXIT -eq 0 ] && [ $DESIGN_EXIT -eq 0 ]; then
  echo "✅ All checks passed"
  exit 0
else
  echo "⚠️  Some checks failed"
  exit 1
fi
