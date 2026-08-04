document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('guides-list');
  const filters = document.getElementById('guide-filters');
  if (!list || !filters) return;

  let guides = [];
  let active = 'Todas';
  const session = SOTAuth.getSession();

  function render() {
    const visible = guides.filter((g) => {
      if (active === 'Todas') return g.category !== 'Plantillas';
      return g.category === active;
    });

    if (!visible.length) {
      list.innerHTML = '<div class="empty-state">No hay guías en esta categoría.</div>';
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
    const cats = ['Todas', ...SOTGuides.categories(guides)];
    filters.innerHTML = cats
      .map(
        (cat) =>
          `<button type="button" class="filter-btn${
            cat === active ? ' active' : ''
          }" data-cat="${SOTGuides.escapeHtml(cat)}">${SOTGuides.escapeHtml(
            cat
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
    list.innerHTML = '<div class="empty-state">No se pudieron cargar las guías.</div>';
  }
});
