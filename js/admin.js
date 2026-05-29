// ===== CONSTANTS & STATE =====
const ADMIN_PASSWORD = 'Dependance1!';
const STORAGE_KEY = 'dependanceSiteData';
const BASE_DATA_PATH = '../data/site-data.json';

let currentData = null;
let activeTab = 'dashboard';
let editingProject = null;
let editingPage = null;
let editorMode = 'form';
let previewMode = 'homepage';
let panelCollapsed = false;
let editingHome = false;

function renderEditorTabs(activeMode, onChangeMode) {
  const tabs = createElement('div', 'editor-tabs');
  
  const formBtn = createElement('button', activeMode === 'form' ? 'tab-btn active' : 'tab-btn', '📝 Form Editor');
  formBtn.type = 'button';
  formBtn.addEventListener('click', () => onChangeMode('form'));
  
  const codeBtn = createElement('button', activeMode === 'code' ? 'tab-btn active' : 'tab-btn', '💻 Code Editor');
  codeBtn.type = 'button';
  codeBtn.addEventListener('click', () => onChangeMode('code'));
  
  tabs.appendChild(formBtn);
  tabs.appendChild(codeBtn);
  return tabs;
}

// ===== HELPERS =====
function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function getStoredData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error('Error reading/parsing stored data from localStorage:', e);
    return null;
  }
}

function setStoredData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving data to localStorage:', e);
  }
}

function buildField(label, value, onChange, path) {
  const row = createElement('div', 'form-group');
  const labelEl = createElement('label', null, label);
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value || '';
  if (path) input.setAttribute('data-form-path', path);
  input.addEventListener('input', (e) => onChange(e.target.value));
  row.appendChild(labelEl);
  row.appendChild(input);
  return row;
}

function buildTextarea(label, value, onChange, path) {
  const row = createElement('div', 'form-group');
  const labelEl = createElement('label', null, label);
  const textarea = document.createElement('textarea');
  textarea.rows = 4;
  textarea.value = value || '';
  if (path) textarea.setAttribute('data-form-path', path);
  textarea.addEventListener('input', (e) => onChange(e.target.value));
  row.appendChild(labelEl);
  row.appendChild(textarea);
  return row;
}

// ===== RENDER LOGIN =====
function renderLogin() {
  const loginDiv = document.getElementById('admin-login');
  loginDiv.innerHTML = '';
  loginDiv.style.display = 'block';
  
  const container = createElement('div', 'login-container');
  const card = createElement('div', 'login-card');
  
  const title = createElement('h2', null, 'DÉPENDANCE ADMIN');
  const desc = createElement('p', null, 'ENTER PASSWORD TO ACCESS THE ADMIN AREA');
  
  const input = document.createElement('input');
  input.type = 'password';
  input.placeholder = 'PASSWORD';
  input.className = 'form-group';
  input.style.padding = '0.6rem 0.75rem';
  input.style.borderRadius = '6px';
  input.style.fontFamily = 'inherit';
  input.style.fontSize = '0.85rem';
  input.style.marginBottom = '1rem';
  input.style.width = '100%';
  input.style.boxSizing = 'border-box';
  
  const button = createElement('button', 'btn-primary', '🔓 ENTER ADMIN');
  button.style.width = '100%';
  button.addEventListener('click', () => {
    if (input.value === ADMIN_PASSWORD) {
      try {
        localStorage.setItem('adminAuthenticated', 'true');
      } catch (e) {
        console.error('Error setting auth state in localStorage:', e);
      }
      loginDiv.style.display = 'none';
      document.getElementById('admin-editor').style.display = 'block';
      loadEditor();
    } else {
      const error = createElement('p', 'error-msg', '❌ WRONG PASSWORD');
      card.appendChild(error);
      setTimeout(() => error.remove(), 3000);
      input.value = '';
    }
  });
  
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') button.click();
  });
  
  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(input);
  card.appendChild(button);
  container.appendChild(card);
  loginDiv.appendChild(container);
}

function renderSidebar() {
  const sidebar = createElement('nav', 'admin-sidebar');
  
  const brand = createElement('div', 'sidebar-brand');
  brand.innerHTML = '<strong>Dépendance</strong><span>Admin</span>';
  sidebar.appendChild(brand);

  const nav = createElement('div', 'sidebar-nav');
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'projects', label: 'Projects', icon: '🎯' },
    { id: 'pages', label: 'Pages', icon: '📄' },
    { id: 'footer', label: 'Footer', icon: '🔗' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  navItems.forEach((item) => {
    const link = createElement('a', activeTab === item.id ? 'nav-item active' : 'nav-item', `${item.icon} ${item.label}`);
    link.addEventListener('click', (e) => {
      e.preventDefault();
      editingProject = null;
      editingPage = null;
      editingHome = false;
      editorMode = 'form';
      previewMode = 'homepage';
      if (item.id === 'home') {
        editingHome = true;
      } else {
        activeTab = item.id;
      }
      renderWorkspace();
    });
    nav.appendChild(link);
  });

  sidebar.appendChild(nav);

  const footer = createElement('div', 'sidebar-footer');
  const saveBtn = createElement('button', 'btn-sm', '💾 Save');
  saveBtn.addEventListener('click', async () => {
    setStoredData(currentData);
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentData)
      });
      const result = await res.json();
      if (result.ok) {
        alert('✅ Saved to server (site-data.json updated)');
      } else {
        alert('❌ Server error: ' + (result.error || 'unknown'));
      }
    } catch (err) {
      alert('⚠️ Saved to browser only. Server not reachable.\nRun: python3 server.py');
    }
  });
  const exportBtn = createElement('button', 'btn-sm', '⬇️ Export');
  exportBtn.addEventListener('click', () => {
    const json = JSON.stringify(currentData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'site-data.json';
    anchor.click();
    URL.revokeObjectURL(url);
  });
  footer.appendChild(saveBtn);
  footer.appendChild(exportBtn);

  // Theme toggle
  const themeBtn = createElement('button', 'theme-toggle', '');
  function updateThemeBtn() {
    const theme = document.getElementById('admin-editor').getAttribute('data-theme') || 'auto';
    if (theme === 'dark') themeBtn.textContent = '🌙 Dark';
    else if (theme === 'light') themeBtn.textContent = '☀️ Light';
    else themeBtn.textContent = '🖥️ System';
  }
  themeBtn.addEventListener('click', () => {
    const current = document.getElementById('admin-editor').getAttribute('data-theme') || 'auto';
    const next = current === 'auto' ? 'light' : current === 'light' ? 'dark' : 'auto';
    document.getElementById('admin-editor').setAttribute('data-theme', next);
    try { localStorage.setItem('adminTheme', next); } catch (e) {}
    updateThemeBtn();
  });
  footer.appendChild(themeBtn);
  sidebar.appendChild(footer);

  return sidebar;
}

function navigateTo(tabId) {
  editingProject = null;
  editingPage = null;
  editingHome = tabId === 'home';
  editorMode = 'form';
  previewMode = 'homepage';
  if (tabId !== 'home') activeTab = tabId;
  renderWorkspace();
}

function renderDashboard() {
  const container = createElement('div', 'admin-panel dashboard-panel');

  const header = createElement('div', 'panel-header');
  header.innerHTML = '<h1>Dashboard</h1><p>Overview of your portfolio content.</p>';
  container.appendChild(header);

  // Stats row
  const statsGrid = createElement('div', 'dashboard-stats');
  const stats = [
    { label: 'Projects', value: currentData.projects.length, icon: '🎯', tab: 'projects' },
    { label: 'Pages', value: currentData.pages.length, icon: '📄', tab: 'pages' },
    { label: 'Services', value: currentData.site.sections.services.items.length, icon: '⚡', tab: 'home' },
    { label: 'Footer Links', value: currentData.site.footer.links.length, icon: '🔗', tab: 'footer' },
  ];
  stats.forEach(s => {
    const card = createElement('div', 'dashboard-card clickable');
    card.innerHTML = `<div class="card-icon">${s.icon}</div><div class="card-stat">${s.value}</div><div class="card-label">${s.label}</div>`;
    card.addEventListener('click', () => navigateTo(s.tab));
    statsGrid.appendChild(card);
  });
  container.appendChild(statsGrid);

  // Recent projects
  if (currentData.projects.length > 0) {
    const recentTitle = createElement('h3', 'dashboard-section-title', 'Recent Projects');
    container.appendChild(recentTitle);
    const recentGrid = createElement('div', 'dashboard-recent');
    const slice = currentData.projects.slice(0, 4);
    slice.forEach((p, i) => {
      const idx = currentData.projects.indexOf(p);
      const item = createElement('div', 'dashboard-recent-item');
      if (p.image) {
        const img = createElement('div', 'recent-item-img');
        img.style.backgroundImage = `url('${p.image}')`;
        item.appendChild(img);
      } else {
        const placeholder = createElement('div', 'recent-item-img placeholder');
        placeholder.textContent = p.title.charAt(0);
        item.appendChild(placeholder);
      }
      const info = createElement('div', 'recent-item-info');
      info.innerHTML = `<strong>${p.title}</strong><span>${p.client || ''} ${p.year ? '• ' + p.year : ''}</span>`;
      item.appendChild(info);
      item.addEventListener('click', () => {
        editingProject = idx;
        editorMode = 'form';
        previewMode = 'detail';
        renderWorkspace();
      });
      recentGrid.appendChild(item);
    });
    container.appendChild(recentGrid);
  }

  // Quick actions
  const actionsTitle = createElement('h3', 'dashboard-section-title', 'Quick Actions');
  container.appendChild(actionsTitle);
  const actions = createElement('div', 'dashboard-actions');

  const addProjectBtn = createElement('button', 'btn-primary', '+ Add Project');
  addProjectBtn.addEventListener('click', () => {
    currentData.projects.push({
      slug: `project-${Date.now()}`,
      title: 'New Project',
      client: 'Client Name',
      year: '2026',
      description: 'Project description',
      tags: [],
      image: '',
      content: ''
    });
    editingProject = currentData.projects.length - 1;
    editorMode = 'form';
    previewMode = 'detail';
    renderWorkspace();
  });
  actions.appendChild(addProjectBtn);

  const editHeroBtn = createElement('button', 'btn-secondary', 'Edit Hero');
  editHeroBtn.addEventListener('click', () => navigateTo('home'));
  actions.appendChild(editHeroBtn);

  const saveBtn = createElement('button', 'btn-primary', '💾 Save All');
  saveBtn.addEventListener('click', async () => {
    setStoredData(currentData);
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentData)
      });
      const result = await res.json();
      alert(result.ok ? '✅ Saved to server' : '❌ Server error: ' + (result.error || 'unknown'));
    } catch (err) {
      alert('⚠️ Saved to browser only. Run: python3 server.py');
    }
  });
  actions.appendChild(saveBtn);

  const exportBtn = createElement('button', 'btn-secondary', '⬇️ Export JSON');
  exportBtn.addEventListener('click', () => {
    const json = JSON.stringify(currentData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'site-data.json';
    anchor.click();
    URL.revokeObjectURL(url);
  });
  actions.appendChild(exportBtn);

  container.appendChild(actions);
  return container;
}

