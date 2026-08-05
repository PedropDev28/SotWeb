document.addEventListener('DOMContentLoaded', () => {
  const t = (key) => window.SOTI18n?.t?.(key) ?? key;
  const msg = document.getElementById('form-msg');

  try {
    if (SOTAuth.consumeDiscordCallback()) {
      window.location.href = 'cuenta.html';
      return;
    }
  } catch (err) {
    if (msg) {
      msg.textContent = err.message || t('auth.discordError');
      msg.classList.add('error');
    }
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('error') === 'discord' && msg) {
    msg.textContent = t('auth.discordError');
    msg.classList.add('error');
  }

  if (SOTAuth.getSession()) {
    window.location.href = 'cuenta.html';
    return;
  }

  const discordBtn = document.getElementById('discord-login');
  if (discordBtn) {
    discordBtn.addEventListener('click', () => {
      try {
        SOTAuth.startDiscordLogin();
      } catch (err) {
        if (msg) {
          msg.textContent = err.message || t('auth.discordHint');
          msg.classList.add('error');
        }
      }
    });
  }

  SOTApp.initGoogleButton(() => {
    window.location.href = 'cuenta.html';
  });
});
