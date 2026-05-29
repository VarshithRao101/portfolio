/**
 * TRNTBEE Admin Control Panel — Full Logic
 * Manages: Auth, Projects, Research, Founder, Contact, Footer Socials
 * Data persisted in localStorage via SiteData store.
 */

/* =========================================================
   CREDENTIALS
   ========================================================= */
const ADMINS = [
  { user: 'varshith',    pass: 'honey2026',   role: 'Owner'  },
  { user: 'beesociety',  pass: 'swarm@2025',  role: 'Editor' },
  { user: 'trntbee',     pass: 'launch@101',  role: 'Editor' },
];

/* =========================================================
   STATE
   ========================================================= */
let data = {};
let editingProjectIdx = null;
let editingResearchIdx = null;
let currentUser = null;

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Check existing session
  const saved = sessionStorage.getItem('admin_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    bootDashboard();
  }

  setupLogin();
});

/* =========================================================
   LOGIN
   ========================================================= */
function setupLogin() {
  const form    = document.getElementById('loginForm');
  const errEl   = document.getElementById('loginErr');
  const passEl  = document.getElementById('adminPass');
  const toggleBtn = document.getElementById('togglePass');

  toggleBtn?.addEventListener('click', () => {
    const isPass = passEl.type === 'password';
    passEl.type = isPass ? 'text' : 'password';
    toggleBtn.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('adminUser').value.trim().toLowerCase();
    const p = passEl.value;
    const match = ADMINS.find(a => a.user === u && a.pass === p);
    if (match) {
      currentUser = match;
      sessionStorage.setItem('admin_user', JSON.stringify(match));
      errEl?.classList.add('hidden');
      bootDashboard();
    } else {
      errEl?.classList.remove('hidden');
      passEl.value = '';
    }
  });
}

/* =========================================================
   BOOT DASHBOARD
   ========================================================= */
function bootDashboard() {
  document.getElementById('loginGate')?.classList.add('hidden');
  document.getElementById('adminShell')?.classList.remove('hidden');
  document.getElementById('adminUserLabel').textContent = currentUser.user;

  data = SiteData.get();

  setupNav();
  setupSaveAll();
  setupLogout();

  renderDashboard();
  renderProjects();
  renderResearch();
  renderFounder();
  renderContact();
  renderFooterSocials();

  setupProjectModal();
  setupResearchModal();
  setupFounderSocialAdd();
  setupFooterSocialAdd();
}

/* =========================================================
   NAV
   ========================================================= */
const SECTION_TITLES = {
  dashboard: 'Dashboard',
  projects:  'Projects',
  research:  'Research & Patents',
  founder:   'Founder Info',
  contact:   'Contact & Social',
  footer:    'Footer Socials',
};

function setupNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const sec = btn.dataset.section;
      document.getElementById(`sec-${sec}`)?.classList.add('active');
      document.getElementById('sectionHeading').textContent = SECTION_TITLES[sec] || sec;
    });
  });
}

/* =========================================================
   SAVE ALL
   ========================================================= */
function setupSaveAll() {
  document.getElementById('saveAllBtn')?.addEventListener('click', () => {
    collectFounder();
    collectContact();
    collectFooterSocials();
    SiteData.save(data);
    showToast('All changes saved!');
    renderDashboard();
  });
}

/* =========================================================
   LOGOUT
   ========================================================= */
function setupLogout() {
  document.getElementById('logoutAdminBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem('admin_user');
    document.getElementById('adminShell')?.classList.add('hidden');
    document.getElementById('loginGate')?.classList.remove('hidden');
    document.getElementById('loginForm')?.reset();
    document.getElementById('loginErr')?.classList.add('hidden');
  });
}

/* =========================================================
   TOAST
   ========================================================= */
function showToast(msg = 'Saved!') {
  const t = document.getElementById('toast');
  const m = document.getElementById('toastMsg');
  if (!t) return;
  m.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}

/* =========================================================
   DASHBOARD
   ========================================================= */
function renderDashboard() {
  const inDevCount = (data.projects || []).filter(p => p.inDev).length;
  const socialCount = (data.footer?.socials || []).length;
  setText('stat-projects', (data.projects || []).length);
  setText('stat-research', (data.research || []).length);
  setText('stat-socials',  socialCount);
  setText('stat-indev',    inDevCount);
}

