document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('guide-root');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const session = SOTAuth.getSession();

  if (!id) {
    root.innerHTML = '<div class="empty-state">Falta el id de la guía en la URL.</div>';
    return;
  }

  try {
    const guides = await SOTGuides.loadGuides();
    const guide = SOTGuides.getGuideById(guides, id);
    if (!guide) {
      root.innerHTML =
        '<div class="empty-state">No se encontró este relato. <a href="guias.html">Volver</a></div>';
      return;
    }

    document.title = `${guide.title} — Los Indomables`;
    const pages = SOTGuides.buildTalePages(guide);
    const progress = session
      ? SOTProgress.getGuideProgress(session.id, guide.id)
      : { checked: {} };

    function checklistHtml() {
      return (guide.checklist || [])
        .map((item) => {
          const checked = !!progress.checked?.[item.id];
          return `
            <label class="${checked ? 'done' : ''}">
              <input
                type="checkbox"
                data-item="${SOTGuides.escapeHtml(item.id)}"
                ${checked ? 'checked' : ''}
                ${session ? '' : 'disabled'}
              >
              <span>${SOTGuides.escapeHtml(item.label)}</span>
            </label>
          `;
        })
        .join('') || '<p><em>Sin marcas aún. Añade checklist en guides.json.</em></p>';
    }

    function updateProgressUi() {
      const stats = session
        ? SOTProgress.getGuideStats(session.id, guide)
        : { done: 0, total: (guide.checklist || []).length, percent: 0 };
      const label = document.getElementById('progress-label');
      const fill = document.getElementById('progress-fill');
      if (label) {
        label.textContent = session
          ? `${stats.done} / ${stats.total} · ${stats.percent}%`
          : 'Inicia sesión para guardar el progreso.';
      }
      if (fill) fill.style.width = `${stats.percent}%`;
    }

    const stats = session
      ? SOTProgress.getGuideStats(session.id, guide)
      : { done: 0, total: (guide.checklist || []).length, percent: 0 };

    root.innerHTML = `
      <div class="guide-layout tale-stage">
        <div>
          <div class="tale-toolbar">
            <a class="back-link" href="guias.html">← Volver a guías</a>
            <span class="tale-page-indicator" data-page-indicator></span>
          </div>

          <div data-tale-book-host></div>

          <div class="tale-nav">
            <button type="button" class="btn btn-ghost" id="prev-page">← Anterior</button>
            <button type="button" class="btn" id="next-page">Siguiente →</button>
          </div>
          <p class="tale-nav-hint">Arrastra la página derecha hacia la izquierda (o la izquierda hacia la derecha). También puedes usar los botones o Q / E.</p>
        </div>

        <aside class="panel progress-panel">
          <h3>Tu progreso</h3>
          <p style="margin-bottom: 1rem; color: rgba(243,230,200,0.75);" id="progress-label">
            ${
              session
                ? `${stats.done} / ${stats.total} · ${stats.percent}%`
                : 'Inicia sesión para guardar el progreso.'
            }
          </p>
          <div class="progress-bar" style="margin-bottom: 1.25rem;">
            <span id="progress-fill" style="width:${stats.percent}%"></span>
          </div>
          <div class="checklist" id="side-checklist">${checklistHtml()}</div>
          ${
            session
              ? ''
              : '<p style="margin-top:1rem"><a class="btn btn-block" href="auth.html">Entrar / Registrarse</a></p>'
          }
        </aside>
      </div>
    `;

    if (session) {
      root.addEventListener('change', (e) => {
        const input = e.target.closest('input[type="checkbox"][data-item]');
        if (!input || !root.contains(input)) return;
        SOTProgress.setChecked(session.id, guide.id, input.dataset.item, input.checked);
        progress.checked[input.dataset.item] = input.checked;
        updateProgressUi();
        root.querySelectorAll(`input[data-item="${input.dataset.item}"]`).forEach((box) => {
          box.checked = input.checked;
          box.closest('label')?.classList.toggle('done', input.checked);
        });
      });
    }

    const book = SOTTaleBook.createTaleBook({
      root,
      pages,
      renderSide: SOTGuides.renderPageSide,
      renderExtras: () => {
        const bookChecklist = document.getElementById('checklist');
        if (bookChecklist) bookChecklist.innerHTML = checklistHtml();
        const side = document.getElementById('side-checklist');
        if (side) side.innerHTML = checklistHtml();
        updateProgressUi();
      },
    });

    document.getElementById('prev-page').addEventListener('click', () => book.prev());
    document.getElementById('next-page').addEventListener('click', () => book.next());

    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'q' || e.key === 'Q' || e.key === 'ArrowLeft') book.prev();
      if (e.key === 'e' || e.key === 'E' || e.key === 'ArrowRight') book.next();
    });

    book.paint();
  } catch {
    root.innerHTML = '<div class="empty-state">No se pudo abrir el libro del relato.</div>';
  }
});
