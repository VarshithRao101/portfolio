/* Desktop header behaviour, the Trail switch, and the slow-motion ring cursor.
   Trail on  -> liquid ink (water-ink.js), native pointer visible.
   Trail off -> ring cursor: a dot pinned exactly to the pointer and a ring that
                glides after it, stretching with speed and opening up over links. */
(function () {
  'use strict';
  const root = document.documentElement;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hdr = document.getElementById('site-hdr');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- header: compact after scrolling, hides going down, returns going up ---------- */
  if (hdr) {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY, dy = y - lastY;
      hdr.classList.toggle('is-compact', y > 60);
      if (!root.classList.contains('menu-open')) {
        if (dy > 4 && y > 320) hdr.classList.add('is-hidden');
        else if (dy < -4 || y < 120) hdr.classList.remove('is-hidden');
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    hdr.addEventListener('click', e => {
      if (!e.target.closest('[data-open-menu]')) return;
      root.classList.add('menu-open');
      if (window.TBX && window.TBX.lenis) window.TBX.lenis.stop();
    });
    // the section you're in gets a small honey dot under its link
    const links = [...hdr.querySelectorAll('.sh-nav a')];
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => entries.forEach(en => {
        if (en.isIntersecting) links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
      }), { rootMargin: '-45% 0px -50% 0px' });
      links.forEach(l => { const t = document.querySelector(l.getAttribute('href')); if (t) io.observe(t); });
    }
    // drop in once the loader is gone
    if (!reduce && hdr.animate && getComputedStyle(hdr).display !== 'none') {
      hdr.style.transform = 'translateY(calc(-100% - 40px))';
      const start = () => {
        hdr.style.transform = '';
        hdr.animate([{ transform: 'translateY(calc(-100% - 40px))' }, { transform: 'translateY(0)' }], { duration: 1100, easing: 'cubic-bezier(.16,1,.3,1)' });
        [...hdr.querySelectorAll('.sh-logo, .sh-nav a, .sh-right > *')].forEach((el, i) =>
          el.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 260 + i * 45, easing: 'cubic-bezier(.25,1,.5,1)', fill: 'backwards' }));
      };
      const wait = () => document.body.classList.contains('is-loading') ? setTimeout(wait, 120) : setTimeout(start, 250);
      wait();
    }
  }

  if (!fine) return; // touch devices: no cursor effects at all

  /* ---------- ring cursor ---------- */
  const ring = document.getElementById('fx-ring'), dot = document.getElementById('fx-dot'), label = document.getElementById('fx-label');
  const target = { x: -200, y: -200 }, pos = { x: -200, y: -200 };
  let sx = 1, sy = 1, ang = 0, ringOn = false, raf = 0, seen = false;

  function loop() {
    // slow, weighty follow: the ring takes its time to catch up
    const ease = root.classList.contains('fx-hover') || root.classList.contains('fx-label') ? 0.1 : 0.075;
    const vx = target.x - pos.x, vy = target.y - pos.y;
    pos.x += vx * ease; pos.y += vy * ease;
    const speed = Math.hypot(vx, vy);
    // stretch along the direction of travel, settle back to round when it catches up
    const tsx = 1 + Math.min(speed / 140, 0.5), tsy = 1 - Math.min(speed / 320, 0.22);
    sx += (tsx - sx) * 0.12; sy += (tsy - sy) * 0.12;
    if (speed > 1) ang = Math.atan2(vy, vx) * 180 / Math.PI;
    ring.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${ang}deg) scale(${sx}, ${sy})`;
    label.style.transform = `rotate(${-ang}deg) scale(${1 / sx}, ${1 / sy})`;
    if (ringOn && (speed > 0.05 || Math.abs(sx - 1) > 0.002)) raf = requestAnimationFrame(loop);
    else raf = 0;
  }
  const kick = () => { if (ringOn && !raf) raf = requestAnimationFrame(loop); };

  window.addEventListener('pointermove', e => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    target.x = e.clientX; target.y = e.clientY;
    if (!seen) { seen = true; pos.x = target.x; pos.y = target.y; }
    // the dot is placed straight from the event, so it is exactly where the pointer is
    if (ringOn) dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    root.classList.remove('fx-away');
    kick();
  }, { passive: true });
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('[data-cursor], a, button, [role="button"], label, summary, select');
    const text = t && t.dataset && t.dataset.cursor;
    root.classList.toggle('fx-label', !!text);
    root.classList.toggle('fx-hover', !!t && !text);
    if (text) label.textContent = text;
    kick();
  });
  window.addEventListener('pointerdown', () => { root.classList.add('fx-down'); kick(); });
  window.addEventListener('pointerup', () => { root.classList.remove('fx-down'); kick(); });
  root.addEventListener('pointerleave', () => root.classList.add('fx-away'));
  root.addEventListener('pointerenter', () => root.classList.remove('fx-away'));

  /* ---------- mode switch ---------- */
  const toggle = document.getElementById('fx-toggle');
  function setMode(mode) {
    const trail = mode === 'trail' && !!window.TBInk; // no WebGL: stay on the ring
    ringOn = !trail && !reduce;
    root.classList.toggle('fx-ring-on', ringOn);
    if (toggle) toggle.setAttribute('aria-pressed', String(trail));
    if (window.TBInk) trail ? window.TBInk.enable() : window.TBInk.disable();
    if (ringOn) { dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`; kick(); }
  }
  if (toggle && !window.TBInk) toggle.hidden = true;
  if (toggle) toggle.addEventListener('click', () => {
    const next = toggle.getAttribute('aria-pressed') === 'true' ? 'ring' : 'trail';
    store.set('tb_fx', next);
    setMode(next);
  });
  setMode(store.get('tb_fx') === 'trail' ? 'trail' : 'ring');
})();
