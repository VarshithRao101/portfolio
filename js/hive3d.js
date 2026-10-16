/* 3D: the honeycomb hero field with a floating extruded bee mark. */
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const HONEY = new THREE.Color('#ffc21a');

/* ================= HERO HIVE ================= */
function hive() {
  const canvas = document.getElementById('hive-canvas');
  if (!canvas) return;
  const mobile = window.innerWidth < 760;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a0a0a');
  scene.fog = new THREE.Fog('#0a0a0a', 18, 46);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 15, 20);
  camera.lookAt(0, 0, 0);

  /* ---- hex grid ---- */
  const R = 0.62, GAP = 0.06, H = 1;
  const geo = new THREE.CylinderGeometry(R, R, H, 6, 1);
  geo.translate(0, -H / 2, 0); // top face sits at y = 0
  const mat = new THREE.MeshStandardMaterial({ color: '#141417', metalness: 0.65, roughness: 0.38 });

  const cells = [];
  const radius = mobile ? 16 : 22;
  const w = Math.sqrt(3) * (R + GAP);
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const x = w * (q + r / 2);
      const z = 1.5 * (R + GAP) * r;
      const d = Math.hypot(x, z);
      if (d > radius * 1.05) continue;
      cells.push({ x, z, d, seed: Math.random(), lit: Math.random() < 0.05 });
    }
  }
  const mesh = new THREE.InstancedMesh(geo, mat, cells.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dark = new THREE.Color('#141417');
  cells.forEach((c, i) => mesh.setColorAt(i, c.lit ? HONEY : dark));
  scene.add(mesh);

  /* ---- lights ---- */
  scene.add(new THREE.AmbientLight('#ffffff', 0.25));
  const key = new THREE.DirectionalLight('#fff3d6', 1.4);
  key.position.set(-6, 14, 8);
  scene.add(key);
  const glow = new THREE.PointLight('#ffb000', 60, 14, 1.6);
  glow.position.set(0, 2.5, 0);
  scene.add(glow);
  const rim = new THREE.PointLight('#ff7a00', 30, 30, 1.5);
  rim.position.set(8, 4, -10);
  scene.add(rim);

  /* ---- extruded bee mark ---- */
  // the bee rides with the camera so it always sits in the upper part of the frame
  const BEE_DIST = 12;
  const beeSlot = new THREE.Group();
  const bee = new THREE.Group();
  beeSlot.add(bee);
  camera.add(beeSlot);
  scene.add(camera);
  function placeBee() {
    const halfH = BEE_DIST * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfW = halfH * camera.aspect;
    const size = Math.min(halfH * 2 * 0.3, halfW * 2 * 0.42); // ~30% of frame height
    beeSlot.scale.setScalar(size);
    beeSlot.position.set(0, halfH * (camera.aspect < 1 ? 0.42 : 0.4), -BEE_DIST);
  }
  new SVGLoader().load('images/brand/bee-mark.svg', data => {
    const goldMat = new THREE.MeshStandardMaterial({ color: '#ffb800', metalness: 0.9, roughness: 0.32, emissive: '#ff8a00', emissiveIntensity: 0.22, envMapIntensity: 0.55 });
    const g = new THREE.Group();
    data.paths.forEach(p => {
      SVGLoader.createShapes(p).forEach(shape => {
        const eg = new THREE.ExtrudeGeometry(shape, { depth: 26, bevelEnabled: true, bevelThickness: 4, bevelSize: 2.5, bevelSegments: 3, curveSegments: 6 });
        g.add(new THREE.Mesh(eg, goldMat));
      });
    });
    // SVG y points down: flip and centre
    g.scale.set(1, -1, 1);
    const box = new THREE.Box3().setFromObject(g);
    const c = box.getCenter(new THREE.Vector3());
    g.position.sub(c.multiply(new THREE.Vector3(1, 1, 1)));
    const wrap = new THREE.Group();
    wrap.add(g);
    const s = 1 / (box.max.y - box.min.y);
    wrap.scale.setScalar(s);
    bee.add(wrap);
    bee.userData.ready = true;
    if (!reduce && window.gsap) {
      window.gsap.from(bee.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 2.2, ease: 'elastic.out(1,.55)', delay: 2.3 });
      window.gsap.from(bee.rotation, { y: -Math.PI * 1.5, duration: 2.6, ease: 'expo.out', delay: 2.3 });
    }
  });

  /* ---- floating pollen ---- */
  const pCount = mobile ? 160 : 360;
  const pGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 40;
    pos[i * 3 + 1] = Math.random() * 12;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pollen = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: '#ffc21a', size: 0.06, transparent: true, opacity: 0.7, depthWrite: false }));
  scene.add(pollen);

  /* ---- interaction ---- */
  const mouse = new THREE.Vector2(0, 0);
  const target = new THREE.Vector3(0, 0, 0);
  const hit = new THREE.Vector3(0, 0, 0);
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let hasPointer = false;
  window.addEventListener('pointermove', e => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    hasPointer = true;
  }, { passive: true });

  // shockwave on click
  const waves = [];
  canvas.parentElement.addEventListener('pointerdown', e => {
    if (e.target.closest('a,button')) return;
    waves.push({ x: hit.x, z: hit.z, t: 0 });
    if (waves.length > 4) waves.shift();
  });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h ? 55 : 38;
    camera.updateProjectionMatrix();
    placeBee();
  }
  window.addEventListener('resize', resize);
  resize();

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  const clock = new THREE.Clock();

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime * (reduce ? 0.2 : 1);

    // where the pointer touches the hive
    if (!hasPointer) { mouse.x = Math.sin(t * 0.4) * 0.5; mouse.y = Math.cos(t * 0.3) * 0.3 - 0.1; }
    ray.setFromCamera(mouse, camera);
    ray.ray.intersectPlane(plane, target);
    hit.lerp(target, 0.08);
    glow.position.set(hit.x, 2.4, hit.z);

    waves.forEach(w => { w.t += dt; });
    while (waves.length && waves[0].t > 4) waves.shift();

    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      let y = Math.sin(c.d * 0.45 - t * 1.1) * 0.35 + Math.sin(c.x * 0.3 + t * 0.6) * 0.15;
      const md = Math.hypot(c.x - hit.x, c.z - hit.z);
      y += Math.max(0, 1 - md / 4.5) ** 2 * 1.6;
      for (const w of waves) {
        const wd = Math.hypot(c.x - w.x, c.z - w.z) - w.t * 9;
        y += Math.exp(-wd * wd * 0.6) * 1.4 * (1 - w.t / 4);
      }
      if (c.lit) y += 0.25 + Math.sin(t * 2 + c.seed * 6) * 0.15;
      p.set(c.x, y, c.z);
      sc.set(1, 1 + c.d * 0.02, 1);
      m4.compose(p, q, sc);
      mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;

    if (bee.userData.ready) {
      bee.position.y = Math.sin(t * 1.2) * 0.04;
      bee.rotation.y += (mouse.x * 0.6 - bee.rotation.y) * 0.05;
      bee.rotation.x += (-mouse.y * 0.25 - bee.rotation.x) * 0.05;
      bee.rotation.z = Math.sin(t * 0.8) * 0.05;
    }

    pollen.rotation.y = t * 0.02;
    pollen.position.y = Math.sin(t * 0.3) * 0.3;

    camera.position.x += (mouse.x * 2 - camera.position.x) * 0.03;
    camera.position.y += (15 + mouse.y * 1.2 - camera.position.y) * 0.03;
    camera.lookAt(0, 1.2, 0);

    renderer.render(scene, camera);
  }
  frame();
}

try { hive(); } catch (e) { console.warn('hive', e); }
