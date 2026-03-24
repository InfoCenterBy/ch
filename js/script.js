/**
 * Использование: await requestWithLoader(fetch('/api/endpoint', {...}))
 * или: await requestWithLoader(async () => { ... })
 */
(function initLoader() {
  const loader = document.getElementById('globalLoader');

  window.showLoader = function () {
    if (!loader) return;
    loader.dataset.loading = 'true';
    loader.style.opacity = '1';
    loader.style.pointerEvents = 'auto';
    loader.setAttribute('aria-hidden', 'false');
  };

  window.hideLoader = function () {
    if (!loader) return;
    loader.dataset.loading = 'false';
    loader.style.opacity = '0';
    loader.style.pointerEvents = 'none';
    loader.setAttribute('aria-hidden', 'true');
  };

  window.requestWithLoader = async function (promiseOrFn) {
    const promise = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
    showLoader();
    try {
      const result = await promise;
      return result;
    } finally {
      hideLoader();
    }
  };
})();

document.querySelectorAll('[data-password-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const wrapper = btn.closest('.password-input-wrapper');
    const input = wrapper?.querySelector('input[type="password"], input[type="text"]');
    if (!input) return;

    const iconCrossed = btn.querySelector('.password-icon-crossed');
    const iconNormal = btn.querySelector('.password-icon-normal');
    const isHidden = input.type === 'password';

    input.type = isHidden ? 'text' : 'password';
    const nowVisible = isHidden;
    iconCrossed?.classList.toggle('hidden', nowVisible);
    iconNormal?.classList.toggle('hidden', !nowVisible);
    btn.setAttribute('aria-label', nowVisible ? 'Скрыть пароль' : 'Показать пароль');
  });
});
