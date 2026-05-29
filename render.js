/**
 * TRNTBEE Site Renderer
 * Reads all content from SiteData (localStorage) and updates the live site.
 * Runs on every page load — admin changes are instantly reflected here.
 */

document.addEventListener('DOMContentLoaded', () => {
  const d = SiteData.get();

  renderFounder(d.founder);
  renderContact(d.contact);
  renderFooterSocials(d.footer?.socials);
  renderProjects(d.projects);
  renderResearch(d.research);
  renderLaunchStrip(d.founder, d.contact, d.projects);
});

/* =========================================================
   FOUNDER INFO
   ========================================================= */
function renderFounder(f) {
  if (!f) return;
  const nameEl = document.getElementById('founder-name');
  const titleEl = document.getElementById('founder-title');
  const bioEl = document.getElementById('founder-bio');
  const photoEl = document.getElementById('founder-photo');
  const socialsEl = document.getElementById('founder-socials');

  if (nameEl && f.name) nameEl.textContent = f.name;
  if (titleEl && f.title) titleEl.textContent = f.title;
  if (bioEl && f.bio) bioEl.textContent = f.bio;
  if (photoEl && f.photo) {
    photoEl.src = f.photo;
    photoEl.alt = f.name || 'Founder';
  }

  if (socialsEl && Array.isArray(f.socials) && f.socials.length) {
    socialsEl.innerHTML = f.socials.map(s =>
      `<a href="${s.url}" target="${s.url.startsWith('mailto') ? '_self' : '_blank'}" aria-label="${s.label || ''}">
         <i class="${s.icon}"></i>
       </a>`
    ).join('');
  }
}

/* =========================================================
   CONTACT / CTA LINKS
   ========================================================= */
function renderContact(c) {
  if (!c) return;

  const igLink = document.getElementById('cta-instagram-link');
  const waLink = document.getElementById('cta-whatsapp-link');
  const emlLink = document.getElementById('cta-email-link');
  const emlTxt = document.getElementById('cta-email-text');

  if (igLink && c.instagramBee) igLink.href = c.instagramBee;
  if (waLink && c.whatsapp) waLink.href = c.whatsapp;
  if (emlLink && c.emailBee) emlLink.href = `mailto:${c.emailBee}`;
  if (emlTxt && c.emailBee) emlTxt.textContent = c.emailBee;
}

/* =========================================================
   FOOTER SOCIALS
   ========================================================= */
function renderFooterSocials(socials) {
  const container = document.getElementById('footer-socials');
  if (!container || !Array.isArray(socials) || !socials.length) return;

  container.innerHTML = socials.map(s =>
    `<a href="${s.url}" target="${s.url.startsWith('mailto') ? '_self' : '_blank'}" class="social-link" aria-label="${s.label || ''}">
       <i class="${s.icon}"></i>
     </a>`
  ).join('');
}

/* =========================================================
   LAUNCH STRIP
   ========================================================= */
function renderLaunchStrip(founder, contact, projects) {
  const founderLinkEl = document.getElementById('launch-founder-link');
  const founderNameEl = document.getElementById('launch-founder-name');
  const founderEmailEl = document.getElementById('launch-founder-email');
  const productLinkEl = document.getElementById('launch-product-link');
  const productNameEl = document.getElementById('launch-product-name');

  const founderEmail = founder?.socials?.find(s => s.url?.startsWith('mailto:'))?.url?.replace('mailto:', '')
    || contact?.emailBee
    || '';

  if (founderLinkEl && founderEmail) founderLinkEl.href = `mailto:${founderEmail}`;
  if (founderNameEl && founder?.name) founderNameEl.textContent = founder.name;
  if (founderEmailEl && founderEmail) founderEmailEl.textContent = founderEmail;

  const strongestProduct = Array.isArray(projects)
    ? projects.find(p => p.cat === 'startup' && !p.inDev && p.appUrl && p.appUrl !== '#')
      || projects.find(p => !p.inDev && p.appUrl && p.appUrl !== '#')
    : null;

  if (strongestProduct && productLinkEl) {
    productLinkEl.href = strongestProduct.appUrl;
    productLinkEl.target = '_blank';
  }

  if (strongestProduct && productNameEl) {
    productNameEl.textContent = strongestProduct.title;
  }
}

function getModalData(primaryLabel, primaryHref, primaryDisabled) {
  return [
    `data-modal-primary-label="${primaryLabel}"`,
    `data-modal-primary-href="${primaryHref || ''}"`,
    `data-modal-primary-disabled="${primaryDisabled ? 'true' : 'false'}"`,
    'data-modal-secondary-label="Get in Touch"',
    'data-modal-secondary-href="#contact"'
  ].join(' ');
}

/* =========================================================
   PROJECTS GRID
   ========================================================= */
function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  if (!grid || !Array.isArray(projects) || !projects.length) return;

  grid.innerHTML = projects.map(p => buildProjectCard(p)).join('');

  setTimeout(() => {
    if (typeof window.setupTabFiltering === 'function') {
      window.setupTabFiltering('#tabs', '#projects-grid');
    }
    if (typeof window.initializeProjectCards === 'function') {
      window.initializeProjectCards('#projects-grid .project-card');
    }
    if (typeof window.bindProjectDemoButtons === 'function') {
      window.bindProjectDemoButtons(grid);
    }
  }, 50);
}

