document.addEventListener('DOMContentLoaded', async () => {
  const t = (key) => window.SOTI18n?.t?.(key) ?? key;
  const root = document.getElementById('page-root');
  if (!root) return;

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    root.innerHTML = `<div class="empty-state">${t('page.missingId')}</div>`;
    return;
  }

  try {
    const api = window.SOT_CONFIG?.adminContentApi || '/api/admin-content';
    const res = await fetch(`${api}?type=pages&id=${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    const page = await res.json();
    if (!res.ok || !page?.title) {
      root.innerHTML = `<div class="empty-state">${t('page.notFound')}</div>`;
      return;
    }

    if (page.published === false && !SOTAuth.isAdmin()) {
      root.innerHTML = `<div class="empty-state">${t('page.notFound')}</div>`;
      return;
    }

    document.title = `${page.title} — Los Indomables`;
    root.innerHTML = `
      <div class="cms-wrap reveal-on-scroll is-visible">
        <a class="back-link" href="index.html">${t('page.back')}</a>
        <header class="cms-header">
          <h1>${escapeHtml(page.title)}</h1>
        </header>
        <div class="cms-body ql-snow">
          <div class="ql-editor">${page.html || ''}</div>
        </div>
      </div>
    `;
  } catch {
    root.innerHTML = `<div class="empty-state">${t('page.error')}</div>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});
