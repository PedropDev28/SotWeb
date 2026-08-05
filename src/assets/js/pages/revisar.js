document.addEventListener('DOMContentLoaded', async () => {
  const t = (key, vars) => window.SOTI18n?.t?.(key, vars) ?? key;
  const root = document.getElementById('review-root');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const token = params.get('token') || '';
  const session = SOTAuth.getSession();
  const endpoint = window.SOT_CONFIG?.guideProposalsApi || '/api/guide-proposals';

  if (!id) {
    root.innerHTML = `<div class="empty-state">${t('review.missingId')}</div>`;
    return;
  }

  async function decide(decision) {
    const msg = document.getElementById('review-msg');
    if (msg) {
      msg.textContent = t('review.working');
      msg.className = 'form-msg';
    }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decide',
          id,
          decision,
          token,
          author: session
            ? {
                id: session.id,
                name: session.name,
                email: session.email,
                provider: session.provider,
                discordId: session.discordId || '',
              }
            : {},
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || t('review.error'));
      if (msg) {
        msg.textContent =
          decision === 'approve' ? t('review.approved') : t('review.rejected');
        msg.className = 'form-msg success';
      }
      setTimeout(() => load(), 800);
    } catch (err) {
      if (msg) {
        msg.textContent = err.message || t('review.error');
        msg.className = 'form-msg error';
      }
    }
  }

  async function load() {
    try {
      const url = `${endpoint}?id=${encodeURIComponent(id)}${
        token ? `&token=${encodeURIComponent(token)}` : ''
      }`;
      const res = await fetch(url, { cache: 'no-store' });
      const proposal = await res.json();
      if (!res.ok) {
        root.innerHTML = `<div class="empty-state">${t('review.notFound')}</div>`;
        return;
      }

      const canDecide =
        proposal.status === 'pending' &&
        (token || SOTAuth.isAdmin(session));

      if (!proposal.guide) {
        root.innerHTML = `
          <div class="panel" style="max-width:640px;margin:0 auto;">
            <h1>${t('review.heading')}</h1>
            <p class="muted">${t('review.needToken')}</p>
            <p>${esc(proposal.guideId || '')} · ${esc(proposal.status || '')}</p>
            <p class="muted">${esc(proposal.author?.name || '')}</p>
          </div>
        `;
        return;
      }

      const g = proposal.guide;
      const steps = (g.steps || [])
        .map(
          (s, i) => `
          <li>
            <strong>${i + 1}. ${esc(s.title)}</strong>
            <div class="muted review-step-preview">${esc(String(s.content || '').slice(0, 280))}${
              String(s.content || '').length > 280 ? '…' : ''
            }</div>
          </li>`
        )
        .join('');

      const checks = (g.checklist || [])
        .map((c) => `<li>${esc(c.label)}</li>`)
        .join('');

      root.innerHTML = `
        <div class="review-layout">
          <header class="panel">
            <p class="muted">${t('review.status')}: <strong>${esc(proposal.status)}</strong></p>
            <h1>${esc(g.title)}</h1>
            <p>${esc(g.summary || '')}</p>
            <p class="muted">${t('review.by', {
              name: proposal.author?.name || '—',
              provider: proposal.author?.provider || '',
            })}</p>
          </header>

          <section class="panel">
            <h2>${t('review.steps')}</h2>
            <ol class="review-steps">${steps}</ol>
          </section>

          <section class="panel">
            <h2>${t('review.checklist')}</h2>
            <ul class="review-checks">${checks || `<li class="muted">${t('guide.emptyChecklist')}</li>`}</ul>
          </section>

          ${
            canDecide
              ? `<div class="review-actions">
                  <button type="button" class="btn" id="approve-btn">${t('review.approve')}</button>
                  <button type="button" class="btn btn-ghost" id="reject-btn">${t('review.reject')}</button>
                </div>
                <p class="form-msg" id="review-msg"></p>`
              : proposal.status === 'pending'
                ? `<p class="muted">${t('review.needAuth')}</p>`
                : ''
          }

          <p style="margin-top:1rem"><a class="back-link" href="guia.html?id=${encodeURIComponent(
            g.id
          )}">${t('review.openGuide')}</a></p>
        </div>
      `;

      document.getElementById('approve-btn')?.addEventListener('click', () => decide('approve'));
      document.getElementById('reject-btn')?.addEventListener('click', () => decide('reject'));
    } catch {
      root.innerHTML = `<div class="empty-state">${t('review.error')}</div>`;
    }
  }

  function esc(str) {
    return SOTGuides.escapeHtml(String(str ?? ''));
  }

  await load();
});
