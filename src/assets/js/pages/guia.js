document.addEventListener('DOMContentLoaded', async () => {
  const t = (key, vars) => window.SOTI18n?.t?.(key, vars) ?? key;
  const root = document.getElementById('guide-root');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const session = SOTAuth.getSession();
  const editMode = params.get('edit') === '1';

  if (!id) {
    root.innerHTML = `<div class="empty-state">${t('guide.missingId')}</div>`;
    return;
  }

  try {
    const guides = await SOTGuides.loadGuides();
    const guide = SOTGuides.getGuideById(guides, id);
    if (!guide) {
      root.innerHTML = `<div class="empty-state">${t('guide.notFound')}</div>`;
      return;
    }

    document.title = `${guide.title} — Los Indomables`;

    if (editMode) {
      if (!session) {
        window.location.href = 'auth.html';
        return;
      }
      window.SOTGuideEditor?.mount?.(root, guide, session);
      return;
    }

    const progress = session
      ? SOTProgress.getGuideProgress(session.id, guide.id)
      : { checked: {} };

    const steps = guide.steps || [];
    const cat = window.SOTI18n?.categoryLabel?.(guide.category) || guide.category || '';
    const diff = window.SOTI18n?.difficultyLabel?.(guide.difficulty) || guide.difficulty || '';

    function checklistHtml() {
      return (guide.checklist || [])
        .map((item) => {
          const checked = !!progress.checked?.[item.id];
          return `
            <label class="walk-check ${checked ? 'done' : ''}">
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
        .join('') || `<p class="muted"><em>${t('guide.emptyChecklist')}</em></p>`;
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
          : t('guide.loginToSave');
      }
      if (fill) fill.style.width = `${stats.percent}%`;
    }

    const stats = session
      ? SOTProgress.getGuideStats(session.id, guide)
      : { done: 0, total: (guide.checklist || []).length, percent: 0 };

    const toc = steps
      .map(
        (step, i) => `
        <li>
          <a href="#step-${SOTGuides.escapeHtml(step.id || String(i + 1))}">
            <span class="toc-num">${i + 1}</span>
            ${SOTGuides.escapeHtml(step.title)}
          </a>
        </li>`
      )
      .join('');

    const stepsHtml = steps
      .map((step, i) => {
        const sid = step.id || `step-${i + 1}`;
        const tips = (step.tips || [])
          .map((tip) => `<li>${SOTGuides.escapeHtml(tip)}</li>`)
          .join('');
        const prev = i > 0 ? steps[i - 1] : null;
        const next = i < steps.length - 1 ? steps[i + 1] : null;
        return `
          <article class="walk-step reveal-on-scroll" id="step-${SOTGuides.escapeHtml(sid)}">
            <header class="walk-step-head">
              <span class="walk-step-badge">${t('guide.stepLabel', { n: i + 1 })}</span>
              <h2>${SOTGuides.escapeHtml(step.title)}</h2>
            </header>
            ${
              step.sketch
                ? `<div class="walk-sketch" aria-hidden="true">${SOTGuides.sketchSvg(step.sketch)}</div>`
                : ''
            }
            <div class="walk-body">${SOTGuides.formatContent(step.content)}</div>
            ${
              tips
                ? `<aside class="walk-tips"><h3>${t('guide.notesTitle')}</h3><ul>${tips}</ul></aside>`
                : ''
            }
            <nav class="walk-step-nav">
              ${
                prev
                  ? `<a class="btn btn-ghost" href="#step-${SOTGuides.escapeHtml(prev.id || String(i))}">${t('guide.prevStep')}</a>`
                  : `<span></span>`
              }
              ${
                next
                  ? `<a class="btn" href="#step-${SOTGuides.escapeHtml(next.id || String(i + 2))}">${t('guide.nextStep')}</a>`
                  : `<a class="btn" href="#checklist">${t('guide.toChecklist')}</a>`
              }
            </nav>
          </article>
        `;
      })
      .join('');

    root.innerHTML = `
      <div class="guide-layout walk-layout">
        <div class="walk-main">
          <div class="walk-toolbar">
            <a class="back-link" href="guias.html">${t('guide.back')}</a>
            <div class="walk-toolbar-actions">
              ${
                session
                  ? `<a class="btn btn-ghost" href="guia.html?id=${encodeURIComponent(guide.id)}&edit=1">${t('guide.edit')}</a>`
                  : ''
              }
            </div>
          </div>

          <header class="walk-hero reveal-on-scroll">
            <div class="guide-meta">
              ${cat ? `<span class="tag">${SOTGuides.escapeHtml(cat)}</span>` : ''}
              ${diff ? `<span class="tag tag-gold">${SOTGuides.escapeHtml(diff)}</span>` : ''}
            </div>
            <h1>${SOTGuides.escapeHtml(guide.title)}</h1>
            <p class="walk-summary">${SOTGuides.escapeHtml(guide.summary || '')}</p>
            ${
              guide.coverSketch
                ? `<div class="walk-cover-sketch" aria-hidden="true">${SOTGuides.sketchSvg(guide.coverSketch)}</div>`
                : ''
            }
          </header>

          <nav class="walk-toc panel reveal-on-scroll" aria-label="${t('guide.tocLabel')}">
            <h2>${t('guide.tocTitle')}</h2>
            <ol>${toc}</ol>
          </nav>

          <div class="walk-steps">
            ${stepsHtml}
          </div>
        </div>

        <aside class="panel progress-panel walk-aside" id="checklist">
          <h3>${t('guide.logTitle')}</h3>
          <p class="muted" id="progress-label">
            ${
              session
                ? `${stats.done} / ${stats.total} · ${stats.percent}%`
                : t('guide.loginToSave')
            }
          </p>
          <div class="progress-bar" style="margin-bottom: 1.25rem;">
            <span id="progress-fill" style="width:${stats.percent}%"></span>
          </div>
          <div class="checklist walk-checklist" id="side-checklist">${checklistHtml()}</div>
          ${
            session
              ? ''
              : `<p style="margin-top:1rem"><a class="btn btn-block" href="auth.html">${t('guide.loginCta')}</a></p>`
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
        const label = input.closest('label');
        label?.classList.toggle('done', input.checked);
        label?.classList.add('check-pop');
        setTimeout(() => label?.classList.remove('check-pop'), 450);
      });
    }

    window.SOTAtmosphere?.observeReveals?.(root);
  } catch {
    root.innerHTML = `<div class="empty-state">${t('guide.openError')}</div>`;
  }
});
