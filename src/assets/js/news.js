(function () {
  let cache = null;

  async function loadNews() {
    if (cache) return cache;
    const res = await fetch(window.SOT_ASSET('data/news.json'), { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudieron cargar las novedades.');
    const data = await res.json();
    cache = Array.isArray(data.news) ? data.news : [];
    return cache;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function resolveLink(item) {
    if (!item.link) return null;
    if (item.link === 'discord') {
      return window.SOT_CONFIG?.discordInviteUrl || '#';
    }
    return item.link;
  }

  function renderNewsItem(item) {
    const href = resolveLink(item);
    const external = href && (href.startsWith('http') || item.link === 'discord');
    const linkHtml =
      href && item.linkLabel
        ? `<a class="news-link" href="${escapeHtml(href)}"${
            external ? ' target="_blank" rel="noopener noreferrer"' : ''
          }>${escapeHtml(item.linkLabel)} →</a>`
        : '';

    return `
      <article class="news-item${item.featured ? ' is-featured' : ''}">
        <div>
          ${
            item.badge
              ? `<span class="news-badge">${escapeHtml(item.badge)}</span>`
              : ''
          }
          <span class="news-date">${escapeHtml(formatDate(item.date))}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary || '')}</p>
          ${linkHtml}
        </div>
      </article>
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

  window.SOTNews = {
    loadNews,
    renderNewsItem,
    formatDate,
  };
})();
