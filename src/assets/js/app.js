(function () {
  function currentPage() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    return path === '' ? 'index.html' : path;
  }

  function t(key) {
    return window.SOTI18n?.t?.(key) ?? key;
  }

  function updateNavAuth() {
    const session = window.SOTAuth?.getSession();
    const authLink = document.querySelector('[data-auth-link]');
    const accountLink = document.querySelector('[data-account-link]');
    const adminLink = document.querySelector('[data-admin-link]');

    if (authLink) {
      if (session) {
        authLink.textContent = t('nav.logoutShort');
        authLink.removeAttribute('data-i18n');
        authLink.href = '#';
        authLink.classList.remove('nav-cta');
        authLink.classList.add('nav-link-quiet');
        authLink.onclick = (e) => {
          e.preventDefault();
          window.SOTAuth.logout();
          window.location.href = 'index.html';
        };
      } else {
        authLink.textContent = t('nav.login');
        authLink.setAttribute('data-i18n', 'nav.login');
        authLink.href = 'auth.html';
        authLink.classList.add('nav-cta');
        authLink.classList.remove('nav-link-quiet');
        authLink.onclick = null;
      }
    }

    if (accountLink) {
      accountLink.classList.toggle('hidden', !session);
    }

    if (adminLink) {
      const isAdmin = !!(session && window.SOTAuth?.isAdmin?.(session));
      adminLink.classList.toggle('hidden', !isAdmin);
    }
  }

  function markActiveNav() {
    const page = currentPage();
    document.querySelectorAll('.nav-links a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const target = href.split('?')[0];
      if (target === page) link.classList.add('active');
    });
  }

  function setupMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const shell = document.querySelector('.nav-shell');
    if (!toggle || !shell) return;
    toggle.addEventListener('click', () => {
      const open = shell.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => {
      if (!shell.classList.contains('open')) return;
      if (e.target.closest('.nav-shell') || e.target.closest('.nav-toggle')) return;
      shell.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  function setupDiscordLinks() {
    const url = window.SOT_CONFIG?.discordInviteUrl || '#';
    document.querySelectorAll('[data-discord-link]').forEach((el) => {
      el.setAttribute('href', url);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    });
  }

  function initGoogleButton(onSuccess) {
    const clientId = window.SOT_CONFIG?.googleClientId;
    const mount = document.getElementById('google-btn');
    const hint = document.getElementById('google-hint');

    if (!mount) return;

    if (!clientId) {
      if (hint) {
        hint.textContent = t('auth.googleHint');
        hint.classList.add('error');
      }
      mount.innerHTML = `
        <button type="button" class="btn btn-google" disabled>
          ${t('auth.googleDisabled')}
        </button>
      `;
      return;
    }

    const render = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          try {
            window.SOTAuth.handleGoogleCredential(response);
            onSuccess?.();
          } catch (err) {
            if (hint) {
              hint.textContent = err.message || t('auth.googleError');
              hint.classList.add('error');
            }
          }
        },
      });
      mount.innerHTML = '';
      window.google.accounts.id.renderButton(mount, {
        theme: 'outline',
        size: 'large',
        width: mount.offsetWidth || 360,
        text: 'continue_with',
        shape: 'rectangular',
        locale: window.SOTI18n?.getLocale?.() || 'es',
      });
    };

    if (window.google?.accounts?.id) {
      render();
    } else {
      window.addEventListener('load', () => setTimeout(render, 300));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateNavAuth();
    markActiveNav();
    setupMobileNav();
    setupDiscordLinks();
  });

  window.SOTApp = {
    initGoogleButton,
    updateNavAuth,
    setupDiscordLinks,
  };
})();
