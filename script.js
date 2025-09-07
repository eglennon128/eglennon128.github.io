// script.js — basic interactivity (no dependencies)
// - Handles mobile menu toggle with a slide-down animation
// - Sets current year in footer

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

  // Newsletter removed; no signup JS required
})();
