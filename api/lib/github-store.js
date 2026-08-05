/**
 * Almacén gratis vía GitHub Contents API (sin Vercel Blob).
 * Env: GITHUB_TOKEN (obligatorio), GITHUB_REPO (default PedropDev28/SotWeb), GITHUB_BRANCH (default main)
 */

const DEFAULT_REPO = 'PedropDev28/SotWeb';
const DEFAULT_BRANCH = 'main';
const OVERLAY_PATH = 'data/runtime/overlays.json';
const PROPOSALS_DIR = 'data/runtime/proposals';

function githubConfig() {
  const token = process.env.GITHUB_TOKEN || '';
  const repo = process.env.GITHUB_REPO || DEFAULT_REPO;
  const branch = process.env.GITHUB_BRANCH || DEFAULT_BRANCH;
  return { token, repo, branch };
}

function isConfigured() {
  return Boolean(githubConfig().token);
}

function apiHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'SotWeb-guide-store',
  };
}

async function getFile(path) {
  const { token, repo, branch } = githubConfig();
  if (!token) throw new Error('github_not_configured');

  const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers: apiHeaders(token) });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`github_get_failed:${res.status}:${text.slice(0, 180)}`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return { type: 'dir', entries: data };
  const content = Buffer.from(data.content || '', 'base64').toString('utf8');
  return { type: 'file', sha: data.sha, content, path: data.path };
}

async function putFile(path, content, message) {
  const { token, repo, branch } = githubConfig();
  if (!token) throw new Error('github_not_configured');

  const existing = await getFile(path);
  const body = {
    message,
    content: Buffer.from(typeof content === 'string' ? content : JSON.stringify(content, null, 2), 'utf8').toString('base64'),
    branch,
  };
  if (existing?.type === 'file' && existing.sha) body.sha = existing.sha;

  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...apiHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`github_put_failed:${res.status}:${text.slice(0, 180)}`);
  }
  return res.json();
}

async function readOverlays() {
  try {
    const file = await getFile(OVERLAY_PATH);
    if (!file || file.type !== 'file') return { guides: {} };
    const data = JSON.parse(file.content || '{}');
    return data && typeof data === 'object' ? data : { guides: {} };
  } catch (err) {
    if (String(err.message || '').includes('github_not_configured')) throw err;
    return { guides: {} };
  }
}

async function writeOverlays(data) {
  await putFile(OVERLAY_PATH, data, 'chore: actualizar overlays de guías aprobadas');
}

async function findProposal(id) {
  const file = await getFile(`${PROPOSALS_DIR}/${id}.json`);
  if (!file || file.type !== 'file') return null;
  try {
    return JSON.parse(file.content);
  } catch {
    return null;
  }
}

async function saveProposal(proposal) {
  await putFile(
    `${PROPOSALS_DIR}/${proposal.id}.json`,
    proposal,
    `chore: propuesta de guía ${proposal.id} (${proposal.status})`
  );
}

async function listPendingProposals() {
  const dir = await getFile(PROPOSALS_DIR);
  if (!dir || dir.type !== 'dir') return [];

  const pending = [];
  for (const entry of dir.entries || []) {
    if (!entry.name?.endsWith('.json') || entry.name === 'index.json') continue;
    const file = await getFile(entry.path);
    if (!file || file.type !== 'file') continue;
    try {
      const item = JSON.parse(file.content);
      if (item?.status === 'pending') {
        pending.push({
          id: item.id,
          guideId: item.guideId,
          status: item.status,
          createdAt: item.createdAt,
          author: { name: item.author?.name, provider: item.author?.provider },
          title: item.guide?.title,
        });
      }
    } catch {
      /* skip broken */
    }
  }
  pending.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return pending;
}

module.exports = {
  isConfigured,
  readOverlays,
  writeOverlays,
  findProposal,
  saveProposal,
  listPendingProposals,
  OVERLAY_PATH,
  PROPOSALS_DIR,
};
