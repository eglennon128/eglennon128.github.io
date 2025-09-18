# Glennon Aerial Insights — Drone & GIS Portfolio

Professional drone media and GIS mapping portfolio. Built as a static site (no build step) and ready for GitHub Pages.

Deployment (GitHub Pages)
- User/Org site (username.github.io): push to `main` and enable GitHub Pages on the repo settings.
- Project site (username.github.io/repo): enable Pages from `main` root; all links in this repo are relative, so they work under subpaths.

Quick publish
1) git add -A
2) git commit -m "Deploy site"
3) git push origin main

Performance & QA
- Replace placeholder images with compressed WebP/AVIF assets and correct dimensions.
- Run `npm run build` (or the bundled binaries in `bin/`) to regenerate `assets/css/site.css` and minified JS bundles before publishing.
- Run Lighthouse (mobile + desktop). Validate Accessibility, SEO, CLS, and TBT.

## Local build

Node 18+ is recommended. After installing Node, run:

```bash
npm install
npm run build
```

If Node is unavailable, the repo includes standalone binaries in `bin/`:

```bash
bin/tailwindcss -c tailwind.config.js -i src/css/site.css -o assets/css/site.css --minify
bin/esbuild src/js/site.js --outfile=assets/js/site.js --minify --target=es2019 --format=iife --legal-comments=none --bundle --platform=browser
bin/esbuild src/js/gis.js --outfile=assets/js/gis.js --minify --target=es2019 --format=iife --legal-comments=none --bundle --platform=browser
```

## Portfolio data

- `content/portfolio-drone.json` and `content/portfolio-gis.json` drive the progressive enhancement layer on `portfolio.html`. Update these files to surface new projects without editing markup (the existing HTML cards remain for SEO and as a graceful fallback).
- Each JSON item uses the `id` field; matching `data-item-id` attributes on the static cards prevent duplicates.
- When new drone/GIS work arrives, drop the media into `assets/images/...`, update the JSON manifests with the new paths, rebuild with `npm run build`, and deploy.

## Analytics

- A Plausible snippet is loaded on every page (`data-domain="glennonaerial.com"`). Update or remove the script tag in the page heads if you prefer a different analytics provider.
- Canonical URLs currently point to `https://glennonaerial.com/`; adjust them if you deploy under a different domain or GitHub Pages subpath.

Notes
- External map/3D viewers still load from CDN (Leaflet, Cesium). For production, pin exact versions and consider self-hosting.
- Internal links are relative (e.g., `about.html`) for compatibility with project pages.
