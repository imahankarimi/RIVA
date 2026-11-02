#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const iconsDir = path.join(__dirname, '../public/icons');

const conversions = [
  { src: 'icon-192-source.svg', dest: 'icon-192.png', size: 192 },
  { src: 'icon-512-source.svg', dest: 'icon-512.png', size: 512 },
  { src: 'icon-512-maskable-source.svg', dest: 'icon-512-maskable.png', size: 512 }
];

console.log('Converting SVG icons to PNG...\n');

// Try rsvg-convert
try {
  execSync('which rsvg-convert', { stdio: 'ignore' });
  console.log('Using rsvg-convert\n');
  conversions.forEach(({ src, dest, size }) => {
    const srcPath = path.join(iconsDir, src);
    const destPath = path.join(iconsDir, dest);
    console.log(`Converting ${src} → ${dest}`);
    execSync(`rsvg-convert -w ${size} -h ${size} "${srcPath}" -o "${destPath}"`, { stdio: 'inherit' });
  });
  console.log('\n✅ All icons generated!');
  process.exit(0);
} catch (e) {
  console.log('❌ rsvg-convert not available\n');
}

// Try ImageMagick
try {
  execSync('which convert', { stdio: 'ignore' });
  console.log('Using ImageMagick\n');
  conversions.forEach(({ src, dest, size }) => {
    const srcPath = path.join(iconsDir, src);
    const destPath = path.join(iconsDir, dest);
    console.log(`Converting ${src} → ${dest}`);
    execSync(`convert "${srcPath}" -resize ${size}x${size} "${destPath}"`, { stdio: 'inherit' });
  });
  console.log('\n✅ All icons generated!');
  process.exit(0);
} catch (e) {
  console.log('❌ ImageMagick not available\n');
}

console.log('⚠️  No SVG conversion tool found.\n');
console.log('Install: brew install librsvg (or imagemagick)\n');
console.log('Or convert manually at: https://svgtopng.com/\n');
process.exit(1);
