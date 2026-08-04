document.addEventListener('DOMContentLoaded', async () => {
  const session = SOTAuth.requireAuth('auth.html');
  if (!session) return;

  const profile = document.getElementById('profile-panel');
  const statsRow = document.getElementById('stats-row');
  const list = document.getElementById('account-guides');
  if (!profile || !statsRow || !list) return;

  const initial = (session.name || '?').trim().charAt(0).toUpperCase();

  profile.innerHTML = `
    <div class="user-chip" style="margin-bottom: 1.25rem;">
      <div class="avatar">
        ${
          session.avatar
            ? `<img src="${SOTGuides.escapeHtml(session.avatar)}" alt="">`
            : initial
        }
      </div>
      <div>
        <strong style="display:block; font-family: var(--font-display);">${SOTGuides.escapeHtml(
          session.name
        )}</strong>
        <span style="opacity:.7; font-size:.9rem;">${SOTGuides.escapeHtml(session.email)}</span>
      </div>
    </div>
    <p style="margin-bottom: 1rem; opacity:.75;">
      Acceso: ${session.provider === 'google' ? 'Google' : 'Correo y contraseña'}
    </p>
    <a class="btn btn-block" href="guias.html">Seguir guías</a>
    <button class="btn btn-ghost btn-block" type="button" id="logout-btn" style="margin-top:.75rem;">
      Cerrar sesión
    </button>
  `;

  document.getElementById('logout-btn').addEventListener('click', () => {
    SOTAuth.logout();
    window.location.href = 'index.html';
  });

  try {
    const guides = (await SOTGuides.loadGuides()).filter(
      (g) => g.category !== 'Plantillas'
    );
    const overall = SOTProgress.getOverallStats(session.id, guides);

    statsRow.innerHTML = `
      <div class="stat"><strong>${overall.percent}%</strong><span>Progreso total</span></div>
      <div class="stat"><strong>${overall.guidesStarted}</strong><span>Guías empezadas</span></div>
      <div class="stat"><strong>${overall.guidesCompleted}</strong><span>Guías completadas</span></div>
    `;

    const started = guides
      .map((g) => ({ guide: g, stats: SOTProgress.getGuideStats(session.id, g) }))
      .filter((x) => x.stats.done > 0)
      .sort((a, b) => b.stats.percent - a.stats.percent);

    if (!started.length) {
      list.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          Aún no has marcado nada. Abre una guía y usa el checklist.
          <p style="margin-top:1rem;"><a class="btn" href="guias.html">Ir a guías</a></p>
        </div>
      `;
      return;
    }

    list.innerHTML = started
      .map(({ guide, stats }) => SOTGuides.renderGuideCard(guide, stats))
      .join('');
  } catch {
    list.innerHTML = '<div class="empty-state">No se pudo cargar el progreso.</div>';
  }
});
