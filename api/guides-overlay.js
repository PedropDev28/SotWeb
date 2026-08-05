/**
 * Overlays de guías publicadas tras aprobación.
 * Env: GITHUB_TOKEN (opcional para lectura; si falta, devuelve vacío)
 */

const store = require('./lib/github-store');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
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
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'method_not_allowed' });
  }

  try {
    if (!store.isConfigured()) {
      return json(res, 200, { guides: {} });
    }
    const overlays = await store.readOverlays();
    return json(res, 200, overlays);
  } catch (err) {
    return json(res, 200, { guides: {}, error: err?.message });
  }
};
