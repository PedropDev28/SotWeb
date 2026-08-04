/**
 * Proxy completo del perfil oficial de Sea of Thieves.
 * Pide todos los endpoints profilev2 útiles y normaliza un snapshot amplio.
 * El token `rat` nunca se guarda ni se registra en logs.
 */

const SOT_BASE = 'https://www.seaofthieves.com/api/profilev2';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const ENDPOINTS = [
  { id: 'balance', path: '/balance' },
  { id: 'overview', path: '/overview?latest=3' },
  { id: 'reputation', path: '/reputation' },
  { id: 'achievements', path: '/achievements' },
  { id: 'seasons', path: '/seasons-progress' },
  { id: 'captaincy', path: '/captaincy' },
  { id: 'guilds', path: '/guilds-summary' },
  { id: 'piratelord', path: '/piratelord' },
  { id: 'flameheart', path: '/flameheart' },
];

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

/** Etiquetas conocidas; el resto se humaniza desde la clave. */
const STAT_LABELS = {
  Combat_Ships_Sunk: { es: 'Barcos hundidos', en: 'Ships sunk', group: 'combat' },
  Combat_Kraken_Defeated: { es: 'Krakens derrotados', en: 'Krakens defeated', group: 'combat' },
  Player_TinyShark_Spawned: { es: 'Encuentros con megalodón', en: 'Megalodon encounters', group: 'combat' },
  Chests_HandedIn_Total: { es: 'Cofres entregados', en: 'Chests handed in', group: 'loot' },
  Voyages_MetresSailed_Total: { es: 'Metros navegados', en: 'Metres sailed', group: 'voyage' },
  Vomited_Total: { es: 'Vómitos', en: 'Times vomited', group: 'fun' },
  Days_At_Sea: { es: 'Días en el mar', en: 'Days at sea', group: 'voyage' },
  Player_Days_At_Sea: { es: 'Días en el mar', en: 'Days at sea', group: 'voyage' },
  Distance_Sailed: { es: 'Distancia navegada', en: 'Distance sailed', group: 'voyage' },
  Gold_Earned: { es: 'Oro ganado', en: 'Gold earned', group: 'loot' },
  Doubloons_Earned: { es: 'Doblones ganados', en: 'Doubloons earned', group: 'loot' },
};

const GROUP_META = {
  combat: { es: 'Combate', en: 'Combat' },
  voyage: { es: 'Navegación', en: 'Voyage' },
  loot: { es: 'Botín', en: 'Loot' },
  fun: { es: 'Varios', en: 'Misc' },
  other: { es: 'Otras', en: 'Other' },
};

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

function humanizeKey(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function guessGroup(key) {
  const k = String(key).toLowerCase();
  if (/combat|kill|sunk|kraken|shark|skeleton|gun|cannon|sword|damage/.test(k)) return 'combat';
  if (/voyage|sail|metre|meter|distance|island|day|sea|quest/.test(k)) return 'voyage';
  if (/chest|gold|doubloon|loot|treasure|handed|coin|crate|skull|merchant/.test(k)) return 'loot';
  if (/vomit|banana|grog|dance|emote|fun/.test(k)) return 'fun';
  return 'other';
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
    gold: num(pick(data, ['gold', 'Gold', 'currencies.gold', 'Balances.gold', 'wallet.gold'])),
    doubloons: num(
      pick(data, ['doubloons', 'Doubloons', 'currencies.doubloons', 'Balances.doubloons', 'wallet.doubloons'])
    ),
    ancientCoins: num(
      pick(data, [
        'ancientCoins',
        'ancient_coins',
        'AncientCoins',
        'currencies.ancientCoins',
        'currencies.ancient_coins',
        'Balances.ancientCoins',
        'wallet.ancientCoins',
      ])
    ),
  };
}

function parseAchievements(overview, achievementsEndpoint) {
  const sources = [achievementsEndpoint, overview?.achievements, overview?.Achievements].filter(Boolean);

  for (const a of sources) {
    if (Array.isArray(a)) {
      const done = a.filter((x) => x?.Completed || x?.completed || x?.UnlockDate || x?.IsComplete).length;
      return { completed: done, total: a.length };
    }
    if (typeof a === 'object') {
      const list = a.Achievements || a.achievements || a.Items || a.items;
      if (Array.isArray(list)) {
        const done = list.filter((x) => x?.Completed || x?.completed || x?.UnlockDate || x?.IsComplete).length;
        return { completed: done, total: list.length };
      }
      const completed = num(pick(a, ['Completed', 'completed', 'Unlocked', 'unlocked', 'Count']));
      const total = num(pick(a, ['Total', 'total', 'Max', 'max']));
      if (completed != null || total != null) {
        return { completed: completed ?? 0, total: total ?? completed ?? 0 };
      }
    }
  }
  return null;
}

