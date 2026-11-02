#!/usr/bin/env node
/**
 * PWA Icon Generation Script
 *
 * Converts centered SVG sources to PNG icons for the PWA manifest.
 *
 * Usage:
 *   node scripts/generate-icons.js
 *
 * Requirements:
 *   npm install sharp
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    // Try to import sharp
    const sharp = await import('sharp').catch(() => null);

    if (!sharp) {
      console.error('❌ sharp is not installed.');
      console.log('\nTo generate PNG icons, install sharp:');
      console.log('  npm install --save-dev sharp');
      console.log('\nOr use an online SVG-to-PNG converter:');
      console.log('  - https://svgtopng.com/');
      console.log('  - https://cloudconvert.com/svg-to-png');
      console.log('\nSource files:');
      console.log('  - public/icons/icon-192-source.svg → icon-192.png');
      console.log('  - public/icons/icon-512-source.svg → icon-512.png');
      console.log('  - public/icons/icon-512-maskable-source.svg → icon-512-maskable.png');
      process.exit(1);
    }

    const iconsDir = path.join(__dirname, '../public/icons');

    // Generate icon-192.png
    console.log('Generating icon-192.png...');
    await sharp.default(path.join(iconsDir, 'icon-192-source.svg'))
      .resize(192, 192)
      .png()
      .toFile(path.join(iconsDir, 'icon-192.png'));

    // Generate icon-512.png
    console.log('Generating icon-512.png...');
    await sharp.default(path.join(iconsDir, 'icon-512-source.svg'))
      .resize(512, 512)
      .png()
      .toFile(path.join(iconsDir, 'icon-512.png'));

    // Generate icon-512-maskable.png
    console.log('Generating icon-512-maskable.png...');
    await sharp.default(path.join(iconsDir, 'icon-512-maskable-source.svg'))
      .resize(512, 512)
      .png()
      .toFile(path.join(iconsDir, 'icon-512-maskable.png'));

    console.log('✅ All PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
