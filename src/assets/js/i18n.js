(function () {
  const STORAGE_KEY = 'sot_locale';
  const LOCALES = ['es', 'en'];
  const DEFAULT = 'es';

  const DICTS = {
    es: {
      'meta.brand': 'Los Indomables',
      'meta.tagline': 'Sitio no oficial de Sea of Thieves',
      'meta.taglineShort': 'Burning Blade',
      'nav.home': 'Inicio',
      'nav.guides': 'Guías',
      'nav.news': 'Novedades',
      'nav.discord': 'Discord',
      'nav.account': 'Mi cuenta',
      'nav.login': 'Entrar',
      'nav.logout': 'Cerrar sesión',
      'nav.openMenu': 'Abrir menú',
      'nav.lang': 'Idioma',
      'footer.copy': '© 2026 Los Indomables — Fan site no oficial de Sea of Thieves.',
      'footer.account': 'Cuenta',

      'home.title': 'Los Indomables — Sea of Thieves',
      'home.heroTitle': 'Donde el horizonte arde',
      'home.heroLead':
        'Guías, progreso de botín y una tripulación lista para alzar velas. Sube a bordo antes de que el mar se tiña de fuego.',
      'home.ctaGuides': 'Abrir guías',
      'home.ctaDiscord': 'Unirse al Discord',
      'home.alertTitle': '¡Reclutamiento a fuego!',
      'home.alertText':
        'Buscamos piratas para sails, alianzas y raids. Presenta tu gamertag en Discord.',
      'home.alertCta': 'Entrar al servidor',
      'home.newsTitle': 'Últimas novedades',
      'home.newsLead':
        'Anuncios oficiales de Sea of Thieves (Rare) y avisos de la tripulación.',
      'home.newsOfficialLink': 'Ver novedades en seaofthieves.com →',
      'home.newsLoading': 'Cargando novedades…',
      'home.newsError': 'No se pudieron cargar las novedades.',
      'news.readOfficialSite': 'Leer en seaofthieves.com',
      'news.readOfficial': 'Leer anuncio oficial',
      'home.discordTitle': 'Cuartel en Discord',
      'home.discordText':
        'Canales de aviso, LFG, spoilers de Tall Tales y memes de cuando os hunde un skelly sloop. El enlace de invitación está siempre en el menú.',
      'home.discordCta': 'Unirme ahora',
      'home.whyTitle': 'Por qué subir a bordo',
      'home.whyLead': 'Cosas que importan cuando el cañón ya está caliente.',
      'home.hook1Title': 'Libros de relato',
      'home.hook1Text':
        'Guías con el formato de los Grandes Relatos: pasa páginas y marca el diario.',
      'home.hook2Title': 'Progreso guardado',
      'home.hook2Text': 'Crea cuenta y lleva la cuenta de Tall Tales, eventos y compañías.',
      'home.hook3Title': 'Tripulación viva',
      'home.hook3Text': 'Discord para juntar crew, avisar de flotas y compartir botín de tips.',
      'home.routesTitle': 'Últimas rutas',
      'home.routesLead': 'Guías listas para seguir. Entra con tu cuenta para guardar el progreso.',
      'home.guidesLoading': 'Cargando guías…',
      'home.guidesError': 'No se pudieron cargar las guías.',

      'guides.title': 'Guías — Los Indomables',
      'guides.heading': 'Guías',
      'guides.lead':
        'Tall Tales, eventos y compañías. Filtra por categoría y marca el progreso desde tu cuenta. Para añadir contenido, edita <code>assets/data/guides.json</code>.',
      'guides.loading': 'Cargando guías…',
      'guides.error': 'No se pudieron cargar las guías.',
      'guides.empty': 'No hay guías en esta categoría.',
      'guides.filterAll': 'Todas',
      'guides.fallbackCategory': 'Guía',
      'guides.progressAria': 'Progreso {percent}%',

      'guide.title': 'Guía — Los Indomables',
      'guide.opening': 'Abriendo el libro del relato…',
      'guide.missingId': 'Falta el id de la guía en la URL.',
      'guide.notFound': 'No se encontró este relato. <a href="guias.html">Volver</a>',
      'guide.openError': 'No se pudo abrir el libro del relato.',
      'guide.back': '← Volver a guías',
      'guide.prev': '← Anterior',
      'guide.next': 'Siguiente →',
      'guide.navHint': 'Arrastra la página · Q / E · flechas',
      'guide.logTitle': 'Diario de a bordo',
      'guide.loginToSave': 'Inicia sesión para guardar el progreso.',
      'guide.loginCta': 'Entrar / Registrarse',
      'guide.emptyChecklist': 'Sin marcas aún. Añade checklist en guides.json.',
      'guide.notesTitle': 'Notas al margen',
      'guide.coverKicker': 'Gran Relato',
      'guide.toReader': 'Al lector',
      'guide.coverIntro':
        'Este libro guarda las pistas de la travesía. Pasa las hojas como en los Grandes Relatos y marca en el diario lo que ya hayas cumplido.',
      'guide.difficultyLabel': 'Dificultad:',
      'guide.defaultQuote': 'Un diario de mar y misterio.',
      'guide.clue': 'Pista {n}',
      'guide.noNotes':
        '<p><em>Sin notas al margen en esta hoja. Añade tips en guides.json.</em></p>',
      'guide.checklistKicker': 'Diario de a bordo',
      'guide.checklistTitle': 'Marcas del relato',
      'guide.checklistIntro':
        'Tacha en tinta lo que ya hayas logrado. Si inicias sesión, el progreso queda guardado en tu cuenta.',
      'guide.captainList': 'Lista del capitán',

      'auth.title': 'Entrar — Los Indomables',
      'auth.heading': 'Tripulación',
      'auth.lead': 'Entra para guardar el progreso de tus guías.',
      'auth.tabLogin': 'Iniciar sesión',
      'auth.tabRegister': 'Registrarse',
      'auth.email': 'Correo',
      'auth.password': 'Contraseña',
      'auth.submitLogin': 'Entrar',
      'auth.pirateName': 'Nombre de pirata',
      'auth.submitRegister': 'Crear cuenta',
      'auth.or': 'o',
      'auth.welcome': '¡Bienvenido a bordo!',
      'auth.created': 'Cuenta creada.',
      'auth.googleHint':
        'Para activar Google, pon tu Client ID en src/assets/js/config.js',
      'auth.googleDisabled': 'Continuar con Google (sin configurar)',
      'auth.googleError': 'Error con Google.',
      'auth.fillAll': 'Rellena todos los campos.',
      'auth.passwordShort': 'La contraseña debe tener al menos 6 caracteres.',
      'auth.emailExists': 'Ya existe una cuenta con ese correo.',
      'auth.badCredentials': 'Correo o contraseña incorrectos.',
      'auth.googleProfile': 'No se pudo leer el perfil de Google.',

      'account.title': 'Mi cuenta — Los Indomables',
      'account.heading': 'Mi cuenta',
      'account.lead': 'Perfil de la flota y estadísticas reales de Sea of Thieves.',
      'account.loading': 'Cargando…',
      'account.progressByGuide': 'Progreso por guía',
      'account.access': 'Acceso: {provider}',
      'account.providerGoogle': 'Google',
      'account.providerLocal': 'Correo y contraseña',
      'account.followGuides': 'Seguir guías',
      'account.logout': 'Cerrar sesión',
      'account.totalProgress': 'Progreso total',
      'account.started': 'Guías empezadas',
      'account.completed': 'Guías completadas',
      'account.empty':
        'Aún no has marcado nada. Abre una guía y usa el checklist.',
      'account.goGuides': 'Ir a guías',
      'account.error': 'No se pudo cargar el progreso.',

      'sot.heading': 'Pirata de Sea of Thieves',
      'sot.lead':
        'Conecta tu perfil oficial para ver oro, compañías y estadísticas reales.',
      'sot.warningTitle': 'El token rat es como una contraseña',
      'sot.warningBody':
        'Da acceso a tu cuenta de seaofthieves.com hasta que caduque (~6–14 días). No lo compartas. Nosotros no lo guardamos en el servidor: solo lo usamos una vez para pedir el snapshot.',
      'sot.step1':
        'Entra en <a href="https://www.seaofthieves.com/profile/overview" target="_blank" rel="noopener">tu perfil oficial</a> e inicia sesión.',
      'sot.step2':
        'Abre DevTools (F12) → Application/Almacenamiento → Cookies → seaofthieves.com → copia el valor de «rat».',
      'sot.step3': 'Pégalo abajo. Opcional: marca recordar solo para esta pestaña.',
      'sot.gamertag': 'Gamertag (opcional)',
      'sot.gamertagPh': 'Tu nombre de Xbox / Steam',
      'sot.ratLabel': 'Cookie rat',
      'sot.ratPh': 'Pega aquí el valor de la cookie rat…',
      'sot.remember': 'Recordar token solo en esta sesión (para refrescar)',
      'sot.connect': 'Sincronizar estadísticas',
      'sot.connecting': 'Sincronizando…',
      'sot.error': 'No se pudieron obtener las estadísticas.',
      'sot.liveBadge': 'Datos oficiales',
      'sot.noTitle': 'Sin título equipado',
      'sot.synced': 'Actualizado {time}',
      'sot.justNow': 'ahora mismo',
      'sot.minsAgo': 'hace {n} min',
      'sot.hoursAgo': 'hace {n} h',
      'sot.daysAgo': 'hace {n} d',
      'sot.refresh': 'Actualizar',
      'sot.reconnect': 'Reconectar',
      'sot.disconnect': 'Desvincular',
      'sot.gold': 'Oro',
      'sot.doubloons': 'Doblones',
      'sot.ancientCoins': 'Monedas antiguas',
      'sot.achievements': 'Logros',
      'sot.companies': 'Compañías',
      'sot.noCompanies': 'Sin datos de reputación.',
      'sot.level': 'Nivel',
      'sot.noLevel': 'Sin nivel',
      'sot.emblems': 'emblemas',
      'sot.combatStats': 'Estadísticas',
      'sot.season': 'Temporada',
      'sot.tier': 'Nivel de temporada',

      'cat.Tall Tales': 'Tall Tales',
      'cat.World Events': 'World Events',
      'cat.Compañías': 'Compañías',
      'cat.Plantillas': 'Plantillas',
      'diff.Media': 'Media',
      'diff.Alta': 'Alta',
      'diff.Baja': 'Baja',
      'diff.—': '—',

      'news.error': 'No se pudieron cargar las novedades.',
      'news.readOfficial': 'Leer anuncio oficial',
      'news.readOfficialSite': 'Leer en seaofthieves.com',
      'news.badgePatch': 'Parche',
      'news.badgeCalendar': 'Calendario',
      'news.badgeEvent': 'Evento',
      'news.badgeSeason': 'Temporada',
      'news.badgeOfficial': 'Oficial',
      'news.badgeCrew': 'Tripulación',

    },
    en: {
      'meta.brand': 'Los Indomables',
      'meta.tagline': 'Unofficial Sea of Thieves fan site',
      'meta.taglineShort': 'Burning Blade',
      'nav.home': 'Home',
      'nav.guides': 'Guides',
      'nav.news': 'News',
      'nav.discord': 'Discord',
      'nav.account': 'My account',
      'nav.login': 'Sign in',
      'nav.logout': 'Sign out',
      'nav.openMenu': 'Open menu',
      'nav.lang': 'Language',
      'footer.copy': '© 2026 Los Indomables — Unofficial Sea of Thieves fan site.',
      'footer.account': 'Account',

      'home.title': 'Los Indomables — Sea of Thieves',
      'home.heroTitle': 'Where the horizon burns',
      'home.heroLead':
        'Guides, loot progress and a crew ready to raise sail. Climb aboard before the sea turns to fire.',
      'home.ctaGuides': 'Open guides',
      'home.ctaDiscord': 'Join Discord',
      'home.alertTitle': 'Crew wanted — fire away!',
      'home.alertText':
        'Looking for pirates for sails, alliances and raids. Drop your gamertag in Discord.',
      'home.alertCta': 'Enter the server',
      'home.newsTitle': 'Latest news',
      'home.newsLead':
        'Official Sea of Thieves announcements (Rare) and crew notices.',
      'home.newsOfficialLink': 'See news on seaofthieves.com →',
      'home.newsLoading': 'Loading news…',
      'home.newsError': 'Could not load news.',
      'news.readOfficialSite': 'Read on seaofthieves.com',
      'news.readOfficial': 'Read official announcement',
      'home.discordTitle': 'Discord quarters',
      'home.discordText':
        'Announcement channels, LFG, Tall Tale spoilers and memes from the time a skelly sloop sank you. The invite link is always in the menu.',
      'home.discordCta': 'Join now',
      'home.whyTitle': 'Why climb aboard',
      'home.whyLead': 'Things that matter when the cannons are already hot.',
      'home.hook1Title': 'Tale books',
      'home.hook1Text':
        'Guides in Tall Tale style: turn pages and tick the journal.',
      'home.hook2Title': 'Saved progress',
      'home.hook2Text': 'Create an account and track Tall Tales, events and companies.',
      'home.hook3Title': 'Living crew',
      'home.hook3Text': 'Discord to find a crew, call fleets and share tip loot.',
      'home.routesTitle': 'Latest routes',
      'home.routesLead': 'Guides ready to follow. Sign in to save your progress.',
      'home.guidesLoading': 'Loading guides…',
      'home.guidesError': 'Could not load guides.',

      'guides.title': 'Guides — Los Indomables',
      'guides.heading': 'Guides',
      'guides.lead':
        'Tall Tales, events and companies. Filter by category and track progress from your account. To add content, edit <code>assets/data/guides.json</code>.',
      'guides.loading': 'Loading guides…',
      'guides.error': 'Could not load guides.',
      'guides.empty': 'No guides in this category.',
      'guides.filterAll': 'All',
      'guides.fallbackCategory': 'Guide',
      'guides.progressAria': 'Progress {percent}%',

      'guide.title': 'Guide — Los Indomables',
      'guide.opening': 'Opening the tale book…',
      'guide.missingId': 'Missing guide id in the URL.',
      'guide.notFound': 'This tale was not found. <a href="guias.html">Back</a>',
      'guide.openError': 'Could not open the tale book.',
      'guide.back': '← Back to guides',
      'guide.prev': '← Previous',
      'guide.next': 'Next →',
      'guide.navHint': 'Drag the page · Q / E · arrows',
      'guide.logTitle': 'Ship’s log',
      'guide.loginToSave': 'Sign in to save progress.',
      'guide.loginCta': 'Sign in / Register',
      'guide.emptyChecklist': 'No marks yet. Add a checklist in guides.json.',
      'guide.notesTitle': 'Margin notes',
      'guide.coverKicker': 'Tall Tale',
      'guide.toReader': 'To the reader',
      'guide.coverIntro':
        'This book holds the clues of the voyage. Turn the pages like in Tall Tales and mark in the journal what you have already done.',
      'guide.difficultyLabel': 'Difficulty:',
      'guide.defaultQuote': 'A journal of sea and mystery.',
      'guide.clue': 'Clue {n}',
      'guide.noNotes':
        '<p><em>No margin notes on this leaf. Add tips in guides.json.</em></p>',
      'guide.checklistKicker': 'Ship’s log',
      'guide.checklistTitle': 'Tale marks',
      'guide.checklistIntro':
        'Cross out in ink what you have already achieved. If you sign in, progress is saved to your account.',
      'guide.captainList': 'Captain’s list',

      'auth.title': 'Sign in — Los Indomables',
      'auth.heading': 'Crew',
      'auth.lead': 'Sign in to save your guide progress.',
      'auth.tabLogin': 'Sign in',
      'auth.tabRegister': 'Register',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.submitLogin': 'Sign in',
      'auth.pirateName': 'Pirate name',
      'auth.submitRegister': 'Create account',
      'auth.or': 'or',
      'auth.welcome': 'Welcome aboard!',
      'auth.created': 'Account created.',
      'auth.googleHint':
        'To enable Google, set your Client ID in src/assets/js/config.js',
      'auth.googleDisabled': 'Continue with Google (not configured)',
      'auth.googleError': 'Google error.',
      'auth.fillAll': 'Fill in all fields.',
      'auth.passwordShort': 'Password must be at least 6 characters.',
      'auth.emailExists': 'An account with that email already exists.',
      'auth.badCredentials': 'Incorrect email or password.',
      'auth.googleProfile': 'Could not read the Google profile.',

      'account.title': 'My account — Los Indomables',
      'account.heading': 'My account',
      'account.lead': 'Crew profile and real Sea of Thieves statistics.',
      'account.loading': 'Loading…',
      'account.progressByGuide': 'Progress by guide',
      'account.access': 'Access: {provider}',
      'account.providerGoogle': 'Google',
      'account.providerLocal': 'Email and password',
      'account.followGuides': 'Continue guides',
      'account.logout': 'Sign out',
      'account.totalProgress': 'Total progress',
      'account.started': 'Guides started',
      'account.completed': 'Guides completed',
      'account.empty':
        'You have not marked anything yet. Open a guide and use the checklist.',
      'account.goGuides': 'Go to guides',
      'account.error': 'Could not load progress.',

      'sot.heading': 'Sea of Thieves pirate',
      'sot.lead':
        'Link your official profile to show gold, companies and real stats.',
      'sot.warningTitle': 'The rat token is like a password',
      'sot.warningBody':
        'It grants access to your seaofthieves.com account until it expires (~6–14 days). Do not share it. We never store it on the server — it is used once to fetch a snapshot.',
      'sot.step1':
        'Open <a href="https://www.seaofthieves.com/profile/overview" target="_blank" rel="noopener">your official profile</a> and sign in.',
      'sot.step2':
        'Open DevTools (F12) → Application → Cookies → seaofthieves.com → copy the «rat» value.',
      'sot.step3': 'Paste it below. Optional: keep it for this tab only to refresh.',
      'sot.gamertag': 'Gamertag (optional)',
      'sot.gamertagPh': 'Your Xbox / Steam name',
      'sot.ratLabel': 'rat cookie',
      'sot.ratPh': 'Paste the rat cookie value here…',
      'sot.remember': 'Remember token for this session only (to refresh)',
      'sot.connect': 'Sync statistics',
      'sot.connecting': 'Syncing…',
      'sot.error': 'Could not fetch statistics.',
      'sot.liveBadge': 'Official data',
      'sot.noTitle': 'No title equipped',
      'sot.synced': 'Updated {time}',
      'sot.justNow': 'just now',
      'sot.minsAgo': '{n} min ago',
      'sot.hoursAgo': '{n} h ago',
      'sot.daysAgo': '{n} d ago',
      'sot.refresh': 'Refresh',
      'sot.reconnect': 'Reconnect',
      'sot.disconnect': 'Unlink',
      'sot.gold': 'Gold',
      'sot.doubloons': 'Doubloons',
      'sot.ancientCoins': 'Ancient coins',
      'sot.achievements': 'Achievements',
      'sot.companies': 'Trading companies',
      'sot.noCompanies': 'No reputation data.',
      'sot.level': 'Level',
      'sot.noLevel': 'No level',
      'sot.emblems': 'emblems',
      'sot.combatStats': 'Statistics',
      'sot.season': 'Season',
      'sot.tier': 'Season tier',

      'cat.Tall Tales': 'Tall Tales',
      'cat.World Events': 'World Events',
      'cat.Compañías': 'Trading Companies',
      'cat.Plantillas': 'Templates',
      'diff.Media': 'Medium',
      'diff.Alta': 'Hard',
      'diff.Baja': 'Easy',
      'diff.—': '—',

      'news.error': 'Could not load news.',
      'news.readOfficial': 'Read official announcement',
      'news.readOfficialSite': 'Read on seaofthieves.com',
      'news.badgePatch': 'Patch',
      'news.badgeCalendar': 'Calendar',
      'news.badgeEvent': 'Event',
      'news.badgeSeason': 'Season',
      'news.badgeOfficial': 'Official',
      'news.badgeCrew': 'Crew',

    },
  };

  let locale = DEFAULT;
  let dict = DICTS[DEFAULT];

  function detectLocale() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && LOCALES.includes(stored)) return stored;
    } catch {
      /* ignore */
    }
    const nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('en')) return 'en';
    return DEFAULT;
  }

  function t(key, vars) {
    let str = dict[key] ?? DICTS[DEFAULT][key] ?? key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
      });
    }
    return str;
  }

  function apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const html = el.hasAttribute('data-i18n-html');
      if (html) el.innerHTML = t(key);
      else el.textContent = t(key);
    });

    root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const map = el.getAttribute('data-i18n-attr');
      if (!map) return;
      map.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });

    const titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) document.title = t(titleEl.getAttribute('data-i18n'));

    document.documentElement.lang = locale;
  }

  function setLocale(next, { reload = true } = {}) {
    if (!LOCALES.includes(next)) return;
    locale = next;
    dict = DICTS[locale] || DICTS[DEFAULT];
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
    apply();
    updateSwitcher();
    window.dispatchEvent(
      new CustomEvent('sot:localechange', { detail: { locale } })
    );
    if (reload) window.location.reload();
  }

  function updateSwitcher() {
    document.querySelectorAll('[data-lang-switch]').forEach((wrap) => {
      wrap.querySelectorAll('[data-lang]').forEach((btn) => {
        const active = btn.getAttribute('data-lang') === locale;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    });
  }

  function mountSwitcher() {
    const nav = document.querySelector('.nav-links');
    if (!nav || nav.querySelector('[data-lang-switch]')) return;

    const li = document.createElement('li');
    li.className = 'lang-switch-item';
    li.innerHTML = `
      <div class="lang-switch" data-lang-switch role="group" aria-label="${t('nav.lang')}">
        <button type="button" class="lang-btn" data-lang="es" aria-pressed="false">ES</button>
        <button type="button" class="lang-btn" data-lang="en" aria-pressed="false">EN</button>
      </div>
    `;
    nav.appendChild(li);

    li.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lang]');
      if (!btn) return;
      const next = btn.getAttribute('data-lang');
      if (next && next !== locale) setLocale(next);
    });

    updateSwitcher();
  }

  /**
   * Resuelve un campo localizable.
   * Acepta string plano o { es, en }.
   */
  function resolve(value, fallback = '') {
    if (value == null) return fallback;
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'object') {
      if (value[locale] != null) return value[locale];
      if (value[DEFAULT] != null) return value[DEFAULT];
      if (value.en != null) return value.en;
      if (value.es != null) return value.es;
    }
    return fallback;
  }

  /** Localiza una guía (o novedad) con bloque translations.{locale} opcional. */
  function localizeItem(item) {
    if (!item) return item;
    const pack = item.translations?.[locale];
    if (!pack) return { ...item };
    return {
      ...item,
      ...pack,
      id: item.id,
      date: item.date,
      featured: item.featured,
      source: item.source,
      link: pack.link || item.link,
      coverSketch: item.coverSketch,
      category: pack.category || item.category,
      difficulty: pack.difficulty || item.difficulty,
      steps: pack.steps || item.steps,
      checklist: pack.checklist || item.checklist,
      translations: item.translations,
    };
  }

  function categoryLabel(cat) {
    if (!cat) return t('guides.fallbackCategory');
    return t(`cat.${cat}`) !== `cat.${cat}` ? t(`cat.${cat}`) : cat;
  }

  function difficultyLabel(diff) {
    if (diff == null || diff === '') return '—';
    const key = `diff.${diff}`;
    return t(key) !== key ? t(key) : diff;
  }

  function init() {
    locale = detectLocale();
    dict = DICTS[locale] || DICTS[DEFAULT];
    apply();
    mountSwitcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SOTI18n = {
    t,
    apply,
    setLocale,
    getLocale: () => locale,
    locales: LOCALES,
    resolve,
    localizeItem,
    categoryLabel,
    difficultyLabel,
    init,
  };
})();
