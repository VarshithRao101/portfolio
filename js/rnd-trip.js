/* TrekVana demo: a trip that re-plans itself when the weather turns. Registers itself on window.RND. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function whenVisible(el, start, stop) {
    if (!('IntersectionObserver' in window)) { start(); return; }
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: '100px' }).observe(el);
  }

  function trip(host) {
    const P = { hyd: [60, 300], har: [250, 205], ris: [320, 172], base: [430, 120], pass: [520, 58], valley: [510, 160] };
    const seg = (a, b, bend = 0) => {
      const [x1, y1] = P[a], [x2, y2] = P[b], mx = (x1 + x2) / 2 + bend, my = (y1 + y2) / 2 - Math.abs(bend);
      return `M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
    };
    let contours = '';
    for (let i = 0; i < 9; i++) contours += `<path d="M-20 ${330 - i * 34} C 150 ${300 - i * 40}, 330 ${360 - i * 36}, 640 ${250 - i * 38}" fill="none" stroke="rgba(255,255,255,${i % 3 === 0 ? .08 : .05})"/>`;
    const node = (k, label, dy = -14) => `<g class="tn" data-n="${k}"><circle cx="${P[k][0]}" cy="${P[k][1]}" r="6"/><text x="${P[k][0]}" y="${P[k][1] + dy}" text-anchor="middle">${label}</text></g>`;
    const RAIN = '<i class="fa-solid fa-cloud-showers-heavy"></i> Heavy rain at the high pass on Day 3. Re-planning…';
    host.innerHTML = `
      <div class="trip">
        <div class="trip-map">
          <svg viewBox="20 20 560 310" preserveAspectRatio="xMidYMid meet">
            ${contours}
            <path class="tr-seg" d="${seg('hyd', 'har', 40)}"/>
            <path class="tr-seg" d="${seg('har', 'ris', 10)}"/>
            <path class="tr-seg" d="${seg('ris', 'base', 20)}"/>
            <path class="tr-seg old" d="${seg('base', 'pass', 10)}"/>
            <path class="tr-seg alt" d="${seg('base', 'valley', -30)}"/>
            ${node('hyd', 'Hyderabad', 22)}${node('har', 'Haridwar', 22)}${node('ris', 'Rishikesh', 22)}${node('base', 'Base camp')}${node('pass', 'High pass')}${node('valley', 'Valley trail', 22)}
            <g class="tr-rain" transform="translate(520 58)"><circle r="26"/><text y="4" text-anchor="middle">Rain</text></g>
            <circle class="tr-dot" r="7" cx="60" cy="300"/>
          </svg>
          <div class="trip-alert" data-alert>${RAIN}</div>
        </div>
        <ol class="trip-plan">
          <li data-d="1"><b>Day 1</b><span>Train, Hyderabad to Haridwar</span><em class="eco">Lower CO₂ than flying</em></li>
          <li data-d="2"><b>Day 2</b><span>Cab to Rishikesh, stay booked</span></li>
          <li data-d="3"><b>Day 3</b><span data-day3></span></li>
          <li data-d="4"><b>Day 4</b><span data-day4></span></li>
        </ol>
      </div>`;
    const dot = host.querySelector('.tr-dot'), alert = host.querySelector('[data-alert]');
    const segs = [...host.querySelectorAll('.tr-seg')];
    segs.forEach(p => { const L = p.getTotalLength ? p.getTotalLength() : 300; p.dataset.len = L; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    let timers = [], running = false, raf = 0;
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const day = d => host.querySelectorAll('.trip-plan li').forEach(li => li.classList.toggle('now', li.dataset.d === String(d)));

    function travel(p, ms, done) {
      const L = +p.dataset.len, t0 = performance.now();
      cancelAnimationFrame(raf);
      (function f(now) {
        const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        p.style.strokeDashoffset = L * (1 - e);
        const pt = p.getPointAtLength(L * e); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
        if (k < 1) raf = requestAnimationFrame(f); else if (done) done();
      })(t0);
    }
    function resetState() {
      host.classList.remove('rerouted', 'raining'); alert.classList.remove('show'); alert.innerHTML = RAIN;
      segs.forEach(p => { p.style.strokeDashoffset = p.dataset.len; });
      host.querySelector('[data-day3]').textContent = 'Trek to base camp, cross the high pass';
      host.querySelector('[data-day4]').textContent = 'Back to Rishikesh';
      host.querySelectorAll('.trip-plan li').forEach(li => li.classList.remove('changed'));
      dot.setAttribute('cx', P.hyd[0]); dot.setAttribute('cy', P.hyd[1]);
    }
    function cycle() {
      timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf);
      resetState(); day(1);
      at(400, () => travel(segs[0], 1600, () => {
        day(2);
        at(300, () => travel(segs[1], 800, () => at(300, () => travel(segs[2], 1200, () => {
          day(3);
          host.classList.add('raining'); alert.classList.add('show');
          at(1900, () => {
            host.classList.add('rerouted');
            host.querySelector('[data-day3]').textContent = 'Valley trail, sheltered from the rain';
            host.querySelector('[data-day4]').textContent = 'High pass, once the weather clears';
            host.querySelectorAll('[data-d="3"], [data-d="4"]').forEach(li => li.classList.add('changed'));
            alert.innerHTML = '<i class="fa-solid fa-route"></i> Plan updated. The pass moves to Day 4.';
            at(500, () => travel(segs[4], 1300, () => at(3800, () => { if (running) cycle(); })));
          });
        }))));
      }));
    }
    resetState();
    if (reduce) {
      segs.forEach((p, i) => { if (i !== 3) p.style.strokeDashoffset = 0; });
      host.classList.add('rerouted');
      host.querySelector('[data-day3]').textContent = 'Valley trail, sheltered from the rain';
      host.querySelector('[data-day4]').textContent = 'High pass, once the weather clears';
      return;
    }
    whenVisible(host, () => { if (!running) { running = true; cycle(); } }, () => { running = false; timers.forEach(clearTimeout); cancelAnimationFrame(raf); });
  }

  window.RND = Object.assign(window.RND || {}, { trip });
})();
