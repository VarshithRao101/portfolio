/* Hive Store: product grid, product modal, bag drawer, order request. */
(function () {
  const { esc, cart, reveals, lenis, reduce } = window.TBX;
  const D = window.TB;
  const $ = s => document.querySelector(s);
  const byId = id => D.merch.find(m => m.id === id);
  const price = m => m.price ? '₹' + m.price.toLocaleString('en-IN') : 'Price TBA';
  const media = m => m.image
    ? `<img src="${esc(m.image)}" alt="${esc(m.name)}" loading="lazy">`
    : `<div class="mcard-ph"><i class="bee"></i><span class="mono">Photo coming soon</span></div>`;

  /* ---------- grid + filters ---------- */
  const types = [...new Set(D.merch.map(m => m.type))];
  $('#shop-filters').insertAdjacentHTML('beforeend', types.map(t => `<button data-f="${esc(t)}">${esc(t)}</button>`).join(''));

  function renderGrid(f = 'all') {
    const list = D.merch.filter(m => f === 'all' || m.type === f);
    $('#shop-count').textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;
    $('#shop-grid').innerHTML = list.map(m => `
      <a class="mcard" href="#${esc(m.id)}" data-id="${esc(m.id)}" data-tilt data-cursor="VIEW">
        <span class="pill mcard-badge">${esc(m.status)}</span>
        <div class="mcard-media">${media(m)}<span class="quick">Quick view</span></div>
        <div class="mcard-body"><div><span class="mono dim" style="font-size:11px">${esc(m.type)}</span><h4>${esc(m.name)}</h4></div><span class="price">${price(m)}</span></div>
      </a>`).join('');
    reveals($('#shop-grid'));
    if (window.gsap && !reduce) gsap.from('#shop-grid .mcard', { opacity: 0, y: 50, duration: 1, stagger: .08, ease: 'expo.out' });
  }
  $('#shop-filters').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#shop-filters button').forEach(x => x.classList.toggle('is-on', x === b));
    renderGrid(b.dataset.f);
  });

  /* ---------- overlays ---------- */
  const overlay = $('#overlay'), modal = $('#pmodal'), drawer = $('#drawer');
  function lock(on) { if (lenis) on ? lenis.stop() : lenis.start(); document.body.style.overflow = on ? 'hidden' : ''; }
  function closeAll() {
    modal.classList.remove('is-open'); drawer.classList.remove('is-open'); overlay.classList.remove('is-open'); lock(false);
    if (location.hash && byId(location.hash.slice(1))) history.replaceState(null, '', location.pathname);
  }
  overlay.addEventListener('click', closeAll);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

  /* ---------- product modal ---------- */
  function openProduct(id) {
    const m = byId(id); if (!m) return;
    let size = m.sizes && m.sizes.length ? m.sizes[1] || m.sizes[0] : null;
    modal.innerHTML = `
      <button class="x-btn" data-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
      <div class="mcard-media">${media(m)}</div>
      <div class="pm-body">
        <span class="pill" style="align-self:start">${esc(m.status)}</span>
        <div><span class="mono dim">${esc(m.type)}</span><h3 style="margin-top:8px">${esc(m.name)}</h3></div>
        <div class="pm-price">${price(m)}</div>
        <p class="dim">${esc(m.desc)}</p>
        ${m.sizes ? `<div><div class="mono dim" style="margin-bottom:10px">Size</div><div class="sizes">${m.sizes.map(s => `<button data-size="${esc(s)}" class="${s === size ? 'is-on' : ''}">${esc(s)}</button>`).join('')}</div></div>` : ''}
        <div style="margin-top:auto;display:grid;gap:10px">
          <button class="btn btn-solid" data-add style="justify-content:center">Add to bag <i class="fa-solid fa-bag-shopping arrow"></i></button>
          <p class="dim" style="font-size:13px;text-align:center">First drop is pre-order. We'll confirm price and delivery before you pay.</p>
        </div>
      </div>`;
    modal.querySelector('[data-close]').onclick = closeAll;
    modal.querySelectorAll('[data-size]').forEach(b => b.onclick = () => {
      size = b.dataset.size;
      modal.querySelectorAll('[data-size]').forEach(x => x.classList.toggle('is-on', x === b));
    });
    modal.querySelector('[data-add]').onclick = () => { cart.add(m.id, size); toast(`${m.name}${size ? ' · ' + size : ''} added`); closeAll(); };
    overlay.classList.add('is-open'); modal.classList.add('is-open'); lock(true);
  }
  $('#shop-grid').addEventListener('click', e => {
    const c = e.target.closest('.mcard'); if (!c) return;
    e.preventDefault(); e.stopPropagation();
    history.replaceState(null, '', '#' + c.dataset.id);
    openProduct(c.dataset.id);
  });

  /* ---------- bag ---------- */
  function renderBag() {
    const items = cart.items().filter(i => byId(i.id));
    const box = $('#bag-items'), foot = $('#bag-foot');
    if (!items.length) {
      box.innerHTML = `<div class="empty"><i class="bee"></i><p>Your bag is empty.</p></div>`;
      foot.innerHTML = `<button class="btn" data-close-bag style="justify-content:center">Keep browsing</button>`;
    } else {
      box.innerHTML = items.map((i, idx) => {
        const m = byId(i.id);
        return `<div class="bag-item">
          <div class="bag-thumb">${m.image ? `<img src="${esc(m.image)}" alt="">` : '<i class="bee"></i>'}</div>
          <div><b>${esc(m.name)}</b><div class="mono dim" style="font-size:11px">${i.size ? 'Size ' + esc(i.size) : ''}</div>
            <div class="qty"><button data-dec="${idx}" aria-label="Decrease">−</button><span>${i.qty}</span><button data-inc="${idx}" aria-label="Increase">+</button></div></div>
          <span class="mono" style="color:var(--honey);font-size:13px">${m.price ? '₹' + (m.price * i.qty).toLocaleString('en-IN') : 'TBA'}</span>
        </div>`;
      }).join('');
      const total = items.reduce((s, i) => s + (byId(i.id).price || 0) * i.qty, 0);
      const anyTba = items.some(i => !byId(i.id).price);
      foot.innerHTML = `
        <div style="display:flex;justify-content:space-between"><span class="dim">Subtotal</span><b>${total ? '₹' + total.toLocaleString('en-IN') : ''}${anyTba ? (total ? ' + TBA' : 'TBA') : ''}</b></div>
        <a class="btn btn-solid" id="checkout" style="justify-content:center">Request order <i class="fa-solid fa-arrow-right arrow"></i></a>
        <p class="dim" style="font-size:12px;text-align:center">Sends your order to the team by email. No payment is taken here.</p>`;
      const lines = items.map(i => `- ${byId(i.id).name}${i.size ? ' (' + i.size + ')' : ''} x${i.qty}`).join('\n');
      $('#checkout').href = `mailto:${D.socials.emailBee}?subject=${encodeURIComponent('TRNT BEE merch order request')}&body=${encodeURIComponent('Hi TRNT BEE team,\n\nI would like to order:\n' + lines + '\n\nName:\nPhone:\nCity:\n')}`;
    }
    box.onclick = e => {
      const all = cart.items().filter(i => byId(i.id));
      const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
      if (inc) all[+inc.dataset.inc].qty++;
      else if (dec) { const k = +dec.dataset.dec; all[k].qty--; if (all[k].qty <= 0) all.splice(k, 1); }
      else return;
      cart.save(all);
    };
    foot.onclick = e => { if (e.target.closest('[data-close-bag]')) closeAll(); };
  }
  document.addEventListener('tb:cart', renderBag);
  $('#open-bag').addEventListener('click', () => { renderBag(); overlay.classList.add('is-open'); drawer.classList.add('is-open'); lock(true); });
  $('#close-bag').addEventListener('click', closeAll);

  /* ---------- notify ---------- */
  $('#notify-form').addEventListener('submit', e => {
    e.preventDefault();
    const em = $('#notify-email').value.trim();
    location.href = `mailto:${D.socials.emailBee}?subject=${encodeURIComponent('Drop alert sign-up')}&body=${encodeURIComponent('Please notify me about the next TRNT BEE merch drop.\n\nEmail: ' + em)}`;
  });

  /* ---------- toast ---------- */
  let tt;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('is-on'), 2200); }

  /* ---------- go ---------- */
  renderGrid();
  reveals(document);
  if (window.gsap && !reduce) gsap.from('.shop-hero .split-line > span', { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: .12, delay: .1 });
  const h = location.hash.slice(1);
  if (byId(h)) setTimeout(() => openProduct(h), 500);
})();
