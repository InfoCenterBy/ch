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

(function initPhoneMask() {
  const PREFIX = '+375(';

  function formatPhone(value) {
    const digits = value.replace(/\D/g, '');
    const nums = digits.startsWith('375') ? digits.slice(3, 12) : digits.slice(0, 9);
    if (nums.length === 0) return '';
    let result = '+375(';
    result += nums.slice(0, 2);
    if (nums.length > 2) result += ')' + nums.slice(2, 5);
    if (nums.length > 5) result += '-' + nums.slice(5, 7);
    if (nums.length > 7) result += '-' + nums.slice(7, 9);
    return result;
  }

  document.querySelectorAll('[data-phone-mask]').forEach((input) => {
    input.addEventListener('focus', (e) => {
      if (e.target.value === '') {
        e.target.value = PREFIX;
        e.target.setSelectionRange(PREFIX.length, PREFIX.length);
      }
    });
    input.addEventListener('blur', (e) => {
      if (e.target.value === PREFIX) e.target.value = '';
    });
    input.addEventListener('input', (e) => {
      e.target.value = formatPhone(e.target.value);
    });
    if (input.value) input.value = formatPhone(input.value);
  });
})();

(function initDatePickers() {
  if (typeof flatpickr !== 'function') return;

  document.querySelectorAll('[data-date-picker]').forEach((input) => {
    const instance = flatpickr(input, {
      locale: 'ru',
      dateFormat: 'd.m.Y',
      allowInput: false,
      clickOpens: true,
      disableMobile: true,
    });

    const wrapper = input.closest('[data-date-picker-wrap]');
    if (!wrapper) return;
    wrapper.addEventListener('click', (event) => {
      if (event.target !== input) {
        instance.open();
      }
    });
  });
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
