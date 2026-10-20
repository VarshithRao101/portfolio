/* TRNT BEE — minimal liquid ink trail (desktop only).
   One smooth ribbon that tapers away from the pointer. Each node chases the one ahead
   on a soft spring, so the trail swims like ink in water. Scrolling drags the tail,
   links swell the head, and it fades out when the mouse rests.
   Drawn in white with mix-blend-mode: difference, so it reads as ink on any background. */
(function () {
  'use strict';
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduce) return;

  let canvas = document.getElementById('water-ink-canvas');
  if (!canvas) { canvas = document.createElement('canvas'); canvas.id = 'water-ink-canvas'; document.body.appendChild(canvas); }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const S = {
    nodes: 18,          // trail length
    follow: 0.22,       // how fast the head catches the pointer
    spring: 0.42,       // how tightly each node chases the one ahead
    drag: 0.58,         // viscosity: lower = more slosh
    head: 8,            // head radius (px)
    headHover: 15,      // head radius over links and buttons
    tail: 0.6,          // tip radius
    idleDelay: 100,     // ms of stillness before fading
    idleFade: 1100,     // ms to fade out
    scrollDrag: 0.55    // how much a scroll pulls the tail
  };

  let dpr = 1, W = 0, H = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const pts = Array.from({ length: S.nodes }, () => ({ x: -100, y: -100, vx: 0, vy: 0 }));
  const mouse = { x: -100, y: -100 };
  let seen = false, lastMove = 0, alpha = 0, headR = S.head, hover = false, lastScroll = window.scrollY;

  window.addEventListener('pointermove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY; lastMove = performance.now();
    if (!seen) { seen = true; pts.forEach(p => { p.x = mouse.x; p.y = mouse.y; }); }
  }, { passive: true });
  document.addEventListener('pointerover', e => { hover = !!e.target.closest('a, button, [role="button"], input, select, textarea, label'); });
  document.documentElement.addEventListener('pointerleave', () => { lastMove = 0; });

  // scrolling drags the trail like a current pulling ink downstream
  window.addEventListener('scroll', () => {
    const dy = window.scrollY - lastScroll; lastScroll = window.scrollY;
    if (!seen) return;
    for (let i = 1; i < pts.length; i++) pts[i].y -= dy * S.scrollDrag * (i / pts.length);
    lastMove = performance.now();
  }, { passive: true });

  function step() {
    const now = performance.now();
    // head eases toward the pointer; the rest follow on springs
    const h = pts[0];
    h.x += (mouse.x - h.x) * S.follow;
    h.y += (mouse.y - h.y) * S.follow;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i], q = pts[i - 1];
      p.vx = (p.vx + (q.x - p.x) * S.spring) * S.drag;
      p.vy = (p.vy + (q.y - p.y) * S.spring) * S.drag;
      p.x += p.vx; p.y += p.vy;
    }
    // fade out after resting, come back instantly on movement
    const idle = now - lastMove;
    const target = !seen || !lastMove ? 0 : idle < S.idleDelay ? 1 : Math.max(0, 1 - (idle - S.idleDelay) / S.idleFade);
    alpha += (target - alpha) * (target > alpha ? 0.35 : 0.12);
    headR += ((hover ? S.headHover : S.head) - headR) * 0.18;
  }

  // the ribbon outline: offset each node along its normal by a radius that tapers to the tip
  const L = [], R = [];
  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (alpha < 0.01) return;
    const n = pts.length;
    const speed = Math.hypot(pts[0].x - pts[2].x, pts[0].y - pts[2].y);
    const thin = 1 / (1 + speed * 0.012); // a fast stroke stretches thinner, like pulled ink
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b.x - a.x, dy = b.y - a.y; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      const t = i / (n - 1);
      const r = (S.tail + (headR - S.tail) * Math.pow(1 - t, 1.35)) * (i ? thin : 1);
      L[i] = { x: pts[i].x - dy * r, y: pts[i].y + dx * r };
      R[i] = { x: pts[i].x + dy * r, y: pts[i].y - dx * r };
    }
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    // smooth curve down the left edge, round the tip, back up the right edge (midpoint quadratics)
    ctx.moveTo(L[0].x, L[0].y);
    for (let i = 1; i < n - 1; i++) ctx.quadraticCurveTo(L[i].x, L[i].y, (L[i].x + L[i + 1].x) / 2, (L[i].y + L[i + 1].y) / 2);
    ctx.lineTo(L[n - 1].x, L[n - 1].y);
    ctx.quadraticCurveTo(pts[n - 1].x, pts[n - 1].y, R[n - 1].x, R[n - 1].y);
    for (let i = n - 2; i > 0; i--) ctx.quadraticCurveTo(R[i].x, R[i].y, (R[i].x + R[i - 1].x) / 2, (R[i].y + R[i - 1].y) / 2);
    ctx.lineTo(R[0].x, R[0].y);
    ctx.closePath();
    ctx.fill();
    // round head
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  (function loop() {
    step(); draw();
    requestAnimationFrame(loop);
  })();
})();
