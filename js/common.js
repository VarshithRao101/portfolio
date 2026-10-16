/* Shared behaviour for every page: smooth scroll, cursor, nav, reveals, cart count. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!window.gsap;
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- storage (never throws) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- cart ---------- */
  const cart = {
    items() { return store.get('tb_cart', []); },
    save(items) { store.set('tb_cart', items); cart.render(); document.dispatchEvent(new CustomEvent('tb:cart')); },
    add(id, size) {
      const items = cart.items();
      const hit = items.find(i => i.id === id && i.size === size);
      if (hit) hit.qty++; else items.push({ id, size, qty: 1 });
      cart.save(items);
    },
    count() { return cart.items().reduce((n, i) => n + i.qty, 0); },
    render() { document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = cart.count(); }); }
  };
  cart.render();

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? document.body : document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    document.documentElement.classList.remove('menu-open');
    if (lenis) lenis.start();
    if (lenis) lenis.scrollTo(id === '#top' ? 0 : target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- nav ---------- */
  const nav = document.getElementById('nav');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', y > lastY && y > 400 && !document.documentElement.classList.contains('menu-open'));
    }
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = document.getElementById('burger');
  if (burger) burger.addEventListener('click', () => {
    const open = document.documentElement.classList.toggle('menu-open');
    if (lenis) open ? lenis.stop() : lenis.start();
  });

  // highlight current section in nav
  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  if (links.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(l => { const s = document.querySelector(l.getAttribute('href')); if (s) io.observe(s); });
  }

  /* ---------- cursor ---------- */
  if (fine && hasGsap) {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    const label = document.getElementById('cursor-label');
    if (dot && ring) {
      const dx = gsap.quickTo(dot, 'x', { duration: .08 }), dy = gsap.quickTo(dot, 'y', { duration: .08 });
      const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
      window.addEventListener('pointermove', e => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
      document.addEventListener('pointerover', e => {
        const t = e.target.closest('a, button, [data-cursor]');
        ring.classList.toggle('is-hover', !!t && !t.dataset.cursor);
        ring.classList.toggle('is-label', !!(t && t.dataset.cursor));
        if (t && t.dataset.cursor) label.textContent = t.dataset.cursor;
      });
    }
  }

  /* ---------- magnetic buttons ---------- */
  function magnetic(root) {
    if (!fine || !hasGsap || reduce) return;
    root.querySelectorAll('.btn, .nav-cta, .social, .d-arrow, .link-arrow .circ').forEach(el => {
      if (el._mag) return; el._mag = true;
      const xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1,.4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1,.4)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .3); yTo((e.clientY - r.top - r.height / 2) * .3);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- 3D tilt ---------- */
  function tilt(root) {
    if (!fine || !hasGsap || reduce) return;
    root.querySelectorAll('[data-tilt]').forEach(el => {
      if (el._tilt) return; el._tilt = true;
      gsap.set(el, { transformPerspective: 1000 });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        gsap.to(el, { rotateY: px * 7, rotateX: -py * 7, duration: .6, ease: 'power3' });
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 1, ease: 'elastic.out(1,.5)' }));
    });
  }

  /* ---------- split headings + reveals ---------- */
  function splitHeadings(root) {
    root.querySelectorAll('[data-split]').forEach(el => {
      if (el._split) return; el._split = true;
      // wrap each word (keeping <em> groups) in a mask
      const frag = document.createDocumentFragment();
      [...el.childNodes].forEach(node => {
        const isEm = node.nodeType === 1;
        const text = node.textContent;
        text.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const outer = document.createElement('span'); outer.className = 'split-line'; outer.style.display = 'inline-block';
          const inner = document.createElement(isEm ? 'em' : 'span'); inner.textContent = part;
          inner.style.display = 'inline-block';
          outer.appendChild(inner); frag.appendChild(outer);
        });
      });
      el.textContent = ''; el.appendChild(frag);
    });
  }

  function reveals(root = document) {
    splitHeadings(root);
    magnetic(root); tilt(root);
    if (!hasGsap || reduce) {
      root.querySelectorAll('[data-reveal]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }
    root.querySelectorAll('[data-split]').forEach(el => {
      if (el._rev) return; el._rev = true;
      gsap.from(el.querySelectorAll('.split-line > *'), {
        yPercent: 110, rotate: 4, duration: 1.1, ease: 'expo.out', stagger: .06,
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
    root.querySelectorAll('[data-reveal]').forEach(el => {
      if (el._rev) return; el._rev = true;
      gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
  }

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  window.TBX = { reduce, fine, store, cart, lenis, reveals, esc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) };
})();
