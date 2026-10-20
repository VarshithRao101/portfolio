/* VoidFall character showcase: all five playable characters, switched with arrows, dots, keys or swipe.
   Models load only when first shown (and the next one is fetched in the background). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;

function init() {
  const stage = document.getElementById('vf-stage');
  if (!stage) return;
  const canvas = stage.querySelector('canvas');
  const chars = JSON.parse(stage.dataset.chars || '[]');
  if (!chars.length) return;
  const $ = s => stage.querySelector(s);

  let renderer, scene, camera, controls, rim, key, clock, started = false, visible = false;
  const cache = new Map();      // id -> Promise<{ root, mixer }>
  let current = null, index = 0, token = 0;

  function setup() {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: window.devicePixelRatio < 1.5, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
    camera.position.set(0, 0.1, 4.2);
    scene.add(new THREE.HemisphereLight('#ffffff', '#1a1208', 1.3));
    key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(2, 3, 3); scene.add(key);
    rim = new THREE.PointLight('#ff8a00', 30, 12); rim.position.set(-1.8, 0.6, -1.6); scene.add(rim);

    controls = new OrbitControls(camera, canvas);
    controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true;
    controls.minPolarAngle = Math.PI * 0.32; controls.maxPolarAngle = Math.PI * 0.6;
    controls.autoRotate = !reduce; controls.autoRotateSpeed = 2;
    // on phones the card sits in a swipe carousel, so the canvas must not eat horizontal swipes
    controls.enableRotate = !coarse;
    controls.target.set(0, -0.32, 0); // sit the model above the name panel
    clock = new THREE.Clock();
    window.addEventListener('resize', resize); resize();
    loop();
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  function load(i) {
    const c = chars[i];
    if (cache.has(c.id)) return cache.get(c.id);
    const p = new Promise((res, rej) => {
      new GLTFLoader().load(c.file, gltf => {
        const model = gltf.scene;
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model, true);
        const size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
        const s = 2.1 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(s);
        model.position.copy(mid).multiplyScalar(-s);
        const root = new THREE.Group(); root.add(model);
        let mixer = null;
        if (gltf.animations.length) { mixer = new THREE.AnimationMixer(model); mixer.clipAction(gltf.animations[0]).play(); }
        res({ root, mixer });
      }, undefined, rej);
    });
    cache.set(c.id, p);
    return p;
  }

  function show(i, dir = 1) {
    index = (i + chars.length) % chars.length;
    const c = chars[index], my = ++token;
    // text + colour update straight away
    stage.style.setProperty('--vf', c.color);
    $('[data-vf-name]').textContent = c.name;
    $('[data-vf-blurb]').textContent = c.blurb;
    $('[data-vf-cost]').textContent = c.cost ? `Unlock: ${c.cost.toLocaleString('en-IN')} shards` : 'Starting character';
    $('[data-vf-count]').textContent = `${String(index + 1).padStart(2, '0')} / ${String(chars.length).padStart(2, '0')}`;
    stage.querySelectorAll('[data-vf-dot]').forEach((d, k) => d.classList.toggle('on', k === index));
    stage.classList.add('is-loading');
    if (rim) rim.color.set(c.color);

    const old = current;
    if (old) animate(old.root, false, dir, () => scene.remove(old.root));
    load(index).then(m => {
      if (my !== token) return;              // user already moved on
      stage.classList.remove('is-loading');
      current = m;
      m.root.rotation.y = 0;
      scene.add(m.root);
      animate(m.root, true, dir);
      load((index + 1) % chars.length).catch(() => {}); // warm the next one
    }).catch(() => { if (my === token) { stage.classList.remove('is-loading'); stage.classList.add('is-error'); } });
  }

  // slide + scale a model in (from the side it's coming from) or out (to the other side)
  function animate(obj, entering, dir, done) {
    if (reduce) { obj.scale.setScalar(entering ? 1 : 0.0001); obj.position.x = 0; if (done) done(); return; }
    const t0 = performance.now(), dur = 520;
    (function f(now) {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      obj.scale.setScalar(Math.max(0.0001, entering ? e : 1 - e));
      obj.position.x = entering ? (1 - e) * 1.6 * dir : -e * 1.6 * dir;
      if (k < 1) requestAnimationFrame(f); else if (done) done();
    })(t0);
  }

  function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    const dt = clock.getDelta();
    if (current && current.mixer) current.mixer.update(dt);
    controls.update();
    renderer.render(scene, camera);
  }

  // controls
  stage.addEventListener('click', e => {
    if (e.target.closest('[data-vf-prev]')) show(index - 1, -1);
    else if (e.target.closest('[data-vf-next]')) show(index + 1, 1);
    else { const d = e.target.closest('[data-vf-dot]'); if (d) { const k = +d.dataset.vfDot; show(k, k > index ? 1 : -1); } }
  });
  stage.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1, -1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1, 1); }
  });

  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && !started) { started = true; setup(); show(0); }
    if (visible && started) resize();
  }, { rootMargin: '200px' }).observe(stage);
}

try { init(); } catch (e) { console.warn('voidfall', e); }
