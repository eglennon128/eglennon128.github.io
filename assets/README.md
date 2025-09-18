# Assets Guide

Drop final branded media here before launch.

## Hero Section
- `video/hero.mp4` — primary hero loop (1–4&nbsp;MB, H.264). Provide a `video/hero.webm` if available for Chrome.
- `images/hero/hero-poster.jpg` — high-quality poster frame used for the video `poster` attribute and CSS fallback background. Export a compressed JPG/WebP (1800x1000 or similar).

## Social Preview
- `images/social-share.jpg` — 1200×630 share image used by `og:image`/`twitter:image` meta tags. Include logo + tagline.

## Fonts
- `fonts/Inter-Variable.woff2` — body text variable font (100–900). Already included from the Inter open-source family.
- `fonts/Montserrat-600.woff2`, `fonts/Montserrat-700.woff2`, `fonts/Montserrat-800.woff2` — heading weights bundled for local use. If you prefer different weights, replace these files and adjust `src/css/site.css` as needed.

Replace these placeholders with production-ready files next week once drone footage is captured. Keep filenames the same and the site will pick them up automatically.