/* =========================================================
   PROJECTS
   ========================================================= */
function renderProjects() {
  const container = document.getElementById('projectsList');
  if (!container) return;
  container.innerHTML = '';
  (data.projects || []).forEach((proj, idx) => {
    const card = document.createElement('div');
    card.className = 'admin-card';

    const devTag = proj.inDev
      ? '<span class="tag-sm tag-indev-sm">In Dev</span>'
      : '<span class="tag-sm tag-live-sm">Live</span>';
    const catTag = proj.cat === 'startup'
      ? '<span class="tag-sm tag-startup">Start-Up</span>'
      : '<span class="tag-sm tag-community">Community</span>';

    card.innerHTML = `
      <div class="admin-card-thumb">
        ${proj.image ? `<img src="${proj.image}" alt="${proj.title}" onerror="this.parentNode.innerHTML='<i class=\\'fa-solid fa-cube\\'></i>'"/>` : '<i class="fa-solid fa-cube"></i>'}
      </div>
      <div class="admin-card-info">
        <h4>${proj.title}</h4>
        <p>${proj.desc}</p>
      </div>
      <div class="admin-card-meta">
        ${catTag}${devTag}
      </div>
      <div class="admin-card-actions">
        <button class="btn-edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;

    card.querySelector('.btn-edit').addEventListener('click', () => openProjectModal(idx));
    card.querySelector('.btn-delete').addEventListener('click', () => {
      if (confirm(`Delete "${proj.title}"?`)) {
        data.projects.splice(idx, 1);
        SiteData.save(data);
        renderProjects();
        renderDashboard();
        showToast('Project deleted');
      }
    });

    container.appendChild(card);
  });
}

function setupProjectModal() {
  document.getElementById('addProjectBtn')?.addEventListener('click', () => openProjectModal(null));
  document.getElementById('closeProjectModal')?.addEventListener('click', closeProjectModal);
  document.getElementById('cancelProjectModal')?.addEventListener('click', closeProjectModal);
  document.getElementById('saveProjectModal')?.addEventListener('click', saveProject);
}

function openProjectModal(idx) {
  editingProjectIdx = idx;
  const modal = document.getElementById('projectModal');
  const title = document.getElementById('projectModalTitle');

  if (idx !== null && data.projects[idx]) {
    const p = data.projects[idx];
    title.textContent = 'Edit Project';
    setVal('pm-id', p.id);
    setVal('pm-title', p.title);
    setVal('pm-cat', p.cat);
    setVal('pm-indev', String(p.inDev));
    setVal('pm-desc', p.desc);
    setVal('pm-desclong', p.descLong || '');
    setVal('pm-image', p.image || '');
    setVal('pm-url', p.appUrl || '');
    setVal('pm-tags', (p.tags || []).join(', '));
  } else {
    title.textContent = 'Add Project';
    ['pm-id','pm-title','pm-desc','pm-desclong','pm-image','pm-url','pm-tags'].forEach(id => setVal(id,''));
    setVal('pm-cat', 'startup');
    setVal('pm-indev', 'false');
  }

  modal?.classList.remove('hidden');
}

function closeProjectModal() {
  document.getElementById('projectModal')?.classList.add('hidden');
  editingProjectIdx = null;
}

function saveProject() {
  const proj = {
    id:       getVal('pm-id').trim() || `proj_${Date.now()}`,
    title:    getVal('pm-title').trim(),
    cat:      getVal('pm-cat'),
    inDev:    getVal('pm-indev') === 'true',
    desc:     getVal('pm-desc').trim(),
    descLong: getVal('pm-desclong').trim(),
    image:    getVal('pm-image').trim(),
    appUrl:   getVal('pm-url').trim(),
    tags:     getVal('pm-tags').split(',').map(t => t.trim()).filter(Boolean),
  };

  if (!proj.title) { alert('Title is required'); return; }

  if (editingProjectIdx !== null) {
    data.projects[editingProjectIdx] = proj;
    showToast('Project updated!');
  } else {
    data.projects.push(proj);
    showToast('Project added!');
  }

  SiteData.save(data);
  closeProjectModal();
  renderProjects();
  renderDashboard();
}

/* =========================================================
   RESEARCH
   ========================================================= */
function renderResearch() {
  const container = document.getElementById('researchList');
  if (!container) return;
  container.innerHTML = '';
  (data.research || []).forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    const typeTag = item.type === 'patent'
      ? '<span class="tag-sm tag-patent">Patent</span>'
      : '<span class="tag-sm tag-paper">Paper</span>';
    const statusTag = item.inProgress
      ? '<span class="tag-sm tag-indev-sm">In Progress</span>'
      : '<span class="tag-sm tag-live-sm">Published</span>';

    card.innerHTML = `
      <div class="admin-card-thumb" style="font-size:24px;">
        <i class="${item.icon || 'fa-solid fa-flask'}"></i>
      </div>
      <div class="admin-card-info">
        <h4>${item.title}</h4>
        <p>${item.desc}</p>
      </div>
      <div class="admin-card-meta">${typeTag}${statusTag}</div>
      <div class="admin-card-actions">
        <button class="btn-edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;

    card.querySelector('.btn-edit').addEventListener('click', () => openResearchModal(idx));
    card.querySelector('.btn-delete').addEventListener('click', () => {
      if (confirm(`Delete "${item.title}"?`)) {
        data.research.splice(idx, 1);
        SiteData.save(data);
        renderResearch();
        renderDashboard();
        showToast('Entry deleted');
      }
    });

    container.appendChild(card);
  });
}

