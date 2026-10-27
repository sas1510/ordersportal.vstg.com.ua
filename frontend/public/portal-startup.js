(function () {
  'use strict';
  var panel = document.getElementById('portal-startup');
  if (!panel) return;
  var title = document.getElementById('portal-startup-title');
  var message = document.getElementById('portal-startup-message');
  var help = document.getElementById('portal-startup-help');
  var code = document.getElementById('portal-startup-code');
  var spinner = document.getElementById('portal-startup-spinner');
  var ready = false;
  var timer;

  function showProblem(reason, slow) {
    panel.hidden = false;
    spinner.hidden = true;
    help.hidden = false;
    title.textContent = slow ? 'Завантаження триває довше, ніж зазвичай' : 'Не вдалося відкрити портал';
    message.textContent = 'Перевірте з’єднання з інтернетом і спробуйте ще раз. Якщо це повторюється, передайте код нижче відповідальному менеджеру.';
    code.textContent = 'Код: ' + reason;
  }
  window.addEventListener('portal:ready', function () {
    ready = true;
    window.clearTimeout(timer);
    panel.hidden = true;
  });
  window.addEventListener('portal:startup-failed', function () {
    window.clearTimeout(timer);
    showProblem('APP_RENDER_ERROR', false);
  });
  window.addEventListener('error', function (event) {
    if (ready) return;
    var target = event.target;
    if (target && target.tagName === 'SCRIPT' && target.type === 'module') {
      window.clearTimeout(timer);
      showProblem('MODULE_LOAD_ERROR', false);
    }
    // Third-party SDK errors do not mean the portal itself failed.
  }, true);
  timer = window.setTimeout(function () {
    if (!ready) showProblem('STARTUP_TIMEOUT', true);
  }, 15000);

  // A remotely loaded font must not block the initial screen or application.
  var font = document.createElement('link');
  font.rel = 'stylesheet';
  font.media = 'print';
  font.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';
  font.onload = function () { font.media = 'all'; };
  document.head.appendChild(font);
}());
