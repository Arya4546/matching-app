# Font Setup Instructions

## KeinannPOP Font

To use the KeinannPOP font locally, follow these steps:

1. **Download the font files** from a reliable source (Google Fonts, Adobe Fonts, or the official font website)
2. **Place the font files** in this directory (`public/fonts/`) with these names:

   - `KeinannPOP-Regular.woff2`
   - `KeinannPOP-Regular.woff`
   - `KeinannPOP-Regular.ttf`
   - `KeinannPOP-Bold.woff2`
   - `KeinannPOP-Bold.woff`
   - `KeinannPOP-Bold.ttf`

3. **Uncomment the @font-face rules** in `src/styles/Fonts.css` and comment out the Google Fonts import

## Current Setup

Currently using **Noto Sans JP** from Google Fonts as the primary Japanese font, which provides excellent Japanese text rendering and is widely supported.

## Font Features

The font configuration includes:

- Proper Japanese text rendering with `font-feature-settings: "palt" 1, "kern" 1`
- Optimized text rendering with `text-rendering: optimizeLegibility`
- Font smoothing for better appearance
- Responsive font sizes for mobile and desktop
- Fallback fonts for better compatibility

## Usage

The fonts are automatically applied to:

- All Japanese text elements
- Headings and body text
- Form inputs and buttons
- Toast notifications
- Modal content
- User interface components
