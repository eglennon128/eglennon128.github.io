import { initDynamicPortfolio } from './modules/data-loader.js';

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

  initDynamicPortfolio();

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
    let lastFocusedEl = null;

    const focusableSelector = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll(focusableSelector)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!focusable.length) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

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
      lastFocusedEl = document.activeElement;
      lightbox.hidden = false;
      lightbox.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => {
        lightbox.classList.add('open');
        const target = dialog.querySelector('[data-close]') || dialog;
        dialog.setAttribute('tabindex', '-1');
        (target).focus();
      });
      lightbox.addEventListener('keydown', trapFocus);
      // prevent background scroll
      document.documentElement.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      const onEnd = (e) => {
        if (e.propertyName === 'opacity') {
          lightbox.hidden = true;
          lightbox.removeEventListener('transitionend', onEnd);
        }
      };
      lightbox.addEventListener('transitionend', onEnd);
      lightbox.removeEventListener('keydown', trapFocus);
      document.documentElement.style.overflow = '';
      if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
        lastFocusedEl.focus();
      }
      lastFocusedEl = null;
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

})();
