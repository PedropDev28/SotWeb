/**
 * Panel admin: páginas rich, guías, uploads.
 * Env: GITHUB_TOKEN, ADMIN_GOOGLE_EMAILS, ADMIN_DISCORD_IDS, ADMIN_SECRET (opcional)
 */

const { randomUUID } = require('crypto');
const store = require('../lib/github-store');

const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Secret');
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 7_000_000) {
        reject(new Error('payload_too_large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

function json(res, status, data) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(status).json(data);
    return;
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function isAdminAuthor(author = {}, req) {
  const secret = process.env.ADMIN_SECRET || '';
  if (secret) {
    const header = req.headers['x-admin-secret'] || '';
    if (header && header === secret) return true;
  }

  const emails = String(process.env.ADMIN_GOOGLE_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const discordIds = String(process.env.ADMIN_DISCORD_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (author.provider === 'google' && author.email && emails.includes(String(author.email).toLowerCase())) {
    return true;
  }
  if (author.provider === 'discord' && author.discordId && discordIds.includes(String(author.discordId))) {
    return true;
  }
  return false;
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || `page-${Date.now()}`;
}

function sanitizePage(input = {}) {
  const id = slugify(input.id || input.slug || input.title);
  return {
    id,
    slug: id,
    title: String(input.title || 'Sin título').slice(0, 200),
    html: String(input.html || '').slice(0, 500_000),
    published: input.published !== false,
    updatedAt: new Date().toISOString(),
    updatedBy: String(input.updatedBy || '').slice(0, 80),
  };
}

function sanitizeGuide(patch = {}) {
  return {
    id: String(patch.id || slugify(patch.title)).slice(0, 120),
    title: String(patch.title || '').slice(0, 200),
    category: String(patch.category || 'Guías').slice(0, 80),
    difficulty: String(patch.difficulty || 'Media').slice(0, 40),
    summary: String(patch.summary || '').slice(0, 2000),
    coverSketch: String(patch.coverSketch || 'compass').slice(0, 40),
    steps: Array.isArray(patch.steps)
      ? patch.steps.slice(0, 40).map((step, i) => ({
          id: String(step.id || `step-${i + 1}`).slice(0, 80),
          title: String(step.title || '').slice(0, 200),
          sketch: String(step.sketch || '').slice(0, 40),
          content: String(step.content || '').slice(0, 200_000),
          tips: Array.isArray(step.tips)
            ? step.tips.slice(0, 20).map((tip) => String(tip).slice(0, 500))
            : [],
        }))
      : [],
    checklist: Array.isArray(patch.checklist)
      ? patch.checklist.slice(0, 60).map((item, i) => ({
          id: String(item.id || `check-${i + 1}`).slice(0, 80),
          label: String(item.label || '').slice(0, 300),
        }))
      : [],
  };
}

function extFromMime(mime) {
  const map = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'application/pdf': 'pdf',
  };
  return map[mime] || 'bin';
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost');
      const type = url.searchParams.get('type') || 'pages';
      const id = url.searchParams.get('id');

      if (!store.isConfigured()) {
        if (type === 'pages' && !id) return json(res, 200, { pages: [] });
        return json(res, 503, { error: 'github_not_configured' });
      }

      if (type === 'pages') {
        if (id) {
          const page = await store.readPage(id);
          if (!page) return json(res, 404, { error: 'not_found' });
          return json(res, 200, page);
        }
        const index = await store.readPagesIndex();
        const publishedOnly = url.searchParams.get('published') === '1';
        return json(res, 200, {
          pages: publishedOnly ? index.pages.filter((p) => p.published) : index.pages,
        });
      }

      if (type === 'overlays') {
        return json(res, 200, await store.readOverlays());
      }

      return json(res, 400, { error: 'unknown_type' });
    }

    if (req.method === 'POST') {
      if (!store.isConfigured()) {
        return json(res, 503, {
          error: 'github_not_configured',
          message: 'Configura GITHUB_TOKEN en Vercel.',
        });
      }

      const body = await parseBody(req);
      if (!isAdminAuthor(body.author || {}, req)) {
        return json(res, 403, { error: 'forbidden', message: 'Solo el admin puede hacer esto.' });
      }

      const action = body.action;

      if (action === 'savePage') {
        const page = sanitizePage({
          ...body.page,
          updatedBy: body.author?.name || 'admin',
        });
        if (!page.title) return json(res, 400, { error: 'title_required' });
        await store.savePage(page);
        return json(res, 200, { page, url: `pagina.html?id=${encodeURIComponent(page.id)}` });
      }

      if (action === 'deletePage') {
        const id = String(body.id || '').slice(0, 120);
        if (!id) return json(res, 400, { error: 'id_required' });
        await store.deletePage(id);
        return json(res, 200, { ok: true, id });
      }

      if (action === 'saveGuide') {
        const guide = sanitizeGuide(body.guide || {});
        if (!guide.id || !guide.title) return json(res, 400, { error: 'invalid_guide' });
        const overlays = await store.readOverlays();
        if (!overlays.guides) overlays.guides = {};
        overlays.guides[guide.id] = {
          ...guide,
          deleted: false,
          updatedAt: new Date().toISOString(),
          updatedBy: body.author?.name || 'admin',
        };
        await store.writeOverlays(overlays);
        return json(res, 200, { guide: overlays.guides[guide.id] });
      }

      if (action === 'deleteGuide') {
        const id = String(body.id || '').slice(0, 120);
        if (!id) return json(res, 400, { error: 'id_required' });
        const overlays = await store.readOverlays();
        if (!overlays.guides) overlays.guides = {};
        overlays.guides[id] = {
          ...(overlays.guides[id] || { id }),
          id,
          deleted: true,
          updatedAt: new Date().toISOString(),
        };
        await store.writeOverlays(overlays);
        return json(res, 200, { ok: true, id });
      }

      if (action === 'upload') {
        const mime = String(body.mime || 'application/octet-stream').slice(0, 80);
        let b64 = String(body.data || '');
        if (b64.includes(',')) b64 = b64.split(',')[1];
        if (!b64) return json(res, 400, { error: 'empty_file' });

        const size = Buffer.byteLength(b64, 'base64');
        if (size > MAX_UPLOAD_BYTES) {
          return json(res, 400, {
            error: 'file_too_large',
            message: 'Máximo ~4.5 MB por archivo (límite práctico de la API).',
          });
        }

        const ext = extFromMime(mime);
        const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
        const path = `${store.UPLOADS_DIR}/${name}`;
        const result = await store.putBinaryFile(path, b64, `chore: upload admin ${name}`);
        return json(res, 200, {
          url: result.publicUrl,
          path: result.path,
          mime,
          name,
        });
      }

      return json(res, 400, { error: 'unknown_action' });
    }

    return json(res, 405, { error: 'method_not_allowed' });
  } catch (err) {
    return json(res, 500, { error: 'server_error', message: err?.message || 'unknown' });
  }
};
