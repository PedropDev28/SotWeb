/**
 * Propuestas de edición de guías + revisión.
 * Env: GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH, DISCORD_WEBHOOK_URL, SITE_URL,
 *      ADMIN_GOOGLE_EMAILS, ADMIN_DISCORD_IDS
 */

const { randomBytes, randomUUID, createHash } = require('crypto');
const store = require('../lib/github-store');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function siteOrigin(req) {
  const fromEnv = (process.env.SITE_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 2_000_000) {
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

function randomToken() {
  return randomBytes(24).toString('hex');
}

function hashToken(token) {
  return createHash('sha256').update(String(token || '')).digest('hex');
}

function tokenMatches(proposal, token) {
  if (!token || !proposal) return false;
  if (proposal.reviewTokenHash) return hashToken(token) === proposal.reviewTokenHash;
  // compat: propuestas antiguas con token en claro
  return token === proposal.reviewToken;
}

function isAdminAuthor(author = {}) {
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

function sanitizeGuidePatch(patch = {}) {
  return {
    id: String(patch.id || '').slice(0, 120),
    title: String(patch.title || '').slice(0, 200),
    category: String(patch.category || '').slice(0, 80),
    difficulty: String(patch.difficulty || '').slice(0, 40),
    summary: String(patch.summary || '').slice(0, 2000),
    coverSketch: String(patch.coverSketch || '').slice(0, 40),
    steps: Array.isArray(patch.steps)
      ? patch.steps.slice(0, 40).map((step, i) => ({
          id: String(step.id || `step-${i + 1}`).slice(0, 80),
          title: String(step.title || '').slice(0, 200),
          sketch: String(step.sketch || '').slice(0, 40),
          content: String(step.content || '').slice(0, 12000),
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
    commendations: Array.isArray(patch.commendations)
      ? patch.commendations.slice(0, 40).map((item, i) => ({
          id: String(item.id || `comm-${i + 1}`).slice(0, 80),
          title: String(item.title || item.label || '').slice(0, 200),
          description: String(item.description || '').slice(0, 1000),
          hint: String(item.hint || '').slice(0, 500),
          image: String(item.image || '').slice(0, 500),
        }))
      : [],
  };
}

async function notifyDiscord(proposal, origin) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return;

  const reviewUrl = `${origin}/revisar.html?id=${encodeURIComponent(proposal.id)}&token=${encodeURIComponent(proposal.reviewToken)}`;
  const author = proposal.author?.name || 'Pirata';
  const title = proposal.guide?.title || proposal.guideId;

  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `📜 Nueva propuesta de guía para revisar\n${reviewUrl}`,
      embeds: [
        {
          title: String(title).slice(0, 200),
          description: `Propuesta de **${author}** (${proposal.author?.provider || 'oauth'})`,
          color: 0xe8a23a,
          fields: [
            { name: 'Guía', value: proposal.guideId, inline: true },
            { name: 'Estado', value: proposal.status, inline: true },
          ],
          url: reviewUrl,
        },
      ],
    }),
  });
}

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const origin = siteOrigin(req);
  const url = new URL(req.url, origin);
  const id = url.searchParams.get('id');
  const token = url.searchParams.get('token');

  try {
    if (req.method === 'GET') {
      if (!store.isConfigured()) {
        return json(res, 503, {
          error: 'github_not_configured',
          message: 'Configura GITHUB_TOKEN en Vercel.',
        });
      }

      if (id) {
        const proposal = await store.findProposal(id);
        if (!proposal) return json(res, 404, { error: 'not_found' });
        const canSeeFull = tokenMatches(proposal, token);
        if (!canSeeFull) {
          return json(res, 200, {
            id: proposal.id,
            guideId: proposal.guideId,
            status: proposal.status,
            createdAt: proposal.createdAt,
            author: { name: proposal.author?.name, provider: proposal.author?.provider },
          });
        }
        return json(res, 200, proposal);
      }

      const pending = await store.listPendingProposals();
      return json(res, 200, { proposals: pending });
    }

    if (req.method === 'POST') {
      if (!store.isConfigured()) {
        return json(res, 503, {
          error: 'github_not_configured',
          message: 'Configura GITHUB_TOKEN en Vercel (gratis, sin Blob).',
        });
      }

      const body = await parseBody(req);
      const action = body.action || 'create';

      if (action === 'create') {
        const author = body.author || {};
        if (!author.id || !author.provider || !['google', 'discord'].includes(author.provider)) {
          return json(res, 401, { error: 'auth_required' });
        }
        const guide = sanitizeGuidePatch(body.guide || {});
        if (!guide.id || !guide.title) {
          return json(res, 400, { error: 'invalid_guide' });
        }

        const reviewToken = randomToken();
        const proposal = {
          id: randomUUID(),
          guideId: guide.id,
          guide,
          status: 'pending',
          reviewTokenHash: hashToken(reviewToken),
          createdAt: new Date().toISOString(),
          author: {
            id: String(author.id).slice(0, 120),
            name: String(author.name || 'Pirata').slice(0, 80),
            email: String(author.email || '').slice(0, 160),
            provider: author.provider,
            discordId: String(author.discordId || '').slice(0, 40),
          },
        };

        await store.saveProposal(proposal);
        try {
          await notifyDiscord({ ...proposal, reviewToken }, origin);
        } catch {
          /* webhook opcional */
        }

        return json(res, 201, {
          id: proposal.id,
          status: proposal.status,
          message: 'Propuesta enviada. Un admin la revisará en Discord.',
        });
      }

      if (action === 'decide') {
        const proposalId = body.id;
        const decision = body.decision;
        const reviewToken = body.token;
        if (!proposalId || !['approve', 'reject'].includes(decision)) {
          return json(res, 400, { error: 'invalid_decision' });
        }

        const proposal = await store.findProposal(proposalId);
        if (!proposal) return json(res, 404, { error: 'not_found' });
        if (proposal.status !== 'pending') {
          return json(res, 409, { error: 'already_decided', status: proposal.status });
        }

        const tokenOk = tokenMatches(proposal, reviewToken);
        const adminOk = isAdminAuthor(body.author || {});
        if (!tokenOk && !adminOk) {
          return json(res, 403, { error: 'forbidden' });
        }

        proposal.status = decision === 'approve' ? 'approved' : 'rejected';
        proposal.decidedAt = new Date().toISOString();
        proposal.decidedBy = body.author?.name || (tokenOk ? 'discord-link' : 'admin');

        if (decision === 'approve') {
          const overlays = await store.readOverlays();
          if (!overlays.guides) overlays.guides = {};
          overlays.guides[proposal.guideId] = {
            ...proposal.guide,
            updatedAt: proposal.decidedAt,
            approvedFrom: proposal.id,
          };
          await store.writeOverlays(overlays);
        }

        await store.saveProposal(proposal);
        return json(res, 200, { id: proposal.id, status: proposal.status });
      }

      return json(res, 400, { error: 'unknown_action' });
    }

    return json(res, 405, { error: 'method_not_allowed' });
  } catch (err) {
    return json(res, 500, {
      error: 'server_error',
      message: err?.message || 'unknown',
    });
  }
};
