#!/bin/bash
echo "=== Checking font configuration chain ==="
echo ""
echo "1. Next.js font loader (layout.tsx):"
grep "const vazirmatn" frontend/app/layout.tsx
echo ""
echo "2. CSS variable added to html className:"
grep "vazirmatn.variable" frontend/app/layout.tsx
echo ""
echo "3. CSS mapping for Persian (globals.css):"
grep -A2 'html\[data-locale="fa"\]' frontend/app/globals.css | head -6
echo ""
echo "4. Tailwind font-sans utility (tailwind-preset.ts):"
grep "sans:" design-system/tailwind-preset.ts
echo ""
echo "5. Body uses font-sans (layout.tsx):"
grep 'className="font-sans"' frontend/app/layout.tsx
