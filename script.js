// script.js — basic interactivity (no dependencies)
// - Handles mobile menu toggle with a slide-down animation
// - IntersectionObserver for reveal-on-scroll animations
// - Sets current year in footer (if #year exists)

(function () {
  'use strict';

  // Mobile menu toggle
  const menuButton = document.getElementById('menuButton');
  const mobileMenu = document.getElementById('mobileMenu');
  const iconBurger = document.querySelector('#menuButton .icon-burger');
  const iconClose = document.querySelector('#menuButton .icon-close');

  function openMenu() {
    mobileMenu.hidden = false; // ensure element participates in layout
    requestAnimationFrame(() => {
      mobileMenu.classList.add('open');
    });
    menuButton.setAttribute('aria-expanded', 'true');
    if (iconBurger && iconClose) {
      iconBurger.classList.add('hidden');
      iconClose.classList.remove('hidden');
    }
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    // wait for CSS transition to finish before hiding
    const onTransitionEnd = (e) => {
      if (e.propertyName === 'max-height') {
        mobileMenu.hidden = true;
        mobileMenu.removeEventListener('transitionend', onTransitionEnd);
      }
    };
    mobileMenu.addEventListener('transitionend', onTransitionEnd);
    menuButton.setAttribute('aria-expanded', 'false');
    if (iconBurger && iconClose) {
      iconBurger.classList.remove('hidden');
      iconClose.classList.add('hidden');
    }
  }

  function toggleMenu() {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeMenu();
    else openMenu();
  }

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', toggleMenu);

    // Close on Escape for accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
        if (isOpen) closeMenu();
      }
    });

    // Close when clicking outside the menu (mobile only context)
    document.addEventListener('click', (e) => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      if (!isOpen) return;
      const target = e.target;
      if (!(menuButton.contains(target) || mobileMenu.contains(target))) {
        closeMenu();
      }
    });

    // Close menu when a mobile link is clicked
    mobileMenu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
        if (isOpen) closeMenu();
      });
    });
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Reveal-on-scroll animations for elements with .reveal
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  // Stagger setup: containers with data-stagger will assign delays to child .reveal
  (function setupStagger() {
    const containers = new Set();
    revealEls.forEach((el) => { if (el.parentElement) containers.add(el.parentElement); });
    containers.forEach((container) => {
      const stepAttr = container.getAttribute && container.getAttribute('data-stagger-step');
      const baseAttr = container.getAttribute && container.getAttribute('data-stagger-base');
      const step = parseInt(stepAttr || '80', 10);
      const base = parseInt(baseAttr || '0', 10);
      const kids = Array.from(container.querySelectorAll(':scope > .reveal, :scope > * .reveal')).filter(Boolean);
      kids.forEach((el, i) => {
        // Only set delay if element doesn't already define one
        if (!el.style.transitionDelay) {
          el.style.transitionDelay = `${base + i * step}ms`;
        }
        el.classList.add('will-fade');
      });
    });
  })();

  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -4% 0px' });

    revealEls.forEach((el) => io.observe(el));
  } else {
    // Fallback: show all immediately
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  // Accordions (services page): .accordion-trigger + next .accordion-panel
  const accordionTriggers = Array.from(document.querySelectorAll('.accordion-trigger'));
  function openPanel(trigger, panel) {
    panel.hidden = false;
    panel.classList.add('open');
    panel.style.maxHeight = panel.scrollHeight + 'px';
    trigger.setAttribute('aria-expanded', 'true');
  }
  function closePanel(trigger, panel) {
    panel.style.maxHeight = panel.scrollHeight + 'px';
    // force reflow to ensure transition kicks when setting to 0
    void panel.offsetHeight; // eslint-disable-line no-unused-expressions
    panel.style.maxHeight = '0px';
    panel.classList.remove('open');
    const onEnd = (e) => {
      if (e.propertyName === 'max-height') {
        panel.hidden = true;
        panel.removeEventListener('transitionend', onEnd);
      }
    };
    panel.addEventListener('transitionend', onEnd);
    trigger.setAttribute('aria-expanded', 'false');
  }
  accordionTriggers.forEach((btn) => {
    const panelId = btn.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    if (!panel) return;
    // Ensure initial state
    btn.setAttribute('aria-expanded', panel.classList.contains('open') ? 'true' : 'false');

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if (expanded) closePanel(btn, panel);
      else openPanel(btn, panel);
    });
  });

  // Keep open panels sized correctly on resize (content height changes)
  window.addEventListener('resize', () => {
    document.querySelectorAll('.accordion-panel.open').forEach((panel) => {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    });
  });

  // Contact form validation + service preselect
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const nameEl = contactForm.querySelector('#name');
    const emailEl = contactForm.querySelector('#email');
    const serviceEl = contactForm.querySelector('#service');
    const messageEl = contactForm.querySelector('#message');
    const statusEl = document.getElementById('formStatus');

    // Preselect service from ?service=drone-media|gis-mapping|other
    const params = new URLSearchParams(window.location.search);
    const svc = (params.get('service') || '').toLowerCase();
    const allowed = new Set(['drone-media', 'gis-mapping', 'other']);
    if (svc && allowed.has(svc)) {
      serviceEl.value = svc;
    }

    function setError(el, msg) {
      el.classList.add('error');
      const msgEl = el.closest('div').querySelector('.error-msg');
      if (msgEl) msgEl.textContent = msg || '';
    }
    function clearError(el) {
      el.classList.remove('error');
      const msgEl = el.closest('div').querySelector('.error-msg');
      if (msgEl) msgEl.textContent = '';
    }
    function isValidEmail(value) {
      // Simple email pattern sufficient for client-side hinting
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    // Live validation on blur
    [nameEl, emailEl, serviceEl, messageEl].forEach((el) => {
      el.addEventListener('blur', () => {
        if (el === nameEl && !el.value.trim()) setError(el, 'Please enter your name.'); else if (el === nameEl) clearError(el);
        if (el === emailEl && !isValidEmail(el.value.trim())) setError(el, 'Enter a valid email address.'); else if (el === emailEl) clearError(el);
        if (el === serviceEl && !el.value) setError(el, 'Please choose a service.'); else if (el === serviceEl) clearError(el);
        if (el === messageEl && !el.value.trim()) setError(el, 'Please tell me about your project.'); else if (el === messageEl) clearError(el);
      });
    });

    contactForm.addEventListener('submit', (e) => {
      let ok = true;
      if (!nameEl.value.trim()) { setError(nameEl, 'Please enter your name.'); ok = false; } else clearError(nameEl);
      if (!isValidEmail(emailEl.value.trim())) { setError(emailEl, 'Enter a valid email address.'); ok = false; } else clearError(emailEl);
      if (!serviceEl.value) { setError(serviceEl, 'Please choose a service.'); ok = false; } else clearError(serviceEl);
      if (!messageEl.value.trim()) { setError(messageEl, 'Please tell me about your project.'); ok = false; } else clearError(messageEl);

      if (!ok) {
        e.preventDefault();
        if (statusEl) {
          statusEl.textContent = 'Please fix the highlighted fields.';
          statusEl.style.color = '#dc2626';
        }
        return;
      }
      // Let the browser submit to Formspree; show a quick sending note
      if (statusEl) {
        statusEl.textContent = 'Sending…';
        statusEl.style.color = '#4b5563';
      }
    });
  }

  // Newsletter removed; no signup JS required

  // Smooth-scroll for on-page anchors
  (function smoothScrollAnchors() {
    const anchors = Array.from(document.querySelectorAll('a[href^="#"]'));
    anchors.forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // update hash without jumping
          history.pushState(null, '', id);
        }
      });
    });
  })();

  // --- Portfolio tabs + filters (portfolio.html) ---
  // Vanilla JS to show/hide tab panels with fade transitions.
  // Minification tip: bundle and minify in production to reduce bytes.
  const tabsRoot = document.querySelector('.js-tabs');
  if (tabsRoot) {
    const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
    const panels = Array.from(document.querySelectorAll('[data-tab-panel]'));

    function activateTab(targetId) {
      // Deactivate all
      tabButtons.forEach((btn) => {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-selected', 'false');
      });
      panels.forEach((p) => p.classList.remove('is-active'));

      // Activate target
      const btn = tabButtons.find((b) => b.getAttribute('data-tab-target') === targetId);
      const panel = document.getElementById(targetId);
      if (btn) {
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
      }
      if (panel) {
        panel.classList.add('is-active');
      }
    }

    // Intercept clicks when a matching panel exists (single-page mode)
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const targetId = btn.getAttribute('data-tab-target');
        if (!targetId) return;
        const panel = document.getElementById(targetId);
        if (panel) {
          e.preventDefault();
          activateTab(targetId);
        }
        // else allow navigation to sub-page e.g., /portfolio-drone.html
      });
    });

    // Initialize default active if any button has is-active
    const initiallyActive = tabButtons.find((b) => b.classList.contains('is-active'));
    if (initiallyActive) {
      activateTab(initiallyActive.getAttribute('data-tab-target'));
    }

    // Filters per panel
    function bindFilter(selectId, panelId) {
      const select = document.getElementById(selectId);
      const panel = document.getElementById(panelId);
      if (!select || !panel) return;
      const cards = Array.from(panel.querySelectorAll('.portfolio-card'));
      select.addEventListener('change', () => {
        const v = select.value;
        cards.forEach((card) => {
          const type = (card.getAttribute('data-type') || '').toLowerCase();
          const show = v === 'all' || v === type;
          if (show) {
            // Ensure participates in layout, then fade in
            card.style.display = '';
            requestAnimationFrame(() => {
              card.classList.remove('hidden-by-filter');
              card.removeAttribute('aria-hidden');
            });
          } else {
            // Fade out, then remove from layout when transition ends
            if (!card.classList.contains('hidden-by-filter')) {
              card.classList.add('hidden-by-filter');
              const onEnd = (e) => {
                if (e.propertyName === 'opacity') {
                  card.style.display = 'none';
                  card.setAttribute('aria-hidden', 'true');
                  card.removeEventListener('transitionend', onEnd);
                }
              };
              card.addEventListener('transitionend', onEnd);
            }
          }
        });
      });
    }

    bindFilter('droneFilter', 'tab-drone');
    bindFilter('gisFilter', 'tab-gis');
  }

  // --- Drone page: filter chips + lightbox modal ---
  (function initDronePage() {
    const filterScope = document.querySelector('[data-filter-scope="drone"]');
    const grid = document.getElementById('droneGrid');
    if (filterScope && grid) {
      const buttons = Array.from(filterScope.querySelectorAll('[data-filter]'));
      const cards = Array.from(grid.querySelectorAll('.media-card'));

      function setActive(btn) {
        buttons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      }

      function applyFilter(val) {
        cards.forEach((card) => {
          const type = (card.getAttribute('data-type') || '').toLowerCase();
          const show = val === 'all' || val === type;
          if (show) {
            card.style.display = '';
            requestAnimationFrame(() => {
              card.classList.remove('hidden-by-filter');
              card.removeAttribute('aria-hidden');
            });
          } else {
            if (!card.classList.contains('hidden-by-filter')) {
              card.classList.add('hidden-by-filter');
              const onEnd = (e) => {
                if (e.propertyName === 'opacity') {
                  card.style.display = 'none';
                  card.setAttribute('aria-hidden', 'true');
                  card.removeEventListener('transitionend', onEnd);
                }
              };
              card.addEventListener('transitionend', onEnd);
            }
          }
        });
      }

      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          setActive(btn);
          applyFilter(btn.getAttribute('data-filter'));
        });
      });
    }

    // Lightbox modal
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    const dialog = lightbox.querySelector('.lightbox-dialog');
    const mediaWrap = document.getElementById('lightboxMedia');
    const titleEl = document.getElementById('lightboxTitle');
    const descEl = document.getElementById('lightboxDesc');
    const btnPrev = lightbox.querySelector('[data-prev]');
    const btnNext = lightbox.querySelector('[data-next]');
    const closeEls = lightbox.querySelectorAll('[data-close]');

    let gallery = [];
    let index = 0;

    function isVideo(url) { return /\.(mp4|webm|ogg)(\?|$)/i.test(url); }

    function renderMedia(url) {
        mediaWrap.innerHTML = '';
        if (isVideo(url)) {
          const v = document.createElement('video');
          v.src = url;
          v.controls = true;
          v.autoplay = true;
          v.playsInline = true;
          v.setAttribute('preload', 'metadata');
          mediaWrap.appendChild(v);
        } else {
          const img = document.createElement('img');
          img.src = url;
          img.loading = 'lazy';
          img.decoding = 'async';
          mediaWrap.appendChild(img);
        }
    }

    function updateNavVisibility() {
      const hasMultiple = gallery.length > 1;
      btnPrev.style.display = hasMultiple ? '' : 'none';
      btnNext.style.display = hasMultiple ? '' : 'none';
    }

    function openLightbox(items, startIndex, title, desc) {
      gallery = items;
      index = startIndex || 0;
      titleEl.textContent = title || '';
      descEl.textContent = desc || '';
      renderMedia(gallery[index]);
      updateNavVisibility();
      lightbox.hidden = false;
      requestAnimationFrame(() => lightbox.classList.add('open'));
      // prevent background scroll
      document.documentElement.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      const onEnd = (e) => {
        if (e.propertyName === 'opacity') {
          lightbox.hidden = true;
          lightbox.removeEventListener('transitionend', onEnd);
        }
      };
      lightbox.addEventListener('transitionend', onEnd);
      document.documentElement.style.overflow = '';
    }

    function next() { if (!gallery.length) return; index = (index + 1) % gallery.length; renderMedia(gallery[index]); }
    function prev() { if (!gallery.length) return; index = (index - 1 + gallery.length) % gallery.length; renderMedia(gallery[index]); }

    // Bind triggers
    document.querySelectorAll('[data-lightbox]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const raw = (el.getAttribute('data-gallery') || '').trim();
        if (!raw) return;
        const items = raw.split('|').map(s => s.trim()).filter(Boolean);
        const title = el.getAttribute('data-title') || '';
        const desc = el.getAttribute('data-desc') || '';
        openLightbox(items, 0, title, desc);
      });
    });

    // Controls
    btnNext && btnNext.addEventListener('click', next);
    btnPrev && btnPrev.addEventListener('click', prev);
    closeEls.forEach((c) => c.addEventListener('click', closeLightbox));
    lightbox.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closeLightbox(); });

    // Keys
    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });
  })();

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