function renderHeroEditor() {
  const container = createElement('div', 'admin-panel editor-panel');
  container.innerHTML = '<div class="panel-header"><h1>Hero Section</h1><p>Edit the homepage hero content.</p></div>';

  const form = createElement('div', 'editor-form');
  form.appendChild(buildField('01_EYEBROW_LABEL', currentData.site.hero.label, (val) => {
    currentData.site.hero.label = val;
    updatePreview();
  }));
  form.appendChild(buildField('02_HEADLINE', currentData.site.hero.title, (val) => {
    currentData.site.hero.title = val;
    updatePreview();
  }));
  form.appendChild(buildField('03_SUBHEADLINE', currentData.site.hero.subtitle, (val) => {
    currentData.site.hero.subtitle = val;
    updatePreview();
  }));
  form.appendChild(buildTextarea('04_DESCRIPTION', currentData.site.hero.description, (val) => {
    currentData.site.hero.description = val;
    updatePreview();
  }));
  form.appendChild(buildField('05_CTA_TEXT', currentData.site.hero.ctaText, (val) => {
    currentData.site.hero.ctaText = val;
    updatePreview();
  }));
  form.appendChild(buildField('06_CTA_URL', currentData.site.hero.ctaUrl, (val) => {
    currentData.site.hero.ctaUrl = val;
    updatePreview();
  }));

  container.appendChild(form);
  return container;
}

