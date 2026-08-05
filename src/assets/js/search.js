(function () {
  let index = [];
  let built = false;
  let building = null;

  function t(key, vars) {
    return window.SOTI18n?.t?.(key, vars) ?? key;
  }

  function esc(str) {
    return window.SOTGuides?.escapeHtml?.(String(str ?? '')) ?? String(str ?? '');
  }

  function stripHtml(html) {
    return String(html || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalize(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function pushEntry(entries, entry) {
    entries.push({
      ...entry,
      haystack: normalize(entry.haystack || `${entry.title} ${entry.snippet || ''}`),
    });
  }

  function indexGuides(entries, guides) {
    guides.forEach((guide) => {
      if (guide.category === 'Plantillas') return;
      const parts = [
        guide.title,
        guide.summary,
        guide.category,
        guide.difficulty,
        ...(guide.steps || []).flatMap((s) => [
          s.title,
          stripHtml(s.content),
          ...(s.tips || []),
        ]),
        ...(guide.checklist || []).map((c) => c.label),
        ...(guide.commendations || []).flatMap((c) => [
          c.title,
          c.description,
          c.hint,
        ]),
      ];
      pushEntry(entries, {
        type: 'guide',
        title: guide.title,
        url: `guia.html?id=${encodeURIComponent(guide.id)}`,
        snippet: guide.summary || '',
        haystack: parts.join(' '),
      });

      (guide.commendations || []).forEach((c) => {
        pushEntry(entries, {
          type: 'commendation',
          title: c.title || '',
          url: `guia.html?id=${encodeURIComponent(guide.id)}#commendations`,
          snippet: c.description || guide.title,
          haystack: `${c.title} ${c.description} ${c.hint} ${guide.title} condecoracion logro commendation`,
        });
      });
    });
  }

  async function buildIndex() {
    const entries = [];

    pushEntry(entries, {
      type: 'page',
      title: t('search.home'),
      url: 'index.html',
      snippet: t('home.heroLead'),
      haystack: `${t('meta.brand')} ${t('home.heroTitle')} ${t('home.heroLead')} ${t('home.newsTitle')} ${t('home.discordTitle')}`,
    });
    pushEntry(entries, {
      type: 'page',
      title: t('nav.guides'),
      url: 'guias.html',
      snippet: t('guides.lead'),
      haystack: `${t('nav.guides')} ${t('guides.heading')} ${stripHtml(t('guides.lead'))}`,
    });
    pushEntry(entries, {
      type: 'page',
      title: t('nav.account'),
      url: 'cuenta.html',
      snippet: t('account.lead'),
      haystack: `${t('nav.account')} ${t('account.heading')} ${t('account.lead')}`,
    });
    pushEntry(entries, {
      type: 'page',
      title: t('nav.login'),
      url: 'auth.html',
      snippet: t('auth.lead'),
      haystack: `${t('nav.login')} ${t('auth.heading')} ${t('auth.lead')} discord google`,
    });

    try {
      if (window.SOTGuides?.loadGuides) {
        const guides = await SOTGuides.loadGuides();
        indexGuides(entries, guides);
      } else {
        const res = await fetch(window.SOT_ASSET('data/guides.json'), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const guides = Array.isArray(data.guides) ? data.guides : [];
          indexGuides(entries, guides);
        }
      }
    } catch {
      /* guides optional */
    }

    try {
      const api = window.SOT_CONFIG?.adminContentApi || '/api/admin-content';
      const res = await fetch(`${api}?type=pages&published=1`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({ pages: [] }));
      for (const meta of data.pages || []) {
        if (!meta.published) continue;
        let hay = `${meta.title} ${meta.id}`;
        let snippet = meta.title;
        try {
          const detail = await fetch(
            `${api}?type=pages&id=${encodeURIComponent(meta.id)}`,
            { cache: 'no-store' }
          ).then((r) => r.json());
          if (detail?.html) {
            const text = stripHtml(detail.html);
            hay += ` ${text}`;
            snippet = text.slice(0, 140);
          }
        } catch {
          /* ignore */
        }
        pushEntry(entries, {
          type: 'cms',
          title: meta.title,
          url: `pagina.html?id=${encodeURIComponent(meta.id)}`,
          snippet,
          haystack: hay,
        });
      }
    } catch {
      /* pages optional */
    }

    try {
      const res = await fetch(window.SOT_ASSET('data/news.json'), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.news) ? data.news : Array.isArray(data) ? data : [];
        items.forEach((item) => {
          pushEntry(entries, {
            type: 'news',
            title: item.title,
            url: item.link || 'index.html#novedades',
            snippet: item.summary || '',
            haystack: `${item.title} ${item.summary || ''} ${item.badge || ''} novedades news`,
          });
        });
      }
    } catch {
      /* news optional */
    }

    index = entries;
    built = true;
    return index;
  }

  async function ensureIndex() {
    if (built) return index;
    if (building) return building;
    building = buildIndex().finally(() => {
      building = null;
    });
    return building;
  }

  function search(query, limit = 20) {
    const q = normalize(query).trim();
    if (!q) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    return index
      .map((item) => {
        let score = 0;
        terms.forEach((term) => {
          if (item.haystack.includes(term)) score += 2;
          if (normalize(item.title).includes(term)) score += 5;
        });
        return { item, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.item);
  }

  function typeLabel(type) {
    return t(`search.type.${type}`) !== `search.type.${type}`
      ? t(`search.type.${type}`)
      : type;
  }

  function ensureUi() {
    if (document.getElementById('site-search-root')) return;

    const nav = document.querySelector('.nav-links');
    if (nav && !document.querySelector('[data-search-toggle]')) {
      const li = document.createElement('li');
      li.className = 'nav-search-item';
      li.innerHTML = `
        <button type="button" class="nav-search-btn" data-search-toggle aria-label="${esc(
          t('search.open')
        )}">
          <span aria-hidden="true">⌕</span>
          <span class="nav-search-label">${esc(t('search.open'))}</span>
        </button>`;
      const account = nav.querySelector('[data-account-link]')?.closest('li');
      if (account) nav.insertBefore(li, account);
      else nav.appendChild(li);
    }

    const root = document.createElement('div');
    root.id = 'site-search-root';
    root.className = 'site-search hidden';
    root.innerHTML = `
      <div class="site-search-backdrop" data-search-close></div>
      <div class="site-search-panel" role="dialog" aria-modal="true" aria-label="${esc(
        t('search.open')
      )}">
        <div class="site-search-bar">
          <input type="search" id="site-search-input" placeholder="${esc(
            t('search.placeholder')
          )}" autocomplete="off" />
          <button type="button" class="btn btn-ghost" data-search-close>${esc(
            t('search.close')
          )}</button>
        </div>
        <p class="muted site-search-hint">${esc(t('search.hint'))}</p>
        <div id="site-search-results" class="site-search-results"></div>
      </div>`;
    document.body.appendChild(root);
  }

  function openSearch() {
    ensureUi();
    const root = document.getElementById('site-search-root');
    root?.classList.remove('hidden');
    const input = document.getElementById('site-search-input');
    input?.focus();
    ensureIndex();
  }

  function closeSearch() {
    document.getElementById('site-search-root')?.classList.add('hidden');
  }

  function renderResults(items, query) {
    const box = document.getElementById('site-search-results');
    if (!box) return;
    if (!query.trim()) {
      box.innerHTML = `<p class="muted">${esc(t('search.start'))}</p>`;
      return;
    }
    if (!items.length) {
      box.innerHTML = `<p class="muted">${esc(t('search.empty'))}</p>`;
      return;
    }
    box.innerHTML = items
      .map(
        (item) => `
      <a class="site-search-hit" href="${esc(item.url)}">
        <span class="site-search-type">${esc(typeLabel(item.type))}</span>
        <strong>${esc(item.title)}</strong>
        <span class="muted">${esc((item.snippet || '').slice(0, 140))}</span>
      </a>`
      )
      .join('');
  }

  let debounce;
  function onInput() {
    const q = document.getElementById('site-search-input')?.value || '';
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      await ensureIndex();
      renderResults(search(q), q);
    }, 160);
  }

  function bind() {
    ensureUi();
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-search-toggle]')) {
        e.preventDefault();
        openSearch();
      }
      if (e.target.closest('[data-search-close]')) {
        closeSearch();
      }
    });
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape') closeSearch();
    });
    document.addEventListener('input', (e) => {
      if (e.target?.id === 'site-search-input') onInput();
    });
  }

  document.addEventListener('DOMContentLoaded', bind);

  window.SOTSearch = {
    open: openSearch,
    close: closeSearch,
    search,
    rebuild: () => {
      built = false;
      return ensureIndex();
    },
  };
})();
