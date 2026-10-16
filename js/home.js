/* Home page: loader, hero intro, content rendering and scroll choreography. */
(function () {
  const { reduce, fine, esc, reveals } = window.TBX;
  const D = window.TB;
  const hasGsap = !!window.gsap;
  const $ = s => document.querySelector(s);

  /* ---------- R&D ---------- */
  $('#rnd-stack').innerHTML = D.research.map((r, i) => `
    <article class="rnd-panel" data-viz="${esc(r.viz)}">
      <div class="rnd-text">
        <div class="rnd-top"><span class="rnd-num">0${i + 1}</span><span class="rnd-label">${esc(r.label)}</span></div>
        <h3>${esc(r.title)}</h3>
        <p>${esc(r.body)}</p>
        <dl class="facts">${r.facts.map(f => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl>
        <span class="rnd-status">${esc(r.status)}</span>
      </div>
      <figure class="rnd-viz">
        <div class="viz viz-${esc(r.viz)}" data-host></div>
        <figcaption>${esc(r.caption)}</figcaption>
      </figure>
    </article>`).join('');
  document.querySelectorAll('.rnd-panel').forEach(p => {
    const fn = window.RND && window.RND[p.dataset.viz];
    if (fn) try { fn(p.querySelector('[data-host]')); } catch (e) { console.warn(e); }
  });
  $('#ip-list').innerHTML = D.patents.map(p => `<li><span>${esc(p.title)}</span><em>${esc(p.status)}</em></li>`).join('');

  /* ---------- Work ---------- */
  const zetaArt = () => {
    const nodes = [[80, 70, 'Form'], [240, 40, 'AI'], [240, 120, 'Sheet'], [400, 70, 'Email'], [400, 160, 'Telegram'], [560, 115, 'Receipt']];
    const edges = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]];
    let s = '';
    edges.forEach(([a, b], i) => {
      const [x1, y1] = nodes[a], [x2, y2] = nodes[b];
      const d = `M${x1 + 46} ${y1} C ${x1 + 100} ${y1} ${x2 - 100} ${y2} ${x2 - 46} ${y2}`;
      s += `<path d="${d}" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1.5"/>
        <path d="${d}" fill="none" stroke="#0a0a0a" stroke-width="2.5" stroke-dasharray="10 400"><animate attributeName="stroke-dashoffset" values="0;-410" dur="2.6s" begin="${i * .3}s" repeatCount="indefinite"/></path>`;
    });
    nodes.forEach(([x, y, n], i) => {
      s += `<rect x="${x - 46}" y="${y - 18}" width="92" height="36" rx="18" fill="${i === 5 ? '#0a0a0a' : '#fff'}" stroke="rgba(0,0,0,.14)"/>
        <text x="${x}" y="${y + 5}" text-anchor="middle" fill="${i === 5 ? '#ffc21a' : '#0a0a0a'}" font-family="Geist, sans-serif" font-size="14" font-weight="500">${n}</text>`;
    });
    return `<div class="zeta-art"><svg viewBox="20 0 600 200" preserveAspectRatio="xMidYMid meet">${s}</svg></div>`;
  };
  const statusText = s => s === 'live' ? 'Live' : s === 'soon' ? 'Demo soon' : 'Building';

  $('#featured').innerHTML = D.solutions.filter(p => p.featured).map(p => {
    let media;
    if (p.art) media = zetaArt();
    else if (p.model) media = `<img class="fallback" src="${esc(p.image)}" alt="${esc(p.title)} character" loading="lazy"><canvas id="voidfall-canvas" data-model="${esc(p.model)}"></canvas>`;
    else media = `<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">`;
    const link = p.url
      ? `<a class="fcard-link" href="${esc(p.url)}" target="_blank" rel="noopener">Visit site <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
      : `<span class="fcard-link off">${statusText(p.status)}</span>`;
    return `<article class="fcard fcard-${esc(p.id)}" data-reveal>
      <div class="fcard-media">${media}</div>
      <div class="fcard-body">
        <div class="fcard-meta"><span>${esc(p.kicker)}</span><span>${esc(p.year || '')}</span></div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.desc)}</p>
        ${link}
      </div>
    </article>`;
  }).join('');

  $('#catalogue').innerHTML = D.solutions.filter(p => !p.featured).map(p => {
    const tag = p.url ? 'a' : 'div';
    const href = p.url ? `href="${esc(p.url)}" target="_blank" rel="noopener"` : '';
    return `<li class="cat-row" data-status="${p.status === 'live' ? 'live' : 'dev'}" data-reveal>
      <${tag} class="cat-link" ${href} data-img="${esc(p.image)}">
        <img class="cat-thumb" src="${esc(p.image)}" alt="" loading="lazy">
        <span class="cat-name">${esc(p.title)}</span>
        <span class="cat-desc">${esc(p.desc)}</span>
        <span class="cat-kind">${esc(p.kicker)}</span>
        <span class="cat-status ${p.status === 'live' ? 'live' : ''}">${p.url ? 'Visit <i class="fa-solid fa-arrow-up-right-from-square"></i>' : statusText(p.status)}</span>
      </${tag}></li>`;
  }).join('') + `<li class="cat-row more" data-status="dev"><div class="cat-link"><span class="cat-name">More on the way</span><span class="cat-desc">We're always building something.</span></div></li>`;

  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#filters button').forEach(x => x.classList.toggle('is-on', x === b));
    const f = b.dataset.f;
    document.querySelectorAll('.cat-row').forEach(c => c.classList.toggle('is-hidden', f !== 'all' && c.dataset.status !== f));
    window.ScrollTrigger && ScrollTrigger.refresh();
  });

  // floating preview image that follows the cursor over the catalogue
  const peek = $('#peek');
  if (fine && hasGsap && peek) {
    const img = peek.querySelector('img');
    const px = gsap.quickTo(peek, 'x', { duration: .5, ease: 'power3' }), py = gsap.quickTo(peek, 'y', { duration: .5, ease: 'power3' });
    const cat = $('#catalogue');
    cat.addEventListener('pointermove', e => { px(e.clientX); py(e.clientY); });
    cat.addEventListener('pointerover', e => {
      const l = e.target.closest('.cat-link[data-img]');
      if (l) { img.src = l.dataset.img; peek.classList.add('on'); }
    });
    cat.addEventListener('pointerleave', () => peek.classList.remove('on'));
  }

  /* ---------- Merch ---------- */
  const SP = (window.STORE && window.STORE.products) || [];
  const money = n => '₹' + Number(n).toLocaleString('en-IN');
  $('#merch-teaser').innerHTML = SP.slice(0, 2).map(m => {
    const im = m.images || [];
    const media = im.length
      ? `<img src="${esc(im[1] || im[0])}" alt="${esc(m.name)}, back" loading="lazy">${im[1] ? `<img class="alt" src="${esc(im[0])}" alt="" loading="lazy">` : ''}`
      : `<div class="mcard-ph"><i class="bee"></i><span>Photo soon</span></div>`;
    return `<a class="mcard" href="store/product.html?id=${encodeURIComponent(m.id)}" data-reveal data-cursor="SHOP">
      <div class="mcard-media">${media}</div>
      <div class="mcard-body"><div><h4>${esc(m.name.split(' — ')[0])}</h4><span class="mcard-colour">${esc(m.color || m.category)}</span></div><span class="price">${m.price ? money(m.price) : m.status === 'coming-soon' ? 'Coming soon' : 'Price soon'}</span></div>
    </a>`;
  }).join('');

  reveals(document);

  /* ---------- loader + hero intro ---------- */
  const title = $('#hero-title');
  title.querySelectorAll('.word').forEach(w => { w.innerHTML = [...w.textContent].map(c => `<span class="char">${c}</span>`).join(''); });

  function intro() {
    document.body.classList.remove('is-loading');
    if (!hasGsap || reduce) return;
    gsap.timeline()
      .from('.hero-title .char', { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: .045 })
      .from('[data-hero]', { opacity: 0, y: 24, duration: 1, ease: 'expo.out', stagger: .1 }, '-=.9')
      .from('.nav .wrap', { y: -20, opacity: 0, duration: .9, ease: 'expo.out' }, '-=1');
  }

  const loader = $('#loader');
  if (!hasGsap || reduce) { loader.remove(); intro(); }
  else {
    const n = { v: 0 }, fill = $('#loader-fill'), num = $('#loader-num');
    const tl = gsap.timeline();
    tl.to(n, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate() { const v = Math.round(n.v); num.textContent = v; fill.style.clipPath = `inset(${100 - v}% 0 0 0)`; } })
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.inOut' })
      .add(() => loader.remove());
    tl.add(intro, '-=.55');
    setTimeout(() => tl.progress(1), 7000);
  }

  if (!hasGsap) return;

  if (!reduce) gsap.to('.hero-content', { yPercent: 18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* intro text: words light up as you scroll */
  const it = $('#intro-text');
  it.innerHTML = it.textContent.split(/\s+/).map(w => `<span class="w">${esc(w)} </span>`).join('');
  const words = it.querySelectorAll('.w');
  ScrollTrigger.create({
    trigger: it, start: 'top 85%', end: 'bottom 50%', scrub: true,
    onUpdate: s => { const k = Math.round(s.progress * words.length); words.forEach((w, i) => w.classList.toggle('on', i < k)); }
  });

  /* research panels stack on desktop: earlier panels shrink back as the next one arrives */
  ScrollTrigger.matchMedia({
    '(min-width: 961px)': () => {
      const panels = gsap.utils.toArray('.rnd-panel');
      panels.forEach((p, i) => {
        if (i === panels.length - 1) return;
        gsap.to(p, {
          scale: .94, opacity: .35, ease: 'none',
          scrollTrigger: { trigger: panels[i + 1], start: 'top bottom', end: 'top 12%', scrub: true }
        });
      });
    }
  });

  /* society */
  gsap.from('.society-big .split-line > span', { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.society-big', start: 'top 85%' } });
  if (!reduce) gsap.to('.society-media video', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '#society', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* footer word fills with honey */
  ScrollTrigger.create({
    trigger: '#footer-word', start: 'top bottom', end: 'bottom bottom', scrub: true,
    onUpdate: s => $('#footer-word').style.setProperty('--fill', (s.progress * 100).toFixed(1) + '%')
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
