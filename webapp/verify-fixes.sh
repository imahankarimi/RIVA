#!/bin/bash

echo "=================================================="
echo "RIVA Web App - Bug Fixes Verification"
echo "=================================================="
echo ""

cd "$(dirname "$0")"

echo "1. Running TypeScript type check..."
echo "--------------------------------------------------"
./node_modules/.bin/tsc --noEmit
TSC_EXIT=$?
echo ""

echo "2. Running ESLint..."
echo "--------------------------------------------------"
./node_modules/.bin/next lint
LINT_EXIT=$?
echo ""

echo "3. Running design system validation..."
echo "--------------------------------------------------"
npm run design:check
DESIGN_EXIT=$?
echo ""

echo "=================================================="
echo "Verification Summary"
echo "=================================================="
echo "TypeScript: $([ $TSC_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "ESLint:     $([ $LINT_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo "Design:     $([ $DESIGN_EXIT -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')"
echo ""

if [ $TSC_EXIT -eq 0 ] && [ $LINT_EXIT -eq 0 ] && [ $DESIGN_EXIT -eq 0 ]; then
    echo "🎉 All checks passed!"
    exit 0
else
    echo "⚠️  Some checks failed. Review output above."
    exit 1
fi
