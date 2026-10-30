/* HostelOS — shared logout button (admin + student pages) */
(function () {
  function logout() {
    var type = localStorage.getItem('hostelos_type');
    localStorage.removeItem('hostelos_token');
    localStorage.removeItem('hostelos_user');
    localStorage.removeItem('hostelos_type');
    window.location.href = type === 'student' ? 'student-login.html' : 'admin-login.html';
  }
  window.hostelosLogout = logout;

  function addButton() {
    var host = document.querySelector('.sidebar-footer') || document.querySelector('.sidebar');
    if (!host || document.getElementById('hostelos-logout')) return;
    var btn = document.createElement('button');
    btn.id = 'hostelos-logout';
    btn.textContent = '🚪 Logout';
    btn.onclick = logout;
    btn.style.cssText = 'width:100%;margin-top:10px;padding:9px 12px;border:1.5px solid rgba(255,255,255,0.35);' +
      'background:transparent;color:#fff;border-radius:8px;font-family:Montserrat,sans-serif;font-size:12px;' +
      'font-weight:700;cursor:pointer;';
    btn.onmouseover = function () { btn.style.background = 'rgba(255,255,255,0.15)'; };
    btn.onmouseout = function () { btn.style.background = 'transparent'; };
    host.appendChild(btn);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton);
  else addButton();
})();
