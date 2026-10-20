/* Live demos for the research section.
   flood   — a small shallow-water style simulation of a dam breach over generated terrain
   scan    — a code scan that finds an injection bug and shows the fix
   cascade — simulated queries falling through cheaper-to-dearer answer tiers */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HONEY = [255, 194, 26];

  // run a draw loop only while the element is on screen
  function whenVisible(el, start, stop) {
    if (!('IntersectionObserver' in window)) { start(); return; }
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: '100px' }).observe(el);
  }
  function fitCanvas(c) {
    const r = c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } // resizing clears and reallocates, so only when needed
    return dpr;
  }
  // tiny deterministic noise
  function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y) { let s = 0, a = .5, f = 1; for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, y * f); a *= .5; f *= 2; } return s; }

  /* =================== FLOOD =================== */
  function flood(host) {
    host.innerHTML = `<canvas></canvas>
      <div class="viz-hud">
        <div><span>Time since breach</span><b data-t>0 min</b></div>
        <div><span>Area under water</span><b data-a>0%</b></div>
      </div>
      <ol class="viz-villages" data-v></ol>`;
    const cv = host.querySelector('canvas'), ctx = cv.getContext('2d');
    const W = 150, H = 96, N = W * H;
    const ground = new Float32Array(N), water = new Float32Array(N), next = new Float32Array(N);
    const arrival = new Float32Array(N);
    let dam = { x: 24, y: 0 };

    // terrain: a river valley winding from the reservoir (top left) to the plain (bottom right)
    const riverY = x => H * .32 + Math.sin(x / W * Math.PI * 1.6) * H * .22 + x / W * H * .25;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dy = Math.abs(y - riverY(x));
      const slope = (1 - x / W) * 4;                    // falls steadily towards the plain
      const walls = dy / H * 2.5 + (dy / H) ** 2 * 12;     // valley sides
      const channel = -0.7 * Math.exp(-((dy / 3) ** 2));   // the river bed itself
      ground[y * W + x] = slope + walls + channel + fbm(x * .06, y * .06) * .35;
    }
    dam.y = Math.round(riverY(dam.x));
    const villages = [
      { name: 'Village A', x: 52 }, { name: 'Village B', x: 82 }, { name: 'Village C', x: 112 }, { name: 'Town D', x: 138 }
    ].map((v, i) => ({ ...v, y: Math.round(riverY(v.x) + (i % 2 ? 4 : -4)), t: null }));

    const shade = new ImageData(W, H);
    (function bakeTerrain() {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x, g = ground[i];
        const gx = ground[i + (x < W - 1 ? 1 : 0)] - ground[i - (x > 0 ? 1 : 0)];
        const gy = ground[i + (y < H - 1 ? W : 0)] - ground[i - (y > 0 ? W : 0)];
        let l = 30 + (-gx - gy) * 40 + g * 6;
        const contour = Math.abs((g * 3) % 1 - .5) < .06 ? 16 : 0;
        l = Math.max(10, Math.min(70, l + contour));
        const p = i * 4; shade.data[p] = l; shade.data[p + 1] = l; shade.data[p + 2] = l + 3; shade.data[p + 3] = 255;
      }
    })();
    const img = new ImageData(W, H);
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const octx = off.getContext('2d');

    let t = 0, running = false, raf = 0;
    function reset() {
      water.fill(0); next.fill(0); fl.fill(0); fr.fill(0); fu.fill(0); fd.fill(0); arrival.fill(-1); t = 0;
      villages.forEach(v => { v.t = null; });
      // reservoir: everything upstream of the breach in the valley, filled to above the breach height
      const level = ground[dam.y * W + dam.x] + 3.2;
      for (let y = 1; y < H - 1; y++) for (let x = 1; x <= dam.x; x++) {
        const i = y * W + x;
        if (Math.abs(y - riverY(x)) < 26) water[i] = Math.max(0, level - ground[i]);
      }
      renderVillages();
    }
    // "virtual pipes" water: each cell keeps an outflow to each neighbour that builds up with
    // the height difference and carries over between steps, so the flood moves as a wave
    const fl = new Float32Array(N), fr = new Float32Array(N), fu = new Float32Array(N), fd = new Float32Array(N);
    function step() {
      const A = .16, keep = .992;
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const i = y * W + x, h = ground[i] + water[i];
        let l = Math.max(0, fl[i] * keep + A * (h - ground[i - 1] - water[i - 1]));
        let r = Math.max(0, fr[i] * keep + A * (h - ground[i + 1] - water[i + 1]));
        let u = Math.max(0, fu[i] * keep + A * (h - ground[i - W] - water[i - W]));
        let d = Math.max(0, fd[i] * keep + A * (h - ground[i + W] - water[i + W]));
        const sum = l + r + u + d;
        if (sum > water[i]) { const k = water[i] / sum; l *= k; r *= k; u *= k; d *= k; }
        fl[i] = l; fr[i] = r; fu[i] = u; fd[i] = d;
      }
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        next[i] = Math.max(0, water[i] - fl[i] - fr[i] - fu[i] - fd[i] + fr[i - 1] + fl[i + 1] + fd[i - W] + fu[i + W]);
      }
      // water drains off the far edge
      for (let y = 0; y < H; y++) next[y * W + W - 2] *= .85;
      water.set(next);
    }
    function draw() {
      fitCanvas(cv);
      let wet = 0;
      for (let i = 0; i < N; i++) {
        const w = water[i], p = i * 4;
        if (w > .02 && arrival[i] < 0) arrival[i] = t;
        if (w > .02) wet++;
        const a = Math.min(1, w * 1.6);
        img.data[p] = shade.data[p] * (1 - a) + HONEY[0] * a;
        img.data[p + 1] = shade.data[p + 1] * (1 - a) + (HONEY[1] - Math.min(80, w * 30)) * a;
        img.data[p + 2] = shade.data[p + 2] * (1 - a) + HONEY[2] * a;
        img.data[p + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, cv.width, cv.height);
      const sx = cv.width / W, sy = cv.height / H, dpr = cv.width / cv.getBoundingClientRect().width;
      // breach marker
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath(); ctx.arc(dam.x * sx, dam.y * sy, 7 * dpr, 0, Math.PI * 2); ctx.stroke();
      ctx.font = `${11 * dpr}px Geist, sans-serif`; ctx.fillStyle = '#fff';
      ctx.fillText('Breach', dam.x * sx + 12 * dpr, dam.y * sy + 4 * dpr);
      // villages
      villages.forEach(v => {
        const flooded = water[v.y * W + v.x] > .05;
        if (flooded && v.t == null) { v.t = Math.round(t * .6); renderVillages(); }
        ctx.fillStyle = flooded ? '#ff4d2e' : '#fff';
        ctx.fillRect(v.x * sx - 4 * dpr, v.y * sy - 4 * dpr, 8 * dpr, 8 * dpr);
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.fillText(v.name, v.x * sx + 8 * dpr, v.y * sy + 4 * dpr);
      });
      host.querySelector('[data-t]').textContent = Math.round(t * .6) + ' min';
      host.querySelector('[data-a]').textContent = Math.round(wet / N * 100) + '%';
    }
    function renderVillages() {
      host.querySelector('[data-v]').innerHTML = villages.map(v =>
        `<li class="${v.t != null ? 'hit' : ''}"><span>${v.name}</span><b>${v.t != null ? v.t + ' min' : 'safe so far'}</b></li>`).join('');
    }
    function loop() {
      if (!running) return;
      step();
      t += 1; draw();
      if (t > 360) reset();
      raf = requestAnimationFrame(loop);
    }
    cv.addEventListener('click', e => {
      const r = cv.getBoundingClientRect();
      const x = Math.round((e.clientX - r.left) / r.width * W), y = Math.round((e.clientY - r.top) / r.height * H);
      // the breach always sits on the river; tapping moves it up or downstream
      if (x > 6 && x < W * .55) { dam = { x, y: Math.round(riverY(x)) }; reset(); }
    });
    reset(); draw();
    if (!reduce) whenVisible(host, () => { if (!running) { running = true; loop(); } }, () => { running = false; cancelAnimationFrame(raf); });
    else { for (let k = 0; k < 140; k++) step(); t = 140; draw(); }
  }

  /* =================== SCAN =================== */
  function scan(host) {
    const code = [
      ['k', "app.get('/orders', async (req, res) => {"],
      ['', "  const user = req.query.user;"],
      ['bad', "  const sql = \"SELECT * FROM orders WHERE user = '\" + user + \"'\";"],
      ['', "  const rows = await db.query(sql);"],
      ['', "  res.json(rows);"],
      ['k', "});"]
    ];
    const fix = "  const rows = await db.query('SELECT * FROM orders WHERE user = $1', [user]);";
    host.innerHTML = `
      <div class="scan">
        <div class="scan-bar"><span class="scan-file">routes/orders.js</span><span class="scan-state" data-state>Scanning</span></div>
        <pre class="scan-code" data-code>${code.map((l, i) => `<div class="ln ${l[0]}" data-l="${i}"><i>${i + 1}</i><code>${esc(l[1])}</code></div>`).join('')}</pre>
        <div class="scan-note" data-note>
          <b>SQL injection</b>
          <p>The <code>user</code> value from the URL goes straight into the query. Sending <code>' OR '1'='1</code> returns every order in the table.</p>
          <span class="scan-path">URL param → string concat → db.query</span>
        </div>
      </div>`;
    function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
    const lines = host.querySelectorAll('.ln'), state = host.querySelector('[data-state]'), note = host.querySelector('[data-note]');
    let timers = [], running = false;
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    function cycle() {
      timers.forEach(clearTimeout); timers = [];
      lines.forEach(l => l.classList.remove('on', 'flag', 'gone'));
      host.querySelectorAll('.ln.fix').forEach(l => l.remove());
      note.classList.remove('show'); state.textContent = 'Scanning'; state.className = 'scan-state';
      lines.forEach((l, i) => { at(300 + i * 380, () => { lines.forEach(x => x.classList.remove('on')); l.classList.add('on'); }); });
      at(300 + 6 * 380, () => { lines.forEach(x => x.classList.remove('on')); lines[2].classList.add('flag'); state.textContent = '1 issue found'; state.classList.add('bad'); });
      at(300 + 6 * 380 + 500, () => note.classList.add('show'));
      at(6200, () => {
        state.textContent = 'Suggested fix'; state.className = 'scan-state good';
        lines[2].classList.add('gone'); lines[3].classList.add('gone');
        const f = document.createElement('div'); f.className = 'ln fix';
        f.innerHTML = `<i>+</i><code>${esc(fix)}</code>`;
        lines[3].after(f);
      });
      at(10500, () => { if (running) cycle(); });
    }
    if (reduce) { lines[2].classList.add('flag'); note.classList.add('show'); state.textContent = '1 issue found'; return; }
    whenVisible(host, () => { if (!running) { running = true; cycle(); } }, () => { running = false; });
  }

  /* =================== CASCADE =================== */
  function cascade(host) {
    const tiers = [
      { name: 'Rules', cost: 1, p: .34 },
      { name: 'Solver', cost: 2, p: .3 },
      { name: 'Search + small model', cost: 6, p: .45 },
      { name: 'Local model', cost: 18, p: .6 },
      { name: 'Large API model', cost: 60, p: 1 }
    ];
    host.innerHTML = `<canvas></canvas>
      <div class="viz-hud">
        <div><span>Avg. cost</span><b data-c>—</b></div>
        <div><span>Big model only</span><b>60.0</b></div>
      </div>`;
    const cv = host.querySelector('canvas'), ctx = cv.getContext('2d');
    const counts = tiers.map(() => 0);
    let parts = [], spent = 0, answered = 0, running = false, raf = 0, last = 0, spawn = 0;
    function layout() {
      const w = cv.width, h = cv.height, dprL = w / Math.max(1, cv.getBoundingClientRect().width);
      const top = Math.max(h * .2, 78 * dprL), rowH = (h - top - h * .03) / tiers.length; // leave room for the readouts
      return { w, h, top, rowH, left: w * .06, right: w * .94 };
    }
    function add() {
      parts.push({ tier: 0, x: 0, y: -0.2, vy: 0, phase: 'fall', life: 0, ok: false, seed: Math.random() });
    }
    function frame(ts) {
      if (!running) return;
      const dt = Math.min(.05, (ts - last) / 1000 || .016); last = ts;
      const dpr = fitCanvas(cv);
      const L = layout();
      ctx.clearRect(0, 0, L.w, L.h);
      // rows
      tiers.forEach((tr, i) => {
        const y = L.top + i * L.rowH;
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.025)' : 'rgba(255,255,255,.045)';
        ctx.fillRect(L.left, y + 3 * dpr, L.right - L.left, L.rowH - 6 * dpr);
        ctx.fillStyle = 'rgba(255,255,255,.88)';
        ctx.font = `500 ${12 * dpr}px Geist, sans-serif`;
        ctx.fillText(tr.name, L.left + 12 * dpr, y + L.rowH / 2 - 2 * dpr);
        ctx.fillStyle = 'rgba(255,255,255,.45)';
        ctx.font = `${10.5 * dpr}px "Geist Mono", monospace`;
        ctx.fillText(`cost ×${tr.cost}`, L.left + 12 * dpr, y + L.rowH / 2 + 13 * dpr);
        // answered bar
        const total = Math.max(1, answered), share = counts[i] / total;
        const bx = L.left + (L.right - L.left) * .62, bw = (L.right - L.left) * .3;
        ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(bx, y + L.rowH / 2 - 3 * dpr, bw, 6 * dpr);
        ctx.fillStyle = '#ffc21a'; ctx.fillRect(bx, y + L.rowH / 2 - 3 * dpr, bw * share, 6 * dpr);
        ctx.fillStyle = 'rgba(255,255,255,.7)';
        ctx.fillText(`${Math.round(share * 100)}%`, bx + bw + 8 * dpr, y + L.rowH / 2 + 4 * dpr);
      });
      // spawn
      spawn += dt; if (spawn > .12) { spawn = 0; add(); }
      const laneX = L.left + (L.right - L.left) * .44;
      parts.forEach(p => {
        const rowMid = L.top + p.tier * L.rowH + L.rowH / 2;
        if (p.phase === 'fall') {
          p.vy += 1400 * dpr * dt; p.y += p.vy * dt;
          const py = p.y * L.h;
          if (p.y < 0) p.y = Math.max(p.y, -0.2);
          if (L.top + (p.y * 0) > 0 && py >= rowMid) {
            // decide at this tier
            p.y = rowMid / L.h; p.vy = 0;
            if (Math.random() < tiers[p.tier].p) { p.phase = 'ok'; counts[p.tier]++; answered++; spent += tiers.slice(0, p.tier + 1).reduce((s, t) => s + t.cost, 0); }
            else { p.phase = 'pause'; p.life = .12; }
          }
        } else if (p.phase === 'pause') {
          p.life -= dt; if (p.life <= 0) { p.tier++; p.phase = 'fall'; p.vy = 120 * dpr; }
        } else if (p.phase === 'ok') {
          p.x += 520 * dpr * dt;
        }
        const x = laneX + (p.seed - .5) * 40 * dpr + p.x, y = p.y * L.h;
        ctx.fillStyle = p.phase === 'ok' ? '#ffc21a' : '#fff';
        ctx.beginPath(); ctx.arc(x, y, (p.phase === 'ok' ? 3.2 : 2.6) * dpr, 0, Math.PI * 2); ctx.fill();
      });
      parts = parts.filter(p => p.x < L.w * .2);
      if (answered) host.querySelector('[data-c]').textContent = (spent / answered).toFixed(1);
      if (answered > 900) { counts.fill(0); answered = 0; spent = 0; }
      raf = requestAnimationFrame(frame);
    }
    if (reduce) { running = true; requestAnimationFrame(t => { frame(t); running = false; }); return; }
    whenVisible(host, () => { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }, () => { running = false; cancelAnimationFrame(raf); });
  }

  window.RND = { flood, scan, cascade };
})();
