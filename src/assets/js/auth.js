(function () {
  const USERS_KEY = 'sot_users';
  const SESSION_KEY = 'sot_session';

  function readUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function writeUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function setSession(user) {
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      provider: user.provider || 'local',
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function findByEmail(email) {
    return readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function t(key) {
    return window.SOTI18n?.t?.(key) ?? key;
  }

  async function register({ name, email, password }) {
    if (!name?.trim() || !email?.trim() || !password) {
      throw new Error(t('auth.fillAll'));
    }
    if (password.length < 6) {
      throw new Error(t('auth.passwordShort'));
    }
    if (findByEmail(email)) {
      throw new Error(t('auth.emailExists'));
    }

    const user = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await hashPassword(password),
      provider: 'local',
      avatar: '',
      createdAt: new Date().toISOString(),
    };

    const users = readUsers();
    users.push(user);
    writeUsers(users);
    return setSession(user);
  }

  async function login({ email, password }) {
    const user = findByEmail(email || '');
    if (!user || user.provider !== 'local') {
      throw new Error(t('auth.badCredentials'));
    }
    const hash = await hashPassword(password || '');
    if (hash !== user.passwordHash) {
      throw new Error(t('auth.badCredentials'));
    }
    return setSession(user);
  }

  function loginWithGoogleProfile(profile) {
    if (!profile?.email) {
      throw new Error(t('auth.googleProfile'));
    }

    let user = findByEmail(profile.email);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        name: profile.name || profile.email.split('@')[0],
        email: profile.email.toLowerCase(),
        passwordHash: '',
        provider: 'google',
        avatar: profile.picture || '',
        createdAt: new Date().toISOString(),
      };
      const users = readUsers();
      users.push(user);
      writeUsers(users);
    } else {
      user.name = profile.name || user.name;
      user.avatar = profile.picture || user.avatar;
      user.provider = 'google';
      const users = readUsers().map((u) => (u.id === user.id ? user : u));
      writeUsers(users);
    }

    return setSession(user);
  }

  function parseJwt(token) {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  }

  function handleGoogleCredential(response) {
    const payload = parseJwt(response.credential);
    return loginWithGoogleProfile({
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    });
  }

  function logout() {
    clearSession();
  }

  function requireAuth(redirectTo = 'auth.html') {
    const session = getSession();
    if (!session) {
      window.location.href = redirectTo;
      return null;
    }
    return session;
  }

  window.SOTAuth = {
    register,
    login,
    logout,
    getSession,
    requireAuth,
    handleGoogleCredential,
    loginWithGoogleProfile,
  };
})();
