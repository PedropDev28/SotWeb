document.addEventListener('DOMContentLoaded', () => {
  if (SOTAuth.getSession()) {
    window.location.href = 'cuenta.html';
    return;
  }

  const msg = document.getElementById('form-msg');
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  if (!msg || !loginForm || !registerForm) return;

  document.querySelectorAll('.auth-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      loginForm.classList.toggle('hidden', !isLogin);
      registerForm.classList.toggle('hidden', isLogin);
      msg.textContent = '';
      msg.className = 'form-msg';
    });
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'form-msg';
    try {
      await SOTAuth.login({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
      });
      msg.textContent = '¡Bienvenido a bordo!';
      msg.classList.add('success');
      window.location.href = 'cuenta.html';
    } catch (err) {
      msg.textContent = err.message;
      msg.classList.add('error');
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'form-msg';
    try {
      await SOTAuth.register({
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
      });
      msg.textContent = 'Cuenta creada.';
      msg.classList.add('success');
      window.location.href = 'cuenta.html';
    } catch (err) {
      msg.textContent = err.message;
      msg.classList.add('error');
    }
  });

  SOTApp.initGoogleButton(() => {
    window.location.href = 'cuenta.html';
  });
});
