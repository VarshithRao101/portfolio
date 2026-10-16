/* TRNT BEE Store — one script for every store page (home, product, checkout).
   The bag is kept in localStorage under 'tb_cart' so the main site shows the same count. */
(function () {
  const S = window.STORE;
  const page = document.body.dataset.page;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const src = p => /^(https?:)?\/\//.test(p) ? p : '../' + p.replace(/^\//, '');
  const byId = id => S.products.find(p => p.id === id);
  const money = n => S.currency + Number(n).toLocaleString('en-IN');
  const canBuy = p => p.status === 'available' || p.status === 'preorder';
  const SWATCH = { 'olive': '#4b5130', 'chocolate brown': '#4a2c1d', 'black': '#111', 'white': '#f4f4f4' };
  const swatch = c => SWATCH[String(c || '').toLowerCase()] || '#999';

  /* ---------- storage ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const cart = {
    items: () => store.get('tb_cart', []).filter(i => byId(i.id) && canBuy(byId(i.id))),
    save(items) { store.set('tb_cart', items); renderCount(); renderBag(); document.dispatchEvent(new Event('cart')); },
    add(id, size, qty = 1) {
      const items = cart.items();
      const hit = items.find(i => i.id === id && i.size === size);
      if (hit) hit.qty += qty; else items.push({ id, size, qty });
      cart.save(items);
    },
    count: () => cart.items().reduce((n, i) => n + i.qty, 0),
    total: () => cart.items().reduce((s, i) => s + (byId(i.id).price || 0) * i.qty, 0),
    hasTba: () => cart.items().some(i => !byId(i.id).price)
  };

  /* ---------- shared pieces ---------- */
  const cats = [...new Set(S.products.map(p => p.category))];
  function priceHtml(p) {
    if (p.price == null) return `<span class="price tba">${p.status === 'coming-soon' ? 'Coming soon' : 'Price soon'}</span>`;
    return `<span class="price">${money(p.price)}${p.compareAt ? `<s>${money(p.compareAt)}</s>` : ''}</span>`;
  }
  function badgeHtml(p) {
    if (p.status === 'coming-soon') return '<span class="badge soon">Coming soon</span>';
    if (p.status === 'sold-out') return '<span class="badge out">Sold out</span>';
    if (p.status === 'preorder') return '<span class="badge">Pre-order</span>';
    if (p.compareAt && p.price) return '<span class="badge sale">Sale</span>';
    if (p.badge) return `<span class="badge">${esc(p.badge)}</span>`;
    return '';
  }
  function mediaHtml(p, big) {
    if (!p.images || !p.images.length) return `<div class="p-ph"><i class="bee"></i>${big ? '' : '<span>Photo soon</span>'}</div>`;
    return `<img src="${esc(src(p.images[0]))}" alt="${esc(p.name)}" loading="lazy">` +
      (!big && p.images[1] ? `<img class="alt" src="${esc(src(p.images[1]))}" alt="" loading="lazy">` : '');
  }
  function notifyLink(p) {
    return `mailto:${S.orderEmail}?subject=${encodeURIComponent('Notify me: ' + p.name)}&body=${encodeURIComponent('Please let me know when ' + p.name + ' is available.')}`;
  }

  function header() {
    const navLinks = `<a href="index.html#shop">Shop all</a>${cats.map(c => `<a href="index.html?cat=${encodeURIComponent(c)}#shop">${esc(c)}</a>`).join('')}`;
    document.body.insertAdjacentHTML('afterbegin', `
      ${S.announcement ? `<div class="announce">${esc(S.announcement)} <a href="index.html#signup">Join the list</a></div>` : ''}
      <header class="header">
        <div class="wrap">
          <div class="h-left">
            <button class="icon-btn menu-btn" data-open-menu aria-label="Menu"><i class="fa-solid fa-bars"></i></button>
            <nav class="h-nav">${navLinks}</nav>
          </div>
          <a class="logo" href="index.html" aria-label="TRNT BEE Store home"><i class="bee"></i>TRNT BEE <small>STORE</small></a>
          <div class="h-actions">
            ${page === 'home' ? '<button class="icon-btn" data-search aria-label="Search"><i class="fa-solid fa-magnifying-glass"></i></button>' : ''}
            <a class="icon-btn" href="../index.html" aria-label="Back to TRNT BEE" title="Back to TRNT BEE"><i class="fa-solid fa-house"></i></a>
            <button class="icon-btn" data-open-bag aria-label="Bag"><i class="fa-solid fa-bag-shopping"></i><span class="count" data-count></span></button>
          </div>
        </div>
        ${page === 'home' ? `<div class="searchbar" id="searchbar"><div class="wrap"><i class="fa-solid fa-magnifying-glass muted"></i><input id="q" type="search" placeholder="Search the store" aria-label="Search"><button class="icon-btn" data-search aria-label="Close search"><i class="fa-solid fa-xmark"></i></button></div></div>` : ''}
      </header>
      <nav class="drawer-nav" id="drawer-nav">
        <button class="icon-btn" data-close aria-label="Close" style="align-self:flex-end"><i class="fa-solid fa-xmark"></i></button>
        ${navLinks}
        <a class="back" href="../index.html">← Back to TRNT BEE</a>
      </nav>
      <div class="scrim" id="scrim"></div>
      <aside class="bag" id="bag" aria-label="Bag">
        <div class="bag-head"><h2>Your bag</h2><button class="icon-btn" data-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="bag-items" id="bag-items"></div>
        <div class="bag-foot" id="bag-foot"></div>
      </aside>
      <div class="toast" id="toast"><span id="toast-msg"></span><button data-open-bag>View bag</button></div>`);
  }

  function footer() {
    document.body.insertAdjacentHTML('beforeend', `
      <footer class="footer">
        <div class="wrap">
          <div class="f-grid">
            <div class="f-brand"><a class="logo" href="index.html"><i class="bee"></i>TRNT BEE</a><p>Merch from TRNT BEE, a student-run studio. Small runs, designed by us.</p></div>
            <div><h4>Shop</h4><ul><li><a href="index.html#shop">All products</a></li>${cats.map(c => `<li><a href="index.html?cat=${encodeURIComponent(c)}#shop">${esc(c)}</a></li>`).join('')}</ul></div>
            <div><h4>Help</h4><ul><li><a href="index.html#help">Shipping</a></li><li><a href="index.html#help">Returns</a></li><li><a href="mailto:${S.orderEmail}">Contact us</a></li></ul></div>
            <div><h4>TRNT BEE</h4><ul><li><a href="../index.html">Main site</a></li><li><a href="https://www.instagram.com/beesociety101" target="_blank" rel="noopener">Instagram</a></li><li><a href="https://youtube.com/@beesociety-d6y" target="_blank" rel="noopener">YouTube</a></li></ul></div>
          </div>
          <div class="f-bottom"><span>© ${new Date().getFullYear()} TRNT BEE</span><span>Prices in INR</span></div>
        </div>
      </footer>`);
  }

  /* ---------- overlays ---------- */
  function open(el) { closeAll(); el.classList.add('open'); $('#scrim').classList.add('open'); document.body.classList.add('lock'); }
  function closeAll() { $$('.bag, .drawer-nav, .scrim').forEach(e => e.classList.remove('open')); document.body.classList.remove('lock'); }
  document.addEventListener('click', e => {
    if (e.target.closest('[data-open-bag]')) { e.preventDefault(); renderBag(); open($('#bag')); hideToast(); }
    else if (e.target.closest('[data-open-menu]')) open($('#drawer-nav'));
    else if (e.target.closest('[data-close]') || e.target.id === 'scrim') closeAll();
    else if (e.target.closest('#drawer-nav a')) closeAll();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

  let tt;
  function toast(msg) { $('#toast-msg').textContent = msg; $('#toast').classList.add('on'); clearTimeout(tt); tt = setTimeout(hideToast, 3200); }
  function hideToast() { $('#toast') && $('#toast').classList.remove('on'); }

  function renderCount() {
    $$('[data-count]').forEach(el => { const n = cart.count(); el.textContent = n || ''; el.toggleAttribute('data-zero', !n); });
  }

  function lineItems(editable) {
    return cart.items().map((i, idx) => {
      const p = byId(i.id);
      return `<div class="line-item">
        <a class="li-img" href="product.html?id=${encodeURIComponent(p.id)}">${p.images && p.images[0] ? `<img src="${esc(src(p.images[0]))}" alt="">` : '<i class="bee"></i>'}</a>
        <div>
          <a class="li-name" href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a>
          <div class="li-meta">${i.size ? 'Size ' + esc(i.size) : esc(p.category)}${p.status === 'preorder' ? ' · Pre-order' : ''}</div>
          ${editable ? `<div><span class="qty sm"><button data-dec="${idx}" aria-label="Decrease">−</button><span>${i.qty}</span><button data-inc="${idx}" aria-label="Increase">+</button></span><button class="li-remove" data-rm="${idx}">Remove</button></div>` : `<div class="li-meta">Qty ${i.qty}</div>`}
        </div>
        <span class="price${p.price ? '' : ' tba'}">${p.price ? money(p.price * i.qty) : 'TBA'}</span>
      </div>`;
    }).join('');
  }
  function totalText() {
    const t = cart.total(), tba = cart.hasTba();
    return t ? money(t) + (tba ? ' + TBA' : '') : (tba ? 'TBA' : money(0));
  }
  function renderBag() {
    const box = $('#bag-items'), foot = $('#bag-foot');
    if (!box) return;
    if (!cart.count()) {
      box.innerHTML = `<div class="bag-empty"><i class="bee"></i><p>Your bag is empty.</p></div>`;
      foot.innerHTML = `<a class="btn btn-ink btn-block" href="index.html#shop" data-close>Browse the store</a>`;
      return;
    }
    box.innerHTML = lineItems(true);
    foot.innerHTML = `<div class="row"><span class="muted">Subtotal</span><b>${totalText()}</b></div>
      <div class="muted" style="font-size:13px">${esc(S.shippingNote)}</div>
      <a class="btn btn-ink btn-block" href="checkout.html">Checkout</a>`;
  }
  document.addEventListener('click', e => {
    const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]'), rm = e.target.closest('[data-rm]');
    if (!inc && !dec && !rm) return;
    const items = cart.items();
    if (inc) items[+inc.dataset.inc].qty++;
    if (dec) { const k = +dec.dataset.dec; if (--items[k].qty <= 0) items.splice(k, 1); }
    if (rm) items.splice(+rm.dataset.rm, 1);
    cart.save(items);
  });

  function card(p) {
    return `<article class="p-card reveal">
      <a class="p-media" href="product.html?id=${encodeURIComponent(p.id)}">${badgeHtml(p)}${mediaHtml(p)}
        ${canBuy(p) && !(p.sizes && p.sizes.length > 1) ? `<button class="p-quick" data-quick="${esc(p.id)}">Add to bag</button>` : ''}</a>
      <a class="p-info" href="product.html?id=${encodeURIComponent(p.id)}"><div><h3>${esc(p.name)}</h3>${p.color ? `<span class="colour"><i style="background:${swatch(p.color)}"></i>${esc(p.color)}</span>` : `<span class="cat">${esc(p.category)}</span>`}</div>${priceHtml(p)}</a>
    </article>`;
  }
  document.addEventListener('click', e => {
    const q = e.target.closest('[data-quick]'); if (!q) return;
    e.preventDefault();
    const p = byId(q.dataset.quick);
    cart.add(p.id, p.sizes && p.sizes[0] || null);
    toast(`${p.name} added`);
  });

  function reveals() {
    const els = $$('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach((en, i) => {
      if (en.isIntersecting) { setTimeout(() => en.target.classList.add('in'), i * 60); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -40px 0px' });
    els.forEach(e => io.observe(e));
  }

  /* =================== HOME =================== */
  function home() {
    const params = new URLSearchParams(location.search);
    let cat = params.get('cat') || 'All', sort = 'featured', q = '';
    $('#chips').innerHTML = ['All', ...cats].map(c => `<button class="chip${c === cat ? ' on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    function draw() {
      let list = S.products.filter(p => (cat === 'All' || p.category === cat) && (!q || (p.name + ' ' + p.category + ' ' + (p.desc || '')).toLowerCase().includes(q)));
      const rank = p => ({ available: 0, preorder: 1, 'coming-soon': 2, 'sold-out': 3 }[p.status] ?? 4);
      if (sort === 'featured') list.sort((a, b) => rank(a) - rank(b));
      if (sort === 'low') list.sort((a, b) => (a.price ?? 1e9) - (b.price ?? 1e9));
      if (sort === 'high') list.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
      $('#n').textContent = `${list.length} item${list.length === 1 ? '' : 's'}`;
      $('#grid').classList.toggle('few', list.length <= 2);
      $('#grid').innerHTML = list.length
        ? list.map(card).join('') + (cat === 'All' && !q ? `<div class="p-more reveal"><div><b>More drops coming</b>New pieces land here first.</div></div>` : '')
        : `<p class="empty-state">Nothing matches that. <button class="chip" data-reset>Clear filters</button></p>`;
      reveals();
    }
    $('#chips').addEventListener('click', e => {
      const b = e.target.closest('[data-cat]'); if (!b) return;
      cat = b.dataset.cat; $$('.chip', $('#chips')).forEach(x => x.classList.toggle('on', x === b));
      history.replaceState(null, '', cat === 'All' ? location.pathname + '#shop' : `?cat=${encodeURIComponent(cat)}#shop`);
      draw();
    });
    $('#sort').addEventListener('change', e => { sort = e.target.value; draw(); });
    document.addEventListener('click', e => {
      if (e.target.closest('[data-reset]')) { cat = 'All'; q = ''; $('#q').value = ''; $$('.chip', $('#chips')).forEach(x => x.classList.toggle('on', x.dataset.cat === 'All')); draw(); }
      if (e.target.closest('[data-search]')) { const sb = $('#searchbar'); sb.classList.toggle('open'); if (sb.classList.contains('open')) { $('#q').focus(); } else { q = ''; $('#q').value = ''; draw(); } }
    });
    $('#q').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); draw(); if (q) $('#shop').scrollIntoView({ block: 'start' }); });
    $('#signup-form').addEventListener('submit', e => {
      e.preventDefault();
      const em = $('#signup-email').value.trim();
      location.href = `mailto:${S.orderEmail}?subject=${encodeURIComponent('Store drop alerts')}&body=${encodeURIComponent('Please add me to the TRNT BEE store list.\n\nEmail: ' + em)}`;
    });
    $('#ship-note').textContent = S.shippingNote;
    draw();
    // the grid is drawn after load, so jump to #shop ourselves
    if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) requestAnimationFrame(() => t.scrollIntoView({ behavior: 'instant' })); }
  }

  /* =================== PRODUCT =================== */
  function product() {
    const p = byId(new URLSearchParams(location.search).get('id'));
    const root = $('#pdp-root');
    if (!p) { root.innerHTML = `<div class="done"><i class="bee"></i><h1 class="checkout-title">Product not found</h1><p class="muted">It may have been removed.</p><p style="margin-top:20px"><a class="btn btn-ink" href="index.html#shop">Back to the store</a></p></div>`; return; }
    document.title = `${p.name} — TRNT BEE Store`;
    let size = null, qty = 1, imgIdx = 0;
    const C = S.collection && /collection 01/i.test((p.details || []).join(' ')) ? S.collection : null;
    const sibs = S.products.filter(x => x.category === p.category && x.color);
    const imgs = p.images || [];
    root.innerHTML = `
      <nav class="crumbs"><a href="index.html">Store</a><span>/</span><a href="index.html?cat=${encodeURIComponent(p.category)}#shop">${esc(p.category)}</a><span>/</span><span>${esc(p.name)}</span></nav>
      <div class="pdp">
        <div class="gallery${imgs.length > 1 ? '' : ' single'}">
          <div class="thumbs">${imgs.map((im, i) => `<button class="${i ? '' : 'on'}" data-img="${i}" aria-label="Image ${i + 1}"><img src="${esc(src(im))}" alt=""></button>`).join('')}</div>
          <div class="main-img">${badgeHtml(p)}${imgs.length ? `<img id="main-img" src="${esc(src(imgs[0]))}" alt="${esc(p.name)}">` : mediaHtml(p, true)}</div>
        </div>
        <div class="buy">
          ${C ? `<span class="collection-line">${esc(C.name)}</span>` : `<span class="cat">${esc(p.category)}</span>`}
          <h1>${esc(p.name)}</h1>
          ${priceHtml(p)}
          <p class="desc">${esc(p.desc)}</p>
          ${C ? `<blockquote>${esc(C.tagline)}</blockquote>` : ''}
          ${sibs.length > 1 ? `<div class="opt-label">Colour <span>${esc(p.color)}</span></div><div class="colours">${sibs.map(x => `<a class="${x.id === p.id ? 'on' : ''}" href="product.html?id=${encodeURIComponent(x.id)}"><span>${x.images && x.images[0] ? `<img src="${esc(src(x.images[0]))}" alt="">` : ''}</span>${esc(x.color)}</a>`).join('')}</div>` : ''}
          ${p.sizes && p.sizes.length ? `<div class="opt-label">Size <span id="size-pick">Pick a size</span></div><div class="sizes" id="sizes">${p.sizes.map(s => `<button data-size="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}
          ${canBuy(p) ? `<div class="buy-row">
              <span class="qty"><button data-q="-1" aria-label="Decrease">−</button><span id="qty">1</span><button data-q="1" aria-label="Increase">+</button></span>
              <button class="btn btn-ink" id="add">${p.status === 'preorder' ? 'Pre-order' : 'Add to bag'}</button>
            </div>`
            : p.status === 'coming-soon' ? `<a class="btn btn-honey btn-block" href="${notifyLink(p)}"><i class="fa-regular fa-bell"></i> Notify me when it drops</a>`
            : `<button class="btn btn-block" disabled>Sold out</button>`}
          <p class="note"><i class="fa-solid fa-truck-fast"></i>${esc(S.shippingNote)}</p>
          <div class="acc">
            ${p.details && p.details.length ? `<details open><summary>Details</summary><ul class="acc-body">${p.details.map(d => `<li>${esc(d)}</li>`).join('')}</ul></details>` : ''}
            <details><summary>Shipping</summary><div class="acc-body">${esc(S.shippingNote)}</div></details>
            <details><summary>Returns and exchanges</summary><div class="acc-body">Wrong size? Email us within 7 days of delivery and we'll sort out an exchange, as long as it's unworn.</div></details>
          </div>
        </div>
      </div>
      ${S.products.length > 1 ? `<section class="section"><div class="shop-head"><h2>You may also like</h2></div><div class="grid">${S.products.filter(x => x.id !== p.id).slice(0, 4).map(card).join('')}</div></section>` : ''}
      <div class="sticky-buy" id="sticky-buy"><span class="s-name">${esc(p.name)}<br>${priceHtml(p)}</span>${canBuy(p) ? `<button class="btn btn-ink" data-scroll-buy>${p.status === 'preorder' ? 'Pre-order' : 'Add to bag'}</button>` : p.status === 'coming-soon' ? `<a class="btn btn-honey" href="${notifyLink(p)}">Notify me</a>` : ''}</div>`;

    root.addEventListener('click', e => {
      const t = e.target.closest('[data-img]');
      if (t) { imgIdx = +t.dataset.img; $('#main-img').src = src(imgs[imgIdx]); $$('.thumbs button').forEach((b, i) => b.classList.toggle('on', i === imgIdx)); }
      const s = e.target.closest('[data-size]');
      if (s) { size = s.dataset.size; $$('#sizes button').forEach(b => b.classList.toggle('on', b === s)); $('#size-pick').textContent = size; $('#sizes').classList.remove('err'); }
      const qb = e.target.closest('[data-q]');
      if (qb) { qty = Math.max(1, Math.min(10, qty + +qb.dataset.q)); $('#qty').textContent = qty; }
      if (e.target.closest('#add') || e.target.closest('[data-scroll-buy]')) {
        if (p.sizes && p.sizes.length && !size) {
          $('#sizes').classList.add('err'); $('#size-pick').textContent = 'Please pick a size';
          $('#sizes').scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
        }
        cart.add(p.id, size, qty); toast(`${p.name}${size ? ' · ' + size : ''} added`);
      }
    });
    // show the sticky buy bar on phones once the main button scrolls away
    const mainBtn = $('#add') || $('.buy .btn');
    if (mainBtn && 'IntersectionObserver' in window) new IntersectionObserver(([en]) => $('#sticky-buy').classList.toggle('show', !en.isIntersecting && en.boundingClientRect.top < 0)).observe(mainBtn);
    reveals();
  }

  /* =================== CHECKOUT =================== */
  function checkout() {
    const root = $('#checkout-root');
    function draw() {
      if (!cart.count()) {
        root.innerHTML = `<div class="done"><i class="bee"></i><h1 class="checkout-title">Your bag is empty</h1><p class="muted">Add something first.</p><p style="margin-top:20px"><a class="btn btn-ink" href="index.html#shop">Browse the store</a></p></div>`;
        return;
      }
      const saved = store.get('tb_checkout', {});
      const f = (id, label, type = 'text', full = false, req = true, extra = '') =>
        `<div class="field${full ? ' full' : ''}"><label for="${id}">${label}${req ? '' : ' <span class="muted" style="font-weight:400">(optional)</span>'}</label>
         ${type === 'textarea' ? `<textarea id="${id}" ${req ? 'required' : ''}>${esc(saved[id] || '')}</textarea>` : `<input id="${id}" type="${type}" value="${esc(saved[id] || '')}" ${req ? 'required' : ''} ${extra}>`}</div>`;
      root.innerHTML = `
        <nav class="crumbs"><a href="index.html">Store</a><span>/</span><span>Checkout</span></nav>
        <div class="checkout">
          <div>
            <h1>Checkout</h1>
            <form class="form" id="co-form" novalidate>
              ${f('name', 'Full name', 'text', true, true, 'autocomplete="name"')}
              ${f('phone', 'Phone', 'tel', false, true, 'autocomplete="tel" inputmode="tel"')}
              ${f('email', 'Email', 'email', false, false, 'autocomplete="email"')}
              ${f('address', 'Address', 'textarea', true)}
              ${f('city', 'City', 'text', false, true, 'autocomplete="address-level2"')}
              ${f('pin', 'PIN code', 'text', false, true, 'inputmode="numeric" autocomplete="postal-code" maxlength="6"')}
              ${f('notes', 'Notes', 'textarea', true, false)}
            </form>
            <div class="how"><b>How ordering works.</b> We don't take payment on the site yet. Send us your order and we'll reply to confirm stock, delivery and payment (UPI or bank transfer).</div>
            <div class="pay-opts">
              ${S.orderWhatsApp ? '<button class="btn btn-honey btn-block" data-send="wa"><i class="fa-brands fa-whatsapp"></i> Send order on WhatsApp</button>' : ''}
              <button class="btn btn-ink btn-block" data-send="mail"><i class="fa-regular fa-envelope"></i> Send order by email</button>
            </div>
          </div>
          <aside class="summary">
            <h2>Order summary</h2>
            ${lineItems(false)}
            <div class="row" style="margin-top:14px"><span class="muted">Subtotal</span><b>${totalText()}</b></div>
            <div class="row"><span class="muted">Shipping</span><span>Confirmed by us</span></div>
            <div class="row total" style="margin-top:8px"><span>Total</span><span>${totalText()}</span></div>
          </aside>
        </div>`;
      $('#co-form').addEventListener('input', () => {
        const d = {}; ['name', 'phone', 'email', 'address', 'city', 'pin', 'notes'].forEach(k => { d[k] = $('#' + k).value; }); store.set('tb_checkout', d);
      });
    }
    function message(d) {
      const lines = cart.items().map(i => { const p = byId(i.id); return `• ${p.name}${i.size ? ' (' + i.size + ')' : ''} × ${i.qty}${p.price ? ' — ' + money(p.price * i.qty) : ''}`; }).join('\n');
      return `Hi TRNT BEE, I'd like to order:\n${lines}\n\nSubtotal: ${totalText()}\n\nName: ${d.name}\nPhone: ${d.phone}${d.email ? '\nEmail: ' + d.email : ''}\nAddress: ${d.address}, ${d.city} ${d.pin}${d.notes ? '\nNotes: ' + d.notes : ''}`;
    }
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-send]'); if (!b) return;
      const d = {}; let ok = true;
      ['name', 'phone', 'email', 'address', 'city', 'pin', 'notes'].forEach(k => {
        const el = $('#' + k); d[k] = el.value.trim();
        let bad = el.required && !d[k];
        if (k === 'phone' && d[k] && d[k].replace(/\D/g, '').length < 10) bad = true;
        if (k === 'pin' && d[k] && !/^\d{6}$/.test(d[k])) bad = true;
        if (k === 'email' && d[k] && !/^\S+@\S+\.\S+$/.test(d[k])) bad = true;
        el.parentElement.classList.toggle('err', bad); if (bad) ok = false;
      });
      if (!ok) { $('.field.err input, .field.err textarea').focus(); return; }
      const msg = message(d);
      const url = b.dataset.send === 'wa'
        ? `https://wa.me/${S.orderWhatsApp}?text=${encodeURIComponent(msg)}`
        : `mailto:${S.orderEmail}?subject=${encodeURIComponent('Store order from ' + d.name)}&body=${encodeURIComponent(msg)}`;
      window.open(url, b.dataset.send === 'wa' ? '_blank' : '_self');
      setTimeout(() => {
        root.innerHTML = `<div class="done"><i class="bee"></i><h1 class="checkout-title">Order ready to send</h1>
          <p class="muted" style="max-width:440px;margin:0 auto">Your ${b.dataset.send === 'wa' ? 'WhatsApp' : 'email app'} should have opened with the order filled in. Hit send there, and we'll reply to confirm.</p>
          <p style="margin-top:22px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a class="btn btn-line" href="${esc(url)}" ${b.dataset.send === 'wa' ? 'target="_blank" rel="noopener"' : ''}>Open it again</a><a class="btn btn-ink" href="index.html" data-clear>Done, clear my bag</a></p></div>`;
      }, 400);
    });
    document.addEventListener('click', e => { if (e.target.closest('[data-clear]')) cart.save([]); });
    document.addEventListener('cart', draw);
    draw();
  }

  /* ---------- go ---------- */
  header(); footer(); renderCount(); renderBag();
  if (page === 'home') home();
  if (page === 'product') product();
  if (page === 'checkout') checkout();
})();