function renderProjectsEditor() {
  const container = createElement('div', 'admin-panel projects-panel');
  container.innerHTML = '<div class="panel-header"><h1>Projects</h1><p>Manage your project portfolio.</p></div>';

  const grid = createElement('div', 'projects-grid');
  
  currentData.projects.forEach((project, index) => {
    const card = createElement('div', 'project-edit-card');
    const imgStyle = project.image ? `background-image: url('${project.image}');` : '';
    card.innerHTML = `
      <div class="project-image-placeholder" style="${imgStyle} background-size: cover;"></div>
      <div class="project-info">
        <h4>${project.title}</h4>
        <p class="meta">${project.client} • ${project.year}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      editingProject = index;
      editorMode = 'form';
      previewMode = 'detail';
      renderWorkspace();
    });
    grid.appendChild(card);
  });

  const addBtn = createElement('button', 'project-add-card', '+ Add Project');
  addBtn.addEventListener('click', () => {
    currentData.projects.push({
      slug: `project-${Date.now()}`,
      title: 'New Project',
      client: 'Client Name',
      year: '2026',
      description: 'Project description',
      image: '',
      tags: ['design'],
      content: ''
    });
    renderWorkspace();
  });
  grid.appendChild(addBtn);

  container.appendChild(grid);
  return container;
}

function renderProjectDetail() {
  if (editingProject === null) return null;
  
  const project = currentData.projects[editingProject];
  const container = createElement('div', 'admin-panel editor-panel');
  
  const header = createElement('div', 'panel-header');
  header.innerHTML = `<h1>Edit Project</h1><p>Update project details.</p>`;
  container.appendChild(header);
  
  const tabs = renderEditorTabs(editorMode, (mode) => {
    editorMode = mode;
    renderWorkspace();
  });
  container.appendChild(tabs);
  
  if (editorMode === 'form') {
    const form = createElement('div', 'editor-form');
    form.appendChild(buildField('01_PROJECT_TITLE', project.title, (val) => {
      currentData.projects[editingProject].title = val;
      updatePreview();
    }));
    form.appendChild(buildField('02_CLIENT_NAME', project.client, (val) => {
      currentData.projects[editingProject].client = val;
      updatePreview();
    }));
    form.appendChild(buildField('03_YEAR', project.year, (val) => {
      currentData.projects[editingProject].year = val;
      updatePreview();
    }));
    form.appendChild(buildField('04_PROJECT_SLUG', project.slug, (val) => {
      currentData.projects[editingProject].slug = val;
    }));
    form.appendChild(buildField('05_IMAGE_URL', project.image, (val) => {
      currentData.projects[editingProject].image = val;
      updatePreview();
    }));
    form.appendChild(buildTextarea('06_DESCRIPTION', project.description, (val) => {
      currentData.projects[editingProject].description = val;
      updatePreview();
    }));
    form.appendChild(buildField('07_TAGS (COMMA_SEPARATED)', project.tags ? project.tags.join(', ') : '', (val) => {
      currentData.projects[editingProject].tags = val.split(',').map(t => t.trim()).filter(Boolean);
      updatePreview();
    }));
    form.appendChild(buildTextarea('08_CONTENT (HTML)', project.content || '', (val) => {
      currentData.projects[editingProject].content = val;
      updatePreview();
    }));

    const actions = createElement('div', 'form-actions');
    const backBtn = createElement('button', 'btn-secondary', '← Back');
    backBtn.addEventListener('click', () => {
      editingProject = null;
      activeTab = 'projects';
      editorMode = 'form';
      previewMode = 'homepage';
      renderWorkspace();
    });
    const deleteBtn = createElement('button', 'btn-danger', '🗑 Delete');
    deleteBtn.addEventListener('click', () => {
      if (confirm('Delete this project?')) {
        currentData.projects.splice(editingProject, 1);
        editingProject = null;
        activeTab = 'projects';
        editorMode = 'form';
        previewMode = 'homepage';
        renderWorkspace();
      }
    });
    actions.appendChild(backBtn);
    actions.appendChild(deleteBtn);
    form.appendChild(actions);

    container.appendChild(form);
  } else {
    const codeContainer = createElement('div', 'code-editor-container');
    
    const desc = createElement('p', 'form-group', null);
    desc.innerHTML = `<label>JSON Data Editor (Format: JSON Object)</label>`;
    codeContainer.appendChild(desc);
    
    const textarea = createElement('textarea', 'code-editor-textarea');
    textarea.value = JSON.stringify(project, null, 2);
    
    const errorMsg = createElement('div', 'code-editor-error');
    errorMsg.style.display = 'none';
    
    textarea.addEventListener('input', (e) => {
      try {
        const parsed = JSON.parse(e.target.value);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          throw new Error('JSON must be a key-value object.');
        }
        currentData.projects[editingProject] = parsed;
        errorMsg.style.display = 'none';
        textarea.style.borderColor = 'rgba(79, 152, 255, 0.4)';
        updatePreview();
      } catch (err) {
        errorMsg.textContent = `⚠️ Invalid JSON: ${err.message}`;
        errorMsg.style.display = 'block';
        textarea.style.borderColor = '#ff6b6b';
      }
    });
    
    codeContainer.appendChild(textarea);
    codeContainer.appendChild(errorMsg);
    
    const actions = createElement('div', 'form-actions');
    const backBtn = createElement('button', 'btn-secondary', '← Back');
    backBtn.addEventListener('click', () => {
      editingProject = null;
      activeTab = 'projects';
      editorMode = 'form';
      previewMode = 'homepage';
      renderWorkspace();
    });
    actions.appendChild(backBtn);
    codeContainer.appendChild(actions);
    
    container.appendChild(codeContainer);
  }
  return container;
}

function renderPagesEditor() {
  const container = createElement('div', 'admin-panel pages-panel');
  container.innerHTML = '<div class="panel-header"><h1>Pages</h1><p>Manage your custom pages.</p></div>';

  const list = createElement('div', 'pages-list');
  
  currentData.pages.forEach((page, index) => {
    const item = createElement('div', 'page-item');
    item.innerHTML = `<strong>${page.title}</strong><span class="slug">/${page.slug}</span>`;
    item.addEventListener('click', () => {
      editingPage = index;
      editorMode = 'form';
      previewMode = 'detail';
      renderWorkspace();
    });
    list.appendChild(item);
  });

  const addBtn = createElement('button', 'btn-primary', '+ Add Page');
  addBtn.addEventListener('click', () => {
    currentData.pages.push({
      slug: `page-${Date.now()}`,
      title: 'New Page',
      description: 'Page description',
      content: '<p>Page content here</p>'
    });
    renderWorkspace();
  });

  container.appendChild(list);
  container.appendChild(addBtn);
  return container;
}

function renderPageDetail() {
  if (editingPage === null) return null;
  
  const page = currentData.pages[editingPage];
  const container = createElement('div', 'admin-panel editor-panel');
  
  const header = createElement('div', 'panel-header');
  header.innerHTML = `<h1>Edit Page</h1><p>Update page content.</p>`;
  container.appendChild(header);
  
  const tabs = renderEditorTabs(editorMode, (mode) => {
    editorMode = mode;
    renderWorkspace();
  });
  container.appendChild(tabs);
  
  if (editorMode === 'form') {
    const form = createElement('div', 'editor-form');
    form.appendChild(buildField('01_PAGE_TITLE', page.title, (val) => {
      currentData.pages[editingPage].title = val;
      updatePreview();
    }));
    form.appendChild(buildField('02_URL_SLUG', page.slug, (val) => {
      currentData.pages[editingPage].slug = val;
    }));
    form.appendChild(buildTextarea('03_DESCRIPTION', page.description, (val) => {
      currentData.pages[editingPage].description = val;
      updatePreview();
    }));
    form.appendChild(buildTextarea('04_CONTENT (HTML)', page.content, (val) => {
      currentData.pages[editingPage].content = val;
      updatePreview();
    }));

    const actions = createElement('div', 'form-actions');
    const backBtn = createElement('button', 'btn-secondary', '← Back');
    backBtn.addEventListener('click', () => {
      editingPage = null;
      activeTab = 'pages';
      editorMode = 'form';
      previewMode = 'homepage';
      renderWorkspace();
    });
    const deleteBtn = createElement('button', 'btn-danger', '🗑 Delete');
    deleteBtn.addEventListener('click', () => {
      if (confirm('Delete this page?')) {
        currentData.pages.splice(editingPage, 1);
        editingPage = null;
        activeTab = 'pages';
        editorMode = 'form';
        previewMode = 'homepage';
        renderWorkspace();
      }
    });
    actions.appendChild(backBtn);
    actions.appendChild(deleteBtn);
    form.appendChild(actions);

    container.appendChild(form);
  } else {
    const codeContainer = createElement('div', 'code-editor-container');
    
    const desc = createElement('p', 'form-group', null);
    desc.innerHTML = `<label>Direct HTML Page Content Editor</label>`;
    codeContainer.appendChild(desc);
    
    const textarea = createElement('textarea', 'code-editor-textarea');
    textarea.value = page.content || '';
    
    textarea.addEventListener('input', (e) => {
      currentData.pages[editingPage].content = e.target.value;
      updatePreview();
    });
    
    codeContainer.appendChild(textarea);
    
    const actions = createElement('div', 'form-actions');
    const backBtn = createElement('button', 'btn-secondary', '← Back');
    backBtn.addEventListener('click', () => {
      editingPage = null;
      activeTab = 'pages';
      editorMode = 'form';
      previewMode = 'homepage';
      renderWorkspace();
    });
    actions.appendChild(backBtn);
    codeContainer.appendChild(actions);
    
    container.appendChild(codeContainer);
  }
  return container;
}

function renderFooterLinkEditor(label, url, onChangeLabel, onChangeUrl, onRemove) {
  const row = createElement('div', 'form-group-inline');
  row.style.cssText = 'display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;';
  
  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.placeholder = 'Label';
  labelInput.value = label || '';
  labelInput.style.flex = '1';
  labelInput.addEventListener('input', (e) => onChangeLabel(e.target.value));
  
  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.placeholder = 'URL';
  urlInput.value = url || '';
  urlInput.style.flex = '1.5';
  urlInput.addEventListener('input', (e) => onChangeUrl(e.target.value));
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = '✕';
  removeBtn.style.cssText = 'background: none; border: 1px solid rgba(255,255,255,0.15); color: #ff6b6b; cursor: pointer; padding: 0.25rem 0.5rem; font-size: 0.8rem; border-radius: 0.25rem;';
  removeBtn.addEventListener('click', onRemove);
  
  row.appendChild(labelInput);
  row.appendChild(urlInput);
  row.appendChild(removeBtn);
  return row;
}

function renderFooterEditor() {
  const container = createElement('div', 'admin-panel editor-panel');
  container.innerHTML = '<div class="panel-header"><h1>Footer</h1><p>Edit footer information.</p></div>';

  const form = createElement('div', 'editor-form');
  form.appendChild(buildField('01_BRAND_NAME', currentData.site.footer.brand, (val) => {
    currentData.site.footer.brand = val;
    updatePreview();
  }));
  form.appendChild(buildField('02_LOCATION', currentData.site.footer.location, (val) => {
    currentData.site.footer.location = val;
    updatePreview();
  }));
  form.appendChild(buildField('03_CONTACT_EMAIL', currentData.site.footer.contact, (val) => {
    currentData.site.footer.contact = val;
    updatePreview();
  }));

  // LINKS
  const linksHeader = createElement('h3', null, '04_NAV_LINKS');
  linksHeader.style.cssText = 'margin: 1.5rem 0 0.75rem; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; color: #8f8f95;';
  form.appendChild(linksHeader);
  
  function renderLinks() {
    const existing = form.querySelector('.footer-links-container');
    if (existing) existing.remove();
    
    const linksContainer = createElement('div', 'footer-links-container');
    currentData.site.footer.links.forEach((link, i) => {
      const editor = renderFooterLinkEditor(
        link.label, link.url,
        (val) => { currentData.site.footer.links[i].label = val; },
        (val) => { currentData.site.footer.links[i].url = val; },
        () => {
          currentData.site.footer.links.splice(i, 1);
          renderLinks();
        }
      );
      linksContainer.appendChild(editor);
    });
    
    const addLinkBtn = createElement('button', 'btn-sm', '+ Add Link');
    addLinkBtn.type = 'button';
    addLinkBtn.style.cssText = 'margin-top: 0.5rem;';
    addLinkBtn.addEventListener('click', () => {
      currentData.site.footer.links.push({ label: 'New Link', url: '#' });
      renderLinks();
    });
    linksContainer.appendChild(addLinkBtn);
    
    form.appendChild(linksContainer);
  }
  renderLinks();

  // SOCIAL
  const socialHeader = createElement('h3', null, '05_SOCIAL_LINKS');
  socialHeader.style.cssText = 'margin: 1.5rem 0 0.75rem; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; color: #8f8f95;';
  form.appendChild(socialHeader);
  
  function renderSocial() {
    const existing = form.querySelector('.footer-social-container');
    if (existing) existing.remove();
    
    const socialContainer = createElement('div', 'footer-social-container');
    currentData.site.footer.social.forEach((item, i) => {
      const editor = renderFooterLinkEditor(
        item.label, item.url,
        (val) => { currentData.site.footer.social[i].label = val; },
        (val) => { currentData.site.footer.social[i].url = val; },
        () => {
          currentData.site.footer.social.splice(i, 1);
          renderSocial();
        }
      );
      socialContainer.appendChild(editor);
    });
    
    const addSocialBtn = createElement('button', 'btn-sm', '+ Add Social');
    addSocialBtn.type = 'button';
    addSocialBtn.style.cssText = 'margin-top: 0.5rem;';
    addSocialBtn.addEventListener('click', () => {
      currentData.site.footer.social.push({ label: 'New Social', url: '#' });
      renderSocial();
    });
    socialContainer.appendChild(addSocialBtn);
    
    form.appendChild(socialContainer);
  }
  renderSocial();

  container.appendChild(form);
  return container;
}

function renderSettings() {
  const container = createElement('div', 'admin-panel settings-panel');
  container.innerHTML = '<div class="panel-header"><h1>Settings</h1><p>Import and export your content.</p></div>';

  const section = createElement('div', 'settings-section');
  section.innerHTML = '<h3>Import / Export</h3>';

  const importRow = createElement('div', 'form-group');
  const importLabel = createElement('label', null, 'Import JSON');
  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = '.json';
  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          currentData = data;
          alert('Data imported successfully!');
          renderWorkspace();
        } catch (err) {
          alert('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  });
  importRow.appendChild(importLabel);
  importRow.appendChild(importInput);
  section.appendChild(importRow);

  const resetBtn = createElement('button', 'btn-danger', 'Reset to Original');
  resetBtn.addEventListener('click', async () => {
    if (confirm('Reset all changes? This cannot be undone.')) {
      const response = await fetch(BASE_DATA_PATH);
      const baseData = await response.json();
      currentData = baseData;
      localStorage.removeItem(STORAGE_KEY);
      renderWorkspace();
    }
  });
  section.appendChild(resetBtn);

  container.appendChild(section);
  return container;
}

function renderPreview() {
  const preview = createElement('div', 'preview-container');
  
  // Create preview header
  const header = createElement('div', 'preview-header');
  const title = createElement('h2', null, 'Live Preview');
  header.appendChild(title);
  
  // Show toggle selector if editing a project or page
  if (editingProject !== null || editingPage !== null) {
    const selector = createElement('div', 'preview-selector');
    
    const homeBtn = createElement('button', previewMode === 'homepage' ? 'selector-btn active' : 'selector-btn', '🏡 Home View');
    homeBtn.type = 'button';
    homeBtn.addEventListener('click', () => {
      previewMode = 'homepage';
      updatePreview();
    });
    
    const detailLabel = editingProject !== null ? '📄 Project Page' : '📄 Custom Page';
    const detailBtn = createElement('button', previewMode === 'detail' ? 'selector-btn active' : 'selector-btn', detailLabel);
    detailBtn.type = 'button';
    detailBtn.addEventListener('click', () => {
      previewMode = 'detail';
      updatePreview();
    });
    
    selector.appendChild(homeBtn);
    selector.appendChild(detailBtn);
    header.appendChild(selector);
  }
  
  preview.appendChild(header);
  
  const content = createElement('div', 'preview-content');
  
  if (previewMode === 'detail' && editingProject !== null) {
    const project = currentData.projects[editingProject];
    const tagsHtml = (project.tags || []).map(t => `<span class="tag" style="border: 1px solid rgba(255,255,255,0.1); padding: 0.35rem 0.65rem; border-radius: 999px; font-size: 0.8rem; color: #d3d3d7; display: inline-block;">${t}</span>`).join(' ');
    const bodyContent = (project.content && project.content.trim())
      ? project.content
      : `
        ${project.image ? `<img src="${project.image}" alt="${project.title}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 0.55rem; display: block; margin-bottom: 1.5rem;" />` : `
          <div style="width: 100%; height: 180px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 0.55rem; display: flex; align-items: center; justify-content: center; color: #8f8f95; margin-bottom: 1.5rem; font-size: 0.9rem;">No Image Selected</div>
        `}
        <p style="white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6; color: #dcdce0; margin-bottom: 1.5rem;">${project.description || ''}</p>
        <div class="tags" style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom: 2rem;">${tagsHtml}</div>
      `;
    content.innerHTML = `
      <header class="container header" style="padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 1.5rem; width: 100%;">
        <div class="brand" style="letter-spacing: 0.25em; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">Dépendance Studio</div>
      </header>
      <div class="project-detail-preview" style="width: 100%;">
        <h1 style="font-size: 1.85rem; margin: 0 0 0.5rem; letter-spacing: -0.02em; font-weight: bold; color: #f4f4f5;">${project.title || 'Untitled'}</h1>
        <div style="color: #8f8f95; font-size: 0.85rem; margin-bottom: 1.5rem;">${project.year || ''} • ${project.client || ''}</div>
        ${bodyContent}
        <div style="margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1.5rem;">
          <a class="button" href="#" onclick="event.preventDefault();" style="font-size: 0.85rem; padding: 0.65rem 1.2rem; border: 1px solid #f4f4f5; display: inline-flex; align-items: center; border-radius: 0.25rem;">Back to home</a>
        </div>
      </div>
    `;
  } else if (previewMode === 'detail' && editingPage !== null) {
    const page = currentData.pages[editingPage];
    content.innerHTML = `
      <header class="container header" style="padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 1.5rem; width: 100%;">
        <div class="brand" style="letter-spacing: 0.25em; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">Dépendance Studio</div>
      </header>
      <div class="page-detail-preview" style="width: 100%;">
        <h1 style="font-size: 1.85rem; margin: 0 0 0.5rem; letter-spacing: -0.02em; font-weight: bold; color: #f4f4f5;">${page.title || 'Untitled'}</h1>
        <div style="color: #8f8f95; font-size: 0.85rem; margin-bottom: 1.5rem;">${page.description || ''}</div>
        <div style="font-size: 0.95rem; line-height: 1.6; color: #dcdce0; margin-bottom: 1.5rem;">${page.content || ''}</div>
        <div style="margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1.5rem;">
          <a class="button" href="#" onclick="event.preventDefault();" style="font-size: 0.85rem; padding: 0.65rem 1.2rem; border: 1px solid #f4f4f5; display: inline-flex; align-items: center; border-radius: 0.25rem;">Back to home</a>
        </div>
      </div>
    `;
  } else {
    content.innerHTML = `
      <div class="preview-hero">
        <span class="eyebrow">${currentData.site.hero.label}</span>
        <h1>${currentData.site.hero.title}</h1>
        <h2>${currentData.site.hero.subtitle}</h2>
        <p>${currentData.site.hero.description}</p>
        <a href="${currentData.site.hero.ctaUrl}" class="preview-cta" onclick="event.preventDefault();">${currentData.site.hero.ctaText}</a>
      </div>
      <div class="preview-projects">
        <h3>Featured Projects</h3>
        <div class="preview-projects-grid">
          ${currentData.projects.slice(0, 3).map((p) => `
            <div class="preview-project-card">
              <div class="preview-project-image" style="background-image: url('${p.image}');"></div>
              <div class="preview-project-info">
                <h4>${p.title}</h4>
                <p>${p.client} • ${p.year}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="preview-footer">
        <p><strong>${currentData.site.footer.brand}</strong></p>
        <p>${currentData.site.footer.location}</p>
        <p><a href="mailto:${currentData.site.footer.contact}" onclick="event.preventDefault();">${currentData.site.footer.contact}</a></p>
      </div>
    `;
  }
  
  preview.appendChild(content);
  return preview;
}

function updatePreview() {
  const previewContainer = document.querySelector('.preview-container');
  if (previewContainer) {
    const newPreview = renderPreview();
    previewContainer.replaceWith(newPreview);
  }
}

// ===== WYSIWYG CANVAS RENDERER =====
function renderCanvas() {
  const canvas = createElement('div', 'canvas-viewport');
  const isPage = editingPage !== null;

  const toolbar = createElement('div', 'canvas-toolbar');
  const toolbarLeft = createElement('div', 'canvas-toolbar-left');
  const toolbarCenter = createElement('div', 'canvas-toolbar-center');
  const toolbarRight = createElement('div', 'canvas-toolbar-right');

  if (isPage) {
    const pg = currentData.pages[editingPage];
    const titleSpan = document.createElement('span');
    titleSpan.className = 'canvas-toolbar-title';
    titleSpan.contentEditable = 'true';
    titleSpan.spellcheck = false;
    titleSpan.textContent = pg.title || 'Untitled';
    titleSpan.addEventListener('blur', () => {
      currentData.pages[editingPage].title = titleSpan.textContent;
    });
    titleSpan.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); titleSpan.blur(); }
    });
    toolbarLeft.appendChild(titleSpan);

    const statusBadge = createElement('span', 'canvas-toolbar-status', pg.status || 'Draft');
    const publishBtn = createElement('button', 'canvas-toolbar-btn primary', 'Publish');
    toolbarRight.appendChild(statusBadge);
    toolbarRight.appendChild(publishBtn);
  } else {
    let contextLabel = '';
    if (editingHome) {
      contextLabel = 'EDITING: HOME PAGE';
    } else if (editingProject !== null) {
      const p = currentData.projects[editingProject];
      contextLabel = `EDITING: ${(p.title || 'UNTITLED').toUpperCase()}`;
    }
    const label = createElement('span', 'canvas-toolbar-label', contextLabel);
    const hint = createElement('span', 'canvas-toolbar-hint', editorMode === 'code' ? '' : 'CLICK ANY TEXT TO EDIT INLINE');
    toolbarLeft.appendChild(label);
    toolbarLeft.appendChild(hint);

    const togglePanelBtn = createElement('button', 'canvas-toolbar-btn', panelCollapsed ? '◀ SHOW PANEL' : 'HIDE PANEL ▶');
    togglePanelBtn.addEventListener('click', () => {
      panelCollapsed = !panelCollapsed;
      renderWorkspace();
    });
    toolbarRight.appendChild(togglePanelBtn);
  }

  // Center toggle: Form / Code
  const toggleWrap = createElement('div', 'canvas-toolbar-toggle');
  const formBtn = createElement('button', 'canvas-toolbar-btn' + (editorMode === 'form' ? ' active' : ''), 'Form');
  formBtn.addEventListener('click', () => { editorMode = 'form'; renderWorkspace(); });
  const codeBtn = createElement('button', 'canvas-toolbar-btn' + (editorMode === 'code' ? ' active' : ''), 'Code');
  codeBtn.addEventListener('click', () => { editorMode = 'code'; renderWorkspace(); });
  toggleWrap.appendChild(formBtn);
  toggleWrap.appendChild(codeBtn);
  toolbarCenter.appendChild(toggleWrap);

  const backBtn = createElement('button', 'canvas-toolbar-btn danger', '✕ CLOSE');
  backBtn.addEventListener('click', () => {
    activeTab = editingHome ? 'dashboard' : (editingProject !== null ? 'projects' : (editingPage !== null ? 'pages' : 'dashboard'));
    editingProject = null;
    editingPage = null;
    editingHome = false;
    editorMode = 'form';
    previewMode = 'homepage';
    panelCollapsed = false;
    renderWorkspace();
  });
  toolbarRight.appendChild(backBtn);

  toolbar.appendChild(toolbarLeft);
  toolbar.appendChild(toolbarCenter);
  toolbar.appendChild(toolbarRight);
  canvas.appendChild(toolbar);

  const frame = createElement('div', 'canvas-frame');

  if (editorMode === 'code') {
    frame.classList.add('code-mode');
    frame.appendChild(renderCanvasCodeEditor());
  } else if (editingHome) {
    frame.appendChild(renderHomeCanvas());
  } else if (editingProject !== null) {
    frame.appendChild(renderProjectCanvas());
  } else if (editingPage !== null) {
    frame.appendChild(renderPageCanvas());
  }

  canvas.appendChild(frame);
  return canvas;
}

