/**
 * Proxy de estadísticas del perfil oficial de Sea of Thieves.
 * Rare no ofrece API pública: usamos los endpoints internos de seaofthieves.com
 * autenticados con la cookie `rat` (Rare Access Token) que el usuario pega.
 *
 * Seguridad:
 * - El token NO se guarda en servidor ni se escribe en logs.
 * - Solo se usa en memoria para las peticiones de esta invocación.
 * - Devolvemos un snapshot normalizado (sin el token).
 */

const SOT_BASE = 'https://www.seaofthieves.com/api/profilev2';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const COMPANY_KEYS = [
  { key: 'GoldHoarders', id: 'gold-hoarders', nameEs: 'Acaparadores de Oro', nameEn: 'Gold Hoarders' },
  { key: 'OrderOfSouls', id: 'order-of-souls', nameEs: 'Orden de las Almas', nameEn: 'Order of Souls' },
  { key: 'MerchantAlliance', id: 'merchant-alliance', nameEs: 'Alianza Comerciante', nameEn: 'Merchant Alliance' },
  { key: 'AthenasFortune', id: 'athenas-fortune', nameEs: 'Fortuna de Atenea', nameEn: "Athena's Fortune" },
  { key: 'ReapersBones', id: 'reapers-bones', nameEs: 'Huesos de la Parca', nameEn: "Reaper's Bones" },
  { key: 'HuntersCall', id: 'hunters-call', nameEs: 'Llamada del Cazador', nameEn: "Hunter's Call" },
  { key: 'BilgeRats', id: 'bilge-rats', nameEs: 'Ratas Sabias', nameEn: 'Bilge Rats' },
  { key: 'GuardiansOfFortune', id: 'guardians', nameEs: 'Guardianes de la Fortuna', nameEn: 'Guardians of Fortune', alts: ['PirateLord'] },
  { key: 'ServantsOfTheFlame', id: 'servants', nameEs: 'Siervos de la Llama', nameEn: 'Servants of the Flame', alts: ['Flameheart'] },
];

const STAT_DEFS = [
  { key: 'Combat_Ships_Sunk', id: 'ships-sunk', labelEs: 'Barcos hundidos', labelEn: 'Ships sunk' },
  { key: 'Combat_Kraken_Defeated', id: 'krakens', labelEs: 'Krakens derrotados', labelEn: 'Krakens defeated' },
  { key: 'Player_TinyShark_Spawned', id: 'megalodons', labelEs: 'Encuentros con megalodón', labelEn: 'Megalodon encounters' },
  { key: 'Chests_HandedIn_Total', id: 'chests', labelEs: 'Cofres entregados', labelEn: 'Chests handed in' },
  { key: 'Voyages_MetresSailed_Total', id: 'metres-sailed', labelEs: 'Metros navegados', labelEn: 'Metres sailed' },
  { key: 'Vomited_Total', id: 'vomited', labelEs: 'Vómitos', labelEn: 'Times vomited' },
];

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function cleanRat(raw) {
  let v = String(raw || '').trim();
  if (/^rat=/i.test(v)) v = v.slice(4);
  if (/^cookie:/i.test(v)) {
    const m = v.match(/rat=([^;]+)/i);
    v = m ? m[1] : v;
  }
  const cookieMatch = v.match(/(?:^|;\s*)rat=([^;]+)/i);
  if (cookieMatch) v = cookieMatch[1];
  return v.trim();
}

function looksLikeRat(token) {
  return typeof token === 'string' && token.length >= 40 && !/\s/.test(token);
}

function num(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'object') {
    const nested = value.value ?? value.Value ?? value.amount ?? value.Amount;
    if (nested != null && nested !== value) return num(nested);
  }
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function pick(obj, paths) {
  for (const path of paths) {
    const parts = path.split('.');
    let cur = obj;
    let ok = true;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object' || !(p in cur)) {
        ok = false;
        break;
      }
      cur = cur[p];
    }
    if (ok && cur != null && cur !== '') return cur;
  }
  return null;
}

function findCompany(reputation, def) {
  if (!reputation || typeof reputation !== 'object') return null;
  if (reputation[def.key]) return reputation[def.key];
  for (const alt of def.alts || []) {
    if (reputation[alt]) return reputation[alt];
  }
  return null;
}

function parseBalance(data) {
  const gold = num(
    pick(data, ['gold', 'Gold', 'currencies.gold', 'Balances.gold', 'wallet.gold'])
  );
  const doubloons = num(
    pick(data, [
      'doubloons',
      'Doubloons',
      'currencies.doubloons',
      'Balances.doubloons',
      'wallet.doubloons',
    ])
  );
  const ancientCoins = num(
    pick(data, [
      'ancientCoins',
      'ancient_coins',
      'AncientCoins',
      'currencies.ancientCoins',
      'currencies.ancient_coins',
      'Balances.ancientCoins',
      'wallet.ancientCoins',
    ])
  );

  return {
    title: pick(data, ['title', 'Title', 'pirateTitle', 'equippedTitle']) || '',
    gamertag:
      pick(data, ['gamertag', 'Gamertag', 'gamerTag', 'displayName', 'name']) || '',
    avatar:
      pick(data, [
        'profileImageUrl',
        'profile_image',
        'profileImage',
        'avatarUrl',
        'avatar',
        'imageUrl',
      ]) || '',
    gold,
    doubloons,
    ancientCoins,
  };
}

