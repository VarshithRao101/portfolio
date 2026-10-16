/* Home page: loader, hero intro, content rendering and scroll choreography. */
(function () {
  const { reduce, esc, reveals } = window.TBX;
  const D = window.TB;
  const hasGsap = !!window.gsap;
  const $ = s => document.querySelector(s);

  /* ---------- generative artwork for R&D cards ---------- */
  const art = {
    flood() {
      let rings = '';
      for (let i = 0; i < 14; i++) {
        const rx = 40 + i * 26, ry = 22 + i * 15;
        rings += `<ellipse cx="300" cy="330" rx="${rx}" ry="${ry}" fill="none" stroke="rgba(255,194,26,${(0.55 - i * 0.035).toFixed(2)})" stroke-width="1">
          <animate attributeName="rx" values="${rx};${rx + 14};${rx}" dur="${4 + i * .25}s" repeatCount="indefinite"/>
          <animate attributeName="ry" values="${ry};${ry + 8};${ry}" dur="${4 + i * .25}s" repeatCount="indefinite"/></ellipse>`;
      }
      let waves = '';
      for (let i = 0; i < 6; i++) {
        const y = 470 + i * 22;
        waves += `<path d="M-20 ${y} Q 75 ${y - 16} 150 ${y} T 300 ${y} T 450 ${y} T 600 ${y} T 750 ${y}" fill="none" stroke="rgba(255,255,255,${0.2 - i * .025})" stroke-width="1.2">
          <animateTransform attributeName="transform" type="translate" values="0 0;-150 0" dur="${5 + i}s" repeatCount="indefinite"/></path>`;
      }
      return `<svg viewBox="0 0 600 640" preserveAspectRatio="xMidYMid slice">${rings}${waves}
        <circle cx="300" cy="330" r="6" fill="#ffc21a"><animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite"/></circle>
        <text x="320" y="320" fill="rgba(255,255,255,.55)" font-family="JetBrains Mono" font-size="11">BREACH · t+00:42</text></svg>`;
    },
    shield() {
      let dots = '';
      for (let y = 0; y < 16; y++) for (let x = 0; x < 14; x++) {
        const d = ((x * 7 + y * 13) % 10) / 10;
        dots += `<circle cx="${30 + x * 42}" cy="${30 + y * 40}" r="1.6" fill="rgba(255,255,255,.18)"><animate attributeName="fill" values="rgba(255,255,255,.18);#ffc21a;rgba(255,255,255,.18)" dur="3s" begin="${(d * 3).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
      }
      return `<svg viewBox="0 0 600 640" preserveAspectRatio="xMidYMid slice">${dots}
        <path d="M300 150 L430 200 L430 330 Q430 440 300 500 Q170 440 170 330 L170 200 Z" fill="rgba(7,7,8,.75)" stroke="#ffc21a" stroke-width="2"/>
        <path d="M250 325 L288 362 L356 290" fill="none" stroke="#ffc21a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="180" stroke-dashoffset="180">
          <animate attributeName="stroke-dashoffset" values="180;0;0;180" keyTimes="0;.3;.85;1" dur="4s" repeatCount="indefinite"/></path>
        <rect x="0" y="0" width="600" height="2" fill="#ffc21a" opacity=".7"><animate attributeName="y" values="0;640;0" dur="4s" repeatCount="indefinite"/></rect></svg>`;
    },
    cascade() {
      let bars = '';
      const tiers = [['RULES', .9], ['SOLVER', .7], ['RETRIEVAL', .55], ['LOCAL LLM', .38], ['API LLM', .2]];
      tiers.forEach(([name, w], i) => {
        const y = 140 + i * 82, x = 60 + i * 50, wd = 260;
        bars += `<g><rect x="${x}" y="${y}" width="${wd}" height="46" rx="10" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.14)"/>
          <rect x="${x}" y="${y}" width="${wd * w}" height="46" rx="10" fill="rgba(255,194,26,${0.15 + w * .6})">
            <animate attributeName="width" values="0;${wd * w};${wd * w};0" keyTimes="0;.35;.9;1" dur="5s" begin="${i * .35}s" repeatCount="indefinite"/></rect>
          <text x="${x + 14}" y="${y + 28}" fill="#f4f1ea" font-family="JetBrains Mono" font-size="11" letter-spacing="1.5">${name}</text></g>`;
        if (i < tiers.length - 1) bars += `<path d="M${x + wd + 10} ${y + 23} q 30 0 30 40 t 20 42" fill="none" stroke="rgba(255,194,26,.5)" stroke-dasharray="4 6"><animate attributeName="stroke-dashoffset" values="20;0" dur="1s" repeatCount="indefinite"/></path>`;
      });
      return `<svg viewBox="0 0 600 640" preserveAspectRatio="xMidYMid slice">${bars}
        <text x="60" y="110" fill="rgba(255,255,255,.5)" font-family="JetBrains Mono" font-size="12">ε ≤ 0.01 · certified</text></svg>`;
    },
    zeta() {
      const nodes = [[90, 120, 'FORM'], [270, 70, 'AI'], [270, 190, 'SHEET'], [450, 120, 'EMAIL'], [450, 250, 'TELEGRAM'], [630, 180, 'PROOF']];
      const edges = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]];
      let s = '';
      edges.forEach(([a, b], i) => {
        const [x1, y1] = nodes[a], [x2, y2] = nodes[b];
        s += `<path d="M${x1 + 50} ${y1} C ${x1 + 110} ${y1} ${x2 - 110} ${y2} ${x2 - 50} ${y2}" fill="none" stroke="rgba(255,255,255,.18)"/>
          <path d="M${x1 + 50} ${y1} C ${x1 + 110} ${y1} ${x2 - 110} ${y2} ${x2 - 50} ${y2}" fill="none" stroke="#ffc21a" stroke-width="2" stroke-dasharray="12 400">
          <animate attributeName="stroke-dashoffset" values="0;-412" dur="2.4s" begin="${i * .3}s" repeatCount="indefinite"/></path>`;
      });
      nodes.forEach(([x, y, n], i) => {
        s += `<g><rect x="${x - 50}" y="${y - 20}" width="100" height="40" rx="12" fill="${i === 5 ? '#ffc21a' : '#141418'}" stroke="rgba(255,255,255,.16)"/>
          <text x="${x}" y="${y + 4}" text-anchor="middle" fill="${i === 5 ? '#000' : '#f4f1ea'}" font-family="JetBrains Mono" font-size="11" letter-spacing="1">${n}</text></g>`;
      });
      return `<div class="zeta-art"><svg viewBox="0 0 720 320" preserveAspectRatio="xMidYMid meet">${s}</svg></div>`;
    }
  };

  /* ---------- R&D ---------- */
  const track = $('#rnd-track');
  track.innerHTML = D.research.map(r => `
    <article class="rnd-card">
      <div class="rnd-art">${art[r.art]()}<span class="code">${esc(r.code)}</span></div>
      <div class="rnd-body">
        <span class="mono kicker">${esc(r.kicker)}</span>
        <h3>${esc(r.title)}</h3>
        <p>${esc(r.desc)}</p>
        <div class="rnd-foot">
          <div class="tags">${r.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          <div class="status">${esc(r.status)}</div>
        </div>
      </div>
    </article>`).join('') + `
    <article class="rnd-card ip">
      <span class="mono" style="color:var(--honey)">Intellectual property</span>
      <h3>Patents &amp; <em>papers.</em></h3>
      <ul class="ip-list">${D.patents.map(p => `<li><b>${esc(p.title)}</b><span>${esc(p.status)}</span></li>`).join('')}</ul>
      <p class="dim" style="margin-top:24px">Technical details stay private until filings clear review.</p>
    </article>`;

  /* ---------- Solutions ---------- */
  const statusPill = s => s === 'live' ? '<span class="pill live">Live</span>' : s === 'live-soon' ? '<span class="pill">Demo soon</span>' : '<span class="pill">In development</span>';
  const linkBtn = p => p.url
    ? `<a class="link-arrow" href="${esc(p.url)}" target="_blank" rel="noopener" data-cursor="VISIT">Visit live <span class="circ"><i class="fa-solid fa-arrow-right"></i></span></a>`
    : `<span class="link-arrow disabled">Coming soon <span class="circ"><i class="fa-solid fa-lock"></i></span></span>`;

  const featured = D.solutions.filter(p => p.featured);
  $('#featured').innerHTML = featured.map(p => {
    let media;
    if (p.art) media = art[p.art]();
    else if (p.model) media = `<img class="fallback" src="${esc(p.image)}" alt="${esc(p.title)} character" loading="lazy"><canvas id="voidfall-canvas" data-model="${esc(p.model)}"></canvas><span class="hint3d mono">Drag to rotate</span>`;
    else media = `<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">`;
    return `<article class="fcard ${esc(p.id)}" data-reveal ${p.model ? '' : 'data-tilt'}>
      <div class="fcard-media">${media}</div>
      <div class="fcard-body">
        <div class="pcard-top"><span class="mono" style="color:var(--honey)">${esc(p.kicker)}</span>${statusPill(p.status)}</div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.desc)}</p>
        <div class="fcard-row"><div class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>${linkBtn(p)}</div>
      </div>
    </article>`;
  }).join('');

  const rest = D.solutions.filter(p => !p.featured);
  $('#sol-grid').innerHTML = rest.map(p => {
    const tag = p.url ? 'a' : 'div';
    const href = p.url ? `href="${esc(p.url)}" target="_blank" rel="noopener" data-cursor="VISIT"` : '';
    return `<${tag} class="pcard" data-status="${p.status === 'live' ? 'live' : 'dev'}" ${href} data-reveal data-tilt>
      <div class="pcard-media"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy"></div>
      <div class="pcard-body">
        <div class="pcard-top"><span class="mono">${esc(p.kicker)}</span>${statusPill(p.status)}</div>
        <h4>${esc(p.title)} ${p.url ? '<i class="fa-solid fa-arrow-up-right-from-square go"></i>' : ''}</h4>
        <p>${esc(p.desc)}</p>
      </div></${tag}>`;
  }).join('') + `<div class="pcard soon" data-status="dev" data-reveal><div><i class="bee"></i><h4>More coming soon</h4><p>The hive is building.</p></div></div>`;

  document.getElementById('filters').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#filters button').forEach(x => x.classList.toggle('is-on', x === b));
    const f = b.dataset.f;
    document.querySelectorAll('#sol-grid .pcard').forEach(c => {
      c.classList.toggle('is-hidden', f !== 'all' && c.dataset.status !== f);
    });
    if (hasGsap) {
      gsap.fromTo('#sol-grid .pcard:not(.is-hidden)', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .6, stagger: .04, ease: 'expo.out' });
      window.ScrollTrigger && ScrollTrigger.refresh();
    }
  });

  /* ---------- Merch teaser ---------- */
  $('#merch-teaser').innerHTML = D.merch.map(m => `
    <a class="mcard" href="shop.html#${esc(m.id)}" data-reveal data-tilt data-cursor="SHOP">
      <span class="pill mcard-badge">${esc(m.status)}</span>
      <div class="mcard-media">${m.image ? `<img src="${esc(m.image)}" alt="${esc(m.name)}" loading="lazy">` : `<div class="mcard-ph"><i class="bee"></i><span class="mono">Photo coming soon</span></div>`}</div>
      <div class="mcard-body"><div><span class="mono dim" style="font-size:11px">${esc(m.type)}</span><h4>${esc(m.name)}</h4></div><span class="price">${m.price ? '₹' + m.price : 'Price TBA'}</span></div>
    </a>`).join('');

  /* ---------- manifesto words ---------- */
  const mt = $('#manifesto-text');
  mt.innerHTML = mt.textContent.split('|').map((chunk, i) =>
    chunk.split(/\s+/).filter(Boolean).map(w => `<span class="w${i % 2 ? ' hl' : ''}">${esc(w)}</span>`).join(' ')
  ).join(' ');

  reveals(document);

  /* ---------- loader + hero intro ---------- */
  const title = $('#hero-title');
  title.querySelectorAll('.word').forEach(w => {
    w.innerHTML = [...w.textContent].map(c => `<span class="char">${c}</span>`).join('');
  });

  function intro() {
    document.body.classList.remove('is-loading');
    if (!hasGsap || reduce) return;
    const tl = gsap.timeline();
    tl.from('.hero-title .char', { yPercent: 115, rotate: 8, duration: 1.4, ease: 'expo.out', stagger: .05 })
      .from('[data-hero], .hero-eyebrow, .hero-bottom', { opacity: 0, y: 30, duration: 1, ease: 'expo.out', stagger: .08 }, '-=1')
      .from('.nav .wrap', { y: -30, opacity: 0, duration: 1, ease: 'expo.out' }, '-=1');
  }

  const loader = $('#loader');
  if (!hasGsap || reduce) {
    loader.remove(); $('#curtain').remove(); intro();
  } else {
    const n = { v: 0 };
    const fill = $('#loader-fill'), num = $('#loader-num');
    let loaded = false;
    window.addEventListener('load', () => { loaded = true; });
    const tl = gsap.timeline();
    tl.to(n, {
      v: 100, duration: 2, ease: 'power2.inOut',
      onUpdate() {
        const v = Math.round(n.v);
        num.textContent = String(v).padStart(3, '0');
        fill.style.clipPath = `inset(${100 - v}% 0 0 0)`;
      }
    })
      .to('.loader-bee', { scale: 1.15, duration: .35, ease: 'back.in(3)' })
      .to('#curtain', { scaleY: 1, duration: .6, ease: 'expo.inOut' }, '-=.1')
      .add(() => { loader.remove(); gsap.set('#curtain', { transformOrigin: 'top' }); })
      .to('#curtain', { scaleY: 0, duration: .8, ease: 'expo.inOut' })
      .add(() => { $('#curtain').remove(); }, '>');
    tl.add(intro, '-=.6');
    // don't hold people hostage if assets are slow
    setTimeout(() => { if (!loaded) tl.progress(1); }, 8000);
  }

  if (!hasGsap) return;

  /* ---------- hero parallax out ---------- */
  if (!reduce) {
    gsap.to('.hero-content', { yPercent: 25, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- manifesto highlight ---------- */
  const words = mt.querySelectorAll('.w');
  ScrollTrigger.create({
    trigger: mt, start: 'top 80%', end: 'bottom 45%', scrub: true,
    onUpdate: s => { const k = Math.round(s.progress * words.length); words.forEach((w, i) => w.classList.toggle('on', i < k)); }
  });

  /* ---------- counters ---------- */
  document.querySelectorAll('[data-count]').forEach(el => {
    const o = { v: 0 }, to = +el.dataset.count, suf = el.dataset.suffix || '';
    gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: () => { el.textContent = Math.round(o.v) + suf; } });
  });

  /* ---------- R&D horizontal scroll ---------- */
  ScrollTrigger.matchMedia({
    '(min-width: 861px)': () => {
      const dist = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '#rnd-pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
          onUpdate: s => gsap.set('#rnd-bar', { scaleX: s.progress })
        }
      });
      track.querySelectorAll('.rnd-card').forEach(card => {
        gsap.from(card.querySelector('.rnd-body') || card, {
          opacity: 0, x: 80, duration: 1, ease: 'expo.out',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 85%' }
        });
      });
    },
    '(max-width: 860px)': () => {
      track.querySelectorAll('.rnd-card').forEach(card => gsap.from(card, { opacity: 0, y: 50, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 88%' } }));
    }
  });

  /* ---------- society ---------- */
  gsap.from('.society-big .split-line > span', { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.society-big', start: 'top 80%' } });
  if (!reduce) gsap.to('.society-media video', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '#society', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- footer word fill ---------- */
  ScrollTrigger.create({
    trigger: '#footer-word', start: 'top bottom', end: 'bottom bottom', scrub: true,
    onUpdate: s => document.getElementById('footer-word').style.setProperty('--fill', (s.progress * 100).toFixed(1) + '%')
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
