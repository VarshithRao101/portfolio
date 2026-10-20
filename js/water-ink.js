/* TRNT BEE — liquid ink cursor (desktop only).
   A small GPU fluid simulation (stable-fluids: advection, vorticity, pressure projection).
   Every pointer sample — including the browser's coalesced in-between samples — injects ink
   and momentum exactly where the pointer is, so the ink starts at the cursor tip and then
   curls, thins and dissolves like ink dropped in water. Scrolling stirs the water.
   Rendered as monochrome white with mix-blend-mode: difference, so it inverts whatever is
   underneath and reads on every section. Sleeps when nothing is moving. */
(function () {
  'use strict';
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduce) return;

  let canvas = document.getElementById('water-ink-canvas');
  if (!canvas) { canvas = document.createElement('canvas'); canvas.id = 'water-ink-canvas'; document.body.appendChild(canvas); }

  const CFG = {
    SIM_RES: 128,              // velocity grid (short side)
    DYE_RES: 768,              // ink grid (short side)
    DENSITY_DISSIPATION: 2.4, // how fast ink fades
    VELOCITY_DISSIPATION: 1.6, // how fast the water calms
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 18,
    CURL: 7,                  // swirl
    SPLAT_RADIUS: 0.00032,      // ink blob size (fraction of screen, squared falloff)
    SPLAT_FORCE: 3600,
    INK: 0.32,                 // ink per sample at normal speed
    SLEEP_AFTER: 4000          // ms without input before the sim stops
  };

  /* ---------- WebGL setup ---------- */
  const params = { alpha: true, depth: false, stencil: false, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false };
  let gl = canvas.getContext('webgl2', params);
  const isGL2 = !!gl;
  if (!gl) gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
  if (!gl) { canvas.remove(); return; }

  let halfFloat, linear;
  if (isGL2) { gl.getExtension('EXT_color_buffer_float'); linear = gl.getExtension('OES_texture_float_linear'); }
  else { halfFloat = gl.getExtension('OES_texture_half_float'); linear = gl.getExtension('OES_texture_half_float_linear'); if (!halfFloat) { canvas.remove(); return; } }
  const HF = isGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
  const FILTER = linear ? gl.LINEAR : gl.NEAREST;

  function canRender(internal, format, type) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.deleteTexture(t); gl.deleteFramebuffer(f); return ok;
  }
  function fmt(internal, format) {
    if (!isGL2) return { internal: gl.RGBA, format: gl.RGBA };
    if (canRender(internal, format, HF)) return { internal, format };
    if (internal === gl.R16F) return fmt(gl.RG16F, gl.RG);
    if (internal === gl.RG16F) return fmt(gl.RGBA16F, gl.RGBA);
    return null;
  }
  const RG = isGL2 ? fmt(gl.RG16F, gl.RG) : fmt();
  const R = isGL2 ? fmt(gl.R16F, gl.RED) : fmt();
  if (!RG || !R || (!isGL2 && !canRender(gl.RGBA, gl.RGBA, HF))) { canvas.remove(); return; }

  /* ---------- shaders ---------- */
  const VS = `precision highp float;
    attribute vec2 aPosition; varying vec2 vUv, vL, vR, vT, vB; uniform vec2 texelSize;
    void main(){ vUv = aPosition * .5 + .5; vL = vUv - vec2(texelSize.x, 0.); vR = vUv + vec2(texelSize.x, 0.);
      vT = vUv + vec2(0., texelSize.y); vB = vUv - vec2(0., texelSize.y); gl_Position = vec4(aPosition, 0., 1.); }`;
  const FS = {
    clear: `precision mediump float; varying vec2 vUv; uniform sampler2D uTexture; uniform float value;
      void main(){ gl_FragColor = value * texture2D(uTexture, vUv); }`,
    splat: `precision highp float; varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;
      void main(){ vec2 p = vUv - point; p.x *= aspectRatio; vec3 s = exp(-dot(p, p) / radius) * color;
        gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + s, 1.); }`,
    advection: `precision highp float; varying vec2 vUv; uniform sampler2D uVelocity, uSource; uniform vec2 texelSize, dyeTexelSize; uniform float dt, dissipation;
      vec4 bilerp(sampler2D s, vec2 uv, vec2 ts){ vec2 st = uv / ts - .5; vec2 i = floor(st), f = fract(st);
        vec4 a = texture2D(s, (i + vec2(.5, .5)) * ts), b = texture2D(s, (i + vec2(1.5, .5)) * ts), c = texture2D(s, (i + vec2(.5, 1.5)) * ts), d = texture2D(s, (i + vec2(1.5, 1.5)) * ts);
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
      void main(){
      #ifdef MANUAL_FILTERING
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize; vec4 r = bilerp(uSource, coord, dyeTexelSize);
      #else
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize; vec4 r = texture2D(uSource, coord);
      #endif
        gl_FragColor = r / (1. + dissipation * dt); }`,
    divergence: `precision mediump float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity;
      void main(){ float L = texture2D(uVelocity, vL).x, Rr = texture2D(uVelocity, vR).x, T = texture2D(uVelocity, vT).y, B = texture2D(uVelocity, vB).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.) L = -C.x; if (vR.x > 1.) Rr = -C.x; if (vT.y > 1.) T = -C.y; if (vB.y < 0.) B = -C.y;
        gl_FragColor = vec4(.5 * (Rr - L + T - B), 0., 0., 1.); }`,
    curl: `precision mediump float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity;
      void main(){ float L = texture2D(uVelocity, vL).y, Rr = texture2D(uVelocity, vR).y, T = texture2D(uVelocity, vT).x, B = texture2D(uVelocity, vB).x;
        gl_FragColor = vec4(.5 * (Rr - L - T + B), 0., 0., 1.); }`,
    vorticity: `precision highp float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
      void main(){ float L = texture2D(uCurl, vL).x, Rr = texture2D(uCurl, vR).x, T = texture2D(uCurl, vT).x, B = texture2D(uCurl, vB).x, C = texture2D(uCurl, vUv).x;
        vec2 f = .5 * vec2(abs(T) - abs(B), abs(Rr) - abs(L)); f /= length(f) + .0001; f *= curl * C; f.y *= -1.;
        vec2 v = texture2D(uVelocity, vUv).xy + f * dt; gl_FragColor = vec4(clamp(v, -1000., 1000.), 0., 1.); }`,
    pressure: `precision mediump float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uPressure, uDivergence;
      void main(){ float L = texture2D(uPressure, vL).x, Rr = texture2D(uPressure, vR).x, T = texture2D(uPressure, vT).x, B = texture2D(uPressure, vB).x;
        gl_FragColor = vec4((L + Rr + B + T - texture2D(uDivergence, vUv).x) * .25, 0., 0., 1.); }`,
    gradient: `precision mediump float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uPressure, uVelocity;
      void main(){ float L = texture2D(uPressure, vL).x, Rr = texture2D(uPressure, vR).x, T = texture2D(uPressure, vT).x, B = texture2D(uPressure, vB).x;
        vec2 v = texture2D(uVelocity, vUv).xy - vec2(Rr - L, T - B); gl_FragColor = vec4(v, 0., 1.); }`,
    // ink: soft, slightly gooey edge (smoothstep) with a faint sheen along its gradient
    display: `precision highp float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uTexture;
      void main(){ float c = texture2D(uTexture, vUv).r;
        float gx = texture2D(uTexture, vR).r - texture2D(uTexture, vL).r, gy = texture2D(uTexture, vT).r - texture2D(uTexture, vB).r;
        float body = smoothstep(.015, .55, c);
        float sheen = clamp(length(vec2(gx, gy)) * 2.2, 0., .35) * body;
        float a = clamp(body * .92 + sheen, 0., 1.);
        gl_FragColor = vec4(a, a, a, a); }`
  };

  function compile(type, src, defs) {
    const s = gl.createShader(type);
    gl.shaderSource(s, (defs || []).map(d => '#define ' + d + '\n').join('') + src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VS);
  function program(fsSrc, defs) {
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc, defs));
    gl.bindAttribLocation(p, 0, 'aPosition'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    return { p, u, use() { gl.useProgram(p); } };
  }
  let P;
  try {
    P = {
      clear: program(FS.clear), splat: program(FS.splat),
      advection: program(FS.advection, linear ? [] : ['MANUAL_FILTERING']),
      divergence: program(FS.divergence), curl: program(FS.curl), vorticity: program(FS.vorticity),
      pressure: program(FS.pressure), gradient: program(FS.gradient), display: program(FS.display)
    };
  } catch (e) { console.warn('ink', e); canvas.remove(); return; }

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  function blit(target) {
    if (target) { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
    else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
  function fbo(w, h, f) {
    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, FILTER); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, FILTER);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, f.internal, w, h, 0, f.format, HF, null);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo: fb, w, h, tx: 1 / w, ty: 1 / h, attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; } };
  }
  function dbl(w, h, f) {
    let a = fbo(w, h, f), b = fbo(w, h, f);
    return { w, h, tx: a.tx, ty: a.ty, get read() { return a; }, get write() { return b; }, swap() { const t = a; a = b; b = t; } };
  }
  function res(r) {
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, asp = Math.max(W, H) / Math.min(W, H);
    const lo = Math.round(r), hi = Math.round(r * asp);
    return W > H ? { w: hi, h: lo } : { w: lo, h: hi };
  }

  let velocity, dye, divergence, curl, pressure;
  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(window.innerWidth * dpr), h = Math.round(window.innerHeight * dpr);
    if (canvas.width === w && canvas.height === h && velocity) return;
    canvas.width = w; canvas.height = h;
    const s = res(CFG.SIM_RES), d = res(CFG.DYE_RES);
    velocity = dbl(s.w, s.h, RG); dye = dbl(d.w, d.h, R);
    divergence = fbo(s.w, s.h, R); curl = fbo(s.w, s.h, R); pressure = dbl(s.w, s.h, R);
  }
  size();
  window.addEventListener('resize', () => { size(); wake(); });

  /* ---------- input ---------- */
  const queue = [];          // splats waiting for the next frame: [x, y, dx, dy, ink] in CSS px
  let last = null, lastInput = 0, running = false, enabled = false;

  function addSample(x, y) {
    if (!last) { last = { x, y }; return; }
    const dx = x - last.x, dy = y - last.y, dist = Math.hypot(dx, dy);
    if (dist < .5) return;
    // fill long jumps so the ink line never breaks
    const steps = Math.min(12, Math.max(1, Math.ceil(dist / 9)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      queue.push([last.x + dx * t, last.y + dy * t, dx / steps, dy / steps, Math.min(1.1, CFG.INK * (0.45 + dist * 0.02) / steps * 1.6)]);
    }
    last = { x, y };
  }
  window.addEventListener('pointermove', e => {
    if (!enabled) return;
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (evs && evs.length) evs.forEach(c => addSample(c.clientX, c.clientY)); else addSample(e.clientX, e.clientY);
    wake();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { last = null; });
  window.addEventListener('blur', () => { last = null; });

  // scrolling stirs the water around the pointer, smearing the ink with the page
  let lastScroll = window.scrollY;
  window.addEventListener('scroll', () => {
    const dy = window.scrollY - lastScroll; lastScroll = window.scrollY;
    if (!enabled || !last || Math.abs(dy) < 1) return;
    queue.push([last.x, last.y, 0, -Math.max(-60, Math.min(60, dy)) * 1.4, 0, 3.5]);
    wake();
  }, { passive: true });

  function splat(x, y, dx, dy, ink, spread = 1) {
    const W = canvas.clientWidth || window.innerWidth, H = canvas.clientHeight || window.innerHeight;
    const asp = canvas.width / canvas.height;
    const u = x / W, v = 1 - y / H;
    let r = CFG.SPLAT_RADIUS * spread; if (asp > 1) r *= asp;
    P.splat.use();
    gl.uniform1i(P.splat.u.uTarget, velocity.read.attach(0));
    gl.uniform1f(P.splat.u.aspectRatio, asp);
    gl.uniform2f(P.splat.u.point, u, v);
    gl.uniform3f(P.splat.u.color, dx / W * CFG.SPLAT_FORCE, -dy / H * CFG.SPLAT_FORCE, 0);
    gl.uniform1f(P.splat.u.radius, r);
    blit(velocity.write); velocity.swap();
    if (ink > 0) {
      gl.uniform1i(P.splat.u.uTarget, dye.read.attach(0));
      gl.uniform3f(P.splat.u.color, ink, 0, 0);
      gl.uniform1f(P.splat.u.radius, r * 0.55);
      blit(dye.write); dye.swap();
    }
  }

  /* ---------- simulation step ---------- */
  function step(dt) {
    gl.disable(gl.BLEND);
    P.curl.use();
    gl.uniform2f(P.curl.u.texelSize, velocity.tx, velocity.ty);
    gl.uniform1i(P.curl.u.uVelocity, velocity.read.attach(0));
    blit(curl);

    P.vorticity.use();
    gl.uniform2f(P.vorticity.u.texelSize, velocity.tx, velocity.ty);
    gl.uniform1i(P.vorticity.u.uVelocity, velocity.read.attach(0));
    gl.uniform1i(P.vorticity.u.uCurl, curl.attach(1));
    gl.uniform1f(P.vorticity.u.curl, CFG.CURL);
    gl.uniform1f(P.vorticity.u.dt, dt);
    blit(velocity.write); velocity.swap();

    P.divergence.use();
    gl.uniform2f(P.divergence.u.texelSize, velocity.tx, velocity.ty);
    gl.uniform1i(P.divergence.u.uVelocity, velocity.read.attach(0));
    blit(divergence);

    P.clear.use();
    gl.uniform1i(P.clear.u.uTexture, pressure.read.attach(0));
    gl.uniform1f(P.clear.u.value, CFG.PRESSURE);
    blit(pressure.write); pressure.swap();

    P.pressure.use();
    gl.uniform2f(P.pressure.u.texelSize, velocity.tx, velocity.ty);
    gl.uniform1i(P.pressure.u.uDivergence, divergence.attach(0));
    for (let i = 0; i < CFG.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(P.pressure.u.uPressure, pressure.read.attach(1));
      blit(pressure.write); pressure.swap();
    }

    P.gradient.use();
    gl.uniform2f(P.gradient.u.texelSize, velocity.tx, velocity.ty);
    gl.uniform1i(P.gradient.u.uPressure, pressure.read.attach(0));
    gl.uniform1i(P.gradient.u.uVelocity, velocity.read.attach(1));
    blit(velocity.write); velocity.swap();

    P.advection.use();
    gl.uniform2f(P.advection.u.texelSize, velocity.tx, velocity.ty);
    if (P.advection.u.dyeTexelSize) gl.uniform2f(P.advection.u.dyeTexelSize, velocity.tx, velocity.ty);
    const vid = velocity.read.attach(0);
    gl.uniform1i(P.advection.u.uVelocity, vid);
    gl.uniform1i(P.advection.u.uSource, vid);
    gl.uniform1f(P.advection.u.dt, dt);
    gl.uniform1f(P.advection.u.dissipation, CFG.VELOCITY_DISSIPATION);
    blit(velocity.write); velocity.swap();

    if (P.advection.u.dyeTexelSize) gl.uniform2f(P.advection.u.dyeTexelSize, dye.read.tx, dye.read.ty);
    gl.uniform1i(P.advection.u.uVelocity, velocity.read.attach(0));
    gl.uniform1i(P.advection.u.uSource, dye.read.attach(1));
    gl.uniform1f(P.advection.u.dissipation, CFG.DENSITY_DISSIPATION);
    blit(dye.write); dye.swap();
  }

  function render() {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    P.display.use();
    gl.uniform2f(P.display.u.texelSize, dye.read.tx, dye.read.ty);
    gl.uniform1i(P.display.u.uTexture, dye.read.attach(0));
    blit(null);
  }

  /* ---------- loop (sleeps when idle) ---------- */
  let prev = 0;
  function wake() {
    lastInput = performance.now();
    if (!running && !document.hidden) { running = true; prev = performance.now(); requestAnimationFrame(frame); }
  }
  function frame(now) {
    if (!enabled) { running = false; return; }
    const dt = Math.min((now - prev) / 1000, 1 / 30); prev = now;
    while (queue.length) { const q = queue.shift(); splat(q[0], q[1], q[2], q[3], q[4], q[5] || 1); }
    step(dt);
    render();
    if (now - lastInput > CFG.SLEEP_AFTER) {
      running = false;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) running = false; });

  // switched by the Trail button in the header (js/header.js)
  window.TBInk = {
    enable() { enabled = true; canvas.style.display = ''; },
    disable() {
      enabled = false; last = null; queue.length = 0; running = false;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      canvas.style.display = 'none';
    }
  };
})();