function setupResearchModal() {
  document.getElementById('addResearchBtn')?.addEventListener('click', () => openResearchModal(null));
  document.getElementById('closeResearchModal')?.addEventListener('click', closeResearchModal);
  document.getElementById('cancelResearchModal')?.addEventListener('click', closeResearchModal);
  document.getElementById('saveResearchModal')?.addEventListener('click', saveResearch);
}

function openResearchModal(idx) {
  editingResearchIdx = idx;
  const modal = document.getElementById('researchModal');
  document.getElementById('researchModalTitle').textContent = idx !== null ? 'Edit Entry' : 'Add Entry';

  if (idx !== null && data.research[idx]) {
    const r = data.research[idx];
    setVal('rm-id', r.id);
    setVal('rm-type', r.type);
    setVal('rm-title', r.title);
    setVal('rm-icon', r.icon || '');
    setVal('rm-status', r.status || '');
    setVal('rm-inprogress', String(r.inProgress));
    setVal('rm-desc', r.desc);
    setVal('rm-desclong', r.descLong || '');
    setVal('rm-tags', (r.tags || []).join(', '));
  } else {
    ['rm-id','rm-title','rm-icon','rm-status','rm-desc','rm-desclong','rm-tags'].forEach(id => setVal(id,''));
    setVal('rm-type', 'patent');
    setVal('rm-inprogress', 'true');
  }

  modal?.classList.remove('hidden');
}

function closeResearchModal() {
  document.getElementById('researchModal')?.classList.add('hidden');
  editingResearchIdx = null;
}

function saveResearch() {
  const item = {
    id:         getVal('rm-id').trim() || `res_${Date.now()}`,
    type:       getVal('rm-type'),
    title:      getVal('rm-title').trim(),
    icon:       getVal('rm-icon').trim(),
    status:     getVal('rm-status').trim(),
    inProgress: getVal('rm-inprogress') === 'true',
    desc:       getVal('rm-desc').trim(),
    descLong:   getVal('rm-desclong').trim(),
    tags:       getVal('rm-tags').split(',').map(t => t.trim()).filter(Boolean),
  };

  if (!item.title) { alert('Title is required'); return; }

  if (editingResearchIdx !== null) {
    data.research[editingResearchIdx] = item;
    showToast('Entry updated!');
  } else {
    data.research.push(item);
    showToast('Entry added!');
  }

  SiteData.save(data);
  closeResearchModal();
  renderResearch();
  renderDashboard();
}

/* =========================================================
   FOUNDER
   ========================================================= */
function renderFounder() {
  const f = data.founder || {};
  setVal('f-name',  f.name  || '');
  setVal('f-title', f.title || '');
  setVal('f-bio',   f.bio   || '');
  setVal('f-photo', f.photo || '');
  renderFounderSocials();
}

function collectFounder() {
  if (!data.founder) data.founder = {};
  data.founder.name  = getVal('f-name').trim();
  data.founder.title = getVal('f-title').trim();
  data.founder.bio   = getVal('f-bio').trim();
  data.founder.photo = getVal('f-photo').trim();
  collectFounderSocials();
}