function buildProjectCard(p) {
  const isInDev = p.inDev === true;
  const hasLiveApp = Boolean(p.appUrl && p.appUrl !== '#');
  const catLabel = p.cat === 'startup' ? 'Start-Up' : 'Community';
  const tagClass = p.cat === 'startup' ? 'tag-startup' : 'tag-community';
  const modalData = getModalData(
    hasLiveApp ? 'Open Live App' : 'Launch Status',
    hasLiveApp ? p.appUrl : '',
    !hasLiveApp
  );

  const ribbon = isInDev ? '<div class="dev-ribbon">In Dev</div>' : '';
  const tagHtml = isInDev
    ? '<span class="project-tag tag-indev">In Development</span>'
    : `<span class="project-tag ${tagClass}">${catLabel}</span>`;

  const imgHtml = p.image
    ? `<img src="${p.image}" alt="${p.title}"
         onerror="this.parentNode.innerHTML='<div class=\\'project-img-placeholder\\'><i class=\\'fa-solid fa-cube\\'></i></div>'"/>`
    : '<div class="project-img-placeholder"><i class="fa-solid fa-cube"></i></div>';

  const tagsHtml = (p.tags || []).map(t => `<span class="tech-tag">${t}</span>`).join('');

  const backActions = isInDev
    ? `<div class="project-links">
         <button class="project-link demo-btn project-link-secondary" data-demo-id="${p.id}" ${modalData}>View Idea <i class="fa-solid fa-eye"></i></button>
         <a href="#contact" class="project-link">Notify Me <i class="fa-solid fa-bell"></i></a>
       </div>
       <div class="dev-notice"><i class="fa-solid fa-gear"></i> Actively being built — launching soon</div>`
    : `<div class="project-links">
         <a href="${p.appUrl}" target="_blank" class="project-link">View App <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
         <button class="project-link demo-btn project-link-secondary" data-demo-id="${p.id}" ${modalData}>Demo <i class="fa-solid fa-play"></i></button>
       </div>`;

  return `
    <li class="project-card reveal scale${isInDev ? ' in-dev' : ''}" data-cat="${p.cat}">
      <div class="w">
        <div class="f">
          ${ribbon}
          ${imgHtml}
          ${tagHtml}
          <div class="project-card-info">
            <h4 class="project-title">${p.title}</h4>
            <p class="project-desc">${p.desc}</p>
          </div>
        </div>
        <div class="b">
          <h4 class="overlay-title">${p.title}</h4>
          <p class="overlay-desc">${p.descLong || p.desc}</p>
          <div class="tech-stack-row">${tagsHtml}</div>
          ${backActions}
        </div>
      </div>
    </li>`;
}

/* =========================================================
   RESEARCH & PATENTS GRID
   ========================================================= */
function renderResearch(research) {
  const grid = document.getElementById('research-grid');
  if (!grid || !Array.isArray(research) || !research.length) return;

  grid.innerHTML = research.map(r => buildResearchCard(r)).join('');

  setTimeout(() => {
    if (typeof window.setupTabFiltering === 'function') {
      window.setupTabFiltering('#research-tabs', '#research-grid');
    }
    if (typeof window.initializeProjectCards === 'function') {
      window.initializeProjectCards('#research-grid .project-card');
    }
    if (typeof window.bindProjectDemoButtons === 'function') {
      window.bindProjectDemoButtons(grid);
    }
  }, 50);
}

function buildResearchCard(r) {
  const typeLabel = r.type === 'patent' ? 'Patent Pending' : 'Research Paper';
  const tagClass = r.type === 'patent' ? 'tag-patent' : 'tag-paper';
  const statusLabel = r.inProgress
    ? (r.type === 'patent' ? 'In Review' : 'In Progress')
    : (r.type === 'patent' ? 'Filed' : 'Published');
  const modalData = getModalData(statusLabel, '', true);
  const tagsHtml = (r.tags || []).map(t => {
    const isStatus = t.includes('In Progress') || t.includes('Disclosed') || t.includes('Published');
    if (isStatus && r.inProgress) {
      const icon = t.includes('Disclosed') ? 'fa-lock' : (r.type === 'patent' ? 'fa-gear' : 'fa-file-pen');
      return `<span class="tech-tag"><i class="fa-solid ${icon}" style="font-size:10px;margin-right:4px;"></i> ${t}</span>`;
    }
    return `<span class="tech-tag">${t}</span>`;
  }).join('');

  const backActions = `
    <div class="project-links">
      <button class="project-link demo-btn project-link-secondary" data-demo-id="${r.id}" ${modalData}>${r.type === 'patent' ? 'View Patent' : 'Read Paper'} <i class="fa-solid fa-book-open"></i></button>
      <button type="button" class="project-link project-link-disabled" disabled>${statusLabel} <i class="fa-solid fa-circle-info"></i></button>
    </div>
  `;

  return `
    <li class="project-card reveal scale" data-cat="${r.type}">
      <div class="w">
        <div class="f">
          <div class="project-img-placeholder"><i class="${r.icon || 'fa-solid fa-flask'}" style="color:var(--y1);font-size:48px;"></i></div>
          <span class="project-tag ${tagClass}">${typeLabel}</span>
          <div class="project-card-info">
            <h4 class="project-title">${r.title}</h4>
            <p class="project-desc">${r.desc}</p>
          </div>
        </div>
        <div class="b">
          <h4 class="overlay-title">${r.title}</h4>
          <p class="overlay-desc">${r.descLong || r.desc}</p>
          <div class="tech-stack-row">${tagsHtml}</div>
          ${backActions}
        </div>
      </div>
    </li>`;
}
