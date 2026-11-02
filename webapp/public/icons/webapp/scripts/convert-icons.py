#!/usr/bin/env python3
"""
Convert SVG icons to PNG using cairosvg
Install: pip3 install cairosvg
"""

import sys
import os

try:
    import cairosvg
except ImportError:
    print("❌ cairosvg is not installed.")
    print("\nInstall it with:")
    print("  pip3 install cairosvg")
    print("\nOr use Node.js with sharp:")
    print("  cd webapp && pnpm add -D sharp && node scripts/generate-icons.js")
    sys.exit(1)

icons_dir = os.path.join(os.path.dirname(__file__), '../public/icons')

conversions = [
    ('icon-192-source.svg', 'icon-192.png', 192),
    ('icon-512-source.svg', 'icon-512.png', 512),
    ('icon-512-maskable-source.svg', 'icon-512-maskable.png', 512),
]

print('🎨 Converting SVG icons to PNG...\n')

for src, dest, size in conversions:
    src_path = os.path.join(icons_dir, src)
    dest_path = os.path.join(icons_dir, dest)

    print(f'Converting {src} → {dest}')

    cairosvg.svg2png(
        url=src_path,
        write_to=dest_path,
        output_width=size,
        output_height=size
    )

print('\n✅ All icons generated successfully!')