function parseAchievements(overview) {
  const a = overview?.achievements || overview?.Achievements || {};
  if (Array.isArray(a)) {
    const done = a.filter((x) => x?.Completed || x?.completed || x?.UnlockDate).length;
    return { completed: done, total: a.length };
  }
  const completed = num(
    pick(a, ['Completed', 'completed', 'Unlocked', 'unlocked', 'Count'])
  );
  const total = num(pick(a, ['Total', 'total', 'Max', 'max']));
  if (completed == null && total == null) return null;
  return { completed: completed ?? 0, total: total ?? completed ?? 0 };
}

function parseSeason(overview) {
  const seasons = overview?.seasons || overview?.Seasons || [];
  if (!Array.isArray(seasons) || !seasons.length) return null;
  const active = seasons.find((s) => s?.IsActive || s?.isActive) || seasons[0];
  let levelProgress = num(active?.LevelProgress ?? active?.levelProgress);
  if (levelProgress != null && levelProgress > 1) levelProgress = levelProgress / 100;
  return {
    title: active?.Title || active?.title || '',
    tier: num(active?.Tier ?? active?.tier),
    levelProgress,
    completeChallenges: num(active?.CompleteChallenges ?? active?.completeChallenges),
    totalChallenges: num(active?.TotalChallenges ?? active?.totalChallenges),
  };
}

function parseStats(overview) {
  const raw = overview?.stats || overview?.Stats || {};
  return STAT_DEFS.map((def) => {
    const value = num(raw[def.key]);
    return {
      id: def.id,
      key: def.key,
      labelEs: def.labelEs,
      labelEn: def.labelEn,
      value,
    };
  }).filter((s) => s.value != null);
}

function parseCompanies(reputation) {
  return COMPANY_KEYS.map((def) => {
    const c = findCompany(reputation, def);
    if (!c) return null;
    const level = num(c.Level ?? c.level);
    const progress = num(c.Progress ?? c.progress);
    const emblemsUnlocked = num(c.EmblemsUnlocked ?? c.emblemsUnlocked);
    const emblemsTotal = num(c.EmblemsTotal ?? c.emblemsTotal);
    if (level == null && progress == null && emblemsUnlocked == null) return null;
    let progressPct = null;
    if (progress != null) {
      progressPct = progress <= 1 ? Math.round(progress * 1000) / 10 : Math.round(progress * 10) / 10;
    }
    return {
      id: def.id,
      key: def.key,
      nameEs: def.nameEs,
      nameEn: def.nameEn,
      motto: c.Motto || c.motto || '',
      rank: c.Rank || c.rank || '',
      level,
      progress: progressPct,
      emblemsUnlocked,
      emblemsTotal,
    };
  }).filter(Boolean);
}

async function sotFetch(path, rat) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${SOT_BASE}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, */*',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        'User-Agent': UA,
        Referer: 'https://www.seaofthieves.com/profile/overview',
        Origin: 'https://www.seaofthieves.com',
        Cookie: `rat=${rat}`,
      },
      signal: controller.signal,
    });

    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

function normalize({ balance, overview, reputation, gamertag }) {
  const b = parseBalance(balance || {});
  return {
    source: 'seaofthieves.com',
    fetchedAt: new Date().toISOString(),
    gamertag: (gamertag || b.gamertag || '').trim(),
    title: b.title,
    avatar: b.avatar,
    currencies: {
      gold: b.gold,
      doubloons: b.doubloons,
      ancientCoins: b.ancientCoins,
    },
    achievements: parseAchievements(overview || {}),
    season: parseSeason(overview || {}),
    stats: parseStats(overview || {}),
    companies: parseCompanies(reputation || {}),
  };
}

module.exports = async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Usa POST con { rat }.' });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    res.status(400).json({ error: 'JSON inválido.' });
    return;
  }

  const rat = cleanRat(body.rat);
  const gamertag = String(body.gamertag || '').trim().slice(0, 64);

  if (!looksLikeRat(rat)) {
    res.status(400).json({
      error:
        'Token rat inválido. Cópialo desde las cookies de seaofthieves.com tras iniciar sesión.',
    });
    return;
  }

  try {
    const [balanceRes, overviewRes, reputationRes] = await Promise.all([
      sotFetch('/balance', rat),
      sotFetch('/overview?latest=3', rat),
      sotFetch('/reputation', rat),
    ]);

    const authFail = [balanceRes, overviewRes, reputationRes].find(
      (r) => r.status === 401 || r.status === 403
    );
    if (authFail) {
      res.status(401).json({
        error:
          'Token caducado o inválido. Vuelve a iniciar sesión en seaofthieves.com y copia el cookie rat.',
      });
      return;
    }

    if (!balanceRes.ok && !overviewRes.ok && !reputationRes.ok) {
      res.status(502).json({
        error: 'Rare no respondió. Prueba más tarde o revisa el token.',
        status: {
          balance: balanceRes.status,
          overview: overviewRes.status,
          reputation: reputationRes.status,
        },
      });
      return;
    }

    const profile = normalize({
      balance: balanceRes.json,
      overview: overviewRes.json,
      reputation: reputationRes.json,
      gamertag,
    });

    const hasData =
      profile.currencies.gold != null ||
      profile.companies.length > 0 ||
      profile.stats.length > 0;

    if (!hasData) {
      res.status(502).json({
        error:
          'Se obtuvo respuesta pero sin datos útiles. El formato de Rare puede haber cambiado.',
        partial: {
          balance: balanceRes.ok,
          overview: overviewRes.ok,
          reputation: reputationRes.ok,
        },
      });
      return;
    }

    res.status(200).json(profile);
  } catch (err) {
    const aborted = err?.name === 'AbortError';
    res.status(502).json({
      error: aborted
        ? 'Tiempo de espera agotado al contactar con seaofthieves.com.'
        : 'No se pudieron obtener las estadísticas.',
    });
  }
};
