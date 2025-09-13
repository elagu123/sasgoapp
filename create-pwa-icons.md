# PWA Icons Creation Guide

## Quick Fix
The PWA manifest is looking for PNG icons but they don't exist. Here are your options:

### Option 1: Use Online PWA Icon Generator (Recommended)
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your app logo or use the placeholder SVG in `/public/icons/icon.svg`
3. Generate all required icon sizes
4. Download and place in `/public/icons/`

### Option 2: Manual Creation
Create these files in `/public/icons/`:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)
- `shortcut-new-trip.png` (96x96 pixels)
- `shortcut-packing.png` (96x96 pixels)
- `shortcut-trips.png` (96x96 pixels)

### Option 3: Command Line (if you have ImageMagick)
```bash
# Convert SVG to PNG at different sizes
magick public/icons/icon.svg -resize 192x192 public/icons/icon-192x192.png
magick public/icons/icon.svg -resize 512x512 public/icons/icon-512x512.png
magick public/icons/icon.svg -resize 96x96 public/icons/shortcut-new-trip.png
magick public/icons/icon.svg -resize 96x96 public/icons/shortcut-packing.png
magick public/icons/icon.svg -resize 96x96 public/icons/shortcut-trips.png
```

## Current Status
- ✅ Manifest updated with correct icon references
- ❌ Actual PNG files need to be created
- 📝 Placeholder SVG created as reference

The PWA will work but show broken icon warnings until real PNG files are added.