/* ===================================================================
   CAPS CLUB AXM — main.js
=================================================================== */
(function () {
  'use strict';

  const CONFIG = {
    waNumber: '573127906620' // WhatsApp en formato internacional, sin + ni espacios
  };

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ENLACES WHATSAPP ---------- */
  function initWhatsApp() {
    $$('[data-wa]').forEach(el => {
      const text = el.getAttribute('data-wa');
      el.setAttribute('href', 'https://wa.me/' + CONFIG.waNumber + '?text=' + encodeURIComponent(text));
    });
  }

  /* ---------- LOADER ---------- */
  function initLoader() {
    const loader = $('#loader');
    if (!loader) return;
    const fill = $('.loader__fill', loader);
    document.body.classList.add('no-scroll');
    let p = 0;
    const tick = setInterval(() => {
      p += Math.random() * 18 + 10;
      if (p >= 100) p = 100;
      if (fill) fill.style.width = p + '%';
      if (p >= 100) clearInterval(tick);
    }, 90);

    function done() {
      if (fill) fill.style.width = '100%';
      setTimeout(() => {
        loader.classList.add('is-done');
        document.body.classList.remove('no-scroll');
        startReveals();
      }, 200);
    }
    const minTime = new Promise(r => setTimeout(r, prefersReduced ? 200 : 850));
    const pageLoad = new Promise(r => {
      if (document.readyState === 'complete') r();
      else window.addEventListener('load', r, { once: true });
    });
    Promise.all([minTime, pageLoad]).then(done);
    setTimeout(done, 3200); // failsafe
  }

  /* ---------- HEADER + SCROLLSPY ---------- */
  function initHeader() {
    const header = $('#header');
    const links = $$('.nav__link');
    const sections = links
      .map(l => document.getElementById(l.getAttribute('href').slice(1)))
      .filter(Boolean);

    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 30);
      let current = '';
      const y = window.scrollY + 130;
      sections.forEach(sec => { if (sec.offsetTop <= y) current = sec.id; });
      links.forEach(l => l.classList.toggle('is-current', l.getAttribute('href') === '#' + current));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- MENÚ MÓVIL ---------- */
  function initNav() {
    const burger = $('#burger');
    const nav = $('#nav');
    if (!burger || !nav) return;
    const toggle = (open) => {
      const isOpen = open ?? !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', isOpen);
      burger.classList.toggle('is-open', isOpen);
      burger.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('no-scroll', isOpen);
    };
    burger.addEventListener('click', () => toggle());
    $$('.nav__link', nav).forEach(l => l.addEventListener('click', () => toggle(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
  }

  /* ---------- REVEAL AL HACER SCROLL ---------- */
  let revealsStarted = false;
  function startReveals() {
    if (revealsStarted) return;
    revealsStarted = true;
    const items = $$('.reveal');
    if (prefersReduced || !('IntersectionObserver' in window)) {
      items.forEach(i => i.classList.add('is-visible'));
      return;
    }
    items.forEach(el => {
      const sibs = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
      const idx = sibs.indexOf(el);
      if (sibs.length > 1 && idx > 0) el.style.transitionDelay = Math.min(idx * 65, 380) + 'ms';
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(i => io.observe(i));
  }

  /* ---------- SCROLL PROGRESS ---------- */
  function initScrollProgress() {
    const bar = $('#scrollProgress');
    if (!bar) return;
    let ticking = false;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(h.scrollTop / max, 1) : 0) + ')';
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    update();
  }

  /* ---------- VARIOS ---------- */
  function initMisc() {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  function init() {
    initWhatsApp();
    initLoader();
    initHeader();
    initNav();
    initScrollProgress();
    initMisc();
    window.addEventListener('scroll', startReveals, { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