// ===== SYNTAX HIGHLIGHTING =====
function highlightJSON(code) {
  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let isContentValue = false;
  return escaped.replace(/("(?:[^"\\]|\\.)*?")(\s*:)|("(?:[^"\\]|\\.)*?")|(\b(?:true|false|null)\b)|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|([{}[\],])/g, (match, key, colon, str, bool, num, punct) => {
    if (key) {
      isContentValue = key === '"content"';
      return `<span class="hl-json-key">${key}</span>${colon}`;
    }
    if (str) {
      if (isContentValue) {
        isContentValue = false;
        const inner = str.slice(1, -1);
        const highlighted = highlightHTMLContent(inner);
        return `<span class="hl-json-string">"${highlighted}"</span>`;
      }
      return `<span class="hl-json-string">${str}</span>`;
    }
    if (bool) { isContentValue = false; return `<span class="hl-json-bool">${bool}</span>`; }
    if (num) { isContentValue = false; return `<span class="hl-json-num">${num}</span>`; }
    if (punct) { isContentValue = false; return `<span class="hl-json-punct">${punct}</span>`; }
    return match;
  });
}

function highlightHTML(code) {
  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(
    /(&lt;\/?[\w:-]+(?:\s[^&]*?)?\/?&gt;|&lt;!--[\s\S]*?--&gt;)/g,
    (match, tag) => {
      if (tag.startsWith('&lt;!--')) return `<span class="hl-html-comment">${tag}</span>`;
      return tag.replace(
        /(&lt;\/?[\w:-]+)|([\w:-]+)(?=\s*=)|("(?:[^"\\]|\\.)*?")|('(?:[^'\\]|\\.)*?')/g,
        (m, tagName, attr, strD, strS) => {
          if (tagName) return `<span class="hl-html-tag">${tagName}</span>`;
          if (attr) return `<span class="hl-html-attr">${attr}</span>`;
          if (strD) return `<span class="hl-html-string">${strD}</span>`;
          if (strS) return `<span class="hl-html-string">${strS}</span>`;
          return m;
        }
      );
    }
  );
}

function highlightCode(code, isHTML) {
  const html = isHTML ? highlightHTML(code) : highlightJSON(code);
  return html || '<br>';
}

function normalizeJSON(code) {
  let result = '';
  let i = 0;
  while (i < code.length) {
    const marker = '"content": "';
    if (code.slice(i).startsWith(marker)) {
      result += marker;
      i += marker.length;
      let value = '';
      while (i < code.length) {
        if (code[i] === '\\') {
          value += code[i] + code[i + 1];
          i += 2;
        } else if (code[i] === '"') {
          break;
        } else if (code[i] === '\n') {
          value += '\\n';
          i++;
          while (i < code.length && (code[i] === ' ' || code[i] === '\t')) {
            i++;
          }
        } else {
          value += code[i];
          i++;
        }
      }
      result += value + '"';
      i++;
    } else {
      result += code[i];
      i++;
    }
  }
  return result;
}

function toDisplayJSON(obj) {
  const json = JSON.stringify(obj, null, 2);
  let result = '';
  let i = 0;
  while (i < json.length) {
    const marker = '"content": "';
    if (json.slice(i).startsWith(marker)) {
      result += marker;
      i += marker.length;
      let value = '';
      while (i < json.length) {
        if (json[i] === '\\' && json[i + 1] === 'n') {
          value += '\n';
          i += 2;
        } else if (json[i] === '\\' && json[i + 1] === '"') {
          value += '\\"';
          i += 2;
        } else if (json[i] === '\\' && json[i + 1] === '\\') {
          value += '\\\\';
          i += 2;
        } else if (json[i] === '"') {
          break;
        } else {
          value += json[i];
          i++;
        }
      }
      result += value + '"';
      i++;
    } else {
      result += json[i];
      i++;
    }
  }
  return result;
}

function formatHTML(html) {
  let result = '';
  let indent = 0;
  const tokens = html.split(/(<[^>]+>)/);
  for (const token of tokens) {
    if (!token) continue;
    if (token.startsWith('<')) {
      const isClosing = token.startsWith('</');
      const isSelfClosing = token.endsWith('/>') || /^(?:<br|<img|<hr|<input|<meta|<link|<area|<base|<col|<embed|<source|<track|<wbr)/i.test(token);
      if (isClosing) indent = Math.max(0, indent - 1);
      result += '\n' + '  '.repeat(indent) + token;
      if (!isClosing && !isSelfClosing) indent++;
    } else {
      const text = token.trim();
      if (text) {
        result += '\n' + '  '.repeat(indent) + text;
      }
    }
  }
  return result.trim();
}

function highlightHTMLContent(escapedContent) {
  return escapedContent.replace(
    /(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?[\w:-]+)([\s\S]*?)(\/?&gt;)/g,
    (match, comment, openTag, attrs, close) => {
      if (comment) return `<span class="hl-html-comment">${comment}</span>`;
      const hlAttrs = attrs.replace(
        /(\s+)([\w:-]+)(?=\s*=)/g,
        (m, ws, attr) => `${ws}<span class="hl-html-attr">${attr}</span>`
      );
      return `<span class="hl-html-tag">${openTag}</span>${hlAttrs}${close}`;
    }
  );
}

