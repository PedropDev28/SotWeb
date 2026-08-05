/**
 * Almacén gratis vía GitHub Contents API (sin Vercel Blob).
 * Env: GITHUB_TOKEN, GITHUB_REPO (default PedropDev28/SotWeb), GITHUB_BRANCH (default main)
 */

const DEFAULT_REPO = 'PedropDev28/SotWeb';
const DEFAULT_BRANCH = 'main';
const OVERLAY_PATH = 'data/runtime/overlays.json';
const PROPOSALS_DIR = 'data/runtime/proposals';
const PAGES_DIR = 'data/runtime/pages';
const PAGES_INDEX = 'data/runtime/pages/index.json';
const UPLOADS_DIR = 'data/runtime/uploads';

function githubConfig() {
  const token = process.env.GITHUB_TOKEN || '';
  const repo = process.env.GITHUB_REPO || DEFAULT_REPO;
  const branch = process.env.GITHUB_BRANCH || DEFAULT_BRANCH;
  return { token, repo, branch };
}

function isConfigured() {
  return Boolean(githubConfig().token);
}

function publicFileUrl(path) {
  const { repo, branch } = githubConfig();
  return `https://cdn.jsdelivr.net/gh/${repo}@${branch}/${path}`;
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
  return { type: 'file', sha: data.sha, content, path: data.path, encoding: data.encoding };
}

async function putFile(path, content, message) {
  const { token, repo, branch } = githubConfig();
  if (!token) throw new Error('github_not_configured');

  const existing = await getFile(path);
  const body = {
    message,
    content: Buffer.from(
      typeof content === 'string' ? content : JSON.stringify(content, null, 2),
      'utf8'
    ).toString('base64'),
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

/** contentBase64: already base64 (no data: prefix) */
async function putBinaryFile(path, contentBase64, message) {
  const { token, repo, branch } = githubConfig();
  if (!token) throw new Error('github_not_configured');

  let sha;
  const existingRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    { headers: apiHeaders(token) }
  );
  if (existingRes.ok) {
    const existing = await existingRes.json();
    sha = existing.sha;
  }

  const body = {
    message,
    content: contentBase64,
    branch,
  };
  if (sha) body.sha = sha;

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
  const data = await res.json();
  const sha = data.commit?.sha || branch;
  return {
    ...data,
    publicUrl: `https://cdn.jsdelivr.net/gh/${repo}@${sha}/${path}`,
    rawUrl: `https://raw.githubusercontent.com/${repo}/${branch}/${path}`,
    path,
  };
}

async function deleteFile(path, message) {
  const { token, repo, branch } = githubConfig();
  if (!token) throw new Error('github_not_configured');
  const existing = await getFile(path);
  if (!existing || existing.type !== 'file') return null;

  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...apiHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha: existing.sha, branch }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`github_delete_failed:${res.status}:${text.slice(0, 180)}`);
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
  await putFile(OVERLAY_PATH, data, 'chore: actualizar overlays de guías');
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
      /* skip */
    }
  }
  pending.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return pending;
}

async function readPagesIndex() {
  try {
    const file = await getFile(PAGES_INDEX);
    if (!file || file.type !== 'file') return { pages: [] };
    const data = JSON.parse(file.content || '{}');
    return { pages: Array.isArray(data.pages) ? data.pages : [] };
  } catch {
    return { pages: [] };
  }
}

async function writePagesIndex(index) {
  await putFile(PAGES_INDEX, index, 'chore: índice de páginas del sitio');
}

async function readPage(id) {
  const file = await getFile(`${PAGES_DIR}/${id}.json`);
  if (!file || file.type !== 'file') return null;
  try {
    return JSON.parse(file.content);
  } catch {
    return null;
  }
}

async function savePage(page) {
  await putFile(`${PAGES_DIR}/${page.id}.json`, page, `chore: página ${page.id}`);
  const index = await readPagesIndex();
  const meta = {
    id: page.id,
    title: page.title,
    slug: page.slug || page.id,
    published: !!page.published,
    updatedAt: page.updatedAt,
  };
  const i = index.pages.findIndex((p) => p.id === page.id);
  if (i >= 0) index.pages[i] = meta;
  else index.pages.push(meta);
  index.pages.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  await writePagesIndex(index);
  return page;
}

async function deletePage(id) {
  await deleteFile(`${PAGES_DIR}/${id}.json`, `chore: borrar página ${id}`);
  const index = await readPagesIndex();
  index.pages = index.pages.filter((p) => p.id !== id);
  await writePagesIndex(index);
}

module.exports = {
  isConfigured,
  githubConfig,
  publicFileUrl,
  getFile,
  putFile,
  putBinaryFile,
  deleteFile,
  readOverlays,
  writeOverlays,
  findProposal,
  saveProposal,
  listPendingProposals,
  readPagesIndex,
  readPage,
  savePage,
  deletePage,
  OVERLAY_PATH,
  PROPOSALS_DIR,
  PAGES_DIR,
  UPLOADS_DIR,
};