function renderFounderSocials() {
  const list = document.getElementById('founderSocialsList');
  if (!list) return;
  list.innerHTML = '';
  (data.founder?.socials || []).forEach((s, idx) => {
    list.appendChild(makeSocialRow(s, idx, 'founder'));
  });
}

function setupFounderSocialAdd() {
  document.getElementById('addFounderSocialBtn')?.addEventListener('click', () => {
    if (!data.founder.socials) data.founder.socials = [];
    data.founder.socials.push({ icon: 'fa-brands fa-github', url: '', label: 'GitHub' });
    renderFounderSocials();
  });
}

function collectFounderSocials() {
  const rows = document.querySelectorAll('#founderSocialsList .social-edit-row');
  data.founder.socials = [];
  rows.forEach(row => {
    data.founder.socials.push({
      icon:  row.querySelector('[data-field="icon"]')?.value.trim()  || '',
      url:   row.querySelector('[data-field="url"]')?.value.trim()   || '',
      label: row.querySelector('[data-field="label"]')?.value.trim() || '',
    });
  });
}

/* =========================================================
   CONTACT
   ========================================================= */
function renderContact() {
  const c = data.contact || {};
  setVal('c-instagram', c.instagramBee || '');
  setVal('c-whatsapp',  c.whatsapp     || '');
  setVal('c-emailbee',  c.emailBee     || '');
}

function collectContact() {
  if (!data.contact) data.contact = {};
  data.contact.instagramBee = getVal('c-instagram').trim();
  data.contact.whatsapp     = getVal('c-whatsapp').trim();
  data.contact.emailBee     = getVal('c-emailbee').trim();
}

/* =========================================================
   FOOTER SOCIALS
   ========================================================= */
function renderFooterSocials() {
  const list = document.getElementById('footerSocialsList');
  if (!list) return;
  list.innerHTML = '';
  (data.footer?.socials || []).forEach((s, idx) => {
    list.appendChild(makeSocialRow(s, idx, 'footer'));
  });
}

function setupFooterSocialAdd() {
  document.getElementById('addFooterSocialBtn')?.addEventListener('click', () => {
    if (!data.footer) data.footer = { socials: [] };
    if (!data.footer.socials) data.footer.socials = [];
    data.footer.socials.push({ icon: 'fa-brands fa-github', url: '', label: 'GitHub' });
    renderFooterSocials();
    renderDashboard();
  });
}

function collectFooterSocials() {
  const rows = document.querySelectorAll('#footerSocialsList .social-edit-row');
  if (!data.footer) data.footer = {};
  data.footer.socials = [];
  rows.forEach(row => {
    data.footer.socials.push({
      icon:  row.querySelector('[data-field="icon"]')?.value.trim()  || '',
      url:   row.querySelector('[data-field="url"]')?.value.trim()   || '',
      label: row.querySelector('[data-field="label"]')?.value.trim() || '',
    });
  });
}

/* =========================================================
   SHARED: SOCIAL ROW BUILDER
   ========================================================= */
function makeSocialRow(s, idx, context) {
  const row = document.createElement('div');
  row.className = 'social-edit-row';
  row.innerHTML = `
    <input data-field="icon"  value="${esc(s.icon  || '')}" placeholder="fa-brands fa-github" title="Font Awesome class"/>
    <input data-field="url"   value="${esc(s.url   || '')}" placeholder="https://..." title="URL" style="flex:2"/>
    <input data-field="label" value="${esc(s.label || '')}" placeholder="Label" style="flex:0.8"/>
    <button class="btn-delete" title="Remove"><i class="fa-solid fa-trash"></i></button>
  `;
  row.querySelector('.btn-delete').addEventListener('click', () => {
    if (context === 'founder') {
      data.founder.socials.splice(idx, 1);
      renderFounderSocials();
    } else {
      data.footer.socials.splice(idx, 1);
      renderFooterSocials();
      renderDashboard();
    }
  });
  return row;
}

/* =========================================================
   UTILS
   ========================================================= */
function getVal(id)       { return document.getElementById(id)?.value || ''; }
function setVal(id, val)  { const el = document.getElementById(id); if (el) el.value = val; }
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function esc(str)         { return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
