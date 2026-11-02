#!/bin/bash
# Convert SVGs to PNGs using qlmanage
qlmanage -t -s 192 -o . icon-192-source.svg
qlmanage -t -s 512 -o . icon-512-source.svg  
qlmanage -t -s 512 -o . icon-512-maskable-source.svg

# Rename files
[ -f icon-192-source.svg.png ] && mv icon-192-source.svg.png icon-192.png
[ -f icon-512-source.svg.png ] && mv icon-512-source.svg.png icon-512.png
[ -f icon-512-maskable-source.svg.png ] && mv icon-512-maskable-source.svg.png icon-512-maskable.png

echo "✅ Icons converted"
ls -lh icon-*.png