function parseSeason(overview, seasonsEndpoint) {
  let seasons =
    (Array.isArray(seasonsEndpoint) && seasonsEndpoint) ||
    seasonsEndpoint?.Seasons ||
    seasonsEndpoint?.seasons ||
    overview?.seasons ||
    overview?.Seasons ||
    [];

  if (!Array.isArray(seasons)) seasons = [];
  if (!seasons.length) return null;

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

/** Devuelve TODAS las claves numéricas de overview.stats */
function parseAllStats(overview) {
  const raw = overview?.stats || overview?.Stats || {};
  if (!raw || typeof raw !== 'object') return [];

  return Object.keys(raw)
    .map((key) => {
      const value = num(raw[key]);
      if (value == null) return null;
      const known = STAT_LABELS[key];
      const group = known?.group || guessGroup(key);
      const human = humanizeKey(key);
      return {
        id: key.toLowerCase().replace(/_/g, '-'),
        key,
        group,
        groupEs: GROUP_META[group]?.es || GROUP_META.other.es,
        groupEn: GROUP_META[group]?.en || GROUP_META.other.en,
        labelEs: known?.es || human,
        labelEn: known?.en || human,
        value,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.group.localeCompare(b.group) || a.labelEn.localeCompare(b.labelEn));
}

function parseCompanies(reputation) {
  return COMPANY_KEYS.map((def) => {
    const c = findCompany(reputation, def);
    if (!c) return null;
    const level = num(c.Level ?? c.level);
    const progress = num(c.Progress ?? c.progress);
    const emblemsUnlocked = num(c.EmblemsUnlocked ?? c.emblemsUnlocked);
    const emblemsTotal = num(c.EmblemsTotal ?? c.emblemsTotal);
    const titlesUnlocked = num(c.TitlesUnlocked ?? c.titlesUnlocked);
    const titlesTotal = num(c.TitlesTotal ?? c.titlesTotal);
    const itemsUnlocked = num(c.ItemsUnlocked ?? c.itemsUnlocked);
    const itemsTotal = num(c.ItemsTotal ?? c.itemsTotal);
    const promotionsUnlocked = num(c.PromotionsUnlocked ?? c.promotionsUnlocked);
    const promotionsTotal = num(c.PromotionsTotal ?? c.promotionsTotal);
    if (
      level == null &&
      progress == null &&
      emblemsUnlocked == null &&
      titlesUnlocked == null
    ) {
      return null;
    }
    let progressPct = null;
    if (progress != null) {
      progressPct =
        progress <= 1 ? Math.round(progress * 1000) / 10 : Math.round(progress * 10) / 10;
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
      titlesUnlocked,
      titlesTotal,
      itemsUnlocked,
      itemsTotal,
      promotionsUnlocked,
      promotionsTotal,
    };
  }).filter(Boolean);
}

function parseFaction(data, id, nameEs, nameEn) {
  if (!data || typeof data !== 'object') return null;
  const level = num(pick(data, ['Level', 'level', 'AllegianceLevel', 'allegianceLevel']));
  const progress = num(pick(data, ['Progress', 'progress']));
  const motto = pick(data, ['Motto', 'motto']) || '';
  const rank = pick(data, ['Rank', 'rank']) || '';
  if (level == null && progress == null && !motto) return null;
  let progressPct = null;
  if (progress != null) {
    progressPct =
      progress <= 1 ? Math.round(progress * 1000) / 10 : Math.round(progress * 10) / 10;
  }
  return { id, nameEs, nameEn, level, progress: progressPct, motto, rank };
}

function parseAlignments(alignments) {
  if (!Array.isArray(alignments)) return [];
  return alignments.map((a) => {
    const accolades = Array.isArray(a.Accolades || a.accolades)
      ? (a.Accolades || a.accolades).map((acc) => ({
          title: acc.LocalisedTitle || acc.localisedTitle || acc.ProgressId || '',
          level: num(acc.MilestoneLevel ?? acc.milestoneLevel) ?? 0,
          progress: num(acc.CurrentProgress ?? acc.currentProgress),
          threshold: num(acc.Threshold ?? acc.threshold),
          pinned: !!(acc.IsPinned || acc.isPinned),
          stats: Array.isArray(acc.Stats || acc.stats)
            ? (acc.Stats || acc.stats).map((s) => ({
                title: s.LocalisedTitle || s.localisedTitle || '',
                value: num(s.Value ?? s.value) ?? 0,
              }))
            : [],
        }))
      : [];

    return {
      id: a.Id || a.id || '',
      title: a.LocalisedTitle || a.localisedTitle || a.Title || a.title || '',
      milestoneSum: num(a.MilestoneSum ?? a.milestoneSum) ?? 0,
      accolades,
    };
  });
}

function parseCaptaincy(data) {
  if (!data || typeof data !== 'object') return null;
  const pirate = data.Pirate || data.pirate || {};
  const shipsRaw = data.Ships || data.ships || [];
  const ships = Array.isArray(shipsRaw)
    ? shipsRaw.map((ship) => ({
        id: ship.ShipId || ship.shipId || '',
        name: ship.Name || ship.name || '',
        type: ship.Type || ship.type || '',
        alignments: parseAlignments(ship.Alignments || ship.alignments),
      }))
    : [];

  const pirateAlignments = parseAlignments(pirate.Alignments || pirate.alignments);

  return {
    pirateAlignments,
    ships,
    shipCount: ships.length,
    milestoneTotal: pirateAlignments.reduce((sum, a) => sum + (a.milestoneSum || 0), 0),
  };
}

function parseGuilds(data) {
  if (!data) return [];
  const list =
    (Array.isArray(data) && data) ||
    data.Guilds ||
    data.guilds ||
    data.Items ||
    data.items ||
    [];
  if (!Array.isArray(list)) return [];
  return list
    .map((g) => ({
      name: g.Name || g.name || g.GuildName || g.guildName || '',
      level: num(g.Level ?? g.level ?? g.ReputationLevel ?? g.reputationLevel),
      members: num(g.Members ?? g.members ?? g.MemberCount ?? g.memberCount),
      motto: g.Motto || g.motto || '',
    }))
    .filter((g) => g.name);
}

async function sotFetch(path, rat) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);
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

function normalize(bundle, gamertag) {
  const b = parseBalance(bundle.balance || {});
  const companies = parseCompanies(bundle.reputation || {});
  const guardians = parseFaction(
    bundle.piratelord,
    'guardians',
    'Guardianes de la Fortuna',
    'Guardians of Fortune'
  );
  const servants = parseFaction(
    bundle.flameheart,
    'servants',
    'Siervos de la Llama',
    'Servants of the Flame'
  );

  // Fusionar facciones Hourglass en compañías si no venían en reputation
  const companyIds = new Set(companies.map((c) => c.id));
  if (guardians && !companyIds.has('guardians')) companies.push(guardians);
  if (servants && !companyIds.has('servants')) companies.push(servants);

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
    achievements: parseAchievements(bundle.overview || {}, bundle.achievements),
    season: parseSeason(bundle.overview || {}, bundle.seasons),
    stats: parseAllStats(bundle.overview || {}),
    companies,
    captaincy: parseCaptaincy(bundle.captaincy),
    guilds: parseGuilds(bundle.guilds),
    endpoints: Object.fromEntries(
      Object.entries(bundle._meta || {}).map(([k, v]) => [k, { ok: v.ok, status: v.status }])
    ),
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
    const results = await Promise.all(
      ENDPOINTS.map(async (ep) => {
        const result = await sotFetch(ep.path, rat);
        return { id: ep.id, ...result };
      })
    );

    const authFail = results.find((r) => r.status === 401 || r.status === 403);
    if (authFail) {
      res.status(401).json({
        error:
          'Token caducado o inválido. Vuelve a iniciar sesión en seaofthieves.com y copia el cookie rat.',
      });
      return;
    }

    const anyOk = results.some((r) => r.ok);
    if (!anyOk) {
      res.status(502).json({
        error: 'Rare no respondió. Prueba más tarde o revisa el token.',
        status: Object.fromEntries(results.map((r) => [r.id, r.status])),
      });
      return;
    }

    const bundle = { _meta: {} };
    results.forEach((r) => {
      bundle[r.id] = r.ok ? r.json : null;
      bundle._meta[r.id] = { ok: r.ok, status: r.status };
    });

    const profile = normalize(bundle, gamertag);

    const hasData =
      profile.currencies.gold != null ||
      profile.companies.length > 0 ||
      profile.stats.length > 0 ||
      profile.captaincy?.ships?.length > 0;

    if (!hasData) {
      res.status(502).json({
        error:
          'Se obtuvo respuesta pero sin datos útiles. El formato de Rare puede haber cambiado.',
        endpoints: profile.endpoints,
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
