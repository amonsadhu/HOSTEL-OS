/* HostelOS — shared helpers: logout button + mobile menu + mobile layout fixes */
(function () {
  /* ---------- Logout ---------- */
  function logout() {
    var type = localStorage.getItem('hostelos_type');
    localStorage.removeItem('hostelos_token');
    localStorage.removeItem('hostelos_user');
    localStorage.removeItem('hostelos_type');
    window.location.href = type === 'student' ? 'student-login.html' : 'admin-login.html';
  }
  window.hostelosLogout = logout;

  /* ---------- Mobile CSS ---------- */
  var css = '' +
  '#hos-menu-btn,#hos-backdrop{display:none}' +
  '@media (max-width:900px){' +
    '#hos-menu-btn{display:flex;align-items:center;justify-content:center;position:fixed;top:12px;left:12px;z-index:1200;' +
      'width:40px;height:40px;border-radius:10px;border:none;background:#1a2e5a;color:#fff;font-size:20px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25)}' +
    'body.student-page #hos-menu-btn{background:#7a4f2d}' +
    '.sidebar{display:flex !important;flex-direction:column;position:fixed !important;top:0;left:0;bottom:0;z-index:1150;' +
      'transform:translateX(-100%);transition:transform .25s ease;max-width:82vw}' +
    '.sidebar.open{transform:none !important}' +
    '#hos-backdrop.show{display:block;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1100}' +
    '.main{margin-left:0 !important;width:100%;max-width:100vw}' +
    '.topbar{padding-left:64px !important;padding-right:12px !important;height:auto !important;min-height:60px;flex-wrap:wrap;gap:8px}' +
    '.topbar-right{flex-wrap:wrap;gap:8px}' +
    '.page-content{padding:14px !important}' +
    '.kpi-grid{grid-template-columns:1fr 1fr !important}' +
    '.form-grid,.form-grid.cols3{grid-template-columns:1fr !important}' +
    '[style*="grid-template-columns"]{grid-template-columns:1fr !important}' +
    '.table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}' +
    '.table-wrap table{min-width:560px}' +
    '.card-header{flex-wrap:wrap;gap:10px}' +
    '.filter-bar,.search-bar{flex-wrap:wrap}' +
    '.search-input{min-width:0;width:100%}' +
    '.modal,.modal-box,.modal-content{width:94vw !important;max-width:94vw !important;max-height:90vh;overflow-y:auto}' +
  '}' +
  '@media (max-width:480px){.kpi-grid{grid-template-columns:1fr !important}.page-title{font-size:16px !important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function init() {
    var sidebar = document.querySelector('.sidebar');
    if (location.pathname.indexOf('student-') !== -1) document.body.classList.add('student-page');

    /* logout button */
    var host = document.querySelector('.sidebar-footer') || sidebar;
    if (host && !document.getElementById('hostelos-logout')) {
      var btn = document.createElement('button');
      btn.id = 'hostelos-logout';
      btn.textContent = '🚪 Logout';
      btn.onclick = logout;
      btn.style.cssText = 'width:100%;margin-top:10px;padding:9px 12px;border:1.5px solid rgba(255,255,255,0.35);' +
        'background:transparent;color:#fff;border-radius:8px;font-family:Montserrat,sans-serif;font-size:12px;font-weight:700;cursor:pointer;';
      host.appendChild(btn);
    }

    /* hamburger */
    if (sidebar && !document.getElementById('hos-menu-btn')) {
      var m = document.createElement('button'); m.id = 'hos-menu-btn'; m.setAttribute('aria-label', 'Menu'); m.textContent = '☰';
      var bd = document.createElement('div'); bd.id = 'hos-backdrop';
      function toggle(open) { sidebar.classList.toggle('open', open); bd.classList.toggle('show', open); }
      m.onclick = function () { toggle(!sidebar.classList.contains('open')); };
      bd.onclick = function () { toggle(false); };
      sidebar.addEventListener('click', function (e) { if (e.target.closest('a')) toggle(false); });
      document.body.appendChild(m); document.body.appendChild(bd);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();