# PWA Icon Fix - Instructions

## Problem
The PWA icons were not properly centered, causing the RIVA logo to appear off-center when installed on mobile devices.

## Solution
Created properly centered SVG sources with correct scaling and positioning:
- **icon-192-source.svg**: 192×192 with logo at 0.65 scale
- **icon-512-source.svg**: 512×512 with logo at 1.73 scale  
- **icon-512-maskable-source.svg**: 512×512 with logo at 1.38 scale (80% safe area for maskable icons)

## Generate PNG Icons

### Option 1: Browser-Based Generator (Easiest)
1. Open http://localhost:3001/generate-icons.html in your browser
2. Icons will auto-generate on page load
3. Click "Download All PNGs" to download all three files
4. Move the downloaded files to `webapp/public/icons/`
5. Replace the existing PNG files

### Option 2: Install Sharp and Use Script
```bash
cd webapp
pnpm add -D sharp
node scripts/generate-icons.js
```

### Option 3: Install System Tools
```bash
# macOS
brew install librsvg
node scripts/convert-icons.js
```

### Option 4: Manual Conversion
1. Visit https://svgtopng.com/ or https://cloudconvert.com/svg-to-png
2. Upload each `-source.svg` file and convert to PNG at the correct size:
   - icon-192-source.svg → 192×192px
   - icon-512-source.svg → 512×512px
   - icon-512-maskable-source.svg → 512×512px
3. Save as the corresponding filenames in `public/icons/`

## Verify After Generation
```bash
cd webapp
pnpm build
```

Then check the generated manifest and install the PWA on a mobile device to verify centering.

## Technical Details
The centering fix involved:
- Using the original RIVA logo viewBox (238.96 × 171.68)
- Translating to canvas center: `translate(width/2, height/2)`
- Scaling appropriately for each size
- Translating logo origin: `translate(-183.93, -256.13)`
- For maskable icons: keeping logo at 80% of canvas size (20% safe area padding)
