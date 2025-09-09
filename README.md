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
- Minify CSS/JS before prod; purge unused Tailwind classes.
- Run Lighthouse (mobile + desktop). Validate Accessibility, SEO, CLS, and TBT.

Notes
- External libraries via CDN for convenience (Tailwind, Leaflet, Cesium). For production, pin exact versions and consider self-hosting.
- Internal links are relative (e.g., `about.html`) for compatibility with project pages.
