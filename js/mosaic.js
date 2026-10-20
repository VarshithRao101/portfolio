/* Mosaic section: builds the endless tile columns, fits the 1280×800 desktop canvas,
   adds interactive 3D tilt, plays the entrance once when the section comes into view,
   and pauses motion off screen. Minimalist Yellow, Grey, Golden, Black palette. */
(function () {
  const sec = document.getElementById('studio');
  if (!sec) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) sec.classList.add('pre');

  /* ---------- tiles data: strictly minimalist yellow, grey, golden, black ---------- */
  const P = (src) => ({ p: src });
  const T = (c, extra = {}) => ({ t: c, ...extra });

  const COLS = {
    x3: [
      P('images/mosaic/hoodie-concrete.jpg'),
      T('gold', { tag: 'BEE SOCIETY', sub: 'Open builds & hacks' }),
      P('images/merch/olive-lookbook.webp'),
      T('dark', { num: '8.3', tag: 'CGPA', sub: 'Built alongside college' }),
      P('images/mosaic/arch-honeycomb.jpg')
    ],
    x2: [
      T('dark', { bee: 1, tag: 'Studio Lab', sub: 'Est. 2024' }),
      P('images/mosaic/gold-fluid.jpg'),
      T('honey', { num: '01', tag: 'Drop', sub: 'Limited production' }),
      P('images/mosaic/hardware-device.jpg'),
      T('grey', { tag: 'Patents', sub: 'Hydrology hazard rating' })
    ],
    x1: [
      P('images/mosaic/topo-contour.jpg'),
      T('grey', { tag: 'Research', sub: 'Early warning systems' }),
      P('images/mosaic/arch-honeycomb.jpg'),
      T('gold', { bee: 1 }),
      P('images/mosaic/hoodie-concrete.jpg')
    ],
    c1: [
      P('images/mosaic/arch-honeycomb.jpg'),
      T('grey', { num: '12+', tag: 'Products', sub: 'built & shipped' }),
      P('images/mosaic/hoodie-concrete.jpg'),
      T('dark', { bee: 1, tag: 'TRNT BEE', sub: 'Research & Design' }),
      P('images/merch/olive-lookbook.webp')
    ],
    c2: [
      T('honey', { tag: 'Collection 01', sub: 'Heavyweight Techwear' }),
      P('images/mosaic/hardware-device.jpg'),
      T('gold', { bee: 1 }),
      P('images/mosaic/topo-contour.jpg'),
      T('grey', { num: '5,749', tag: 'Dams Mapped', sub: 'Patent-pending AI' })
    ],
    c3: [
      P('images/mosaic/gold-fluid.jpg'),
      T('dark', { num: '04', tag: 'Divisions', sub: 'One studio ecosystem' }),
      P('images/founder.webp'),
      T('honey', { tag: 'BEE SOCIETY', sub: 'Student builder collective' }),
      P('images/merch/brown-lookbook.webp')
    ]
  };

  const UP = new Set(['c2', 'x1', 'x3']);

  const cell = d => d.p
    ? `<div class="m-cell ph"><img src="${d.p}" alt="" loading="lazy" decoding="async"></div>`
    : `<div class="m-cell ${d.t}">${d.bee ? '<i class="m-bee"></i>' : ''}${d.num ? `<span class="m-num">${d.num}</span>` : ''}${d.tag ? `<span class="m-tag">${d.tag}${d.sub ? `<small>${d.sub}</small>` : ''}</span>` : ''}</div>`;

  const grid = document.getElementById('m-grid');
  if (grid) {
    grid.innerHTML = ['x3', 'x2', 'x1', 'c1', 'c2', 'c3'].map(k => {
      const html = COLS[k].map(cell).join('');
      // Duplicate sequence so -50% translate seamlessly loops
      return `<div class="m-col ${k}${UP.has(k) ? ' up' : ''}"><div class="m-track">${html}${html}</div></div>`;
    }).join('');
  }

  /* ---------- layout mode & scaling ---------- */
  const deskQ = window.matchMedia('(min-width: 1097px) and (min-aspect-ratio: 27/25)');
  function fit() {
    const desk = deskQ.matches;
    sec.classList.toggle('desk', desk);
    sec.classList.remove('ex1', 'ex2', 'ex3');
    if (!desk) { sec.style.removeProperty('--s'); return; }
    const vw = sec.clientWidth, vh = sec.clientHeight;
    const s = vw / vh > 1280 / 800 ? vh / 800 : vw / 1280;
    sec.style.setProperty('--s', s);
    sec.style.setProperty('--W', vw / s);
    sec.style.setProperty('--H', vh / s);
    const extra = Math.max(0, Math.min(3, Math.floor((vw / s - 1294) / 218.33)));
    if (extra) sec.classList.add('ex' + extra);
  }
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 150));

  /* ---------- interactive 3D mouse parallax on desktop ---------- */
  let mouseRaf = null;
  let targetTiltX = 0, targetTiltY = 0;
  let currentTiltX = 0, currentTiltY = 0;

  function updateParallax() {
    currentTiltX += (targetTiltX - currentTiltX) * 0.08;
    currentTiltY += (targetTiltY - currentTiltY) * 0.08;
    if (grid) {
      grid.style.transform = `perspective(1400px) rotateY(${currentTiltX.toFixed(2)}deg) rotateX(${currentTiltY.toFixed(2)}deg)`;
    }
    if (Math.abs(targetTiltX - currentTiltX) > 0.01 || Math.abs(targetTiltY - currentTiltY) > 0.01) {
      mouseRaf = requestAnimationFrame(updateParallax);
    } else {
      mouseRaf = null;
    }
  }

  sec.addEventListener('mousemove', e => {
    if (!sec.classList.contains('desk') || reduce) return;
    const rect = sec.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    targetTiltX = nx * 4.5;
    targetTiltY = -ny * 3.5;
    if (!mouseRaf) mouseRaf = requestAnimationFrame(updateParallax);
  });

  sec.addEventListener('mouseleave', () => {
    targetTiltX = 0;
    targetTiltY = 0;
    if (!mouseRaf) mouseRaf = requestAnimationFrame(updateParallax);
  });

  /* ---------- menu button reuses the site menu ---------- */
  sec.addEventListener('click', e => {
    if (!e.target.closest('[data-open-menu]')) return;
    document.documentElement.classList.add('menu-open');
    if (window.TBX && window.TBX.lenis) window.TBX.lenis.stop();
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !document.documentElement.classList.contains('menu-open')) return;
    document.documentElement.classList.remove('menu-open');
    if (window.TBX && window.TBX.lenis) window.TBX.lenis.start();
  });

  /* ---------- pause marquee off screen; tuck the site nav while our header shows ---------- */
  const nav = document.getElementById('nav');
  const hdr = sec.querySelector('.m-hdr');
  new IntersectionObserver(([en]) => sec.classList.toggle('is-paused', !en.isIntersecting)).observe(sec);
  if (hdr) {
    new IntersectionObserver(([en]) => {
      if (nav) nav.classList.toggle('is-tucked', en.isIntersecting && sec.classList.contains('desk') && en.boundingClientRect.top > -60);
    }, { threshold: [0, .5, 1] }).observe(hdr);
  }

  /* ---------- staged cinematic entrance ---------- */
  const EXPO = 'cubic-bezier(.16,1,.3,1)', QUART = 'cubic-bezier(.25,1,.5,1)', QUINT = 'cubic-bezier(.22,1,.36,1)';
  function entrance() {
    if (reduce || !sec.animate) { sec.classList.remove('pre'); return; }
    setTimeout(() => sec.classList.remove('pre'), 4000); // safety net
    const anims = [];
    const go = (el, frames, delay, dur, easing = EXPO) => {
      if (el) anims.push(el.animate(frames, { delay, duration: dur, easing, fill: 'both' }));
    };
    const fadeIn = (dy) => [{ opacity: 0, transform: `translateY(${dy}px)` }, { opacity: 1, transform: 'translateY(0)' }];
    const desk = sec.classList.contains('desk');
    if (desk && hdr) {
      go(hdr, [{ transform: 'translateY(calc(-100% - 48px))' }, { transform: 'translateY(0)' }], 0, 950);
      [...sec.querySelectorAll('.m-util > *')].forEach((el, i) => go(el, [{ opacity: 0 }, { opacity: 1 }], 320 + i * 70, 600, QUART));
      go(sec.querySelector('.m-logo'), fadeIn(-10), 380, 800, QUART);
      [...sec.querySelectorAll('.m-nav > *')].forEach((el, i) => go(el, fadeIn(-8), 440 + i * 55, 700, QUART));
      go(sec.querySelector('.m-main > .m-cta'), fadeIn(-8), 620, 700, QUART);
    }
    sec.querySelectorAll('.m-h1 .ln > span').forEach((el, i) =>
      go(el, [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], 300 + i * 85, 1000));

    // columns rise into place with subtle drift
    [...sec.querySelectorAll('.m-col')].filter(c => getComputedStyle(c).display !== 'none').forEach((c, i) =>
      go(c, [{ opacity: 0, transform: `translateY(${i % 2 ? -100 : 140}px)` }, { opacity: 1, transform: 'translateY(0)' }], 150 + i * 110, 1800, QUINT));

    go(sec.querySelector('.m-p'), fadeIn(14), 720, 900, QUART);
    sec.querySelectorAll('.m-acts > *').forEach((el, i) => go(el, fadeIn(12), 840 + i * 90, 800, QUART));

    Promise.all(anims.map(a => a.finished)).then(() => {
      sec.classList.remove('pre');
      anims.forEach(a => a.cancel());
      sec.dataset.entrance = 'done';
    });
  }

  let played = false;
  const io = new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !played) { played = true; io.disconnect(); entrance(); }
  }, { threshold: .22 });
  io.observe(sec);
})();
