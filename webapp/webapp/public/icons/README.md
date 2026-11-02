# PWA Icon Generation

This directory contains the RIVA PWA icons with proper centering.

## Files

- `icon-192-source.svg` - Source for 192x192 icon
- `icon-512-source.svg` - Source for 512x512 standard icon
- `icon-512-maskable-source.svg` - Source for 512x512 maskable icon (with safe area)
- `icon-192.png` - 192x192 PNG (generated)
- `icon-512.png` - 512x512 PNG (generated)
- `icon-512-maskable.png` - 512x512 maskable PNG (generated)

## Regenerating Icons

### Option 1: Using the script (requires sharp)

```bash
# Install sharp if not already installed
pnpm add -D sharp

# Generate all PNG icons
node scripts/generate-icons.js
```

### Option 2: Manual conversion (online tool)

1. Visit https://svgtopng.com/ or https://cloudconvert.com/svg-to-png
2. Convert each `-source.svg` file to PNG at the specified dimensions:
   - `icon-192-source.svg` → `icon-192.png` (192x192)
   - `icon-512-source.svg` → `icon-512.png` (512x512)
   - `icon-512-maskable-source.svg` → `icon-512-maskable.png` (512x512)
3. Replace the files in this directory

### Option 3: Using ImageMagick (if installed)

```bash
convert public/icons/icon-192-source.svg -resize 192x192 public/icons/icon-192.png
convert public/icons/icon-512-source.svg -resize 512x512 public/icons/icon-512.png
convert public/icons/icon-512-maskable-source.svg -resize 512x512 public/icons/icon-512-maskable.png
```

## Centering Details

The icons are properly centered by:

1. Placing the logo at exact canvas center (translate to center, then translate logo origin)
2. Using the original logo viewBox dimensions (238.96 × 171.68)
3. Calculating scale factors for proper sizing:
   - 192x192: 0.65 scale (logo ~125px wide)
   - 512x512: 1.73 scale (logo ~413px wide)
   - 512x512 maskable: 1.38 scale (logo ~330px wide, 80% of canvas for safe area)

The maskable icon includes 20% padding to ensure the logo isn't cropped on devices that apply circular or other shaped masks.
