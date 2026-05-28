const siteDataPath = 'data/site-data.json';

function createElement(tag, className, textContent) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent) el.textContent = textContent;
  return el;
}

function renderHero(data) {
  const hero = document.querySelector('#hero');
  if (!hero) return;
  hero.innerHTML = `
    <div class="hero-content">
      <div class="eyebrow">${data.label}</div>
      <h1>${data.title}</h1>
      <div class="hero-subtitle">${data.subtitle}</div>
      <p>${data.description}</p>
      <a class="button" href="${data.ctaUrl}">${data.ctaText}</a>
    </div>
  `;
}

function renderWorkSection(section, projects) {
  const target = document.querySelector('#work');
  if (!target) return;
  target.innerHTML = `
    <div class="section-title">
      <div>
        <h2>${section.title}</h2>
        <div class="section-meta">(${section.count}) • ${section.subtitle}</div>
      </div>
      <a class="button" href="admin/">Admin</a>
    </div>
    <div class="grid work-grid" id="work-grid"></div>
  `;

  const grid = target.querySelector('#work-grid');
  projects.forEach((project) => {
    const card = createElement('article', 'card');
    card.innerHTML = `
      <img src="${project.image}" alt="${project.title}" loading="lazy" />
      <div class="card-meta"><span>${project.year}</span><span>${project.client}</span></div>
      <h3>${project.title}</h3>
      <p>${project.description}</p>
      <div class="tags">${project.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>
      <a class="button" href="page.html?slug=${project.slug}">View Project</a>
    `;
    grid.appendChild(card);
  });
}

function renderServices(services) {
  const target = document.querySelector('#services');
  if (!target) return;
  target.innerHTML = `
    <div class="section-title">
      <div>
        <h2>${services.title}</h2>
        <div class="section-meta">${services.description}</div>
      </div>
    </div>
    <div class="services"></div>
  `;

  const container = target.querySelector('.services');
  services.items.forEach((item) => {
    const card = createElement('article', 'service-card');
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    `;
    container.appendChild(card);
  });
}

function renderFooter(footer) {
  const target = document.querySelector('#footer');
  if (!target) return;
  target.innerHTML = `
    <div class="footer-grid">
      <div>
        <div class="brand">${footer.brand}</div>
        <div>${footer.location}</div>
        <div>${footer.contact}</div>
      </div>
      <div>
        <div class="section-title"><h2>Links</h2></div>
        ${footer.links.map((link) => `<a href="${link.url}">${link.label}</a>`).join('<br/>')}
      </div>
    </div>
    <div class="footer-note">
      ${footer.social.map((item) => `<a href="${item.url}" target="_blank">${item.label}</a>`).join(' • ')}
    </div>
  `;
}

async function loadSite() {
  const response = await fetch(siteDataPath);
  const data = await response.json();
  document.title = data.site.title;
  document.querySelector('meta[name="description"]').setAttribute('content', data.site.description);

  renderHero(data.site.hero);
  renderWorkSection(data.site.sections.work, data.projects);
  renderServices(data.site.sections.services);
  renderFooter(data.site.footer);
}

window.addEventListener('DOMContentLoaded', () => {
  loadSite().catch((error) => {
    console.error('Unable to load site data:', error);
    const main = document.querySelector('main');
    if (main) main.innerHTML = '<p>Impossibile caricare i contenuti del sito. Assicurati di servire il progetto tramite un server locale.</p>';
  });
});
