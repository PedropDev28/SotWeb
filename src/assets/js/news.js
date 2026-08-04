(function () {
  let cache = null;
  let cacheLang = null;

  const STEAM_APP_ID = 1172620;
  const MONTHS_ES = {
    january: 'enero',
    february: 'febrero',
    march: 'marzo',
    april: 'abril',
    may: 'mayo',
    june: 'junio',
    july: 'julio',
    august: 'agosto',
    september: 'septiembre',
    october: 'octubre',
    november: 'noviembre',
    december: 'diciembre',
  };

  function currentLang() {
    return window.SOTI18n?.getLocale?.() === 'en' ? 'en' : 'es';
  }

  function officialHub(lang = currentLang()) {
    return lang === 'en'
      ? 'https://www.seaofthieves.com/news'
      : 'https://www.seaofthieves.com/es/news';
  }

  function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
  }

  function cleanSummary(html) {
    let text = String(html || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length > 220) text = `${text.slice(0, 217).trim()}…`;
    return text;
  }

  function localizeTitle(title, lang = currentLang()) {
    if (lang === 'en') return title;
    let t = String(title || '');

    t = t.replace(
      /This Month in Sea of Thieves:\s*([A-Za-z]+)\s+(\d{4})/i,
      (_, month, year) => {
        const m = MONTHS_ES[month.toLowerCase()] || month.toLowerCase();
        return `Este mes en Sea of Thieves: ${capitalize(m)} de ${year}`;
      }
    );
    t = t.replace(
      /Sea of Thieves Release Notes\s*[–-]\s*Hotfix\s*(.+)/i,
      'Notas del parche de Sea of Thieves – Revisión $1'
    );
    t = t.replace(
      /Sea of Thieves Release Notes\s*[–-]\s*(.+)/i,
      'Notas del parche de Sea of Thieves – $1'
    );
    t = t.replace(
      /Personalise Your Pirate Playground in Sea of Thieves Season\s+(\d+)/i,
      'Personaliza tu patio de juegos pirata en Sea of Thieves Temporada $1'
    );
    t = t.replace(
      /All the Customary Fun in Season\s+(\d+)\s+Community Weekend on (.+)/i,
      'Diversión a medida en el fin de semana de la comunidad de la Temporada $1 ($2)'
    );
    t = t.replace(/Community Weekend/gi, 'fin de semana de la comunidad');
    t = t.replace(/\bSeason\s+(\d+)/gi, 'Temporada $1');
    t = t.replace(/\bHotfix\b/gi, 'Revisión');
    return t;
  }

  function badgeForTitle(title) {
    const t = window.SOTI18n?.t?.bind(window.SOTI18n);
    const raw = String(title || '');
    if (/release notes|hotfix|notas del parche|revisión/i.test(raw)) {
      return t?.('news.badgePatch') || 'Parche';
    }
    if (/this month|este mes/i.test(raw)) {
      return t?.('news.badgeCalendar') || 'Calendario';
    }
    if (/community weekend|fin de semana de la comunidad/i.test(raw)) {
      return t?.('news.badgeEvent') || 'Evento';
    }
    if (/season\s+\d+|temporada\s+\d+/i.test(raw)) {
      return t?.('news.badgeSeason') || 'Temporada';
    }
    return t?.('news.badgeOfficial') || 'Oficial';
  }

  function monthArticleSlug(title) {
    const month = String(title || '').match(
      /(?:This Month in Sea of Thieves|Este mes en Sea of Thieves):\s*([A-Za-záéíóú]+)\s*(?:de\s*)?(\d{4})/i
    );
    if (!month) return null;
    const raw = month[1].toLowerCase();
    const en =
      Object.keys(MONTHS_ES).find((k) => k === raw || MONTHS_ES[k] === raw) ||
      raw;
    return `this-month-${en}${month[2]}`;
  }

  function officialArticleUrl(title, gid, lang = currentLang()) {
    const slug = monthArticleSlug(title);
    if (slug) return `${officialHub(lang)}/${slug}`;
    return `https://steamcommunity.com/games/${STEAM_APP_ID}/announcements/detail/${gid}`;
  }

  async function translateToSpanish(text) {
    const q = String(text || '').trim();
    if (!q) return q;
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          q.slice(0, 450)
        )}&langpair=en|es`,
        { cache: 'force-cache' }
      );
      if (!res.ok) return q;
      const data = await res.json();
      const out = data?.responseData?.translatedText;
      if (!out || /INVALID|MYMEMORY WARNING/i.test(out)) return q;
      return out;
    } catch {
      return q;
    }
  }

  async function localizeOfficialItem(item, index = 0) {
    const lang = currentLang();
    const t = window.SOTI18n?.t?.bind(window.SOTI18n);
    const titleEn = item.titleEn || item.title;
    const alreadyEs =
      /este mes|notas del parche|temporada|fin de semana de la comunidad/i.test(
        item.title || ''
      );

    let title = alreadyEs && lang !== 'en' ? item.title : localizeTitle(titleEn, lang);
    if (lang === 'en' && item.titleEn) title = item.titleEn;

    let summary = item.summary || '';
    const looksEnglish =
      summary &&
      !alreadyEs &&
      /\b(the|and|with|from|your|this|season|update)\b/i.test(summary);

    if (lang !== 'en' && looksEnglish) {
      summary = await translateToSpanish(summary);
    }

    const isMonth = /this month|este mes/i.test(titleEn) || /este mes/i.test(title);
    const gid = String(item.id || '').replace(/^sot-/, '');

    let link = item.link;
    if (link && link.includes('seaofthieves.com')) {
      link = link
        .replace('www.seaofthieves.com/news', `www.seaofthieves.com/${lang === 'en' ? 'news' : 'es/news'}`)
        .replace('www.seaofthieves.com/es/es/', 'www.seaofthieves.com/es/')
        .replace('www.seaofthieves.com/es/news/es/', 'www.seaofthieves.com/es/news/');
      if (lang === 'en') {
        link = link.replace('www.seaofthieves.com/es/news', 'www.seaofthieves.com/news');
      }
    } else if (gid) {
      link = officialArticleUrl(titleEn, gid, lang);
    }

    return {
      ...item,
      title,
      titleEn,
      summary,
      badge: badgeForTitle(titleEn),
      featured: index === 0 ? true : !!item.featured,
      source: 'official',
      link,
      linkLabel: isMonth
        ? t?.('news.readOfficialSite') || 'Leer en seaofthieves.com'
        : t?.('news.readOfficial') || 'Leer anuncio oficial',
    };
  }

  function mapSteamItem(item, index) {
    const date = new Date(Number(item.date) * 1000);
    const iso = Number.isNaN(date.getTime())
      ? ''
      : date.toISOString().slice(0, 10);

    return localizeOfficialItem(
      {
        id: `sot-${item.gid}`,
        title: item.title,
        titleEn: item.title,
        date: iso,
        summary: cleanSummary(item.contents),
        source: 'official',
        link: officialArticleUrl(item.title, item.gid),
      },
      index
    );
  }

  async function fetchFromApi() {
    const lang = currentLang();
    const base = window.SOT_CONFIG?.officialNewsApi || '/api/official-news';
    const endpoint = `${base}${base.includes('?') ? '&' : '?'}lang=${lang}`;
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) throw new Error('API oficial no disponible');
    const data = await res.json();
    const news = Array.isArray(data.news) ? data.news : [];
    return Promise.all(news.map((item, i) => localizeOfficialItem(item, i)));
  }

  async function fetchFromSteam() {
    const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${STEAM_APP_ID}&count=16&maxlength=360&format=json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Steam news no disponible');
    const data = await res.json();
    const items = Array.isArray(data?.appnews?.newsitems)
      ? data.appnews.newsitems
      : [];
    const filtered = items
      .filter((item) => item.feedname === 'steam_community_announcements')
      .slice(0, 6);
    return Promise.all(filtered.map((item, i) => mapSteamItem(item, i)));
  }

  async function fetchOfficialFallback() {
    const res = await fetch(window.SOT_ASSET('data/official-news.json'), {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Fallback oficial no disponible');
    const data = await res.json();
    const news = Array.isArray(data)
      ? data
      : Array.isArray(data.news)
        ? data.news
        : [];
    return Promise.all(news.map((item, i) => localizeOfficialItem(item, i)));
  }

  async function loadOfficialNews() {
    const loaders = [fetchFromApi, fetchFromSteam, fetchOfficialFallback];
    for (const load of loaders) {
      try {
        const news = await load();
        if (news.length) return news;
      } catch {
        /* probar siguiente fuente */
      }
    }
    return [];
  }

  async function loadCrewNews() {
    const res = await fetch(window.SOT_ASSET('data/news.json'), {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const t = window.SOTI18n?.t?.bind(window.SOTI18n);
    return (Array.isArray(data.news) ? data.news : []).map((item) => {
      const localized = window.SOTI18n?.localizeItem?.(item) || item;
      return {
        ...localized,
        source: item.source || 'crew',
        badge: localized.badge || t?.('news.badgeCrew') || 'Tripulación',
      };
    });
  }

  function byDateDesc(a, b) {
    return String(b.date || '').localeCompare(String(a.date || ''));
  }

  async function loadNews() {
    const lang = currentLang();
    if (cache && cacheLang === lang) return cache;

    const [official, crew] = await Promise.all([
      loadOfficialNews(),
      loadCrewNews(),
    ]);

    const officialIds = new Set(official.map((n) => n.id));
    const merged = [
      ...official,
      ...crew.filter((n) => !officialIds.has(n.id)),
    ].sort(byDateDesc);

    if (merged.length) {
      const newestOfficial = merged.find((n) => n.source === 'official');
      merged.forEach((n) => {
        n.featured = newestOfficial
          ? n.id === newestOfficial.id
          : n === merged[0];
      });
    }

    cache = merged;
    cacheLang = lang;
    return cache;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    const locale = currentLang() === 'en' ? 'en-GB' : 'es-ES';
    return d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function resolveLink(item) {
    if (!item.link) return null;
    if (item.link === 'discord') {
      return window.SOT_CONFIG?.discordInviteUrl || '#';
    }
    return item.link;
  }

  function renderNewsItem(item) {
    const href = resolveLink(item);
    const external = href && (href.startsWith('http') || item.link === 'discord');
    const linkHtml =
      href && item.linkLabel
        ? `<a class="news-link" href="${escapeHtml(href)}"${
            external ? ' target="_blank" rel="noopener noreferrer"' : ''
          }>${escapeHtml(item.linkLabel)} →</a>`
        : '';

    return `
      <article class="news-item${item.featured ? ' is-featured' : ''}${
        item.source === 'official' ? ' is-official' : ''
      }">
        <div>
          ${
            item.badge
              ? `<span class="news-badge">${escapeHtml(item.badge)}</span>`
              : ''
          }
          <span class="news-date">${escapeHtml(formatDate(item.date))}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary || '')}</p>
          ${linkHtml}
        </div>
      </article>
    `;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function syncOfficialHubLinks() {
    const hub = officialHub();
    document.querySelectorAll('a.section-more[href*="seaofthieves.com"]').forEach((a) => {
      a.setAttribute('href', hub);
    });
  }

  window.SOTNews = {
    loadNews,
    loadOfficialNews,
    renderNewsItem,
    formatDate,
    officialHub,
    syncOfficialHubLinks,
    clearCache() {
      cache = null;
      cacheLang = null;
    },
  };
})();
