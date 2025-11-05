# PWA Icons

This directory contains the Progressive Web App (PWA) icons for ForeverPages.

## Required Icons

The following icons are referenced in `public/manifest.json` and should be placed in this directory:

### App Icons (PNG format)
- `icon-192x192.png` - 192x192px (required for PWA installation)
- `icon-512x512.png` - 512x512px (required for PWA installation)
- `apple-touch-icon.png` - 180x180px (for iOS home screen)

### Icon Specifications
- **Format**: PNG with transparency
- **Background**: Transparent or white
- **Design**: ForeverPages logo (heart icon) in black/white
- **Safe Zone**: Icons should have padding to account for rounded corners on different devices

### Generation Tools
You can generate these icons using:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

### Example Command
```bash
# Using pwa-asset-generator
npx pwa-asset-generator logo.svg public/icons/ --background "transparent" --padding "20%"
```

## Fallback Icons
The following standard favicon files should also be in the `public/` root:
- `favicon.ico` (16x16, 32x32)
- `favicon-16x16.png`
- `apple-touch-icon.png` (180x180)

## Color Scheme
- **Light mode**: Black logo on transparent/white background
- **Dark mode**: White logo on transparent/black background
- **Theme color**: `#000000` (black)