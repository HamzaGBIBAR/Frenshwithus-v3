/**
 * Script d'initialisation exécuté avant le rendu (theme, RTL).
 * Placé dans public/ pour éviter 'unsafe-inline' dans la CSP.
 */
(function () {
  var lang = localStorage.getItem('frenchwithus-lang');
  if (lang === 'ar') document.documentElement.dir = 'rtl';
})();
(function () {
  var stored = localStorage.getItem('frenchwithus-theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark = stored === 'dark' || (stored !== 'light' && prefersDark);
  if (isDark) document.documentElement.classList.add('dark');
})();
