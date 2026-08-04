/**
 * Proxy de novedades oficiales de Sea of Thieves.
 * La web oficial bloquea el RSS con WAF; usamos los anuncios de Rare en Steam
 * (mismo contenido que publica Rare) y enlazamos a seaofthieves.com cuando es posible.
 */
const STEAM_APP_ID = 1172620;
const STEAM_NEWS_URL =
  `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${STEAM_APP_ID}&count=16&maxlength=360&format=json`;

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

function badgeForTitle(title) {
  const t = String(title || '');
  if (/release notes|hotfix/i.test(t)) return 'Parche';
  if (/this month/i.test(t)) return 'Calendario';
  if (/community weekend/i.test(t)) return 'Evento';
  if (/season\s+\d+/i.test(t)) return 'Temporada';
  return 'Oficial';
}

function officialArticleUrl(title, gid) {
  const month = String(title || '').match(
    /This Month in Sea of Thieves:\s*([A-Za-z]+)\s+(\d{4})/i
  );
  if (month) {
    return `https://www.seaofthieves.com/news/this-month-${month[1].toLowerCase()}${month[2]}`;
  }
  return `https://steamcommunity.com/games/${STEAM_APP_ID}/announcements/detail/${gid}`;
}

function mapItem(item, index) {
  const date = new Date(Number(item.date) * 1000);
  const iso = Number.isNaN(date.getTime())
    ? ''
    : date.toISOString().slice(0, 10);

  return {
    id: `sot-${item.gid}`,
    title: item.title,
    date: iso,
    summary: cleanSummary(item.contents),
    badge: badgeForTitle(item.title),
    featured: index === 0,
    source: 'official',
    link: officialArticleUrl(item.title, item.gid),
    linkLabel: /This Month in Sea of Thieves/i.test(item.title)
      ? 'Leer en seaofthieves.com'
      : 'Leer anuncio oficial',
  };
}

async function fetchOfficialNews() {
  const res = await fetch(STEAM_NEWS_URL, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Steam news HTTP ${res.status}`);
  const data = await res.json();
  const items = Array.isArray(data?.appnews?.newsitems)
    ? data.appnews.newsitems
    : [];

  return items
    .filter((item) => item.feedname === 'steam_community_announcements')
    .slice(0, 6)
    .map(mapItem);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    const news = await fetchOfficialNews();
    res.status(200).json({
      source: 'steam-rare',
      officialHub: 'https://www.seaofthieves.com/news',
      news,
    });
  } catch (err) {
    res.status(502).json({
      error: 'No se pudieron obtener las novedades oficiales.',
      detail: String(err?.message || err),
    });
  }
};
