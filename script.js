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
})();
