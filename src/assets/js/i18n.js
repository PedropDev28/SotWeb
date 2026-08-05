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
      'nav.logoutShort': 'Salir',
      'nav.accountShort': 'Cuenta',
      'nav.logout': 'Cerrar sesión',
      'nav.openMenu': 'Abrir menú',
      'nav.lang': 'Idioma',
      'nav.admin': 'Admin',
      'search.open': 'Buscar',
      'search.close': 'Cerrar',
      'search.placeholder': 'Busca en toda la web…',
      'search.hint': 'Guías, condecoraciones, páginas y novedades. Atajo: Ctrl/Cmd + K',
      'search.start': 'Escribe cualquier palabra clave.',
      'search.empty': 'Sin resultados.',
      'search.home': 'Inicio',
      'search.type.page': 'Página',
      'search.type.guide': 'Guía',
      'search.type.commendation': 'Condecoración',
      'search.type.cms': 'Contenido',
      'search.type.news': 'Novedad',
      'footer.copy': '© 2026 Los Indomables — Fan site no oficial de Sea of Thieves.',
      'footer.account': 'Cuenta',

      'home.title': 'Los Indomables — Sea of Thieves',
      'home.heroKicker': 'Evento Burning Blade',
      'home.scrollCue': 'Zarpar',
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
      'home.hook1Title': 'Guías paso a paso',
      'home.hook1Text':
        'Índice, enlaces a cada pista y checklist en el lateral para no perderte.',
      'home.hook2Title': 'Progreso guardado',
      'home.hook2Text': 'Entra con Discord o Google y lleva la cuenta de Tall Tales, eventos y compañías.',
      'home.hook3Title': 'Tripulación viva',
      'home.hook3Text': 'Discord para juntar crew, avisar de flotas y compartir botín de tips.',
      'home.routesTitle': 'Últimas rutas',
      'home.routesLead': 'Guías listas para seguir. Entra con Discord o Google para guardar el progreso.',
      'home.guidesLoading': 'Cargando guías…',
      'home.guidesError': 'No se pudieron cargar las guías.',

      'guides.title': 'Guías — Los Indomables',
      'guides.heading': 'Guías',
      'guides.lead':
        'Tall Tales, eventos y compañías. Filtra por categoría y marca el progreso. Con cuenta puedes proponer ediciones; un admin las revisa por Discord.',
      'guides.loading': 'Cargando guías…',
      'guides.error': 'No se pudieron cargar las guías.',
      'guides.empty': 'No hay guías en esta categoría.',
      'guides.filterAll': 'Todas',
      'guides.fallbackCategory': 'Guía',
      'guides.progressAria': 'Progreso {percent}%',
      'guides.cardCta': 'Abrir guía',
      'a11y.backToTop': 'Volver arriba',

      'guide.title': 'Guía — Los Indomables',
      'guide.opening': 'Abriendo la guía…',
      'guide.missingId': 'Falta el id de la guía en la URL.',
      'guide.notFound': 'No se encontró esta guía. <a href="guias.html">Volver</a>',
      'guide.openError': 'No se pudo abrir la guía.',
      'guide.back': '← Volver a guías',
      'guide.prev': '← Anterior',
      'guide.next': 'Siguiente →',
      'guide.prevStep': '← Paso anterior',
      'guide.nextStep': 'Siguiente paso →',
      'guide.toChecklist': 'Ir al checklist →',
      'guide.toCommendations': 'Ver condecoraciones →',
      'guide.navHint': 'Usa el índice o los enlaces entre pasos',
      'guide.logTitle': 'Diario de a bordo',
      'guide.loginToSave': 'Inicia sesión para guardar el progreso.',
      'guide.loginCta': 'Entrar con Discord / Google',
      'guide.emptyChecklist': 'Sin marcas aún. Añade checklist en guides.json.',
      'guide.notesTitle': 'Notas al margen',
      'guide.coverKicker': 'Gran Relato',
      'guide.toReader': 'Al lector',
      'guide.coverIntro':
        'Sigue los pasos en orden, marca el diario y usa el índice para saltar a cualquier pista.',
      'guide.difficultyLabel': 'Dificultad:',
      'guide.defaultQuote': 'Un diario de mar y misterio.',
      'guide.clue': 'Pista {n}',
      'guide.stepLabel': 'Paso {n}',
      'guide.tocTitle': 'Índice del relato',
      'guide.tocLabel': 'Índice',
      'guide.edit': 'Proponer edición',
      'guide.commendationsBadge': 'Logros',
      'guide.commendationsTitle': 'Condecoraciones',
      'guide.commendationsLead':
        'Marca las condecoraciones del Gran Relato que ya hayas desbloqueado.',
      'guide.noNotes':
        '<p><em>Sin notas al margen en esta hoja. Añade tips en guides.json.</em></p>',
      'guide.checklistKicker': 'Diario de a bordo',
      'guide.checklistTitle': 'Marcas del relato',
      'guide.checklistIntro':
        'Tacha lo que ya hayas logrado. Si inicias sesión, el progreso queda guardado.',
      'guide.captainList': 'Lista del capitán',

      'editor.heading': 'Proponer edición',
      'editor.lead':
        'Los cambios no se publican al momento: se envían a revisión y un admin los aprueba por Discord.',
      'editor.cancel': '← Cancelar',
      'editor.submit': 'Enviar a revisión',
      'editor.title': 'Título',
      'editor.summary': 'Resumen',
      'editor.category': 'Categoría',
      'editor.difficulty': 'Dificultad',
      'editor.steps': 'Pasos',
      'editor.addStep': 'Añadir paso',
      'editor.stepN': 'Paso {n}',
      'editor.stepTitle': 'Título del paso',
      'editor.stepContent': 'Contenido',
      'editor.stepTips': 'Consejos (uno por línea)',
      'editor.tipsPh': 'Un consejo por línea',
      'editor.checklist': 'Checklist',
      'editor.commendations': 'Condecoraciones',
      'editor.addCommendation': 'Añadir condecoración',
      'editor.commTitle': 'Título',
      'editor.commDesc': 'Descripción',
      'editor.commHint': 'Pista (opcional)',
      'editor.commImage': 'Imagen / GIF',
      'editor.addCheck': 'Añadir marca',
      'editor.checkPh': 'Marca del diario…',
      'editor.remove': 'Quitar',
      'editor.required': 'Título y resumen son obligatorios.',
      'editor.sending': 'Enviando propuesta…',
      'editor.sent': '¡Propuesta enviada! Pendiente de revisión.',
      'editor.error': 'No se pudo enviar la propuesta.',

      'review.title': 'Revisar guía — Los Indomables',
      'review.loading': 'Cargando propuesta…',
      'review.heading': 'Revisión de guía',
      'review.missingId': 'Falta el id de la propuesta.',
      'review.notFound': 'No se encontró la propuesta.',
      'review.status': 'Estado',
      'review.by': 'Propuesta de {name} ({provider})',
      'review.steps': 'Pasos',
      'review.checklist': 'Checklist',
      'review.approve': 'Aprobar y publicar',
      'review.reject': 'Rechazar',
      'review.working': 'Aplicando decisión…',
      'review.approved': 'Aprobada y publicada.',
      'review.rejected': 'Propuesta rechazada.',
      'review.error': 'No se pudo completar la revisión.',
      'review.needToken': 'Abre el enlace completo del aviso de Discord para ver el contenido.',
      'review.needAuth': 'Necesitas el enlace de Discord o una cuenta admin para decidir.',
      'review.openGuide': 'Ver guía publicada →',

      'auth.title': 'Entrar — Los Indomables',
      'auth.heading': 'Tripulación',
      'auth.lead': 'Entra con Discord o Google para guardar el progreso y proponer ediciones.',
      'auth.sideTitle': 'Alza velas con la tripulación',
      'auth.perk1': 'Progreso de Tall Tales y condecoraciones guardado',
      'auth.perk2': 'Checklists sincronizadas en cualquier dispositivo',
      'auth.perk3': 'Propón ediciones en las guías del clan',
      'auth.discordCta': 'Continuar con Discord',
      'auth.or': 'o',
      'auth.welcome': '¡Bienvenido a bordo!',
      'auth.googleHint':
        'Para activar Google, pon tu Client ID en src/assets/js/config.js',
      'auth.googleDisabled': 'Continuar con Google (sin configurar)',
      'auth.googleError': 'Error con Google.',
      'auth.googleProfile': 'No se pudo leer el perfil de Google.',
      'auth.discordHint':
        'Para activar Discord, pon discordClientId en config.js y DISCORD_CLIENT_SECRET en Vercel.',
      'auth.discordProfile': 'No se pudo leer el perfil de Discord.',
      'auth.discordError': 'No se pudo iniciar sesión con Discord.',

      'account.title': 'Mi cuenta — Los Indomables',
      'account.heading': 'Mi cuenta',
      'account.lead': 'Perfil de la flota y estadísticas reales de Sea of Thieves.',
      'account.loading': 'Cargando…',
      'account.progressByGuide': 'Progreso por guía',
      'account.access': 'Acceso: {provider}',
      'account.providerGoogle': 'Google',
      'account.providerDiscord': 'Discord',
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

      'admin.title': 'Admin — Los Indomables',
      'admin.heading': 'Panel del capitán',
      'admin.lead': 'Edita páginas, guías y sube imágenes o GIFs sin tocar el código.',
      'admin.loading': 'Cargando panel…',
      'admin.forbiddenTitle': 'Zona del capitán',
      'admin.forbidden': 'Solo el admin puede entrar aquí. Configura tu email/Discord en config.js y en Vercel.',
      'admin.tabPages': 'Páginas',
      'admin.tabGuides': 'Guías',
      'admin.newPage': 'Nueva página',
      'admin.newGuide': 'Nueva guía',
      'admin.edit': 'Editar',
      'admin.delete': 'Borrar',
      'admin.view': 'Ver',
      'admin.back': '← Volver',
      'admin.save': 'Guardar',
      'admin.saving': 'Guardando…',
      'admin.uploading': 'Subiendo archivo…',
      'admin.uploaded': 'Archivo subido.',
      'admin.deleted': 'Eliminado.',
      'admin.savedPage': 'Página guardada.',
      'admin.savedGuide': 'Guía publicada.',
      'admin.error': 'No se pudo completar la acción.',
      'admin.noPages': 'Aún no hay páginas. Crea la primera.',
      'admin.pageTitle': 'Título de la página',
      'admin.pageId': 'ID / slug (URL)',
      'admin.published': 'Publicada',
      'admin.draft': 'Borrador',
      'admin.editorHint': 'Editor tipo Word: texto, títulos, enlaces, imágenes y GIFs.',
      'admin.editorPlaceholder': 'Escribe como en un documento…',
      'admin.insertImage': 'Insertar imagen / GIF',
      'admin.insertFile': 'Subir archivo / vídeo',
      'admin.confirmDelete': '¿Seguro que quieres borrar esto?',
      'admin.guideStepsHint':
        'En cada paso puedes formatear texto e insertar imágenes o GIFs (icono de imagen o el botón de abajo).',

      'page.title': 'Página — Los Indomables',
      'page.loading': 'Cargando página…',
      'page.missingId': 'Falta el id de la página.',
      'page.notFound': 'Página no encontrada.',
      'page.error': 'No se pudo cargar la página.',
      'page.back': '← Volver al inicio',

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
      'sot.allStats': 'Todas las stats',
      'sot.highlights': 'Destacadas',
      'sot.noStats': 'Sin estadísticas en el overview.',
      'sot.statsCount': '{n} stats',
      'sot.captaincy': 'Capitanía',
      'sot.ships': 'Barcos',
      'sot.guilds': 'Gremios',
      'sot.noCaptaincy': 'Sin hitos de pirata.',
      'sot.noShips': 'Sin barcos capitanados.',
      'sot.noGuilds': 'Sin gremios.',
      'sot.unnamedShip': 'Barco sin nombre',
      'sot.milestonesSum': '{n} hitos',
      'sot.milestoneLevel': 'Nv. {n}',
      'sot.titles': 'títulos',
      'sot.items': 'objetos',
      'sot.members': 'miembros',

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
      'nav.logoutShort': 'Sign out',
      'nav.accountShort': 'Account',
      'nav.logout': 'Sign out',
      'nav.openMenu': 'Open menu',
      'nav.lang': 'Language',
      'nav.admin': 'Admin',
      'search.open': 'Search',
      'search.close': 'Close',
      'search.placeholder': 'Search the whole site…',
      'search.hint': 'Guides, commendations, pages and news. Shortcut: Ctrl/Cmd + K',
      'search.start': 'Type any keyword.',
      'search.empty': 'No results.',
      'search.home': 'Home',
      'search.type.page': 'Page',
      'search.type.guide': 'Guide',
      'search.type.commendation': 'Commendation',
      'search.type.cms': 'Content',
      'search.type.news': 'News',
      'footer.copy': '© 2026 Los Indomables — Unofficial Sea of Thieves fan site.',
      'footer.account': 'Account',

      'home.title': 'Los Indomables — Sea of Thieves',
      'home.heroKicker': 'Burning Blade event',
      'home.scrollCue': 'Set sail',
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
      'home.hook1Title': 'Step-by-step guides',
      'home.hook1Text':
        'Table of contents, links to each clue and a side checklist so you never get lost.',
      'home.hook2Title': 'Saved progress',
      'home.hook2Text': 'Sign in with Discord or Google and track Tall Tales, events and companies.',
      'home.hook3Title': 'Living crew',
      'home.hook3Text': 'Discord to find a crew, call fleets and share tip loot.',
      'home.routesTitle': 'Latest routes',
      'home.routesLead': 'Guides ready to follow. Sign in with Discord or Google to save progress.',
      'home.guidesLoading': 'Loading guides…',
      'home.guidesError': 'Could not load guides.',

      'guides.title': 'Guides — Los Indomables',
      'guides.heading': 'Guides',
      'guides.lead':
        'Tall Tales, events and companies. Filter by category and track progress. With an account you can propose edits; an admin reviews them on Discord.',
      'guides.loading': 'Loading guides…',
      'guides.error': 'Could not load guides.',
      'guides.empty': 'No guides in this category.',
      'guides.filterAll': 'All',
      'guides.fallbackCategory': 'Guide',
      'guides.progressAria': 'Progress {percent}%',
      'guides.cardCta': 'Open guide',
      'a11y.backToTop': 'Back to top',

      'guide.title': 'Guide — Los Indomables',
      'guide.opening': 'Opening the guide…',
      'guide.missingId': 'Missing guide id in the URL.',
      'guide.notFound': 'This guide was not found. <a href="guias.html">Back</a>',
      'guide.openError': 'Could not open the guide.',
      'guide.back': '← Back to guides',
      'guide.prev': '← Previous',
      'guide.next': 'Next →',
      'guide.prevStep': '← Previous step',
      'guide.nextStep': 'Next step →',
      'guide.toChecklist': 'Go to checklist →',
      'guide.toCommendations': 'See commendations →',
      'guide.navHint': 'Use the index or the links between steps',
      'guide.logTitle': 'Ship’s log',
      'guide.loginToSave': 'Sign in to save progress.',
      'guide.loginCta': 'Sign in with Discord / Google',
      'guide.emptyChecklist': 'No marks yet. Add a checklist in guides.json.',
      'guide.notesTitle': 'Margin notes',
      'guide.coverKicker': 'Tall Tale',
      'guide.toReader': 'To the reader',
      'guide.coverIntro':
        'Follow the steps in order, tick the log and use the index to jump to any clue.',
      'guide.difficultyLabel': 'Difficulty:',
      'guide.defaultQuote': 'A journal of sea and mystery.',
      'guide.clue': 'Clue {n}',
      'guide.stepLabel': 'Step {n}',
      'guide.tocTitle': 'Tale index',
      'guide.tocLabel': 'Index',
      'guide.edit': 'Propose edit',
      'guide.commendationsBadge': 'Achievements',
      'guide.commendationsTitle': 'Commendations',
      'guide.commendationsLead':
        'Tick the Tall Tale commendations you have already unlocked.',
      'guide.noNotes':
        '<p><em>No margin notes on this leaf. Add tips in guides.json.</em></p>',
      'guide.checklistKicker': 'Ship’s log',
      'guide.checklistTitle': 'Tale marks',
      'guide.checklistIntro':
        'Cross out what you have already achieved. If you sign in, progress is saved.',
      'guide.captainList': 'Captain’s list',

      'editor.heading': 'Propose an edit',
      'editor.lead':
        'Changes are not published immediately: they go to review and an admin approves them on Discord.',
      'editor.cancel': '← Cancel',
      'editor.submit': 'Send for review',
      'editor.title': 'Title',
      'editor.summary': 'Summary',
      'editor.category': 'Category',
      'editor.difficulty': 'Difficulty',
      'editor.steps': 'Steps',
      'editor.addStep': 'Add step',
      'editor.stepN': 'Step {n}',
      'editor.stepTitle': 'Step title',
      'editor.stepContent': 'Content',
      'editor.stepTips': 'Tips (one per line)',
      'editor.tipsPh': 'One tip per line',
      'editor.checklist': 'Checklist',
      'editor.commendations': 'Commendations',
      'editor.addCommendation': 'Add commendation',
      'editor.commTitle': 'Title',
      'editor.commDesc': 'Description',
      'editor.commHint': 'Hint (optional)',
      'editor.commImage': 'Image / GIF',
      'editor.addCheck': 'Add mark',
      'editor.checkPh': 'Log mark…',
      'editor.remove': 'Remove',
      'editor.required': 'Title and summary are required.',
      'editor.sending': 'Sending proposal…',
      'editor.sent': 'Proposal sent! Pending review.',
      'editor.error': 'Could not send the proposal.',

      'review.title': 'Review guide — Los Indomables',
      'review.loading': 'Loading proposal…',
      'review.heading': 'Guide review',
      'review.missingId': 'Missing proposal id.',
      'review.notFound': 'Proposal not found.',
      'review.status': 'Status',
      'review.by': 'Proposed by {name} ({provider})',
      'review.steps': 'Steps',
      'review.checklist': 'Checklist',
      'review.approve': 'Approve and publish',
      'review.reject': 'Reject',
      'review.working': 'Applying decision…',
      'review.approved': 'Approved and published.',
      'review.rejected': 'Proposal rejected.',
      'review.error': 'Could not complete the review.',
      'review.needToken': 'Open the full Discord notification link to see the content.',
      'review.needAuth': 'You need the Discord link or an admin account to decide.',
      'review.openGuide': 'View published guide →',

      'auth.title': 'Sign in — Los Indomables',
      'auth.heading': 'Crew',
      'auth.lead': 'Sign in with Discord or Google to save progress and propose edits.',
      'auth.sideTitle': 'Set sail with the crew',
      'auth.perk1': 'Tall Tale progress and commendations saved',
      'auth.perk2': 'Checklists synced across every device',
      'auth.perk3': 'Propose edits to the clan guides',
      'auth.discordCta': 'Continue with Discord',
      'auth.or': 'or',
      'auth.welcome': 'Welcome aboard!',
      'auth.googleHint':
        'To enable Google, set your Client ID in src/assets/js/config.js',
      'auth.googleDisabled': 'Continue with Google (not configured)',
      'auth.googleError': 'Google error.',
      'auth.googleProfile': 'Could not read the Google profile.',
      'auth.discordHint':
        'To enable Discord, set discordClientId in config.js and DISCORD_CLIENT_SECRET on Vercel.',
      'auth.discordProfile': 'Could not read the Discord profile.',
      'auth.discordError': 'Could not sign in with Discord.',

      'account.title': 'My account — Los Indomables',
      'account.heading': 'My account',
      'account.lead': 'Crew profile and real Sea of Thieves statistics.',
      'account.loading': 'Loading…',
      'account.progressByGuide': 'Progress by guide',
      'account.access': 'Access: {provider}',
      'account.providerGoogle': 'Google',
      'account.providerDiscord': 'Discord',
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

      'admin.title': 'Admin — Los Indomables',
      'admin.heading': 'Captain’s panel',
      'admin.lead': 'Edit pages, guides and upload images or GIFs without touching code.',
      'admin.loading': 'Loading panel…',
      'admin.forbiddenTitle': 'Captain’s quarters',
      'admin.forbidden': 'Only the admin can enter. Set your email/Discord in config.js and Vercel.',
      'admin.tabPages': 'Pages',
      'admin.tabGuides': 'Guides',
      'admin.newPage': 'New page',
      'admin.newGuide': 'New guide',
      'admin.edit': 'Edit',
      'admin.delete': 'Delete',
      'admin.view': 'View',
      'admin.back': '← Back',
      'admin.save': 'Save',
      'admin.saving': 'Saving…',
      'admin.uploading': 'Uploading file…',
      'admin.uploaded': 'File uploaded.',
      'admin.deleted': 'Deleted.',
      'admin.savedPage': 'Page saved.',
      'admin.savedGuide': 'Guide published.',
      'admin.error': 'Could not complete the action.',
      'admin.noPages': 'No pages yet. Create the first one.',
      'admin.pageTitle': 'Page title',
      'admin.pageId': 'ID / slug (URL)',
      'admin.published': 'Published',
      'admin.draft': 'Draft',
      'admin.editorHint': 'Word-like editor: text, headings, links, images and GIFs.',
      'admin.editorPlaceholder': 'Write like in a document…',
      'admin.insertImage': 'Insert image / GIF',
      'admin.insertFile': 'Upload file / video',
      'admin.confirmDelete': 'Are you sure you want to delete this?',
      'admin.guideStepsHint':
        'In each step you can format text and insert images or GIFs (image icon or the button below).',

      'page.title': 'Page — Los Indomables',
      'page.loading': 'Loading page…',
      'page.missingId': 'Missing page id.',
      'page.notFound': 'Page not found.',
      'page.error': 'Could not load the page.',
      'page.back': '← Back home',

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
      'sot.allStats': 'All stats',
      'sot.highlights': 'Highlights',
      'sot.noStats': 'No overview statistics.',
      'sot.statsCount': '{n} stats',
      'sot.captaincy': 'Captaincy',
      'sot.ships': 'Ships',
      'sot.guilds': 'Guilds',
      'sot.noCaptaincy': 'No pirate milestones.',
      'sot.noShips': 'No captained ships.',
      'sot.noGuilds': 'No guilds.',
      'sot.unnamedShip': 'Unnamed ship',
      'sot.milestonesSum': '{n} milestones',
      'sot.milestoneLevel': 'Lv. {n}',
      'sot.titles': 'titles',
      'sot.items': 'items',
      'sot.members': 'members',

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
    const actions = document.getElementById('nav-actions');
    if (!actions || actions.querySelector('[data-lang-switch]')) return;

    const wrap = document.createElement('div');
    wrap.className = 'lang-switch-wrap';
    wrap.innerHTML = `
      <div class="lang-switch" data-lang-switch role="group" aria-label="${t('nav.lang')}">
        <button type="button" class="lang-btn" data-lang="es" aria-pressed="false">ES</button>
        <button type="button" class="lang-btn" data-lang="en" aria-pressed="false">EN</button>
      </div>
    `;
    actions.appendChild(wrap);

    wrap.addEventListener('click', (e) => {
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
      commendations: pack.commendations || item.commendations,
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
