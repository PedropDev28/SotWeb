/**
 * Proxy de novedades oficiales de Sea of Thieves.
 * Steam solo publica en inglés; localizamos a ES y enlazamos a seaofthieves.com/es.
 */
const STEAM_APP_ID = 1172620;
const STEAM_NEWS_URL =
  `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${STEAM_APP_ID}&count=16&maxlength=360&format=json`;

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
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > 220) text = `${text.slice(0, 217).trim()}…`;
  return text;
}

function badgeForTitle(title, lang) {
  const t = String(title || '');
  const es = lang !== 'en';
  if (/release notes|hotfix|notas del parche|revisión/i.test(t)) {
    return es ? 'Parche' : 'Patch';
  }
  if (/this month|este mes/i.test(t)) return es ? 'Calendario' : 'Calendar';
  if (/community weekend|fin de semana de la comunidad/i.test(t)) {
    return es ? 'Evento' : 'Event';
  }
  if (/season\s+\d+|temporada\s+\d+/i.test(t)) {
    return es ? 'Temporada' : 'Season';
  }
  return es ? 'Oficial' : 'Official';
}

function localizeTitle(title, lang) {
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

function officialArticleUrl(title, gid, lang) {
  const hub =
    lang === 'en'
      ? 'https://www.seaofthieves.com/news'
      : 'https://www.seaofthieves.com/es/news';
  const slug = monthArticleSlug(title);
  if (slug) return `${hub}/${slug}`;
  return `https://steamcommunity.com/games/${STEAM_APP_ID}/announcements/detail/${gid}`;
}

async function translateToSpanish(text) {
  const q = String(text || '').trim();
  if (!q) return q;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    q.slice(0, 450)
  )}&langpair=en|es`;
  const res = await fetch(url);
  if (!res.ok) return q;
  const data = await res.json();
  const out = data?.responseData?.translatedText;
  if (!out || /INVALID|MYMEMORY WARNING/i.test(out)) return q;
  return out;
}

async function mapItem(item, index, lang) {
  const date = new Date(Number(item.date) * 1000);
  const iso = Number.isNaN(date.getTime())
    ? ''
    : date.toISOString().slice(0, 10);

  const titleEn = item.title;
  const summaryEn = cleanSummary(item.contents);
  const title = localizeTitle(titleEn, lang);
  let summary = summaryEn;

  if (lang !== 'en' && summaryEn) {
    try {
      summary = await translateToSpanish(summaryEn);
    } catch {
      summary = summaryEn;
    }
  }

  const isMonth = /this month|este mes/i.test(titleEn) || /este mes/i.test(title);
  const es = lang !== 'en';

  return {
    id: `sot-${item.gid}`,
    title,
    titleEn,
    date: iso,
    summary,
    badge: badgeForTitle(titleEn, lang),
    featured: index === 0,
    source: 'official',
    link: officialArticleUrl(titleEn, item.gid, lang),
    linkLabel: isMonth
      ? es
        ? 'Leer en seaofthieves.com'
        : 'Read on seaofthieves.com'
      : es
        ? 'Leer anuncio oficial'
        : 'Read official announcement',
  };
}

async function fetchOfficialNews(lang) {
  const res = await fetch(STEAM_NEWS_URL, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Steam news HTTP ${res.status}`);
  const data = await res.json();
  const items = Array.isArray(data?.appnews?.newsitems)
    ? data.appnews.newsitems
    : [];

  const filtered = items
    .filter((item) => item.feedname === 'steam_community_announcements')
    .slice(0, 6);

  const mapped = [];
  for (let i = 0; i < filtered.length; i += 1) {
    mapped.push(await mapItem(filtered[i], i, lang));
  }
  return mapped;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const langRaw = String(req.query?.lang || 'es').toLowerCase();
  const lang = langRaw === 'en' ? 'en' : 'es';

  try {
    const news = await fetchOfficialNews(lang);
    res.status(200).json({
      source: 'steam-rare',
      lang,
      officialHub:
        lang === 'en'
          ? 'https://www.seaofthieves.com/news'
          : 'https://www.seaofthieves.com/es/news',
      news,
    });
  } catch (err) {
    res.status(502).json({
      error: 'No se pudieron obtener las novedades oficiales.',
      detail: String(err?.message || err),
    });
  }
};
