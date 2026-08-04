(function () {
  let cache = null;

  const OFFICIAL_HUB = 'https://www.seaofthieves.com/news';
  const STEAM_APP_ID = 1172620;

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

  function badgeForTitle(title) {
    const t = window.SOTI18n?.t?.bind(window.SOTI18n);
    const raw = String(title || '');
    if (/release notes|hotfix/i.test(raw)) return t?.('news.badgePatch') || 'Parche';
    if (/this month/i.test(raw)) return t?.('news.badgeCalendar') || 'Calendario';
    if (/community weekend/i.test(raw)) return t?.('news.badgeEvent') || 'Evento';
    if (/season\s+\d+/i.test(raw)) return t?.('news.badgeSeason') || 'Temporada';
    return t?.('news.badgeOfficial') || 'Oficial';
  }

  function officialArticleUrl(title, gid) {
    const month = String(title || '').match(
      /This Month in Sea of Thieves:\s*([A-Za-z]+)\s+(\d{4})/i
    );
    if (month) {
      return `${OFFICIAL_HUB}/this-month-${month[1].toLowerCase()}${month[2]}`;
    }
    return `https://steamcommunity.com/games/${STEAM_APP_ID}/announcements/detail/${gid}`;
  }

  function mapSteamItem(item, index) {
    const date = new Date(Number(item.date) * 1000);
    const iso = Number.isNaN(date.getTime())
      ? ''
      : date.toISOString().slice(0, 10);
    const isMonth = /This Month in Sea of Thieves/i.test(item.title);
    const t = window.SOTI18n?.t?.bind(window.SOTI18n);

    return {
      id: `sot-${item.gid}`,
      title: item.title,
      date: iso,
      summary: cleanSummary(item.contents),
      badge: badgeForTitle(item.title),
      featured: index === 0,
      source: 'official',
      link: officialArticleUrl(item.title, item.gid),
      linkLabel: isMonth
        ? t?.('news.readOfficialSite') || 'Leer en seaofthieves.com'
        : t?.('news.readOfficial') || 'Leer anuncio oficial',
    };
  }

  async function fetchFromApi() {
    const endpoint =
      window.SOT_CONFIG?.officialNewsApi || '/api/official-news';
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) throw new Error('API oficial no disponible');
    const data = await res.json();
    return Array.isArray(data.news) ? data.news : [];
  }

  async function fetchFromSteam() {
    const url =
      `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${STEAM_APP_ID}&count=16&maxlength=360&format=json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Steam news no disponible');
    const data = await res.json();
    const items = Array.isArray(data?.appnews?.newsitems)
      ? data.appnews.newsitems
      : [];
    return items
      .filter((item) => item.feedname === 'steam_community_announcements')
      .slice(0, 6)
      .map(mapSteamItem);
  }

  async function fetchOfficialFallback() {
    const res = await fetch(window.SOT_ASSET('data/official-news.json'), {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Fallback oficial no disponible');
    const data = await res.json();
    return Array.isArray(data) ? data : Array.isArray(data.news) ? data.news : [];
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
    if (cache) return cache;

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
    return cache;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    const locale = window.SOTI18n?.getLocale?.() === 'en' ? 'en-GB' : 'es-ES';
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

  window.SOTNews = {
    loadNews,
    loadOfficialNews,
    renderNewsItem,
    formatDate,
    officialHub: OFFICIAL_HUB,
    clearCache() {
      cache = null;
    },
  };
})();
