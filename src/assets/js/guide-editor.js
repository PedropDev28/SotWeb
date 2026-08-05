(function () {
  function t(key, vars) {
    return window.SOTI18n?.t?.(key, vars) ?? key;
  }

  function esc(str) {
    return window.SOTGuides?.escapeHtml?.(str) ?? String(str);
  }

  function mount(root, guide, session) {
    const draft = JSON.parse(JSON.stringify(guide));

    function stepFields(step, index) {
      return `
        <div class="editor-step panel" data-step-index="${index}">
          <div class="editor-step-head">
            <strong>${t('editor.stepN', { n: index + 1 })}</strong>
            <button type="button" class="btn btn-ghost btn-sm" data-remove-step>${t('editor.remove')}</button>
          </div>
          <div class="form-group">
            <label>${t('editor.stepTitle')}</label>
            <input type="text" data-field="title" value="${esc(step.title || '')}">
          </div>
          <div class="form-group">
            <label>${t('editor.stepContent')}</label>
            <textarea rows="6" data-field="content">${esc(step.content || '')}</textarea>
          </div>
          <div class="form-group">
            <label>${t('editor.stepTips')}</label>
            <textarea rows="3" data-field="tips" placeholder="${esc(t('editor.tipsPh'))}">${esc(
              (step.tips || []).join('\n')
            )}</textarea>
          </div>
        </div>
      `;
    }

    function checklistFields() {
      return (draft.checklist || [])
        .map(
          (item, i) => `
        <div class="editor-check-row" data-check-index="${i}">
          <input type="text" data-check-label value="${esc(item.label || '')}" placeholder="${esc(
            t('editor.checkPh')
          )}">
          <button type="button" class="btn btn-ghost btn-sm" data-remove-check>${t('editor.remove')}</button>
        </div>`
        )
        .join('');
    }

    function commendationFields() {
      return (draft.commendations || [])
        .map(
          (item, i) => `
        <div class="editor-comm panel" data-comm-index="${i}">
          <div class="editor-step-head">
            <strong>${esc(t('editor.commendations'))} ${i + 1}</strong>
            <button type="button" class="btn btn-ghost btn-sm" data-remove-comm>${t('editor.remove')}</button>
          </div>
          <div class="form-group">
            <label>${esc(t('editor.commTitle'))}</label>
            <input type="text" data-comm-title value="${esc(item.title || '')}">
          </div>
          <div class="form-group">
            <label>${esc(t('editor.commDesc'))}</label>
            <textarea rows="2" data-comm-desc>${esc(item.description || '')}</textarea>
          </div>
          <div class="form-group">
            <label>${esc(t('editor.commHint'))}</label>
            <input type="text" data-comm-hint value="${esc(item.hint || '')}">
          </div>
          <div class="form-group">
            <label>${esc(t('editor.commImage'))}</label>
            <input type="url" data-comm-image value="${esc(item.image || '')}" placeholder="https://…">
          </div>
        </div>`
        )
        .join('');
    }

    function paint() {
      root.innerHTML = `
        <div class="editor-wrap">
          <div class="walk-toolbar">
            <a class="back-link" href="guia.html?id=${encodeURIComponent(guide.id)}">${t('editor.cancel')}</a>
            <button type="button" class="btn" id="editor-submit">${t('editor.submit')}</button>
          </div>
          <header class="editor-hero panel">
            <h1>${t('editor.heading')}</h1>
            <p class="muted">${t('editor.lead')}</p>
          </header>

          <form class="editor-form" id="guide-editor-form">
            <div class="panel">
              <div class="form-group">
                <label>${t('editor.title')}</label>
                <input id="ed-title" type="text" value="${esc(draft.title || '')}" required>
              </div>
              <div class="form-group">
                <label>${t('editor.summary')}</label>
                <textarea id="ed-summary" rows="3" required>${esc(draft.summary || '')}</textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>${t('editor.category')}</label>
                  <input id="ed-category" type="text" value="${esc(draft.category || '')}">
                </div>
                <div class="form-group">
                  <label>${t('editor.difficulty')}</label>
                  <input id="ed-difficulty" type="text" value="${esc(draft.difficulty || '')}">
                </div>
              </div>
            </div>

            <div class="editor-section">
              <div class="editor-section-head">
                <h2>${t('editor.steps')}</h2>
                <button type="button" class="btn btn-ghost" id="add-step">${t('editor.addStep')}</button>
              </div>
              <div id="steps-host">
                ${(draft.steps || []).map(stepFields).join('')}
              </div>
            </div>

            <div class="editor-section panel">
              <div class="editor-section-head">
                <h2>${t('editor.checklist')}</h2>
                <button type="button" class="btn btn-ghost" id="add-check">${t('editor.addCheck')}</button>
              </div>
              <div id="checks-host">${checklistFields()}</div>
            </div>

            <div class="editor-section panel">
              <div class="editor-section-head">
                <h2>${t('editor.commendations')}</h2>
                <button type="button" class="btn btn-ghost" id="add-comm">${t('editor.addCommendation')}</button>
              </div>
              <div id="comms-host">${commendationFields()}</div>
            </div>

            <p class="form-msg" id="editor-msg"></p>
            <button type="submit" class="btn btn-block">${t('editor.submit')}</button>
          </form>
        </div>
      `;

      bind();
    }

    function collect() {
      draft.title = document.getElementById('ed-title').value.trim();
      draft.summary = document.getElementById('ed-summary').value.trim();
      draft.category = document.getElementById('ed-category').value.trim();
      draft.difficulty = document.getElementById('ed-difficulty').value.trim();

      draft.steps = [...document.querySelectorAll('.editor-step')].map((el, i) => {
        const prev = draft.steps?.[i] || {};
        return {
          id: prev.id || `step-${i + 1}`,
          sketch: prev.sketch || '',
          title: el.querySelector('[data-field="title"]').value.trim(),
          content: el.querySelector('[data-field="content"]').value.trim(),
          tips: el
            .querySelector('[data-field="tips"]')
            .value.split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        };
      });

      draft.checklist = [...document.querySelectorAll('.editor-check-row')].map((el, i) => {
        const prev = draft.checklist?.[i] || {};
        return {
          id: prev.id || `check-${i + 1}`,
          label: el.querySelector('[data-check-label]').value.trim(),
        };
      }).filter((c) => c.label);

      draft.commendations = [...document.querySelectorAll('[data-comm-index]')].map((el, i) => {
        const prev = draft.commendations?.[i] || {};
        return {
          id: prev.id || `comm-${i + 1}`,
          title: el.querySelector('[data-comm-title]').value.trim(),
          description: el.querySelector('[data-comm-desc]').value.trim(),
          hint: el.querySelector('[data-comm-hint]').value.trim(),
          image: el.querySelector('[data-comm-image]')?.value.trim() || prev.image || '',
        };
      }).filter((c) => c.title);
    }

    function bind() {
      document.getElementById('add-step')?.addEventListener('click', () => {
        collect();
        draft.steps = draft.steps || [];
        draft.steps.push({
          id: `step-${draft.steps.length + 1}`,
          title: '',
          content: '',
          tips: [],
          sketch: '',
        });
        paint();
      });

      document.getElementById('add-check')?.addEventListener('click', () => {
        collect();
        draft.checklist = draft.checklist || [];
        draft.checklist.push({ id: `check-${draft.checklist.length + 1}`, label: '' });
        paint();
      });

      document.getElementById('add-comm')?.addEventListener('click', () => {
        collect();
        draft.commendations = draft.commendations || [];
        draft.commendations.push({
          id: `comm-${draft.commendations.length + 1}`,
          title: '',
          description: '',
          hint: '',
          image: '',
        });
        paint();
      });

      root.querySelectorAll('[data-remove-step]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.closest('.editor-step')?.dataset.stepIndex);
          collect();
          draft.steps.splice(idx, 1);
          paint();
        });
      });

      root.querySelectorAll('[data-remove-check]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.closest('.editor-check-row')?.dataset.checkIndex);
          collect();
          draft.checklist.splice(idx, 1);
          paint();
        });
      });

      root.querySelectorAll('[data-remove-comm]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.closest('[data-comm-index]')?.dataset.commIndex);
          collect();
          draft.commendations.splice(idx, 1);
          paint();
        });
      });

      const form = document.getElementById('guide-editor-form');
      const submitTop = document.getElementById('editor-submit');
      const submit = async (e) => {
        e?.preventDefault?.();
        const msg = document.getElementById('editor-msg');
        collect();
        if (!draft.title || !draft.summary) {
          msg.textContent = t('editor.required');
          msg.className = 'form-msg error';
          return;
        }

        msg.textContent = t('editor.sending');
        msg.className = 'form-msg';

        try {
          const endpoint = window.SOT_CONFIG?.guideProposalsApi || '/api/guide-proposals';
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              author: {
                id: session.id,
                name: session.name,
                email: session.email,
                provider: session.provider,
                discordId: session.discordId || '',
              },
              guide: draft,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.message || data.error || t('editor.error'));
          }
          msg.textContent = t('editor.sent');
          msg.className = 'form-msg success';
          setTimeout(() => {
            window.location.href = `guia.html?id=${encodeURIComponent(guide.id)}`;
          }, 1200);
        } catch (err) {
          msg.textContent = err.message || t('editor.error');
          msg.className = 'form-msg error';
        }
      };

      form?.addEventListener('submit', submit);
      submitTop?.addEventListener('click', submit);
    }

    paint();
  }

  window.SOTGuideEditor = { mount };
})();