// ===== FULL-SCREEN CODE EDITOR (replaces canvas in code mode) =====
function renderCanvasCodeEditor() {
  const container = createElement('div', 'canvas-code-editor');

  let data, fileName, isHTML;
  if (editingHome) {
    const hero = currentData.site.hero;
    const services = currentData.site.sections.services;
    const work = currentData.site.sections.work;
    const footer = currentData.site.footer;
    data = { hero, services, work, footer: { brand: footer.brand, location: footer.location, contact: footer.contact, links: footer.links, social: footer.social } };
    fileName = 'home.json';
  } else if (editingProject !== null) {
    data = currentData.projects[editingProject];
    fileName = (data.slug || 'project') + '.json';
  } else if (editingPage !== null) {
    isHTML = true;
    fileName = (currentData.pages[editingPage].slug || 'page') + '.html';
  }

  const header = createElement('div', 'canvas-code-editor-header');
  const fileTab = document.createElement('span');
  fileTab.className = 'file-tab';
  fileTab.textContent = fileName;
  header.appendChild(fileTab);
  container.appendChild(header);

  const body = createElement('div', 'canvas-code-editor-body');

  const lineNumbers = createElement('div', 'line-numbers');
  body.appendChild(lineNumbers);

  const editor = createElement('pre', 'code-editor-pre');
  editor.contentEditable = true;
  editor.spellcheck = false;
  editor.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  });

  let displayData = data;
  if (editingProject !== null && data && data.content) {
    displayData = { ...data, content: formatHTML(data.content) };
  }
  const initialCode = editingPage !== null
    ? (currentData.pages[editingPage].content || '')
    : toDisplayJSON(displayData);
  editor.innerHTML = highlightCode(initialCode, isHTML);

  body.appendChild(editor);
  container.appendChild(body);

  const statusBar = createElement('div', 'canvas-code-editor-status');
  statusBar.innerHTML = '<span class="status-indicator">●</span> Ready';
  container.appendChild(statusBar);

  function getCode() { return editor.textContent; }

  function updateLineNumbers() {
    const lines = getCode().split('\n');
    lineNumbers.textContent = lines.map((_, i) => i + 1).join('\n');
  }
  updateLineNumbers();

  function saveCaret() {
    const sel = document.getSelection();
    if (!sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    const pre = range.cloneRange();
    pre.selectNodeContents(editor);
    pre.setEnd(range.endContainer, range.endOffset);
    return pre.toString().length;
  }

  function restoreCaret(offset) {
    if (offset === null) return;
    const sel = document.getSelection();
    const range = document.createRange();
    let charCount = 0;
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (charCount + node.length >= offset) {
        range.setStart(node, offset - charCount);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      charCount += node.length;
    }
    range.selectNodeContents(editor);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  editor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = editor.scrollTop;
  });

  let updating = false;
  editor.addEventListener('input', () => {
    if (updating) return;
    const caret = saveCaret();
    updating = true;
    updateLineNumbers();
    editor.innerHTML = highlightCode(getCode(), isHTML);
    restoreCaret(caret);
    updating = false;
    try {
      const raw = getCode();
      if (editingPage !== null) {
        currentData.pages[editingPage].content = raw;
        statusBar.innerHTML = '<span class="status-indicator success">●</span> Saved';
      } else {
        const parsed = JSON.parse(normalizeJSON(raw));
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          throw new Error('JSON must be a key-value object');
        }
        if (editingHome) {
          if ('hero' in parsed) currentData.site.hero = parsed.hero;
          if ('services' in parsed) currentData.site.sections.services = parsed.services;
          if ('work' in parsed) currentData.site.sections.work = parsed.work;
          if ('footer' in parsed) currentData.site.footer = parsed.footer;
        } else {
          currentData.projects[editingProject] = parsed;
        }
        statusBar.innerHTML = '<span class="status-indicator success">●</span> Valid JSON';
      }
    } catch (err) {
      statusBar.innerHTML = `<span class="status-indicator error">●</span> ${err.message}`;
    }
  });

  editor.addEventListener('keydown', (e) => {
    if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (editingPage === null) {
        try {
          const parsed = JSON.parse(normalizeJSON(getCode()));
          const formatted = toDisplayJSON(parsed);
          editor.innerHTML = highlightCode(formatted, false);
          updateLineNumbers();
          statusBar.innerHTML = '<span class="status-indicator success">●</span> Formatted';
        } catch (err) {
          statusBar.innerHTML = `<span class="status-indicator error">●</span> Cannot format: ${err.message}`;
        }
      }
    }
  });

  return container;
}

function makeEditable(element, dataKey, updateFn) {
  element.setAttribute('contenteditable', 'true');
  element.setAttribute('data-canvas-key', dataKey);
  element.classList.add('canvas-editable');
  element.setAttribute('spellcheck', 'false');
  
  element.addEventListener('focus', () => {
    element.classList.add('canvas-editing');
  });
  
  element.addEventListener('blur', () => {
    element.classList.remove('canvas-editing');
    const newVal = element.textContent;
    updateFn(newVal);
    // Sync form panel inputs if visible
    const formInput = document.querySelector(`[data-form-path="${dataKey}"]`);
    if (formInput) {
      formInput.value = newVal;
    }
  });
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      element.blur();
    }
  });
  
  return element;
}

function renderProjectCanvas() {
  const project = currentData.projects[editingProject];
  const page = createElement('div', 'canvas-page');
  
  // Main content
  const main = document.createElement('main');
  main.className = 'container';
  
  const section = createElement('section', 'section');
  
  // Section title: h2 (editable) + subtitle (editable year • client)
  const sectionTitle = createElement('div', 'section-title');
  const titleWrap = document.createElement('div');
  
  const titleEl = createElement('h2', 'canvas-title');
  titleEl.textContent = project.title || 'Untitled';
  makeEditable(titleEl, 'project.title', (val) => {
    currentData.projects[editingProject].title = val;
  });
  titleWrap.appendChild(titleEl);
  
  const subtitle = createElement('div', 'section-meta');
  const yearSpan = document.createElement('span');
  yearSpan.textContent = project.year || '';
  makeEditable(yearSpan, 'project.year', (val) => {
    currentData.projects[editingProject].year = val;
  });
  subtitle.appendChild(yearSpan);
  subtitle.append(' • ');
  const clientSpan = document.createElement('span');
  clientSpan.textContent = project.client || '';
  makeEditable(clientSpan, 'project.client', (val) => {
    currentData.projects[editingProject].client = val;
  });
  subtitle.appendChild(clientSpan);
  titleWrap.appendChild(subtitle);
  
  sectionTitle.appendChild(titleWrap);
  section.appendChild(sectionTitle);
  
  // Page content: use content HTML if present, else fallback to image + description + tags
  const pageContent = createElement('div', 'page-content');
  pageContent.id = 'page-content';
  
  if (project.content && project.content.trim()) {
    pageContent.innerHTML = project.content;

    // Hide elements not needed in admin (only useful on the live site)
    pageContent.querySelectorAll('.svg-info, .cover-2.none').forEach(el => {
      el.style.display = 'none';
    });

    // Make images editable
    pageContent.querySelectorAll('img').forEach(img => {
      img.style.cursor = 'pointer';
      img.title = 'Click to edit image URL';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        const newUrl = prompt('Edit image URL:', img.getAttribute('src') || '');
        if (newUrl !== null) {
          img.setAttribute('src', newUrl);
          currentData.projects[editingProject].content = pageContent.innerHTML;
        }
      });
    });

    // Make video containers editable (data-video-urls)
    pageContent.querySelectorAll('[data-video-urls]').forEach(el => {
      el.style.cursor = 'pointer';
      el.title = 'Click to edit video URLs';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentVal = el.getAttribute('data-video-urls') || '';
        const newVal = prompt('Edit video URLs (comma separated):', currentVal);
        if (newVal !== null) {
          el.setAttribute('data-video-urls', newVal);
          currentData.projects[editingProject].content = pageContent.innerHTML;
        }
      });
    });

    // Make iframes/embeds editable
    pageContent.querySelectorAll('iframe').forEach(iframe => {
      iframe.style.cursor = 'pointer';
      iframe.title = 'Click to edit embed URL';
      iframe.addEventListener('click', (e) => {
        e.stopPropagation();
        const newUrl = prompt('Edit embed URL:', iframe.src || '');
        if (newUrl !== null) {
          iframe.src = newUrl;
          currentData.projects[editingProject].content = pageContent.innerHTML;
        }
      });
    });

    // Make videos editable (inline <video> with <source>)
    pageContent.querySelectorAll('video').forEach(video => {
      const source = video.querySelector('source');
      const currentSrc = source ? source.getAttribute('src') || '' : video.getAttribute('src') || '';
      video.style.cursor = 'pointer';
      video.title = 'Click to edit video URL';
      video.addEventListener('click', (e) => {
        e.stopPropagation();
        const newUrl = prompt('Edit video URL:', currentSrc);
        if (newUrl !== null) {
          if (source) {
            source.setAttribute('src', newUrl);
          } else {
            video.setAttribute('src', newUrl);
          }
          video.load();
          currentData.projects[editingProject].content = pageContent.innerHTML;
        }
      });
    });

    // Make links editable
    pageContent.querySelectorAll('a[href]').forEach(a => {
      a.style.cursor = 'pointer';
      a.title = 'Click to edit link URL';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const newUrl = prompt('Edit link URL:', a.getAttribute('href') || '');
        if (newUrl !== null) {
          a.setAttribute('href', newUrl);
          currentData.projects[editingProject].content = pageContent.innerHTML;
        }
      });
    });

    pageContent.setAttribute('contenteditable', 'true');
    pageContent.classList.add('canvas-editable');
    pageContent.addEventListener('blur', () => {
      currentData.projects[editingProject].content = pageContent.innerHTML;
    });
  } else {
    if (project.image) {
      const img = document.createElement('img');
      img.src = project.image;
      img.alt = project.title || '';
      img.className = 'canvas-cover-img';
      img.loading = 'lazy';
      img.addEventListener('click', () => {
        const newUrl = prompt('IMAGE URL:', project.image || '');
        if (newUrl !== null) {
          currentData.projects[editingProject].image = newUrl;
          img.src = newUrl;
          const formInput = document.querySelector('[data-form-path="project.image"]');
          if (formInput) formInput.value = newUrl;
        }
      });
      pageContent.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'width: 100%; padding: 3rem 0; text-align: center; border: 2px dashed rgba(255,255,255,0.1); border-radius: 0.5rem; cursor: pointer; color: #8f8f95; font-size: 0.85rem;';
      placeholder.textContent = 'CLICK TO ADD IMAGE';
      placeholder.addEventListener('click', () => {
        const newUrl = prompt('IMAGE URL:');
        if (newUrl) {
          currentData.projects[editingProject].image = newUrl;
          renderWorkspace();
        }
      });
      pageContent.appendChild(placeholder);
    }
    
    const descEl = document.createElement('p');
    descEl.textContent = project.description || '';
    descEl.style.cssText = 'margin-top: 1.5rem; line-height: 1.6;';
    makeEditable(descEl, 'project.description', (val) => {
      currentData.projects[editingProject].description = val;
    });
    pageContent.appendChild(descEl);
    
    const tagsWrap = createElement('div', 'tags');
    tagsWrap.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1.5rem;';
    (project.tags || []).forEach((tag, i) => {
      const tagEl = createElement('span', 'tag');
      tagEl.textContent = tag;
      makeEditable(tagEl, `project.tags.${i}`, (val) => {
        currentData.projects[editingProject].tags[i] = val;
      });
      tagsWrap.appendChild(tagEl);
    });
    
    const addTagBtn = createElement('button', 'tag', '+');
    addTagBtn.style.cssText = 'border: 1px dashed rgba(255,255,255,0.2); background: transparent; color: #8f8f95; cursor: pointer; font-family: inherit; font-size: 0.85rem;';
    addTagBtn.addEventListener('click', () => {
      if (!currentData.projects[editingProject].tags) currentData.projects[editingProject].tags = [];
      currentData.projects[editingProject].tags.push('new');
      renderWorkspace();
    });
    tagsWrap.appendChild(addTagBtn);
    pageContent.appendChild(tagsWrap);
  }
  
  section.appendChild(pageContent);
  main.appendChild(section);
  
  // Back link
  const backWrap = createElement('div', 'form-actions');
  backWrap.style.cssText = 'margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.08);';
  const backLink = document.createElement('a');
  backLink.className = 'button';
  backLink.textContent = '← Back to home';
  backLink.href = '#';
  backLink.onclick = (e) => { e.preventDefault(); };
  backWrap.appendChild(backLink);
  main.appendChild(backWrap);
  
  page.appendChild(main);
  
  return page;
}

