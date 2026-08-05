/**
 * Configuración del sitio.
 * Para activar Google Sign-In:
 * 1. Ve a https://console.cloud.google.com/apis/credentials
 * 2. Crea un "ID de cliente OAuth 2.0" tipo Aplicación web
 * 3. Añade tu origen (ej. http://localhost:5500) en orígenes autorizados
 * 4. Pega el Client ID abajo
 */
window.SOT_CONFIG = {
  googleClientId: '204522422343-e6c2ishmm6tehsq2ni2btl3bnnr58joo.apps.googleusercontent.com',
  /** Client ID público de la app Discord (OAuth2). El secret va solo en Vercel. */
  discordClientId: '1534462943587205202',
  siteName: 'Los Indomables',
  /** Pega aquí el enlace de invitación permanente de tu Discord */
  discordInviteUrl: 'https://discord.gg/Cb6hzXd2Wx',
  /** Ruta base de assets desde la raíz del sitio (HTML en la raíz para Vercel) */
  assetBase: './src/assets',
  /** Endpoint que sirve novedades oficiales (api/official-news.js en Vercel) */
  officialNewsApi: '/api/official-news',
  officialNewsHub: 'https://www.seaofthieves.com/es/news',
  /** Proxy de estadísticas del perfil oficial (api/sot-profile.js en Vercel) */
  sotProfileApi: '/api/sot-profile',
  guideProposalsApi: '/api/guide-proposals',
  guidesOverlayApi: '/api/guides-overlay',
  adminContentApi: '/api/admin-content',
  /**
   * Admins (también en Vercel env). Emails de Google y/o IDs de Discord.
   * Deben coincidir con ADMIN_GOOGLE_EMAILS / ADMIN_DISCORD_IDS en Vercel.
   */
  adminGoogleEmails: ["pedroextr22@gmail.com"],
  adminDiscordIds: ["1163613851250597938"],
  /** Opcional: mismo valor que ADMIN_SECRET en Vercel para reforzar el panel */
  adminSecret: 'Nieblapepe20',
};

window.SOT_ASSET = function sotAsset(path) {
  const base = (window.SOT_CONFIG?.assetBase || './src/assets').replace(/\/$/, '');
  return `${base}/${String(path).replace(/^\//, '')}`;
};
