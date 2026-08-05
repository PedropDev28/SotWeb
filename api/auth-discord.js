/**
 * OAuth Discord: exchange code → profile → redirect to auth.html?discord=...
 * Env: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, SITE_URL (opcional)
 */

function siteOrigin(req) {
  const fromEnv = (process.env.SITE_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

module.exports = async function handler(req, res) {
  const origin = siteOrigin(req);
  const clientId = process.env.DISCORD_CLIENT_ID || '';
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
  const redirectUri = `${origin}/api/auth-discord`;

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }

  const url = new URL(req.url, origin);
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.get('error');

  if (oauthError || !code) {
    res.statusCode = 302;
    res.setHeader('Location', `${origin}/auth.html?error=discord`);
    res.end();
    return;
  }

  if (!clientId || !clientSecret) {
    res.statusCode = 302;
    res.setHeader('Location', `${origin}/auth.html?error=discord`);
    res.end();
    return;
  }

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!tokenRes.ok) throw new Error('token_exchange_failed');
    const tokenData = await tokenRes.json();

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) throw new Error('user_fetch_failed');
    const user = await userRes.json();

    const profile = {
      id: user.id,
      username: user.username,
      global_name: user.global_name,
      avatar: user.avatar,
      email: user.email || '',
    };

    const payload = encodeURIComponent(JSON.stringify(profile));
    res.statusCode = 302;
    res.setHeader('Location', `${origin}/auth.html?discord=${payload}`);
    res.end();
  } catch {
    res.statusCode = 302;
    res.setHeader('Location', `${origin}/auth.html?error=discord`);
    res.end();
  }
};
