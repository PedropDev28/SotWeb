(function () {
  const SESSION_KEY = 'sot_session';

  function setSession(user) {
    const session = {
      id: user.id,
      name: user.name,
      email: user.email || '',
      avatar: user.avatar || '',
      provider: user.provider,
      discordId: user.discordId || '',
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

  function t(key) {
    return window.SOTI18n?.t?.(key) ?? key;
  }

  function loginWithGoogleProfile(profile) {
    if (!profile?.email && !profile?.sub) {
      throw new Error(t('auth.googleProfile'));
    }

    const sub = profile.sub || profile.email.toLowerCase();
    return setSession({
      id: `google:${sub}`,
      name: profile.name || (profile.email || 'Pirata').split('@')[0],
      email: (profile.email || '').toLowerCase(),
      avatar: profile.picture || '',
      provider: 'google',
    });
  }

  function loginWithDiscordProfile(profile) {
    if (!profile?.id) {
      throw new Error(t('auth.discordProfile'));
    }

    const username = profile.global_name || profile.username || 'Pirata';
    const avatar = profile.avatar
      ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=128`
      : '';

    return setSession({
      id: `discord:${profile.id}`,
      name: username,
      email: profile.email || '',
      avatar,
      provider: 'discord',
      discordId: String(profile.id),
    });
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
      sub: payload.sub,
    });
  }

  function consumeDiscordCallback() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('discord');
    if (!raw) return null;

    try {
      const profile = JSON.parse(decodeURIComponent(raw));
      const session = loginWithDiscordProfile(profile);
      params.delete('discord');
      params.delete('error');
      const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', clean);
      return session;
    } catch {
      throw new Error(t('auth.discordProfile'));
    }
  }

  function startDiscordLogin() {
    const clientId = window.SOT_CONFIG?.discordClientId;
    if (!clientId) {
      throw new Error(t('auth.discordHint'));
    }
    const redirectUri = `${window.location.origin}/api/auth-discord`;
    const url = new URL('https://discord.com/api/oauth2/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'identify email');
    window.location.href = url.toString();
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

  function isAdmin(session = getSession()) {
    if (!session) return false;
    const emails = (window.SOT_CONFIG?.adminGoogleEmails || []).map((e) => e.toLowerCase());
    const discordIds = (window.SOT_CONFIG?.adminDiscordIds || []).map(String);
    if (session.provider === 'google' && session.email && emails.includes(session.email.toLowerCase())) {
      return true;
    }
    if (session.provider === 'discord' && session.discordId && discordIds.includes(String(session.discordId))) {
      return true;
    }
    return false;
  }

  window.SOTAuth = {
    logout,
    getSession,
    requireAuth,
    handleGoogleCredential,
    loginWithGoogleProfile,
    loginWithDiscordProfile,
    consumeDiscordCallback,
    startDiscordLogin,
    isAdmin,
  };
})();
