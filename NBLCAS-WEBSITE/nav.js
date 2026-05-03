(function () {
  var NAV_HTML = [
    '<div class="nav-inner">',
    '  <div class="nav-links">',
    '    <a href="/" class="nav-link" data-page="home">',
    '      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    '      Home',
    '    </a>',
    '    <a href="/contracts.html" class="nav-link" data-page="contracts">',
    '      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
    '      Contracts',
    '    </a>',
    '    <a href="/stats.html" class="nav-link" data-page="stats">',
    '      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    '      Player Stats',
    '    </a>',
    '    <a href="/docs.html" class="nav-link" data-page="docs">',
    '      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    '      Docs',
    '    </a>',
    '    <div class="nav-dropdown" id="dd-more">',
    '      <button class="nav-link nav-dropdown-btn">',
    '        More',
    '        <svg class="nav-chevron" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>',
    '      </button>',
    '      <div class="nav-dropdown-menu" style="display:none">',
    '        <a href="/changelog.html" class="nav-dropdown-item" data-page="changelog">Changelog</a>',
    '      </div>',
    '    </div>',
    '  </div>',
    '  <button class="nav-theme-btn" id="theme-toggle" aria-label="Toggle theme">',
    '    <svg id="theme-icon-dark" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    '    <svg id="theme-icon-light" class="hidden" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    '  </button>',
    '</div>'
  ].join('\n');

  // Inject nav — works whether the browser has new HTML (#nav-root) or old cached HTML (full nav)
  var root = document.getElementById('nav-root');
  if (root) {
    root.innerHTML = NAV_HTML;
  } else {
    // Old cached HTML: find existing nav and fully replace its contents
    var existingNav = document.querySelector('nav.nav');
    if (existingNav) {
      existingNav.id = 'nav-root';
      existingNav.innerHTML = NAV_HTML;
    }
  }

  // Dropdown logic
  var dds = document.querySelectorAll('.nav-dropdown');

  function closeAll() {
    dds.forEach(function (dd) {
      var menu = dd.querySelector('.nav-dropdown-menu');
      var chevron = dd.querySelector('.nav-chevron');
      if (menu) menu.style.display = 'none';
      if (chevron) chevron.style.transform = '';
      dd.classList.remove('open');
    });
  }

  function openDD(dd) {
    closeAll();
    var menu = dd.querySelector('.nav-dropdown-menu');
    var chevron = dd.querySelector('.nav-chevron');
    if (menu) { menu.style.removeProperty('display'); dd.classList.add('open'); }
    if (chevron) chevron.style.transform = 'rotate(180deg)';
  }

  dds.forEach(function (dd) {
    var menu = dd.querySelector('.nav-dropdown-menu');
    var btn  = dd.querySelector('.nav-dropdown-btn');
    if (menu) menu.style.display = 'none';
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (dd.classList.contains('open')) { closeAll(); } else { openDD(dd); }
      });
    }
  });

  document.addEventListener('click', closeAll);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });

  // Active state
  var path = window.location.pathname;
  var links = document.querySelectorAll('.nav-link[data-page]');
  links.forEach(function (a) {
    var pg = a.getAttribute('data-page');
    if (
      (pg === 'home'      && (path === '/' || path === '/index.html')) ||
      (pg === 'contracts' && path.startsWith('/contracts')) ||
      (pg === 'stats'     && path.startsWith('/stats')) ||
      (pg === 'docs'      && (path.startsWith('/docs') || path.startsWith('/contracts-info') || path.startsWith('/stats-info')))
    ) {
      a.classList.add('active');
    }
  });

  if (path.includes('changelog')) {
    var md = document.querySelector('#dd-more');
    if (md) md.classList.add('active');
    var cl = document.querySelector('.nav-dropdown-item[data-page="changelog"]');
    if (cl) cl.classList.add('active');
  }

  // Theme toggle
  var themeBtn  = document.getElementById('theme-toggle');
  var iconDark  = document.getElementById('theme-icon-dark');
  var iconLight = document.getElementById('theme-icon-light');

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      if (iconDark)  iconDark.classList.add('hidden');
      if (iconLight) iconLight.classList.remove('hidden');
    } else {
      document.documentElement.classList.add('dark');
      if (iconDark)  iconDark.classList.remove('hidden');
      if (iconLight) iconLight.classList.add('hidden');
    }
  }

  applyTheme(localStorage.getItem('nbl-theme') === 'light' ? 'light' : 'dark');

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      localStorage.setItem('nbl-theme', next);
      applyTheme(next);
    });
  }
})();
