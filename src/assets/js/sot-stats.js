(function () {
  const SNAPSHOT_KEY = 'sot_pirate_snapshot';
  const RAT_SESSION_KEY = 'sot_rat_session';

  function readStore(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  }

  function writeStore(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function getSnapshot(userId) {
    if (!userId) return null;
    return readStore(SNAPSHOT_KEY)[userId] || null;
  }

  function saveSnapshot(userId, profile) {
    const all = readStore(SNAPSHOT_KEY);
    all[userId] = {
      profile,
      syncedAt: profile.fetchedAt || new Date().toISOString(),
    };
    writeStore(SNAPSHOT_KEY, all);
    return all[userId];
  }

  function clearSnapshot(userId) {
    const all = readStore(SNAPSHOT_KEY);
    delete all[userId];
    writeStore(SNAPSHOT_KEY, all);
    clearSessionRat(userId);
  }

  function saveSessionRat(userId, rat) {
    try {
      const all = JSON.parse(sessionStorage.getItem(RAT_SESSION_KEY) || '{}');
      all[userId] = rat;
      sessionStorage.setItem(RAT_SESSION_KEY, JSON.stringify(all));
    } catch {
      /* ignore */
    }
  }

  function getSessionRat(userId) {
    try {
      const all = JSON.parse(sessionStorage.getItem(RAT_SESSION_KEY) || '{}');
      return all[userId] || '';
    } catch {
      return '';
    }
  }

  function clearSessionRat(userId) {
    try {
      const all = JSON.parse(sessionStorage.getItem(RAT_SESSION_KEY) || '{}');
      delete all[userId];
      sessionStorage.setItem(RAT_SESSION_KEY, JSON.stringify(all));
    } catch {
      /* ignore */
    }
  }

  function apiUrl() {
    return window.SOT_CONFIG?.sotProfileApi || '/api/sot-profile';
  }

  async function fetchProfile({ rat, gamertag }) {
    const res = await fetch(apiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        rat,
        gamertag: gamertag || undefined,
      }),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const msg =
        data?.error ||
        (res.status === 404
          ? 'El endpoint /api/sot-profile no está disponible (¿desplegado en Vercel?).'
          : `Error HTTP ${res.status}`);
      throw new Error(msg);
    }

    return data;
  }

  async function connect(userId, { rat, gamertag, rememberSession }) {
    const profile = await fetchProfile({ rat, gamertag });
    if (gamertag && !profile.gamertag) profile.gamertag = gamertag;
    const saved = saveSnapshot(userId, profile);
    if (rememberSession) saveSessionRat(userId, rat);
    else clearSessionRat(userId);
    return saved;
  }

  async function refresh(userId, { gamertag } = {}) {
    const rat = getSessionRat(userId);
    if (!rat) {
      throw new Error(
        'No hay token en esta sesión. Vuelve a conectar pegando el cookie rat.'
      );
    }
    const existing = getSnapshot(userId);
    return connect(userId, {
      rat,
      gamertag: gamertag || existing?.profile?.gamertag || '',
      rememberSession: true,
    });
  }

  function formatNumber(n, locale) {
    if (n == null || Number.isNaN(Number(n))) return '—';
    try {
      return Number(n).toLocaleString(locale === 'en' ? 'en-GB' : 'es-ES');
    } catch {
      return String(n);
    }
  }

  function companyName(company, locale) {
    return locale === 'en' ? company.nameEn : company.nameEs;
  }

  function statLabel(stat, locale) {
    return locale === 'en' ? stat.labelEn : stat.labelEs;
  }

  function relativeTime(iso, locale) {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diff = Date.now() - then;
    const mins = Math.round(diff / 60000);
    const t = window.SOTI18n?.t?.bind(window.SOTI18n);
    if (mins < 1) return t ? t('sot.justNow') : 'ahora';
    if (mins < 60) {
      return t
        ? t('sot.minsAgo', { n: mins })
        : `hace ${mins} min`;
    }
    const hours = Math.round(mins / 60);
    if (hours < 48) {
      return t
        ? t('sot.hoursAgo', { n: hours })
        : `hace ${hours} h`;
    }
    const days = Math.round(hours / 24);
    return t ? t('sot.daysAgo', { n: days }) : `hace ${days} d`;
  }

  window.SOTPirate = {
    getSnapshot,
    saveSnapshot,
    clearSnapshot,
    getSessionRat,
    connect,
    refresh,
    formatNumber,
    companyName,
    statLabel,
    relativeTime,
  };
})();
