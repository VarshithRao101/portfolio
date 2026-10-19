/* Mosaic section: builds the endless tile columns, fits the 1280×800 desktop canvas,
   plays the entrance once when the section comes into view, and pauses motion off screen. */
(function () {
  const sec = document.getElementById('studio');
  if (!sec) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // hide entrance targets only once we know the script is running
  if (!reduce) sec.classList.add('pre');
  const img = n => `images/mosaic/${n}.webp`;

  /* ---------- tiles ----------
     p: photo, t: solid colour (with an optional tag, number or bee). Order per column matters:
     neighbouring columns move in opposite directions, so colours are spread to avoid clumps. */
  const P = (src, mul) => ({ p: src, mul });
  const T = (c, extra = {}) => ({ t: c, ...extra });
  const COLS = {
    x3: [P(img('vf-shadow')), T('blue'), T('dark', { bee: 1 }), P(img('hive-top')), T('yellow', { tag: 'Store', sub: 'Collection 01' })],
    x2: [T('yellow'), P(img('bee-ink')), T('cream', { num: '04' }), T('red'), P(img('map-dark'))],
    x1: [T('blue', { tag: 'Society', sub: 'Build with us' }), P(img('vf-frost')), T('red'), P('images/merch/brown-back.webp', 1), T('cream')],
    c1: [T('red', { tag: 'R&D', sub: 'Four programs' }), P(img('bee-gold')), P(img('vf-flame')), T('blue'), P(img('hive-low'))],
    c2: [T('yellow', { num: '12+' , tag: 'Products', sub: 'built and shipped' }), P(img('map-cream')), T('dark', { bee: 1 }), P(img('vf-thunder')), T('red')],
    c3: [T('blue', { tag: 'Society', sub: 'Open sessions' }), T('cream', { tag: 'Work', sub: 'Apps, sites, games' }), P(img('vf-void')), T('yellow', { tag: 'Store', sub: 'Collection 01' }), P('images/merch/olive-back.webp', 1)]
  };
  const UP = new Set(['c2', 'x1', 'x3']);
  const cell = d => d.p
    ? `<div class="m-cell ph${d.mul ? ' mul' : ''}"><img src="${d.p}" alt="" loading="lazy" decoding="async"></div>`
    : `<div class="m-cell ${d.t}">${d.bee ? '<i class="m-bee"></i>' : ''}${d.num ? `<span class="m-num">${d.num}</span>` : ''}${d.tag ? `<span class="m-tag">${d.tag}${d.sub ? `<small>${d.sub}</small>` : ''}</span>` : ''}</div>`;
  const grid = document.getElementById('m-grid');
  grid.innerHTML = ['x3', 'x2', 'x1', 'c1', 'c2', 'c3'].map(k => {
    const html = COLS[k].map(cell).join('');
    // each column holds its five tiles twice so a -50% translate loops seamlessly
    return `<div class="m-col ${k}${UP.has(k) ? ' up' : ''}"><div class="m-track">${html}${html}</div></div>`;
  }).join('');

  /* ---------- layout mode ---------- */
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

  /* ---------- pause the marquee off screen; tuck the site nav while our header shows ---------- */
  const nav = document.getElementById('nav');
  const hdr = sec.querySelector('.m-hdr');
  new IntersectionObserver(([en]) => sec.classList.toggle('is-paused', !en.isIntersecting)).observe(sec);
  new IntersectionObserver(([en]) => {
    if (nav) nav.classList.toggle('is-tucked', en.isIntersecting && sec.classList.contains('desk') && en.boundingClientRect.top > -60);
  }, { threshold: [0, .5, 1] }).observe(hdr);

  /* ---------- entrance ---------- */
  const EXPO = 'cubic-bezier(.16,1,.3,1)', QUART = 'cubic-bezier(.25,1,.5,1)', QUINT = 'cubic-bezier(.22,1,.36,1)';
  function entrance() {
    if (reduce || !sec.animate) { sec.classList.remove('pre'); return; }
    setTimeout(() => sec.classList.remove('pre'), 4000); // safety net
    const anims = [];
    const go = (el, frames, delay, dur, easing = EXPO) => { if (el) anims.push(el.animate(frames, { delay, duration: dur, easing, fill: 'both' })); };
    const fadeIn = (dy) => [{ opacity: 0, transform: `translateY(${dy}px)` }, { opacity: 1, transform: 'translateY(0)' }];
    const desk = sec.classList.contains('desk');
    if (desk) {
      go(hdr, [{ transform: 'translateY(calc(-100% - 48px))' }, { transform: 'translateY(0)' }], 0, 950);
      [...sec.querySelectorAll('.m-util > *')].forEach((el, i) => go(el, [{ opacity: 0 }, { opacity: 1 }], 320 + i * 70, 600, QUART));
      go(sec.querySelector('.m-logo'), fadeIn(-10), 380, 800, QUART);
      [...sec.querySelectorAll('.m-nav > *')].forEach((el, i) => go(el, fadeIn(-8), 440 + i * 55, 700, QUART));
      go(sec.querySelector('.m-main > .m-cta'), fadeIn(-8), 620, 700, QUART);
    }
    sec.querySelectorAll('.m-h1 .ln > span').forEach((el, i) =>
      go(el, [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], 300 + i * 85, 1000));
    // columns rise into place with a little extra drift so they hand over to the marquee smoothly
    [...sec.querySelectorAll('.m-col')].filter(c => getComputedStyle(c).display !== 'none').forEach((c, i) =>
      go(c, [{ opacity: 0, transform: `translateY(${i % 2 ? -120 : 160}px)` }, { opacity: 1, transform: 'translateY(0)' }], 150 + i * 110, 1900, QUINT));
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
  }, { threshold: .28 });
  io.observe(sec);
})();
