(() => {
  'use strict';

  // --- GIS page: Leaflet map init + overlay toggles (portfolio-gis.html) ---
  (function initGISPage() {
    const mapEls = Array.from(document.querySelectorAll('.gis-map'));
    if (!mapEls.length) return;

    function ensureLeaflet() { return typeof window.L !== 'undefined'; }

    function parseCenter(attr) {
      if (!attr) return [37.7749, -122.4194];
      const parts = attr.split(',').map(s => parseFloat(s.trim()));
      return parts.length === 2 && parts.every(n => Number.isFinite(n)) ? [parts[0], parts[1]] : [37.7749, -122.4194];
    }

    function setLayerOpacity(layer, opacity) {
      if (!layer) return;
      if (layer.setOpacity) {
        try { layer.setOpacity(opacity); } catch (e) {}
      }
      if (layer.setStyle) {
        try { layer.setStyle({ opacity, fillOpacity: Math.max(0, Math.min(1, opacity * 0.8)) }); } catch (e) {}
      }
      if (layer.eachLayer) {
        try { layer.eachLayer((l) => setLayerOpacity(l, opacity)); } catch (e) {}
      }
    }

    function fadeLayerIn(map, layer, duration = 240) {
      if (!layer) return;
      setLayerOpacity(layer, 0);
      if (!map.hasLayer(layer)) layer.addTo(map);
      const start = performance.now();
      function step(t) {
        const p = Math.min(1, (t - start) / duration);
        setLayerOpacity(layer, p);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function fadeLayerOut(map, layer, duration = 240, done) {
      if (!layer || !map.hasLayer(layer)) { if (done) done(); return; }
      const start = performance.now();
      function step(t) {
        const p = Math.min(1, (t - start) / duration);
        setLayerOpacity(layer, 1 - p);
        if (p < 1) requestAnimationFrame(step);
        else { try { map.removeLayer(layer); } catch (e) {} if (done) done(); }
      }
      requestAnimationFrame(step);
    }

    function initMap(el) {
      if (!ensureLeaflet()) {
        console.warn('Leaflet not available');
        return;
      }
      if (el._map) return; // already initialized

      const center = parseCenter(el.getAttribute('data-center'));
      const zoom = parseInt(el.getAttribute('data-zoom') || '13', 10);
      const kind = (el.getAttribute('data-kind') || '').toLowerCase();

      const map = L.map(el, { zoomControl: true, scrollWheelZoom: true }).setView(center, zoom);
      el._map = map;
      el._defaultView = { center, zoom };
      el._overlays = {};

      // Base tiles (OpenStreetMap). Consider switching to a branded or cached tile service in production.
      const base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      base.on('tileerror', () => {
        console.warn('Map tiles failed to load. Check network or tile URL.');
        // Optional: Show a light border to indicate failure
        el.style.boxShadow = 'inset 0 0 0 2px rgba(239,68,68,0.35)';
      });

      // Demo overlays per kind
      if (kind === 'ortho' || kind === 'remote-sensing') {
        // NDVI: green rectangle; Thermal: red rectangle
        const bounds = L.latLngBounds([center[0] - 0.02, center[1] - 0.03], [center[0] + 0.02, center[1] + 0.03]);
        const ndvi = L.rectangle(bounds, { color: '#16a34a', weight: 1, fillColor: '#22c55e', fillOpacity: 0.35 });
        const thermal = L.rectangle(bounds, { color: '#ef4444', weight: 1, fillColor: '#ef4444', fillOpacity: 0.30 });
        el._overlays.ndvi = ndvi;
        el._overlays.thermal = thermal;
      }

      if (kind === 'photogrammetry') {
        // Extent polygon + sample GCP markers
        const extent = L.polygon([
          [center[0] + 0.01, center[1] - 0.02],
          [center[0] + 0.02, center[1] + 0.01],
          [center[0] - 0.01, center[1] + 0.02],
          [center[0] - 0.02, center[1] - 0.01]
        ], { color: '#3b82f6', weight: 2, fillColor: '#60a5fa', fillOpacity: 0.15 });
        const gcps = L.layerGroup([
          L.marker([center[0] + 0.005, center[1] + 0.005]).bindTooltip('GCP 1'),
          L.marker([center[0] - 0.006, center[1] + 0.01]).bindTooltip('GCP 2'),
          L.marker([center[0] - 0.003, center[1] - 0.012]).bindTooltip('GCP 3')
        ]);
        el._overlays.extent = extent.addTo(map);
        el._overlays.gcp = gcps;
      }

      // Button wiring for layer toggles and reset
      document.querySelectorAll(`[data-for="#${el.id}"]`).forEach((btn) => {
        const layerKey = btn.getAttribute('data-layer');
        const action = btn.getAttribute('data-action');
        if (layerKey) {
          btn.addEventListener('click', () => {
            // styling selection
            const group = btn.parentElement.querySelectorAll('[data-layer]');
            group.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');

            // Fade out current overlay (if any), then fade in chosen
            const chosen = el._overlays[layerKey];
            const current = el._currentOverlay;
            if (current && current !== chosen) {
              fadeLayerOut(map, current, 200, () => {
                el._currentOverlay = chosen || null;
                if (chosen) fadeLayerIn(map, chosen, 220);
              });
            } else {
              el._currentOverlay = chosen || null;
              if (chosen) fadeLayerIn(map, chosen, 220);
            }
          });
        }
        if (action === 'reset-view') {
          btn.addEventListener('click', () => {
            map.setView(el._defaultView.center, el._defaultView.zoom, { animate: true });
          });
        }
      });
    }

    // Lazy initialize maps when they enter viewport
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            initMap(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
      mapEls.forEach((el) => io.observe(el));
    } else {
      mapEls.forEach((el) => initMap(el));
    }

    // GIS Filters for cards
    const scope = document.querySelector('[data-filter-scope="gis"]');
    if (scope) {
      const buttons = Array.from(scope.querySelectorAll('[data-filter]'));
      const cards = Array.from(document.querySelectorAll('.map-card'));
      function setActive(btn) { buttons.forEach(b => b.classList.remove('is-active')); btn.classList.add('is-active'); }
      function applyFilter(val) {
        cards.forEach((card) => {
          const type = (card.getAttribute('data-type') || '').toLowerCase();
          const show = val === 'all' || val === type;
          if (show) {
            card.style.display = '';
            requestAnimationFrame(() => { card.classList.remove('hidden-by-filter'); card.removeAttribute('aria-hidden'); });
          } else {
            if (!card.classList.contains('hidden-by-filter')) {
              card.classList.add('hidden-by-filter');
              const onEnd = (e) => {
                if (e.propertyName === 'opacity') { card.style.display = 'none'; card.setAttribute('aria-hidden', 'true'); card.removeEventListener('transitionend', onEnd); }
              };
              card.addEventListener('transitionend', onEnd);
            }
          }
        });
      }
      buttons.forEach((btn) => btn.addEventListener('click', () => { setActive(btn); applyFilter(btn.getAttribute('data-filter')); }));
    }
  })();

  // --- Cesium placeholder: basic viewer init on demand ---
  (function initCesiumToggle() {
    const toggle = document.querySelector('[data-cesium-toggle]');
    if (!toggle) return;
    const targetSel = toggle.getAttribute('data-for');
    const target = targetSel ? document.querySelector(targetSel) : null;
    if (!target) return;

    let viewer = null;
    function createViewer() {
      if (viewer) return viewer;
      if (typeof window.Cesium === 'undefined') {
        console.warn('CesiumJS not available (offline or blocked).');
        return null;
      }
      const { Cesium } = window;
      // Note: If using Cesium Ion assets, set Cesium.Ion.defaultAccessToken = 'YOUR_TOKEN';
      viewer = new Cesium.Viewer(target, {
        imageryProvider: new Cesium.UrlTemplateImageryProvider({ url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' }),
        terrain: undefined,
        animation: false,
        timeline: false,
        sceneModePicker: false,
        baseLayerPicker: false
      });
      // Placeholder model load (commented):
      // Cesium.Model.fromGltf({ url: 'path/to/model.glb' }).then(model => { viewer.scene.primitives.add(model); });
      return viewer;
    }

    function show() { target.hidden = false; target.setAttribute('aria-hidden', 'false'); target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    function hide() { target.hidden = true; target.setAttribute('aria-hidden', 'true'); }

    toggle.addEventListener('click', () => {
      if (target.hidden) {
        show();
        createViewer();
      } else {
        hide();
      }
    });
  })();

  /*
    Testing Guide (JS):
    - Run Lighthouse Mobile: ensure no blocking main-thread tasks >200ms; verify images are lazy and maps init on scroll.
    - Keyboard: Tab through menus, accordions, tabs, lightbox; Esc closes menus and modals.
    - Reduced Motion: Test with prefers-reduced-motion to confirm acceptable animation intensity.
    - DevTools Coverage: Check for unused code before production minification/treeshake.
    Production Tip: Minify this file and defer loading (already using defer); consider splitting page-specific logic if bundling.
  */
})();
