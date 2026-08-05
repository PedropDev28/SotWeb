(function () {
  let cache = null;

  const SKETCHES = {
    compass: `
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="46"/>
        <circle cx="60" cy="60" r="34"/>
        <path d="M60 18 L66 60 L60 102 L54 60 Z"/>
        <path d="M18 60 L60 54 L102 60 L60 66 Z"/>
        <circle cx="60" cy="60" r="4" fill="#3a2a18" stroke="none"/>
        <path d="M60 28 L62 40 L60 38 L58 40 Z" fill="#3a2a18" stroke="none"/>
      </svg>`,
    island: `
      <svg viewBox="0 0 140 100" aria-hidden="true">
        <path d="M10 70 C30 55, 45 78, 65 62 C80 50, 95 72, 120 58 C128 54, 135 60, 138 68 L138 88 L8 88 Z"/>
        <path d="M48 62 C50 40, 58 28, 62 20 C66 30, 72 42, 74 62"/>
        <path d="M55 48 C62 46, 68 48, 72 52"/>
        <path d="M20 78 Q40 70 55 78 T90 76 T125 80"/>
        <circle cx="100" cy="30" r="8"/>
        <path d="M8 88 Q40 92 70 88 T132 90"/>
      </svg>`,
    chest: `
      <svg viewBox="0 0 120 90" aria-hidden="true">
        <path d="M18 38 L60 18 L102 38 L102 72 L18 72 Z"/>
        <path d="M18 38 L102 38"/>
        <path d="M60 18 L60 72"/>
        <rect x="52" y="48" width="16" height="12"/>
        <path d="M24 48 L40 48 M80 48 L96 48"/>
        <path d="M30 28 L60 14 L90 28" opacity=".5"/>
      </svg>`,
    ship: `
      <svg viewBox="0 0 140 100" aria-hidden="true">
        <path d="M20 70 L35 82 L110 82 L125 70 L115 70 L105 58 L40 58 L30 70 Z"/>
        <path d="M70 58 L70 18"/>
        <path d="M70 22 L98 48 L70 48 Z"/>
        <path d="M70 30 L48 52 L70 52"/>
        <path d="M15 86 Q50 92 75 86 T130 88"/>
        <circle cx="108" cy="22" r="6"/>
      </svg>`,
    skull: `
      <svg viewBox="0 0 100 110" aria-hidden="true">
        <path d="M28 48 C28 24, 72 24, 72 48 C72 58, 68 64, 68 72 L62 88 L38 88 L32 72 C32 64, 28 58, 28 48 Z"/>
        <circle cx="42" cy="52" r="7"/>
        <circle cx="58" cy="52" r="7"/>
        <path d="M48 62 L52 62 L50 70 Z"/>
        <path d="M40 78 L44 84 M50 78 L50 86 M60 78 L56 84"/>
        <path d="M22 70 L18 78 M78 70 L82 78"/>
      </svg>`,
    map: `
      <svg viewBox="0 0 130 100" aria-hidden="true">
        <path d="M18 20 L48 14 L82 22 L112 16 L112 78 L82 84 L48 76 L18 82 Z"/>
        <path d="M48 14 L48 76 M82 22 L82 84"/>
        <path d="M30 40 C40 30, 55 45, 70 35 C85 25, 95 40, 100 48"/>
        <circle cx="70" cy="50" r="3" fill="#3a2a18" stroke="none"/>
        <path d="M70 50 L78 38"/>
        <path d="M34 60 L42 66 L38 70"/>
      </svg>`,
    key: `
      <svg viewBox="0 0 120 70" aria-hidden="true">
        <circle cx="28" cy="35" r="16"/>
        <circle cx="28" cy="35" r="7"/>
        <path d="M44 35 L108 35 L108 28 L96 28 L96 42 L88 42 L88 28 L80 28 L80 48"/>
      </svg>`,
  };

  async function loadOverlays() {
    const endpoint = window.SOT_CONFIG?.guidesOverlayApi;
    if (!endpoint) return {};
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (!res.ok) return {};
      const data = await res.json();
      return data?.guides && typeof data.guides === 'object' ? data.guides : {};
    } catch {
      return {};
    }
  }

  function mergeGuide(base, overlay) {
    if (!overlay) return base;
    return {
      ...base,
      ...overlay,
      id: base.id,
      steps: Array.isArray(overlay.steps) ? overlay.steps : base.steps,
      checklist: Array.isArray(overlay.checklist) ? overlay.checklist : base.checklist,
      commendations: Array.isArray(overlay.commendations)
        ? overlay.commendations
        : base.commendations,
    };
  }

  async function loadGuides() {
    if (cache) return cache.map((g) => window.SOTI18n?.localizeItem?.(g) || g);
    const res = await fetch(window.SOT_ASSET('data/guides.json'), { cache: 'no-store' });
    if (!res.ok) throw new Error(window.SOTI18n?.t?.('guides.error') || 'No se pudieron cargar las guías.');
    const data = await res.json();
    const base = Array.isArray(data.guides) ? data.guides : [];
    const overlays = await loadOverlays();
    cache = base
      .map((guide) => mergeGuide(guide, overlays[guide.id]))
      .filter((guide) => !overlays[guide.id]?.deleted);
    // Guías nuevas solo en overlay (aprobadas / creadas por admin)
    Object.keys(overlays).forEach((id) => {
      if (overlays[id]?.deleted) return;
      if (!cache.find((g) => g.id === id) && overlays[id]?.title) {
        cache.push(overlays[id]);
      }
    });
    return cache.map((g) => window.SOTI18n?.localizeItem?.(g) || g);
  }

  function clearCache() {
    cache = null;
  }

  function stripHtml(str) {
    return String(str || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function guideSearchBlob(guide) {
    const parts = [
      guide.title,
      guide.summary,
      guide.category,
      guide.difficulty,
      guide.id,
    ];
    (guide.steps || []).forEach((step) => {
      parts.push(step.title, stripHtml(step.content), ...(step.tips || []));
    });
    (guide.checklist || []).forEach((item) => parts.push(item.label));
    (guide.commendations || []).forEach((item) => {
      parts.push(item.title, item.description, item.hint);
    });
    return parts.filter(Boolean).join(' ').toLowerCase();
  }

  function matchesQuery(guide, query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return true;
    const hay = guideSearchBlob(guide);
    return q
      .split(/\s+/)
      .filter(Boolean)
      .every((token) => hay.includes(token));
  }

  function getGuideById(guides, id) {
    return guides.find((g) => g.id === id) || null;
  }

  function categories(guides) {
    return [...new Set(guides.map((g) => g.category).filter(Boolean))];
  }

  /* Emblemas grabados que hacen de marca de agua en cada tarjeta */
  const CARD_MARKS = {
    default:
      '<path d="M32 6 44 18v14c0 12-6 20-12 26-6-6-12-14-12-26V18z"/><path d="M32 20v20M24 28h16"/>',
    'Tall Tales':
      '<path d="M32 8 40 24l18 3-13 12 3 17-16-8-16 8 3-17L6 27l18-3z"/>',
    'World Events':
      '<circle cx="32" cy="32" r="22"/><path d="M32 10v44M10 32h44M32 4l4 8h-8zM43 21l-9 9-9-9"/>',
    Compañías:
      '<circle cx="32" cy="32" r="21"/><path d="M32 11v42M11 32h42M20 20l24 24M44 20 20 44"/>',
  };

  function cardMark(category) {
    const path = CARD_MARKS[category] || CARD_MARKS.default;
    return (
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.4" ' +
      'stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' +
      path +
      '</svg>'
    );
  }

  function renderGuideCard(guide, stats) {
    const percent = stats?.percent ?? 0;
    const cat = window.SOTI18n?.categoryLabel?.(guide.category) || guide.category || 'Guía';
    const diff = window.SOTI18n?.difficultyLabel?.(guide.difficulty) || guide.difficulty || '—';
    const progressAria =
      window.SOTI18n?.t?.('guides.progressAria', { percent }) || `Progreso ${percent}%`;
    const cta = window.SOTI18n?.t?.('guides.cardCta') || 'Abrir guía';
    return `
      <a class="guide-tile" href="guia.html?id=${encodeURIComponent(guide.id)}">
        <span class="guide-tile-mark" aria-hidden="true">${cardMark(guide.category)}</span>
        <div class="guide-meta">
          <span class="tag">${escapeHtml(cat)}</span>
          <span class="tag tag-gold">${escapeHtml(diff)}</span>
        </div>
        <h3>${escapeHtml(guide.title)}</h3>
        <p>${escapeHtml(guide.summary || '')}</p>
        <div class="guide-tile-foot">
          <div class="progress-bar" aria-label="${escapeHtml(progressAria)}">
            <span style="width:${percent}%"></span>
          </div>
          <span class="guide-tile-pct">${percent}%</span>
        </div>
        <span class="guide-tile-cta">${escapeHtml(cta)}<i aria-hidden="true">→</i></span>
      </a>
    `;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatContent(content) {
    if (!content) return '';
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(content);
    if (!hasHtml) {
      return `<p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>`;
    }
    return content;
  }

  function sketchSvg(name) {
    return SKETCHES[name] || SKETCHES.map;
  }

  const ORNAMENT = `
    <svg class="tale-ornament" viewBox="0 0 220 28" aria-hidden="true">
      <path d="M12 14 H78 M142 14 H208" stroke="#5a3a14" stroke-width="1.1" opacity=".6"/>
      <path d="M110 5 L118 14 L110 23 L102 14 Z" fill="#5a3a14" opacity=".55"/>
      <circle cx="110" cy="14" r="3.2" fill="#ead7b0" stroke="#5a3a14" stroke-width="1"/>
      <path d="M88 14 C96 8, 104 8, 110 14 C116 20, 124 20, 132 14" fill="none" stroke="#5a3a14" stroke-width="1" opacity=".45"/>
    </svg>`;

  /**
   * Convierte una guía (steps + checklist) en páginas de libro estilo Tale Book.
   * También admite guide.pages[] si quieres controlar el doble página a mano.
   */
  function buildTalePages(guide) {
    if (Array.isArray(guide.pages) && guide.pages.length) {
      return guide.pages.map((page, i) => normalizePage(page, i, guide));
    }

    const pages = [];

    pages.push({
      type: 'cover',
      left: {
        kicker: window.SOTI18n?.t?.('guide.coverKicker') || 'Gran Relato',
        title: guide.title,
        content: `<p class="tale-cover-quote">«${escapeHtml(
          guide.summary ||
            window.SOTI18n?.t?.('guide.defaultQuote') ||
            'Un diario de mar y misterio.'
        )}»</p>`,
        showOrnament: true,
        badge: window.SOTI18n?.categoryLabel?.(guide.category) || guide.category || 'Guía',
      },
      right: {
        title: window.SOTI18n?.t?.('guide.toReader') || 'Al lector',
        titleClass: 'tale-title-sm',
        content: `
          <p>${window.SOTI18n?.t?.('guide.coverIntro') ||
            'Este libro guarda las pistas de la travesía. Pasa las hojas como en los Grandes Relatos y marca en el diario lo que ya hayas cumplido.'}</p>
          <p><em>${window.SOTI18n?.t?.('guide.difficultyLabel') || 'Dificultad:'}</em> ${escapeHtml(
            window.SOTI18n?.difficultyLabel?.(guide.difficulty) || guide.difficulty || '—'
          )}</p>
        `,
        sketch: guide.coverSketch || 'compass',
      },
    });

    (guide.steps || []).forEach((step, index) => {
      const tips = step.tips || [];
      pages.push({
        type: 'step',
        left: {
          kicker:
            window.SOTI18n?.t?.('guide.clue', { n: index + 1 }) || `Pista ${index + 1}`,
          title: step.title,
          titleClass: 'tale-title-sm',
          content: formatContent(step.content),
          showOrnament: true,
        },
        right: {
          sketch: step.sketch || pickSketch(index),
          notes: tips,
          content: tips.length
            ? ''
            : window.SOTI18n?.t?.('guide.noNotes') ||
              '<p><em>Sin notas al margen en esta hoja. Añade tips en guides.json.</em></p>',
        },
      });
    });

    pages.push({
      type: 'checklist',
      left: {
        kicker: window.SOTI18n?.t?.('guide.checklistKicker') || 'Diario de a bordo',
        title: window.SOTI18n?.t?.('guide.checklistTitle') || 'Marcas del relato',
        titleClass: 'tale-title-sm',
        content: `<p>${
          window.SOTI18n?.t?.('guide.checklistIntro') ||
          'Tacha en tinta lo que ya hayas logrado. Si inicias sesión, el progreso queda guardado en tu cuenta.'
        }</p>`,
        showOrnament: true,
      },
      right: {
        title: window.SOTI18n?.t?.('guide.captainList') || 'Lista del capitán',
        titleClass: 'tale-title-sm',
        checklist: true,
      },
    });

    return pages;
  }

  function normalizePage(page, index, guide) {
    return {
      type: page.type || 'custom',
      left: {
        kicker: page.left?.kicker || '',
        title: page.left?.title || guide.title,
        titleClass: page.left?.titleClass || 'tale-title-sm',
        content: formatContent(page.left?.content || ''),
        sketch: page.left?.sketch,
        notes: page.left?.notes || page.left?.tips || [],
        showOrnament: page.left?.showOrnament !== false,
        badge: page.left?.badge,
        checklist: !!page.left?.checklist,
      },
      right: {
        kicker: page.right?.kicker || '',
        title: page.right?.title || '',
        titleClass: page.right?.titleClass || 'tale-title-sm',
        content: formatContent(page.right?.content || ''),
        sketch: page.right?.sketch,
        notes: page.right?.notes || page.right?.tips || [],
        showOrnament: !!page.right?.showOrnament,
        checklist: !!page.right?.checklist,
      },
    };
  }

  function pickSketch(index) {
    const order = ['map', 'island', 'key', 'ship', 'chest', 'skull', 'compass'];
    return order[index % order.length];
  }

  function renderPageSide(side, options = {}) {
    if (!side) return '<div class="tale-page-inner"></div>';

    const parts = [];
    if (side.badge) {
      parts.push(
        `<div style="text-align:center"><span class="tale-cover-badge">${escapeHtml(
          side.badge
        )}</span></div>`
      );
    }
    if (side.showOrnament) parts.push(ORNAMENT);
    if (side.kicker) {
      parts.push(`<p class="tale-kicker">${escapeHtml(side.kicker)}</p>`);
    }
    if (side.title) {
      parts.push(
        `<h2 class="tale-title ${side.titleClass || ''}">${escapeHtml(
          side.title
        )}</h2>`
      );
    }
    if (side.sketch) {
      parts.push(`<div class="tale-sketch">${sketchSvg(side.sketch)}</div>`);
    }
    if (side.content) {
      parts.push(`<div class="tale-body">${side.content}</div>`);
    }
    if (side.notes?.length) {
      parts.push(`
        <div class="tale-notes">
          <h4>${escapeHtml(
            window.SOTI18n?.t?.('guide.notesTitle') || 'Notas al margen'
          )}</h4>
          <ul>${side.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul>
        </div>
      `);
    }
    if (side.checklist) {
      parts.push(`<div class="checklist tale-checklist" id="${options.checklistId || 'checklist'}"></div>`);
    }
    if (options.pageNum) {
      parts.push(`<div class="tale-page-num">${options.pageNum}</div>`);
    }

    return `<div class="tale-page-inner">${parts.join('')}</div>`;
  }

  window.SOTGuides = {
    loadGuides,
    clearCache,
    getGuideById,
    categories,
    renderGuideCard,
    escapeHtml,
    formatContent,
    buildTalePages,
    renderPageSide,
    sketchSvg,
    stripHtml,
    guideSearchBlob,
    matchesQuery,
  };
})();
