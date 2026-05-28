(function () {
  var contentDiv = document.getElementById('project-content');
  if (!contentDiv) return;

  function show() {
    contentDiv.classList.add('show');
  }

  var slug = null;
  var match = window.location.pathname.match(/\/projects\/(.+)\.html/);
  if (match) slug = match[1];

  if (!slug) {
    show();
    return;
  }

  try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '../data/site-data.json', false);
    xhr.overrideMimeType && xhr.overrideMimeType('application/json');
    xhr.send(null);

    if (xhr.status === 200 || xhr.status === 0) {
      var data = JSON.parse(xhr.responseText);

      // Merge with localStorage data (admin edits)
      try {
        var stored = JSON.parse(localStorage.getItem('dependanceSiteData'));
        if (stored && stored.projects) {
          data.projects = stored.projects;
        }
      } catch (_) {}

      var project = null;
      for (var i = 0; i < data.projects.length; i++) {
        if (data.projects[i].slug === slug) {
          project = data.projects[i];
          break;
        }
      }
      if (project && project.content) {
        contentDiv.innerHTML = project.content;
      } else {
        // Set page metadata from project data if no custom content
        if (project) {
          var titleEl = document.querySelector('h1');
          if (titleEl) titleEl.textContent = project.title || titleEl.textContent;
          var descEl = document.querySelector('.project-description');
          if (descEl) descEl.textContent = project.description || descEl.textContent;
        }
      }
    }
  } catch (e) {
    // JSON non disponibile — il contenuto di fallback è già nell'HTML
  }

  show();
})();