function renderPageCanvas() {
  const pg = currentData.pages[editingPage];
  const page = createElement('div', 'canvas-page');
  
  // Header — matches page.html
  const header = createElement('header', 'container header');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 0;';
  const brand = createElement('div', 'brand', 'Dépendance Studio');
  const nav = createElement('nav', 'nav-list');
  nav.innerHTML = `
    <a href="#" onclick="event.preventDefault();">Home</a>
    <a href="#" onclick="event.preventDefault();">About</a>
    <a href="#" onclick="event.preventDefault();">Admin</a>
  `;
  header.appendChild(brand);
  header.appendChild(nav);
  page.appendChild(header);
  
  const main = document.createElement('main');
  main.className = 'container';
  
  const section = createElement('section', 'section');
  
  // Section title
  const sectionTitle = createElement('div', 'section-title');
  const titleWrap = document.createElement('div');
  
  const titleEl = createElement('h2', 'canvas-title');
  titleEl.textContent = pg.title || 'Untitled';
  makeEditable(titleEl, 'page.title', (val) => {
    currentData.pages[editingPage].title = val;
  });
  titleWrap.appendChild(titleEl);
  
  const subtitle = createElement('div', 'section-meta');
  subtitle.textContent = pg.description || '';
  makeEditable(subtitle, 'page.description', (val) => {
    currentData.pages[editingPage].description = val;
  });
  titleWrap.appendChild(subtitle);
  
  sectionTitle.appendChild(titleWrap);
  section.appendChild(sectionTitle);
  
  // HTML content block (editable)
  const contentBlock = createElement('div', 'page-content');
  contentBlock.id = 'page-content';
  contentBlock.innerHTML = pg.content || '';
  contentBlock.setAttribute('contenteditable', 'true');
  contentBlock.classList.add('canvas-editable');
  contentBlock.setAttribute('data-canvas-key', 'page.content');
  contentBlock.addEventListener('blur', () => {
    currentData.pages[editingPage].content = contentBlock.innerHTML;
  });
  section.appendChild(contentBlock);
  
  main.appendChild(section);
  
  // Back link
  const backWrap = createElement('div', 'form-actions');
  backWrap.style.cssText = 'margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.08);';
  const backLink = document.createElement('a');
  backLink.className = 'button';
  backLink.textContent = '← Back to home';
  backLink.href = '#';
  backLink.onclick = (e) => { e.preventDefault(); };
  backWrap.appendChild(backLink);
  main.appendChild(backWrap);
  
  page.appendChild(main);
  
  return page;
}

