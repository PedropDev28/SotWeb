(function () {
  function currentPage() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    return path === '' ? 'index.html' : path;
  }

  function updateNavAuth() {
    const session = window.SOTAuth?.getSession();
    const authLink = document.querySelector('[data-auth-link]');
    const accountLink = document.querySelector('[data-account-link]');

    if (authLink) {
      if (session) {
        authLink.textContent = 'Cerrar sesión';
        authLink.href = '#';
        authLink.addEventListener('click', (e) => {
          e.preventDefault();
          window.SOTAuth.logout();
          window.location.href = 'index.html';
        });
      } else {
        authLink.textContent = 'Entrar';
        authLink.href = 'auth.html';
      }
    }

    if (accountLink) {
      accountLink.classList.toggle('hidden', !session);
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
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
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
        hint.textContent =
          'Para activar Google, pon tu Client ID en src/assets/js/config.js';
        hint.classList.add('error');
      }
      mount.innerHTML = `
        <button type="button" class="btn btn-google" disabled>
          Continuar con Google (sin configurar)
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
              hint.textContent = err.message || 'Error con Google.';
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
        locale: 'es',
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
