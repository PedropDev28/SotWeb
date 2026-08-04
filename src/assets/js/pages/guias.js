document.addEventListener('DOMContentLoaded', async () => {
  const t = (key) => window.SOTI18n?.t?.(key) ?? key;
  const list = document.getElementById('guides-list');
  const filters = document.getElementById('guide-filters');
  if (!list || !filters) return;

  let guides = [];
  let active = '__all__';
  const session = SOTAuth.getSession();

  function render() {
    const visible = guides.filter((g) => {
      if (active === '__all__') return g.category !== 'Plantillas';
      return g.category === active;
    });

    if (!visible.length) {
      list.innerHTML = `<div class="empty-state">${t('guides.empty')}</div>`;
      return;
    }

    list.innerHTML = visible
      .map((g) => {
        const stats = session
          ? SOTProgress.getGuideStats(session.id, g)
          : { percent: 0 };
        return SOTGuides.renderGuideCard(g, stats);
      })
      .join('');
  }

  try {
    guides = await SOTGuides.loadGuides();
    const cats = [
      { id: '__all__', label: t('guides.filterAll') },
      ...SOTGuides.categories(guides)
        .filter((c) => c !== 'Plantillas')
        .map((c) => ({
          id: c,
          label: window.SOTI18n?.categoryLabel?.(c) || c,
        })),
    ];
    filters.innerHTML = cats
      .map(
        (cat) =>
          `<button type="button" class="filter-btn${
            cat.id === active ? ' active' : ''
          }" data-cat="${SOTGuides.escapeHtml(cat.id)}">${SOTGuides.escapeHtml(
            cat.label
          )}</button>`
      )
      .join('');

    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      active = btn.dataset.cat;
      filters.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });

    render();
  } catch {
    list.innerHTML = `<div class="empty-state">${t('guides.error')}</div>`;
  }
});
