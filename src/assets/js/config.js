/**
 * Configuración del sitio.
 * Para activar Google Sign-In:
 * 1. Ve a https://console.cloud.google.com/apis/credentials
 * 2. Crea un "ID de cliente OAuth 2.0" tipo Aplicación web
 * 3. Añade tu origen (ej. http://localhost:5500) en orígenes autorizados
 * 4. Pega el Client ID abajo
 */
window.SOT_CONFIG = {
  googleClientId: '204522422343-e6c2ishmm6tehsq2ni2btl3bnnr58joo.apps.googleusercontent.com', // ej: '123456789-abcdef.apps.googleusercontent.com'
  siteName: 'Los Indomables',
  /** Pega aquí el enlace de invitación permanente de tu Discord */
  discordInviteUrl: 'https://discord.gg/Cb6hzXd2Wx',
};