function renderHomeCanvas() {
  const data = currentData;
  const page = createElement('div', 'canvas-page');

  // Header
  const header = createElement('header', 'container header');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 0;';
  const brand = createElement('div', 'brand', 'Dépendance Studio');
  const nav = createElement('nav', 'nav-list');
  nav.innerHTML = `
    <a href="#" onclick="event.preventDefault();">Home</a>
    <a href="#" onclick="event.preventDefault();">About</a>
    <a href="#" onclick="event.preventDefault();">Admin</a>
  `;
  header.appendChild(brand);
  header.appendChild(nav);
  page.appendChild(header);

  const main = document.createElement('main');
  main.className = 'container';

  // === HERO SECTION ===
  const heroSection = createElement('section', 'hero');
  heroSection.style.cssText = 'min-height: auto; padding: 3rem 0 4rem; display: grid; align-content: center; gap: 1.5rem;';

  const hero = data.site.hero;
  const eyebrow = createElement('div', 'eyebrow');
  eyebrow.textContent = hero.label || '';
  makeEditable(eyebrow, 'home.hero.label', (val) => {
    currentData.site.hero.label = val;
  });
  heroSection.appendChild(eyebrow);

  const heroTitle = document.createElement('h1');
  heroTitle.textContent = hero.title || '';
  heroTitle.style.cssText = 'margin: 0; font-size: clamp(3rem, 5vw, 5rem); letter-spacing: -0.04em;';
  makeEditable(heroTitle, 'home.hero.title', (val) => {
    currentData.site.hero.title = val;
  });
  heroSection.appendChild(heroTitle);

  const heroSubtitle = createElement('div', 'hero-subtitle');
  heroSubtitle.textContent = hero.subtitle || '';
  heroSubtitle.style.cssText = 'max-width: 720px; color: #dcdce0;';
  makeEditable(heroSubtitle, 'home.hero.subtitle', (val) => {
    currentData.site.hero.subtitle = val;
  });
  heroSection.appendChild(heroSubtitle);

  const heroDesc = document.createElement('p');
  heroDesc.textContent = hero.description || '';
  heroDesc.style.cssText = 'max-width: 720px; color: #dcdce0;';
  makeEditable(heroDesc, 'home.hero.description', (val) => {
    currentData.site.hero.description = val;
  });
  heroSection.appendChild(heroDesc);

  const ctaLink = document.createElement('a');
  ctaLink.className = 'button';
  ctaLink.textContent = hero.ctaText || 'Contact Us';
  ctaLink.href = '#';
  ctaLink.onclick = (e) => e.preventDefault();
  makeEditable(ctaLink, 'home.hero.ctaText', (val) => {
    currentData.site.hero.ctaText = val;
  });
  heroSection.appendChild(ctaLink);

  main.appendChild(heroSection);

  // === SERVICES SECTION ===
  const servicesSection = createElement('section', 'section services-section');
  servicesSection.id = 'services';
  servicesSection.style.cssText = 'padding: 3rem 0;';

  const sTitle = data.site.sections.services;
  const sectionTitle = createElement('div', 'section-title');
  sectionTitle.style.cssText = 'display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem;';

  const stWrap = document.createElement('div');
  const stH2 = document.createElement('h2');
  stH2.textContent = sTitle.title || '';
  stH2.style.cssText = 'margin: 0; font-size: clamp(2rem, 3vw, 3rem);';
  makeEditable(stH2, 'home.services.title', (val) => {
    currentData.site.sections.services.title = val;
  });
  stWrap.appendChild(stH2);

  const stDesc = createElement('div', 'section-meta');
  stDesc.textContent = sTitle.description || '';
  makeEditable(stDesc, 'home.services.description', (val) => {
    currentData.site.sections.services.description = val;
  });
  stWrap.appendChild(stDesc);
  sectionTitle.appendChild(stWrap);
  servicesSection.appendChild(sectionTitle);

  const servicesGrid = createElement('div', 'services');
  servicesGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem;';
  sTitle.items.forEach((item, i) => {
    const card = createElement('article', 'service-card');
    card.style.cssText = 'border: 1px solid rgba(255,255,255,0.08); padding: 1.5rem; background: rgba(255,255,255,0.02);';
    
    const cardTitle = document.createElement('h3');
    cardTitle.textContent = item.title || '';
    cardTitle.style.cssText = 'margin-top: 0;';
    makeEditable(cardTitle, `home.services.items.${i}.title`, (val) => {
      currentData.site.sections.services.items[i].title = val;
    });
    card.appendChild(cardTitle);
    
    const cardDesc = document.createElement('p');
    cardDesc.textContent = item.description || '';
    makeEditable(cardDesc, `home.services.items.${i}.description`, (val) => {
      currentData.site.sections.services.items[i].description = val;
    });
    card.appendChild(cardDesc);
    
    servicesGrid.appendChild(card);
  });
  servicesSection.appendChild(servicesGrid);
  main.appendChild(servicesSection);

  // === WORK / PROJECTS SECTION ===
  const workSection = createElement('section', 'section work-section');
  workSection.id = 'work';
  workSection.style.cssText = 'padding: 3rem 0;';

  const workData = data.site.sections.work;
  const workTitleDiv = createElement('div', 'section-title');
  workTitleDiv.style.cssText = 'display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem;';

  const wtWrap = document.createElement('div');
  const wtH2 = document.createElement('h2');
  wtH2.textContent = workData.title || '';
  wtH2.style.cssText = 'margin: 0; font-size: clamp(2rem, 3vw, 3rem);';
  makeEditable(wtH2, 'home.work.title', (val) => {
    currentData.site.sections.work.title = val;
  });
  wtWrap.appendChild(wtH2);

  const wtMeta = createElement('div', 'section-meta');
  wtMeta.textContent = `(${workData.count}) • ${workData.subtitle}`;
  makeEditable(wtMeta, 'home.work.meta', (val) => {
    const match = val.match(/\((\d+)\)\s*•\s*(.+)/);
    if (match) {
      currentData.site.sections.work.count = parseInt(match[1], 10);
      currentData.site.sections.work.subtitle = match[2].trim();
    } else {
      currentData.site.sections.work.subtitle = val;
    }
  });
  wtWrap.appendChild(wtMeta);

  const wtNote = document.createElement('div');
  wtNote.textContent = workData.note || '';
  wtNote.style.cssText = 'font-size: 0.85rem; color: #8f8f95; margin-top: 0.5rem;';
  makeEditable(wtNote, 'home.work.note', (val) => {
    currentData.site.sections.work.note = val;
  });
  wtWrap.appendChild(wtNote);

  workTitleDiv.appendChild(wtWrap);
  workSection.appendChild(workTitleDiv);

  const workGrid = createElement('div', 'grid work-grid');
  workGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem;';

  currentData.projects.forEach((project, i) => {
    const card = createElement('article', 'card');
    card.style.cssText = 'cursor: pointer; border: 1px solid rgba(255,255,255,0.08); border-radius: 0.5rem; overflow: hidden; background: rgba(255,255,255,0.02); transition: border-color 0.2s;';
    card.addEventListener('mouseenter', () => { card.style.borderColor = 'rgba(255,255,255,0.2)'; });
    card.addEventListener('mouseleave', () => { card.style.borderColor = 'rgba(255,255,255,0.08)'; });
    card.innerHTML = `
      <img src="${project.image}" alt="${project.title}" loading="lazy" style="width: 100%; height: 200px; object-fit: cover; display: block;" />
      <div style="padding: 1rem;">
        <div style="color: #8f8f95; font-size: 0.8rem; margin-bottom: 0.4rem;"><span>${project.year}</span><span> • ${project.client}</span></div>
        <h3 style="margin: 0 0 0.4rem; font-size: 1.1rem;">${project.title}</h3>
        <p style="font-size: 0.85rem; color: #dcdce0; margin: 0 0 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${project.description}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      editingProject = i;
      editingHome = false;
      editorMode = 'form';
      previewMode = 'detail';
      panelCollapsed = false;
      renderWorkspace();
    });
    workGrid.appendChild(card);
  });

  workSection.appendChild(workGrid);
  main.appendChild(workSection);

  // === FOOTER ===
  const footer = createElement('footer', 'container footer');
  footer.style.cssText = 'border-top: 1px solid rgba(255,255,255,0.08); padding: 2rem 0 3rem; color: #a3a3ab;';

  const fGrid = createElement('div', 'footer-grid');
  fGrid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2rem;';

  const fCol1 = document.createElement('div');
  const fBrand = createElement('div', 'brand');
  fBrand.textContent = data.site.footer.brand || '';
  makeEditable(fBrand, 'home.footer.brand', (val) => {
    currentData.site.footer.brand = val;
  });
  fCol1.appendChild(fBrand);

  const fLocation = document.createElement('div');
  fLocation.textContent = data.site.footer.location || '';
  makeEditable(fLocation, 'home.footer.location', (val) => {
    currentData.site.footer.location = val;
  });
  fCol1.appendChild(fLocation);

  const fContact = document.createElement('div');
  fContact.textContent = data.site.footer.contact || '';
  makeEditable(fContact, 'home.footer.contact', (val) => {
    currentData.site.footer.contact = val;
  });
  fCol1.appendChild(fContact);

  fGrid.appendChild(fCol1);

  const fCol2 = createElement('div', 'footer-col-links');
  const linksTitle = createElement('div', 'section-title');
  linksTitle.innerHTML = '<h2 style="margin:0;font-size:1rem;">Links</h2>';
  fCol2.appendChild(linksTitle);
  
  data.site.footer.links.forEach((link, i) => {
    const a = document.createElement('a');
    a.href = '#';
    a.onclick = (e) => e.preventDefault();
    a.textContent = link.label;
    a.style.cssText = 'display: inline-block; margin-top: 0.5rem; color: inherit; cursor: default;';
    makeEditable(a, `home.footer.links.${i}.label`, (val) => {
      currentData.site.footer.links[i].label = val;
    });
    fCol2.appendChild(a);
    fCol2.appendChild(document.createElement('br'));
  });
  fGrid.appendChild(fCol2);

  // Social
  const fCol3 = createElement('div', 'footer-col-social');
  const socialTitle = createElement('div', 'section-title');
  socialTitle.innerHTML = '<h2 style="margin:0;font-size:1rem;">Social</h2>';
  fCol3.appendChild(socialTitle);
  
  data.site.footer.social.forEach((item, i) => {
    const a = document.createElement('a');
    a.href = '#';
    a.onclick = (e) => e.preventDefault();
    a.textContent = item.label;
    a.style.cssText = 'display: inline-block; margin-top: 0.5rem; color: inherit; cursor: default;';
    makeEditable(a, `home.footer.social.${i}.label`, (val) => {
      currentData.site.footer.social[i].label = val;
    });
    fCol3.appendChild(a);
    fCol3.appendChild(document.createElement('br'));
  });
  fGrid.appendChild(fCol3);

  footer.appendChild(fGrid);
  main.appendChild(footer);

  page.appendChild(main);
  return page;
}

// ===== PROPERTIES PANEL (collapsible right panel in canvas mode) =====
function renderPropertiesPanel() {
  const panel = createElement('div', 'properties-panel');
  
  const header = createElement('div', 'properties-header');
  header.innerHTML = '<h3>PROPERTIES</h3>';
  panel.appendChild(header);
  
  if (editingHome) {
    const hero = currentData.site.hero;
    const services = currentData.site.sections.services;
    const footer = currentData.site.footer;
    const form = createElement('div', 'editor-form');
    
    form.appendChild(buildField('HERO_EYEBROW', hero.label, (val) => {
      currentData.site.hero.label = val;
      refreshCanvasField('home.hero.label', val);
    }, 'home.hero.label'));
    form.appendChild(buildField('HERO_TITLE', hero.title, (val) => {
      currentData.site.hero.title = val;
      refreshCanvasField('home.hero.title', val);
    }, 'home.hero.title'));
    form.appendChild(buildField('HERO_SUBTITLE', hero.subtitle, (val) => {
      currentData.site.hero.subtitle = val;
      refreshCanvasField('home.hero.subtitle', val);
    }, 'home.hero.subtitle'));
    form.appendChild(buildTextarea('HERO_DESCRIPTION', hero.description, (val) => {
      currentData.site.hero.description = val;
      refreshCanvasField('home.hero.description', val);
    }, 'home.hero.description'));
    form.appendChild(buildField('HERO_CTA_TEXT', hero.ctaText, (val) => {
      currentData.site.hero.ctaText = val;
      refreshCanvasField('home.hero.ctaText', val);
    }, 'home.hero.ctaText'));
    form.appendChild(buildField('HERO_CTA_URL', hero.ctaUrl, (val) => {
      currentData.site.hero.ctaUrl = val;
    }, 'home.hero.ctaUrl'));
    
    // Services section
    form.appendChild(buildField('SERVICES_TITLE', services.title, (val) => {
      currentData.site.sections.services.title = val;
      refreshCanvasField('home.services.title', val);
    }, 'home.services.title'));
    form.appendChild(buildTextarea('SERVICES_DESCRIPTION', services.description, (val) => {
      currentData.site.sections.services.description = val;
      refreshCanvasField('home.services.description', val);
    }, 'home.services.description'));
    
    // Service items
    services.items.forEach((item, i) => {
      form.appendChild(buildField(`SERVICE_${i+1}_TITLE`, item.title, (val) => {
        currentData.site.sections.services.items[i].title = val;
        refreshCanvasField(`home.services.items.${i}.title`, val);
      }, `home.services.items.${i}.title`));
      form.appendChild(buildTextarea(`SERVICE_${i+1}_DESCRIPTION`, item.description, (val) => {
        currentData.site.sections.services.items[i].description = val;
        refreshCanvasField(`home.services.items.${i}.description`, val);
      }, `home.services.items.${i}.description`));
    });
    
    // Work section
    const work = currentData.site.sections.work;
    form.appendChild(buildField('WORK_TITLE', work.title, (val) => {
      currentData.site.sections.work.title = val;
      refreshCanvasField('home.work.title', val);
    }, 'home.work.title'));
    form.appendChild(buildField('WORK_COUNT', String(work.count || ''), (val) => {
      currentData.site.sections.work.count = parseInt(val, 10) || 0;
      refreshCanvasField('home.work.meta', `(${currentData.site.sections.work.count}) • ${currentData.site.sections.work.subtitle}`);
    }, 'home.work.count'));
    form.appendChild(buildField('WORK_SUBTITLE', work.subtitle, (val) => {
      currentData.site.sections.work.subtitle = val;
      refreshCanvasField('home.work.meta', `(${currentData.site.sections.work.count}) • ${val}`);
    }, 'home.work.subtitle'));
    form.appendChild(buildField('WORK_NOTE', work.note, (val) => {
      currentData.site.sections.work.note = val;
      refreshCanvasField('home.work.note', val);
    }, 'home.work.note'));
    
    // Footer
    form.appendChild(buildField('FOOTER_BRAND', footer.brand, (val) => {
      currentData.site.footer.brand = val;
      refreshCanvasField('home.footer.brand', val);
    }, 'home.footer.brand'));
    form.appendChild(buildField('FOOTER_LOCATION', footer.location, (val) => {
      currentData.site.footer.location = val;
      refreshCanvasField('home.footer.location', val);
    }, 'home.footer.location'));
    form.appendChild(buildField('FOOTER_EMAIL', footer.contact, (val) => {
      currentData.site.footer.contact = val;
      refreshCanvasField('home.footer.contact', val);
    }, 'home.footer.contact'));
    
    // Footer links
    footer.links.forEach((link, i) => {
      form.appendChild(buildField(`FOOTER_LINK_${i+1}_LABEL`, link.label, (val) => {
        currentData.site.footer.links[i].label = val;
        refreshCanvasField(`home.footer.links.${i}.label`, val);
      }, `home.footer.links.${i}.label`));
      form.appendChild(buildField(`FOOTER_LINK_${i+1}_URL`, link.url, (val) => {
        currentData.site.footer.links[i].url = val;
      }, `home.footer.links.${i}.url`));
    });
    
    // Footer social
    footer.social.forEach((item, i) => {
      form.appendChild(buildField(`FOOTER_SOCIAL_${i+1}_LABEL`, item.label, (val) => {
        currentData.site.footer.social[i].label = val;
        refreshCanvasField(`home.footer.social.${i}.label`, val);
      }, `home.footer.social.${i}.label`));
      form.appendChild(buildField(`FOOTER_SOCIAL_${i+1}_URL`, item.url, (val) => {
        currentData.site.footer.social[i].url = val;
      }, `home.footer.social.${i}.url`));
    });
    
    panel.appendChild(form);
    
  } else if (editingProject !== null) {
    const project = currentData.projects[editingProject];
    const form = createElement('div', 'editor-form');
    
    form.appendChild(buildField('01_PROJECT_TITLE', project.title, (val) => {
      currentData.projects[editingProject].title = val;
      refreshCanvasField('project.title', val);
    }, 'project.title'));
    form.appendChild(buildField('02_CLIENT_NAME', project.client, (val) => {
      currentData.projects[editingProject].client = val;
      refreshCanvasField('project.client', val);
    }, 'project.client'));
    form.appendChild(buildField('03_YEAR', project.year, (val) => {
      currentData.projects[editingProject].year = val;
      refreshCanvasField('project.year', val);
    }, 'project.year'));
    form.appendChild(buildField('04_PROJECT_SLUG', project.slug, (val) => {
      currentData.projects[editingProject].slug = val;
    }, 'project.slug'));
    form.appendChild(buildField('05_IMAGE_URL', project.image, (val) => {
      currentData.projects[editingProject].image = val;
      const canvasImg = document.querySelector('.canvas-cover-img');
      if (canvasImg) canvasImg.src = val;
    }, 'project.image'));
    form.appendChild(buildTextarea('06_DESCRIPTION', project.description, (val) => {
      currentData.projects[editingProject].description = val;
      refreshCanvasField('project.description', val);
    }, 'project.description'));
    form.appendChild(buildField('07_TAGS', project.tags ? project.tags.join(', ') : '', (val) => {
      currentData.projects[editingProject].tags = val.split(',').map(t => t.trim()).filter(Boolean);
      renderWorkspace();
    }, 'project.tags'));
    form.appendChild(buildTextarea('08_CONTENT (HTML)', project.content || '', (val) => {
      currentData.projects[editingProject].content = val;
    }, 'project.content'));
    
    panel.appendChild(form);
    
  } else if (editingPage !== null) {
    const pg = currentData.pages[editingPage];
    const form = createElement('div', 'editor-form');

    const blockSection = createElement('div', 'figma-section-divider');
    blockSection.innerHTML = '<span>BLOCK SETTINGS</span>';
    form.appendChild(blockSection);

    form.appendChild(buildTextarea('04_CONTENT (HTML)', pg.content, (val) => {
      currentData.pages[editingPage].content = val;
      const canvasHtml = document.querySelector('[data-canvas-key="page.content"]');
      if (canvasHtml) canvasHtml.innerHTML = val;
    }, 'page.content'));

    const customSection = createElement('div', 'figma-section-divider');
    customSection.innerHTML = '<span>CUSTOM FIELDS</span>';
    form.appendChild(customSection);

    form.appendChild(buildField('01_PAGE_TITLE', pg.title, (val) => {
      currentData.pages[editingPage].title = val;
      refreshCanvasField('page.title', val);
    }, 'page.title'));
    form.appendChild(buildField('02_URL_SLUG', pg.slug, (val) => {
      currentData.pages[editingPage].slug = val;
    }, 'page.slug'));
    form.appendChild(buildTextarea('03_DESCRIPTION', pg.description, (val) => {
      currentData.pages[editingPage].description = val;
      refreshCanvasField('page.description', val);
    }, 'page.description'));
    
    panel.appendChild(form);
  }
  
  return panel;
}

function refreshCanvasField(key, value) {
  const el = document.querySelector(`[data-canvas-key="${key}"]`);
  if (el && document.activeElement !== el) {
    el.textContent = value;
  }
}

function renderProjectNav() {
  const nav = createElement('div', 'figma-left-panel');
  const header = createElement('div', 'figma-left-header');
  header.innerHTML = '<span class="figma-left-title">PROJECTS</span>';
  nav.appendChild(header);

  const list = createElement('div', 'figma-left-list');
  currentData.projects.forEach((p, i) => {
    const item = createElement('div', i === editingProject ? 'figma-left-item active' : 'figma-left-item');
    const thumb = document.createElement('div');
    thumb.className = 'figma-left-thumb';
    if (p.image) thumb.style.backgroundImage = `url('${p.image}')`;
    const info = document.createElement('div');
    info.className = 'figma-left-info';
    info.innerHTML = `<strong>${p.title || 'Untitled'}</strong><span>${p.client || ''}</span>`;
    item.appendChild(thumb);
    item.appendChild(info);
    item.addEventListener('click', () => {
      editingProject = i;
      editorMode = 'form';
      renderWorkspace();
    });
    list.appendChild(item);
  });
  nav.appendChild(list);
  return nav;
}

function renderPageNav() {
  const nav = createElement('div', 'figma-left-panel');
  const header = createElement('div', 'figma-left-header');
  header.innerHTML = '<span class="figma-left-title">PAGES</span>';
  nav.appendChild(header);

  const list = createElement('div', 'figma-left-list');
  currentData.pages.forEach((p, i) => {
    const item = createElement('div', i === editingPage ? 'figma-left-item active' : 'figma-left-item');
    const thumb = document.createElement('div');
    thumb.className = 'figma-left-thumb';
    thumb.textContent = '📄';
    thumb.style.cssText = 'display:flex;align-items:center;justify-content:center;font-size:14px;background:var(--fg-thumb-bg);';
    const info = document.createElement('div');
    info.className = 'figma-left-info';
    info.innerHTML = `<strong>${p.title || 'Untitled'}</strong><span>${p.slug || ''}</span>`;
    item.appendChild(thumb);
    item.appendChild(info);
    item.addEventListener('click', () => {
      editingPage = i;
      editorMode = 'form';
      renderWorkspace();
    });
    list.appendChild(item);
  });
  nav.appendChild(list);
  return nav;
}

function renderMainContent() {
  // Canvas mode: editing home, project, or page
  if (editingHome || editingProject !== null || editingPage !== null) {
    const isPage = editingPage !== null;
    const isProject = editingProject !== null;
    const suffix = isProject ? ' post-type-projects' : isPage ? ' post-type-page' : '';
    const isCodeMode = editorMode === 'code';
    const baseClass = 'admin-main canvas-mode' + ((panelCollapsed || isCodeMode) ? ' collapsed' : '') + suffix;
    const content = createElement('div', baseClass);
    if (isProject) {
      content.appendChild(renderProjectNav());
    } else if (isPage) {
      content.appendChild(renderPageNav());
    }
    content.appendChild(renderCanvas());
    if (!panelCollapsed && editorMode !== 'code') {
      content.appendChild(renderPropertiesPanel());
    }
    return content;
  }
  
  // Standard mode
  const content = createElement('div', 'admin-main');
  
  let panel = null;
  switch (activeTab) {
    case 'dashboard':
      panel = renderDashboard();
      break;
    case 'hero':
      panel = renderHeroEditor();
      break;
    case 'projects':
      panel = renderProjectsEditor();
      break;
    case 'pages':
      panel = renderPagesEditor();
      break;
    case 'footer':
      panel = renderFooterEditor();
      break;
    case 'settings':
      panel = renderSettings();
      break;
    default:
      panel = renderDashboard();
  }

  if (panel) content.appendChild(panel);
  
  return content;
}

function renderWorkspace() {
  const editor = document.querySelector('#admin-editor');
  editor.innerHTML = '';
  editor.classList.toggle('post-type-projects', editingProject !== null);
  editor.classList.toggle('post-type-page', editingPage !== null);

  const shell = createElement('div', 'admin-shell');
  shell.appendChild(renderSidebar());
  shell.appendChild(renderMainContent());

  editor.appendChild(shell);
}

function mergeData(stored, base) {
  if (!stored) return base;
  try {
    const merged = { ...base, ...stored };
    merged.site = { ...base.site, ...(stored.site || {}) };
    merged.site.hero = { ...base.site.hero, ...(stored.site?.hero || {}) };
    merged.site.footer = { ...base.site.footer, ...(stored.site?.footer || {}) };
    merged.site.footer.links = stored.site?.footer?.links || base.site.footer.links;
    merged.site.footer.social = stored.site?.footer?.social || base.site.footer.social;
    merged.site.sections = { ...base.site.sections, ...(stored.site?.sections || {}) };
    merged.site.sections.work = { ...base.site.sections.work, ...(stored.site?.sections?.work || {}) };
    merged.site.sections.services = { ...base.site.sections.services, ...(stored.site?.sections?.services || {}) };
    merged.projects = stored.projects || base.projects;
    merged.pages = stored.pages || base.pages;
    return merged;
  } catch (e) {
    console.error('Error merging stored and base data:', e);
    return base;
  }
}

function applyTheme() {
  const saved = (() => { try { return localStorage.getItem('adminTheme'); } catch (e) { return null; } })();
  const el = document.getElementById('admin-editor');
  if (saved === 'light' || saved === 'dark') {
    el.setAttribute('data-theme', saved);
  } else {
    el.removeAttribute('data-theme');
  }
}

async function loadEditor() {
  applyTheme();
  try {
    const response = await fetch(BASE_DATA_PATH);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} (${response.statusText})`);
    }
    const baseData = await response.json();
    const storedData = getStoredData();
    currentData = mergeData(storedData, baseData);
    renderWorkspace();
  } catch (error) {
    console.error('Unable to load admin data:', error);
    document.getElementById('admin-editor').innerHTML = `
      <div style="padding: 4rem 2rem; text-align: center; max-width: 600px; margin: 0 auto; font-family: inherit; color: #f4f4f5;">
        <div style="font-size: 3rem; margin-bottom: 1.5rem;">⚠️</div>
        <h2 style="font-size: 1.5rem; margin-bottom: 1rem; font-weight: 600;">Unable to Load Dashboard</h2>
        <p style="color: #8f8f95; font-size: 0.95rem; margin-bottom: 2rem; line-height: 1.6; text-align: left; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); padding: 1.25rem; border-radius: 0.75rem;">
          <strong>Error details:</strong> ${error.message}<br/><br/>
          <strong>Possible causes:</strong><br/>
          1. The server is not running or has crashed.<br/>
          2. You opened the HTML file directly in the browser (using file:// URL) instead of serving it via a local web server (e.g. <code>python3 -m http.server 8000</code>).<br/>
          3. Stale or corrupted data is present in browser storage.
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button onclick="location.reload();" class="btn-primary" style="padding: 0.8rem 1.5rem;">🔄 Retry</button>
          <button onclick="try { localStorage.clear(); } catch(e) {} location.reload();" class="btn-secondary" style="padding: 0.8rem 1.5rem;">🗑️ Reset Storage & Retry</button>
        </div>
      </div>
    `;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  let logged = false;
  try {
    logged = localStorage.getItem('adminAuthenticated') === 'true';
  } catch (e) {
    console.error('Error reading authentication status:', e);
  }
  
  if (logged) {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-editor').style.display = 'block';
    loadEditor();
  } else {
    renderLogin();
  }
});
