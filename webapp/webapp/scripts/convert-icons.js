#!/usr/bin/env node
/**
 * SVG to PNG converter - tries multiple conversion methods
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const iconsDir = path.join(__dirname, '../public/icons');

const conversions = [
  { src: 'icon-192-source.svg', dest: 'icon-192.png', size: 192 },
  { src: 'icon-512-source.svg', dest: 'icon-512.png', size: 512 },
  { src: 'icon-512-maskable-source.svg', dest: 'icon-512-maskable.png', size: 512 }
];

console.log('🎨 Converting SVG icons to PNG...\n');

// Try using rsvg-convert (librsvg) if available
try {
  execSync('which rsvg-convert', { stdio: 'ignore' });
  console.log('Using rsvg-convert for conversion\n');

  conversions.forEach(({ src, dest, size }) => {
    const srcPath = path.join(iconsDir, src);
    const destPath = path.join(iconsDir, dest);

    console.log(`Converting ${src} → ${dest}`);
    execSync(
      `rsvg-convert -w ${size} -h ${size} "${srcPath}" -o "${destPath}"`,
      { stdio: 'inherit' }
    );
  });

  console.log('\n✅ All icons generated successfully!');
  process.exit(0);
} catch (e) {
  console.log('❌ rsvg-convert not available\n');
}

// Try using ImageMagick convert
try {
  execSync('which convert', { stdio: 'ignore' });
  console.log('Using ImageMagick convert for conversion\n');

  conversions.forEach(({ src, dest, size }) => {
    const srcPath = path.join(iconsDir, src);
    const destPath = path.join(iconsDir, dest);

    console.log(`Converting ${src} → ${dest}`);
    execSync(
      `convert "${srcPath}" -resize ${size}x${size} "${destPath}"`,
      { stdio: 'inherit' }
    );
  });

  console.log('\n✅ All icons generated successfully!');
  process.exit(0);
} catch (e) {
  console.log('❌ ImageMagick not available\n');
}

console.log('⚠️  No SVG conversion tool found.\n');
console.log('Please install one of the following:\n');
console.log('  1. sharp: pnpm add -D sharp (then use generate-icons.js)');
console.log('  2. librsvg: brew install librsvg (provides rsvg-convert)');
console.log('  3. ImageMagick: brew install imagemagick\n');
console.log('Or convert manually at: https://svgtopng.com/\n');

process.exit(1);
