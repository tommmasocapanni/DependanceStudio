const siteDataPath = 'data/site-data.json';

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function createElement(tag, className, textContent) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent) el.textContent = textContent;
  return el;
}

function renderPage(data, slug) {
  const pageTitle = document.querySelector('#page-title');
  const pageContent = document.querySelector('#page-content');
  const pageSubtitle = document.querySelector('#page-subtitle');
  const pageLink = document.querySelector('#page-back');

  if (!pageTitle || !pageContent || !pageSubtitle || !pageLink) return;

  const project = data.projects.find((item) => item.slug === slug);
  const page = data.pages.find((item) => item.slug === slug);

  if (project) {
    document.title = `${project.title} | Dépendance Studio`;
    pageTitle.textContent = project.title;
    pageSubtitle.textContent = `${project.year} • ${project.client}`;
    if (project.content && project.content.trim()) {
      pageContent.innerHTML = project.content;
    } else {
      pageContent.innerHTML = `
        <img src="${project.image}" alt="${project.title}" loading="lazy" />
        <p>${project.description}</p>
        <div class="tags">${project.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>
      `;
    }
  } else if (page) {
    document.title = `${page.title} | Dépendance Studio`;
    pageTitle.textContent = page.title;
    pageSubtitle.textContent = page.description;
    pageContent.innerHTML = page.content;
  } else {
    document.title = 'Page not found | Dépendance Studio';
    pageTitle.textContent = 'Pagina non trovata';
    pageSubtitle.textContent = `Il contenuto richiesto non esiste ancora.`;
    pageContent.innerHTML = `<p>Controlla la URL o torna alla <a href="index.html">home</a>.</p>`;
  }

  pageLink.href = 'index.html';
}

async function loadPage() {
  const slug = getQueryParam('slug');
  if (!slug) {
    document.querySelector('#page-title').textContent = 'Pagina non valida';
    document.querySelector('#page-content').innerHTML = '<p>Inserisci un parametro slug valido nell’URL.</p>';
    return;
  }

  const response = await fetch(siteDataPath);
  const data = await response.json();
  renderPage(data, slug);
}

window.addEventListener('DOMContentLoaded', () => {
  loadPage().catch((error) => {
    console.error('Unable to load page data:', error);
    document.querySelector('#page-content').innerHTML = '<p>Impossibile caricare la pagina. Assicurati di servire il progetto tramite un server locale.</p>';
  });
});
