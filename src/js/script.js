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
