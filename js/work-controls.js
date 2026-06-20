(function () {
  'use strict';

  var workSection = document.querySelector('#WORK');
  if (!workSection) return;

  // --- DOM refs ---
  var showBtn = workSection.querySelector('.toggle-show');
  var hideBtn = workSection.querySelector('.toggle-hide');
  var filterToggleBtn = workSection.querySelector('.filter-toggle-btn');
  var filterPanel = workSection.querySelector('.filter-panel');
  var titleCount = workSection.querySelector('.number .text-54');
  var filterSidebar = null;

  // --- State ---
  var isShowMode = true;
  var isFilterOpen = false;
  var activeFilters = { tags: [], years: [], locations: [] };
  var projectsData = [];

  // --- Feature 1: Show / Hide ---

  function getContentTargets() {
    var all = workSection.querySelectorAll(
      '.card-work .content, .card-work .content-copy'
    );
    return Array.prototype.filter.call(all, function (el) {
      var card = el.closest('.card-work');
      return card && card.style.display !== 'none';
    });
  }

  function setShowMode(show) {
    if (show === isShowMode) return;
    isShowMode = show;

    showBtn.classList.toggle('active', show);
    hideBtn.classList.toggle('active', !show);

    var targets = getContentTargets();

    gsap.killTweensOf(targets);

    if (show) {
      workSection.classList.remove('hide-mode');
      gsap.to(targets, {
        height: function (i, el) {
          var h = el._origHeight;
          return h > 0 ? h : 'auto';
        },
        marginTop: function (i, el) {
          return el._origMarginTop != null ? el._origMarginTop : '';
        },
        marginBottom: function (i, el) {
          return el._origMarginBottom != null ? el._origMarginBottom : '';
        },
        paddingTop: function (i, el) {
          return el._origPaddingTop != null ? el._origPaddingTop : '';
        },
        paddingBottom: function (i, el) {
          return el._origPaddingBottom != null ? el._origPaddingBottom : '';
        },
        opacity: 1,
        duration: 0.35,
        ease: 'power2.inOut',
        stagger: 0.05,
        overwrite: 'auto',
        onComplete: function () {
          targets.forEach(function (el) {
            el.style.removeProperty('height');
            el.style.removeProperty('opacity');
            el.style.removeProperty('margin-top');
            el.style.removeProperty('margin-bottom');
            el.style.removeProperty('padding-top');
            el.style.removeProperty('padding-bottom');
            delete el._origHeight;
            delete el._origMarginTop;
            delete el._origMarginBottom;
            delete el._origPaddingTop;
            delete el._origPaddingBottom;
          });
        }
      });
    } else {
      targets.forEach(function (el) {
        el._origHeight = el.offsetHeight;
        el._origMarginTop = getComputedStyle(el).marginTop;
        el._origMarginBottom = getComputedStyle(el).marginBottom;
        el._origPaddingTop = getComputedStyle(el).paddingTop;
        el._origPaddingBottom = getComputedStyle(el).paddingBottom;
        el.style.height = el.offsetHeight + 'px';
      });
      workSection.classList.add('hide-mode');
      gsap.to(targets, {
        height: 0,
        opacity: 0,
        marginTop: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
        duration: 0.35,
        ease: 'power2.inOut',
        stagger: 0.05,
        overwrite: 'auto'
      });
    }
  }

  if (showBtn && hideBtn) {
    showBtn.addEventListener('click', function () { setShowMode(true); });
    hideBtn.addEventListener('click', function () { setShowMode(false); });
  }

  // --- Feature 2: Filters ---

  function loadProjects() {
    return fetch('/data/site-data.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        projectsData = data.projects || [];
        populateFilters();
        return projectsData;
      })
      .catch(function (e) {
        console.warn('Failed to load project data:', e);
      });
  }

  function extractFilters() {
    var tagSet = {};
    var yearSet = {};
    var locationSet = {};

    projectsData.forEach(function (p) {
      (p.tags || []).forEach(function (t) {
        tagSet[t] = (tagSet[t] || 0) + 1;
      });
      if (p.year) {
        yearSet[p.year] = (yearSet[p.year] || 0) + 1;
      }
      if (p.location) {
        locationSet[p.location] = (locationSet[p.location] || 0) + 1;
      }
    });

    return {
      tags: Object.keys(tagSet).sort().map(function (k) {
        return { label: k, count: tagSet[k] };
      }),
      years: Object.keys(yearSet).sort().reverse().map(function (k) {
        return { label: k, count: yearSet[k] };
      }),
      locations: Object.keys(locationSet).sort().map(function (k) {
        return { label: k, count: locationSet[k] };
      })
    };
  }

  function populateContainer(container, items, category) {
    if (!container) return;
    container.innerHTML = '';
    items.forEach(function (item) {
      var el = document.createElement('span');
      el.className = 'filter-tag';
      el.dataset.filter = item.label;
      el.dataset.type = category;
      el.innerHTML = item.label + ' <span class="count">[' + item.count + ']</span>';
      el.addEventListener('click', function () {
        toggleFilter(category, item.label, el);
      });
      container.appendChild(el);
    });
  }

  function populateFilters() {
    var filters = extractFilters();

    populateContainer(
      workSection.querySelector('.filter-section[data-filter-type="tag"] .filter-tags'),
      filters.tags, 'tags'
    );
    populateContainer(
      workSection.querySelector('.filter-section[data-filter-type="year"] .filter-tags'),
      filters.years, 'years'
    );
    populateContainer(
      workSection.querySelector('.filter-section[data-filter-type="location"] .filter-tags'),
      filters.locations, 'locations'
    );
  }

  function toggleFilter(category, value, el) {
    var idx = activeFilters[category].indexOf(value);
    if (idx === -1) {
      activeFilters[category].push(value);
      el.classList.add('active');
    } else {
      activeFilters[category].splice(idx, 1);
      el.classList.remove('active');
    }
    applyFilters();
  }

  function hasActiveFilters() {
    return activeFilters.tags.length > 0 ||
           activeFilters.years.length > 0 ||
           activeFilters.locations.length > 0;
  }

  function projectMatches(project) {
    if (!hasActiveFilters()) return true;

    if (activeFilters.tags.length > 0) {
      if (!(project.tags && project.tags.some(function (t) {
        return activeFilters.tags.indexOf(t) !== -1;
      }))) return false;
    }

    if (activeFilters.years.length > 0) {
      if (activeFilters.years.indexOf(project.year) === -1) return false;
    }

    if (activeFilters.locations.length > 0) {
      if (activeFilters.locations.indexOf(project.location) === -1) return false;
    }

    return true;
  }

  function getProjectBySlug(slug) {
    for (var i = 0; i < projectsData.length; i++) {
      if (projectsData[i].slug === slug) return projectsData[i];
    }
    return null;
  }

  function applyFilters() {
    var cards = workSection.querySelectorAll('.card-work');
    var visibleCount = 0;

    cards.forEach(function (card) {
      var href = card.getAttribute('href');
      var slug = card.getAttribute('data-slug') || '';
      if (!slug && href) {
        slug = href.replace('/projects/', '').replace('.html', '');
      }
      var project = slug ? getProjectBySlug(slug) : null;
      var match = project ? projectMatches(project) : !hasActiveFilters();

      gsap.killTweensOf(card);

      if (match) {
        card.style.display = '';
        card.style.pointerEvents = '';

        var row = card.closest('.row-double-work');
        if (row) row.style.display = '';

        var contents = card.querySelectorAll('.content, .content-copy');
        contents.forEach(function (el) {
          if (!isShowMode) {
            if (!el._origHeight) {
              el._origHeight = el.offsetHeight;
              el._origMarginTop = getComputedStyle(el).marginTop;
              el._origMarginBottom = getComputedStyle(el).marginBottom;
              el._origPaddingTop = getComputedStyle(el).paddingTop;
              el._origPaddingBottom = getComputedStyle(el).paddingBottom;
            }
            gsap.set(el, {
              height: 0,
              opacity: 0,
              marginTop: 0,
              marginBottom: 0,
              paddingTop: 0,
              paddingBottom: 0
            });
          } else if (el._origHeight) {
            gsap.set(el, { height: el._origHeight, opacity: 1 });
            delete el._origHeight;
            el.style.removeProperty('margin-top');
            el.style.removeProperty('margin-bottom');
            el.style.removeProperty('padding-top');
            el.style.removeProperty('padding-bottom');
          } else {
            el.style.removeProperty('height');
            el.style.removeProperty('opacity');
          }
        });

        gsap.to(card, {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto'
        });
        visibleCount++;

        // Trigger pixel animation if content was hidden
        var contentEl = card.querySelector('.content');
        if (contentEl && window.__contentInstances) {
          var ci = window.__contentInstances.get(contentEl);
          if (ci && ci.pxIndex < ci.pxFactorValues.length - 1) {
            ci.animatePixels();
          }
        }
      } else {
        card.style.display = 'none';
        card.style.pointerEvents = 'none';
        gsap.set(card, { opacity: 0, scale: 0.97 });

        var row = card.closest('.row-double-work');
        if (row) {
          var visible = row.querySelectorAll('.card-work:not([style*="display: none"])');
          if (visible.length === 0) row.style.display = 'none';
        }
      }
    });

    // Toggle clear buttons on filter section titles
    var sections = workSection.querySelectorAll('.filter-section');
    sections.forEach(function (s) {
      var type = s.getAttribute('data-filter-type');
      var key = type === 'tag' ? 'tags' : type === 'location' ? 'locations' : 'years';
      var btn = s.querySelector('.filter-clear-btn');
      if (btn) {
        btn.style.display = activeFilters[key].length > 0 ? '' : 'none';
      }
    });

    if (titleCount) {
      titleCount.textContent = hasActiveFilters()
        ? visibleCount
        : projectsData.length;
    }
  }

  // --- Init ---

  // Restructure DOM: sidebar + grid layout
  if (filterPanel) {
    var layout = document.createElement('div');
    layout.className = 'work-layout';

    var sidebar = document.createElement('aside');
    sidebar.className = 'filter-sidebar';

    var sections = filterPanel.querySelectorAll('.filter-section');
    Array.prototype.forEach.call(sections, function (s) {
      sidebar.appendChild(s);

      var title = s.querySelector('.filter-section-title');
      if (title) {
        var clearBtn = document.createElement('span');
        clearBtn.className = 'filter-clear-btn';
        clearBtn.textContent = '\u00d7';
        clearBtn.style.display = 'none';
        clearBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var type = s.getAttribute('data-filter-type');
          var key = type === 'tag' ? 'tags' : type === 'location' ? 'locations' : 'years';
          var tags = s.querySelectorAll('.filter-tag');
          tags.forEach(function (t) { t.classList.remove('active'); });
          activeFilters[key] = [];
          applyFilters();
        });
        title.appendChild(clearBtn);
      }
    });

    filterPanel.parentNode.removeChild(filterPanel);

    var grid = document.createElement('div');
    grid.className = 'work-grid';

    var children = Array.prototype.slice.call(workSection.children);
    children.forEach(function (child) {
      if (child.classList &&
          (child.classList.contains('card-work') ||
           child.classList.contains('row-double-work'))) {
        grid.appendChild(child);
      }
    });

    layout.appendChild(sidebar);
    layout.appendChild(grid);

    var controls = workSection.querySelector('.work-controls');
    if (controls && controls.nextSibling) {
      workSection.insertBefore(layout, controls.nextSibling);
    } else {
      workSection.appendChild(layout);
    }

    filterSidebar = sidebar;
  }

  // Sidebar toggle
  if (filterToggleBtn && filterSidebar) {
    filterToggleBtn.addEventListener('click', function () {
      isFilterOpen = !isFilterOpen;
      filterSidebar.classList.toggle('open', isFilterOpen);
      filterToggleBtn.innerHTML = isFilterOpen
        ? 'Hide Filters <span style="display:inline-block;margin-left:4px">\u00d7</span>'
        : 'Show Filters';
    });
  }

  loadProjects();

})();
