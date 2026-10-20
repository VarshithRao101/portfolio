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

  // antialiasing only where pixels are big; high-DPI screens look sharp without it
  const dprMax = mobile ? 1.25 : 1.5;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: window.devicePixelRatio < 1.5, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprMax));
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
  // Cell motion runs on the GPU: positions are written once, the vertex shader lifts each cell
  // every frame from a few uniforms (time, pointer, click waves). No per-frame CPU loop.
  const seeds = new Float32Array(cells.length), lits = new Float32Array(cells.length);
  cells.forEach((c, i) => { seeds[i] = c.seed; lits[i] = c.lit ? 1 : 0; });
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  geo.setAttribute('aLit', new THREE.InstancedBufferAttribute(lits, 1));
  const U = { uTime: { value: 0 }, uHit: { value: new THREE.Vector2() }, uWaves: { value: [0, 1, 2, 3].map(() => new THREE.Vector3(0, 0, 99)) } };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute float aSeed;\nattribute float aLit;\nuniform float uTime;\nuniform vec2 uHit;\nuniform vec3 uWaves[4];\n' +
      sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
        float dd = length(ip);
        float lift = sin(dd * .45 - uTime * 1.1) * .35 + sin(ip.x * .3 + uTime * .6) * .15;
        float k = max(0., 1. - distance(ip, uHit) / 4.5); lift += k * k * 1.6;
        for (int i = 0; i < 4; i++) {
          vec3 w = uWaves[i];
          if (w.z < 4.) { float wd = distance(ip, w.xy) - w.z * 9.; lift += exp(-wd * wd * .6) * 1.4 * (1. - w.z / 4.); }
        }
        lift += aLit * (.25 + sin(uTime * 2. + aSeed * 6.) * .15);
        transformed.y += lift / length(instanceMatrix[1].xyz);`);
  };
  const mesh = new THREE.InstancedMesh(geo, mat, cells.length);
  mesh.frustumCulled = false; // cells move in the shader, so the CPU bounds are not exact
  const dark = new THREE.Color('#141417');
  cells.forEach((c, i) => mesh.setColorAt(i, c.lit ? HONEY : dark));
  {
    const m = new THREE.Matrix4(), q0 = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
    cells.forEach((c, i) => mesh.setMatrixAt(i, m.compose(v.set(c.x, 0, c.z), q0, s.set(1, 1 + c.d * 0.02, 1))));
    mesh.instanceMatrix.needsUpdate = true;
  }
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
  fetch('images/brand/bee-mark.svg').then(r => r.text()).then(txt => new SVGLoader().parse(txt.replace(/currentColor/g, '#000'))).then(data => {
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

    U.uTime.value = t;
    U.uHit.value.set(hit.x, hit.z);
    for (let i = 0; i < 4; i++) { const w = waves[i]; U.uWaves.value[i].set(w ? w.x : 0, w ? w.z : 0, w ? w.t : 99); }

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
