document.addEventListener('DOMContentLoaded', async () => {
  const t = (key, vars) => window.SOTI18n?.t?.(key, vars) ?? key;
  const root = document.getElementById('admin-root');
  if (!root) return;

  const session = SOTAuth.requireAuth('auth.html');
  if (!session) return;

  if (!SOTAuth.isAdmin(session)) {
    root.innerHTML = `
      <div class="panel" style="max-width:560px;margin:0 auto;">
        <h2>${esc(t('admin.forbiddenTitle'))}</h2>
        <p class="muted">${esc(t('admin.forbidden'))}</p>
        <p><a class="btn" href="index.html">${esc(t('nav.home'))}</a></p>
      </div>`;
    return;
  }

  const api = window.SOT_CONFIG?.adminContentApi || '/api/admin-content';
  let tab = 'pages';
  let pages = [];
  let guides = [];
  let quill = null;
  let stepQuills = [];
  let editingPageId = null;
  let editingGuide = null;

  function esc(str) {
    return SOTGuides.escapeHtml(String(str ?? ''));
  }

  function authorPayload() {
    return {
      id: session.id,
      name: session.name,
      email: session.email,
      provider: session.provider,
      discordId: session.discordId || '',
    };
  }

  async function adminPost(body) {
    const headers = { 'Content-Type': 'application/json' };
    const secret = window.SOT_CONFIG?.adminSecret;
    if (secret) headers['X-Admin-Secret'] = secret;
    const res = await fetch(api, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, author: authorPayload() }),
    });
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(
        text?.slice(0, 160) || t('admin.error')
      );
    }
    if (!res.ok) throw new Error(data.message || data.error || t('admin.error'));
    return data;
  }

  async function uploadFile(file) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const result = await adminPost({
      action: 'upload',
      mime: file.type || 'application/octet-stream',
      data: dataUrl,
    });
    return result.url;
  }

  async function refreshData() {
    const pagesRes = await fetch(`${api}?type=pages`, { cache: 'no-store' });
    const pagesText = await pagesRes.text();
    let pagesJson = { pages: [] };
    try {
      pagesJson = pagesText ? JSON.parse(pagesText) : { pages: [] };
    } catch {
      throw new Error(pagesText?.slice(0, 160) || t('admin.error'));
    }
    if (!pagesRes.ok) {
      throw new Error(pagesJson.message || pagesJson.error || t('admin.error'));
    }
    pages = pagesJson.pages || [];
    SOTGuides.clearCache();
    guides = await SOTGuides.loadGuides();
  }

  function paint() {
    root.innerHTML = `
      <div class="admin-shell">
        <div class="admin-tabs" role="tablist">
          <button type="button" class="auth-tab ${tab === 'pages' ? 'active' : ''}" data-tab="pages">${esc(t('admin.tabPages'))}</button>
          <button type="button" class="auth-tab ${tab === 'guides' ? 'active' : ''}" data-tab="guides">${esc(t('admin.tabGuides'))}</button>
        </div>
        <div id="admin-view"></div>
        <p class="form-msg" id="admin-msg"></p>
      </div>
    `;

    root.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        tab = btn.dataset.tab;
        paint();
      });
    });

    const view = document.getElementById('admin-view');
    if (tab === 'pages') renderPages(view);
    else renderGuides(view);
  }

  function setMsg(text, kind = '') {
    const el = document.getElementById('admin-msg');
    if (!el) return;
    el.textContent = text || '';
    el.className = `form-msg ${kind}`.trim();
  }

  function renderPages(view) {
    if (editingPageId !== null) {
      renderPageEditor(view);
      return;
    }

    view.innerHTML = `
      <div class="admin-toolbar">
        <button type="button" class="btn" id="new-page">${esc(t('admin.newPage'))}</button>
      </div>
      <div class="admin-list">
        ${
          pages.length
            ? pages
                .map(
                  (p) => `
            <article class="panel admin-card">
              <div>
                <h3>${esc(p.title)}</h3>
                <p class="muted">${esc(p.id)} · ${p.published ? esc(t('admin.published')) : esc(t('admin.draft'))}</p>
              </div>
              <div class="admin-card-actions">
                <a class="btn btn-ghost" href="pagina.html?id=${encodeURIComponent(p.id)}" target="_blank">${esc(t('admin.view'))}</a>
                <button type="button" class="btn btn-ghost" data-edit-page="${esc(p.id)}">${esc(t('admin.edit'))}</button>
                <button type="button" class="btn btn-ghost" data-del-page="${esc(p.id)}">${esc(t('admin.delete'))}</button>
              </div>
            </article>`
                )
                .join('')
            : `<p class="muted">${esc(t('admin.noPages'))}</p>`
        }
      </div>
    `;

    document.getElementById('new-page')?.addEventListener('click', () => {
      editingPageId = '__new__';
      paint();
    });
    view.querySelectorAll('[data-edit-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingPageId = btn.dataset.editPage;
        paint();
      });
    });
    view.querySelectorAll('[data-del-page]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('admin.confirmDelete'))) return;
        try {
          setMsg(t('admin.saving'));
          await adminPost({ action: 'deletePage', id: btn.dataset.delPage });
          await refreshData();
          setMsg(t('admin.deleted'), 'success');
          paint();
        } catch (err) {
          setMsg(err.message, 'error');
        }
      });
    });
  }

  async function renderPageEditor(view) {
    let page = {
      id: '',
      title: '',
      html: '<p></p>',
      published: true,
    };

    if (editingPageId && editingPageId !== '__new__') {
      view.innerHTML = `<div class="empty-state">${esc(t('admin.loading'))}</div>`;
      try {
        const res = await fetch(`${api}?type=pages&id=${encodeURIComponent(editingPageId)}`, {
          cache: 'no-store',
        });
        page = await res.json();
        if (!res.ok) throw new Error(page.message || t('admin.error'));
      } catch (err) {
        view.innerHTML = `<p class="form-msg error">${esc(err.message)}</p>`;
        return;
      }
    }

    view.innerHTML = `
      <div class="admin-toolbar">
        <button type="button" class="btn btn-ghost" id="back-pages">${esc(t('admin.back'))}</button>
        <button type="button" class="btn" id="save-page">${esc(t('admin.save'))}</button>
      </div>
      <div class="panel editor-hero">
        <div class="form-group">
          <label>${esc(t('admin.pageTitle'))}</label>
          <input id="page-title" type="text" value="${esc(page.title || '')}">
        </div>
        <div class="form-group">
          <label>${esc(t('admin.pageId'))}</label>
          <input id="page-id" type="text" value="${esc(page.id || '')}" placeholder="mi-pagina" ${
            editingPageId !== '__new__' ? 'readonly' : ''
          }>
        </div>
        <label class="walk-check" style="margin-bottom:1rem;">
          <input type="checkbox" id="page-published" ${page.published !== false ? 'checked' : ''}>
          <span>${esc(t('admin.published'))}</span>
        </label>
        <label class="muted" style="display:block;margin-bottom:.5rem;">${esc(t('admin.editorHint'))}</label>
        <div id="quill-editor" class="quill-host"></div>
        <div class="admin-media-bar">
          <label class="btn btn-ghost">
            ${esc(t('admin.insertImage'))}
            <input type="file" id="insert-image" accept="image/*,.gif" hidden>
          </label>
          <label class="btn btn-ghost">
            ${esc(t('admin.insertFile'))}
            <input type="file" id="insert-file" accept="image/*,video/*,audio/*,.pdf,.gif" hidden>
          </label>
        </div>
      </div>
    `;

    document.getElementById('back-pages')?.addEventListener('click', () => {
      editingPageId = null;
      quill = null;
      paint();
    });

    quill = new Quill('#quill-editor', {
      theme: 'snow',
      placeholder: t('admin.editorPlaceholder'),
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['blockquote', 'code-block'],
          ['link', 'image', 'video'],
          ['clean'],
        ],
      },
    });
    quill.root.innerHTML = page.html || '<p></p>';

    const toolbar = quill.getModule('toolbar');
    toolbar.addHandler('image', () => {
      document.getElementById('insert-image')?.click();
    });

    async function insertFromInput(input) {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      try {
        setMsg(t('admin.uploading'));
        const url = await uploadFile(file);
        const range = quill.getSelection(true) || { index: quill.getLength() };
        if (file.type.startsWith('image/')) {
          quill.insertEmbed(range.index, 'image', url, 'user');
        } else if (file.type.startsWith('video/')) {
          quill.insertEmbed(range.index, 'video', url, 'user');
        } else {
          quill.insertText(range.index, file.name, 'link', url, 'user');
        }
        setMsg(t('admin.uploaded'), 'success');
      } catch (err) {
        setMsg(err.message, 'error');
      }
    }

    document.getElementById('insert-image')?.addEventListener('change', (e) => insertFromInput(e.target));
    document.getElementById('insert-file')?.addEventListener('change', (e) => insertFromInput(e.target));

    document.getElementById('save-page')?.addEventListener('click', async () => {
      try {
        setMsg(t('admin.saving'));
        const title = document.getElementById('page-title').value.trim();
        const id = document.getElementById('page-id').value.trim() || title;
        const published = document.getElementById('page-published').checked;
        const data = await adminPost({
          action: 'savePage',
          page: {
            id: editingPageId === '__new__' ? id : page.id,
            title,
            html: quill.root.innerHTML,
            published,
          },
        });
        editingPageId = null;
        quill = null;
        await refreshData();
        setMsg(t('admin.savedPage', { url: data.url || '' }), 'success');
        paint();
      } catch (err) {
        setMsg(err.message, 'error');
      }
    });
  }

  function renderGuides(view) {
    if (editingGuide) {
      renderGuideEditor(view);
      return;
    }

    view.innerHTML = `
      <div class="admin-toolbar">
        <button type="button" class="btn" id="new-guide">${esc(t('admin.newGuide'))}</button>
      </div>
      <div class="admin-list">
        ${guides
          .map(
            (g) => `
          <article class="panel admin-card">
            <div>
              <h3>${esc(g.title)}</h3>
              <p class="muted">${esc(g.id)} · ${esc(g.category || '')}</p>
            </div>
            <div class="admin-card-actions">
              <a class="btn btn-ghost" href="guia.html?id=${encodeURIComponent(g.id)}" target="_blank">${esc(t('admin.view'))}</a>
              <button type="button" class="btn btn-ghost" data-edit-guide="${esc(g.id)}">${esc(t('admin.edit'))}</button>
              <button type="button" class="btn btn-ghost" data-del-guide="${esc(g.id)}">${esc(t('admin.delete'))}</button>
            </div>
          </article>`
          )
          .join('')}
      </div>
    `;

    document.getElementById('new-guide')?.addEventListener('click', () => {
      editingGuide = {
        id: '',
        title: '',
        category: 'Tall Tales',
        difficulty: 'Media',
        summary: '',
        steps: [{ id: 'step-1', title: '', content: '', tips: [] }],
        checklist: [],
        commendations: [],
      };
      paint();
    });

    view.querySelectorAll('[data-edit-guide]').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingGuide = JSON.parse(
          JSON.stringify(guides.find((g) => g.id === btn.dataset.editGuide) || null)
        );
        paint();
      });
    });

    view.querySelectorAll('[data-del-guide]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('admin.confirmDelete'))) return;
        try {
          setMsg(t('admin.saving'));
          await adminPost({ action: 'deleteGuide', id: btn.dataset.delGuide });
          SOTGuides.clearCache();
          await refreshData();
          setMsg(t('admin.deleted'), 'success');
          paint();
        } catch (err) {
          setMsg(err.message, 'error');
        }
      });
    });
  }

  function mountStepQuill(host, html, onImageRequest) {
    const editor = new Quill(host, {
      theme: 'snow',
      placeholder: t('admin.editorPlaceholder'),
      modules: {
        toolbar: {
          container: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean'],
          ],
          handlers: {
            image: () => onImageRequest(editor),
          },
        },
      },
    });
    editor.root.innerHTML = html || '<p></p>';
    return editor;
  }

  async function insertMediaIntoQuill(editor, file) {
    setMsg(t('admin.uploading'));
    const url = await uploadFile(file);
    const range = editor.getSelection(true) || { index: editor.getLength() };
    if (file.type.startsWith('image/')) {
      editor.insertEmbed(range.index, 'image', url, 'user');
      editor.setSelection(range.index + 1);
    } else if (file.type.startsWith('video/')) {
      editor.insertEmbed(range.index, 'video', url, 'user');
    } else {
      editor.insertText(range.index, file.name, 'link', url, 'user');
    }
    setMsg(t('admin.uploaded'), 'success');
  }

  function renderGuideEditor(view) {
    const g = editingGuide;
    stepQuills = [];

    view.innerHTML = `
      <div class="admin-toolbar">
        <button type="button" class="btn btn-ghost" id="back-guides">${esc(t('admin.back'))}</button>
        <button type="button" class="btn" id="save-guide">${esc(t('admin.save'))}</button>
      </div>
      <div class="editor-form">
        <div class="panel">
          <div class="form-group">
            <label>${esc(t('editor.title'))}</label>
            <input id="g-title" type="text" value="${esc(g.title || '')}">
          </div>
          <div class="form-group">
            <label>ID</label>
            <input id="g-id" type="text" value="${esc(g.id || '')}" placeholder="mi-guia" ${g.id ? 'readonly' : ''}>
          </div>
          <div class="form-group">
            <label>${esc(t('editor.summary'))}</label>
            <textarea id="g-summary" rows="3">${esc(g.summary || '')}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>${esc(t('editor.category'))}</label>
              <input id="g-category" type="text" value="${esc(g.category || '')}">
            </div>
            <div class="form-group">
              <label>${esc(t('editor.difficulty'))}</label>
              <input id="g-difficulty" type="text" value="${esc(g.difficulty || '')}">
            </div>
          </div>
        </div>
        <div class="editor-section">
          <div class="editor-section-head">
            <h2>${esc(t('editor.steps'))}</h2>
            <button type="button" class="btn btn-ghost" id="g-add-step">${esc(t('editor.addStep'))}</button>
          </div>
          <p class="muted" style="margin-bottom:0.85rem;">${esc(t('admin.guideStepsHint'))}</p>
          <div id="g-steps">
            ${(g.steps || [])
              .map(
                (step, i) => `
              <div class="editor-step panel" data-i="${i}">
                <div class="editor-step-head">
                  <strong>${esc(t('editor.stepN', { n: i + 1 }))}</strong>
                  <button type="button" class="btn btn-ghost btn-sm" data-rm-step>${esc(t('editor.remove'))}</button>
                </div>
                <div class="form-group">
                  <label>${esc(t('editor.stepTitle'))}</label>
                  <input data-f="title" type="text" value="${esc(step.title || '')}">
                </div>
                <div class="form-group">
                  <label>${esc(t('editor.stepContent'))}</label>
                  <div class="quill-host quill-step" data-quill-step="${i}"></div>
                  <div class="admin-media-bar">
                    <label class="btn btn-ghost btn-sm">
                      ${esc(t('admin.insertImage'))}
                      <input type="file" data-step-image="${i}" accept="image/*,.gif" hidden>
                    </label>
                  </div>
                </div>
                <div class="form-group">
                  <label>${esc(t('editor.stepTips'))}</label>
                  <textarea data-f="tips" rows="3">${esc((step.tips || []).join('\n'))}</textarea>
                </div>
              </div>`
              )
              .join('')}
          </div>
        </div>
        <div class="panel editor-section">
          <div class="editor-section-head">
            <h2>${esc(t('editor.checklist'))}</h2>
            <button type="button" class="btn btn-ghost" id="g-add-check">${esc(t('editor.addCheck'))}</button>
          </div>
          <div id="g-checks">
            ${(g.checklist || [])
              .map(
                (c, i) => `
              <div class="editor-check-row" data-i="${i}">
                <input type="text" data-check value="${esc(c.label || '')}">
                <button type="button" class="btn btn-ghost btn-sm" data-rm-check>${esc(t('editor.remove'))}</button>
              </div>`
              )
              .join('')}
          </div>
        </div>
        <div class="panel editor-section">
          <div class="editor-section-head">
            <h2>${esc(t('editor.commendations'))}</h2>
            <button type="button" class="btn btn-ghost" id="g-add-comm">${esc(t('editor.addCommendation'))}</button>
          </div>
          <div id="g-comms">
            ${(g.commendations || [])
              .map(
                (c, i) => `
              <div class="editor-comm panel" data-i="${i}">
                <div class="editor-step-head">
                  <strong>${esc(t('editor.commendations'))} ${i + 1}</strong>
                  <button type="button" class="btn btn-ghost btn-sm" data-rm-comm>${esc(t('editor.remove'))}</button>
                </div>
                <div class="form-group">
                  <label>${esc(t('editor.commTitle'))}</label>
                  <input data-comm="title" type="text" value="${esc(c.title || '')}">
                </div>
                <div class="form-group">
                  <label>${esc(t('editor.commDesc'))}</label>
                  <textarea data-comm="description" rows="2">${esc(c.description || '')}</textarea>
                </div>
                <div class="form-group">
                  <label>${esc(t('editor.commHint'))}</label>
                  <input data-comm="hint" type="text" value="${esc(c.hint || '')}">
                </div>
              </div>`
              )
              .join('')}
          </div>
        </div>
      </div>
      <input type="file" id="guide-image-picker" accept="image/*,.gif" hidden>
    `;

    const imagePicker = document.getElementById('guide-image-picker');
    let pendingQuill = null;

    (g.steps || []).forEach((step, i) => {
      const host = view.querySelector(`[data-quill-step="${i}"]`);
      if (!host || !window.Quill) return;
      stepQuills[i] = mountStepQuill(host, step.content || '', (editor) => {
        pendingQuill = editor;
        imagePicker?.click();
      });
    });

    imagePicker?.addEventListener('change', async () => {
      const file = imagePicker.files?.[0];
      imagePicker.value = '';
      if (!file || !pendingQuill) return;
      try {
        await insertMediaIntoQuill(pendingQuill, file);
      } catch (err) {
        setMsg(err.message, 'error');
      } finally {
        pendingQuill = null;
      }
    });

    view.querySelectorAll('[data-step-image]').forEach((input) => {
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        input.value = '';
        const idx = Number(input.dataset.stepImage);
        const editor = stepQuills[idx];
        if (!file || !editor) return;
        try {
          await insertMediaIntoQuill(editor, file);
        } catch (err) {
          setMsg(err.message, 'error');
        }
      });
    });

    function collectGuide() {
      g.title = document.getElementById('g-title').value.trim();
      g.id = document.getElementById('g-id').value.trim() || g.id;
      g.summary = document.getElementById('g-summary').value.trim();
      g.category = document.getElementById('g-category').value.trim();
      g.difficulty = document.getElementById('g-difficulty').value.trim();
      g.steps = [...document.querySelectorAll('#g-steps .editor-step')].map((el, i) => ({
        id: g.steps?.[i]?.id || `step-${i + 1}`,
        sketch: g.steps?.[i]?.sketch || '',
        title: el.querySelector('[data-f="title"]').value.trim(),
        content: stepQuills[i] ? stepQuills[i].root.innerHTML : '',
        tips: el
          .querySelector('[data-f="tips"]')
          .value.split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      }));
      g.checklist = [...document.querySelectorAll('#g-checks .editor-check-row')]
        .map((el, i) => ({
          id: g.checklist?.[i]?.id || `check-${i + 1}`,
          label: el.querySelector('[data-check]').value.trim(),
        }))
        .filter((c) => c.label);
      g.commendations = [...document.querySelectorAll('#g-comms .editor-comm')]
        .map((el, i) => ({
          id: g.commendations?.[i]?.id || `comm-${i + 1}`,
          title: el.querySelector('[data-comm="title"]').value.trim(),
          description: el.querySelector('[data-comm="description"]').value.trim(),
          hint: el.querySelector('[data-comm="hint"]').value.trim(),
        }))
        .filter((c) => c.title);
    }

    document.getElementById('back-guides')?.addEventListener('click', () => {
      editingGuide = null;
      stepQuills = [];
      paint();
    });

    document.getElementById('g-add-step')?.addEventListener('click', () => {
      collectGuide();
      g.steps.push({ id: `step-${g.steps.length + 1}`, title: '', content: '<p></p>', tips: [] });
      paint();
    });

    document.getElementById('g-add-check')?.addEventListener('click', () => {
      collectGuide();
      g.checklist = g.checklist || [];
      g.checklist.push({ id: `check-${g.checklist.length + 1}`, label: '' });
      paint();
    });

    document.getElementById('g-add-comm')?.addEventListener('click', () => {
      collectGuide();
      g.commendations = g.commendations || [];
      g.commendations.push({
        id: `comm-${g.commendations.length + 1}`,
        title: '',
        description: '',
        hint: '',
      });
      paint();
    });

    view.querySelectorAll('[data-rm-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.closest('[data-i]')?.dataset.i);
        collectGuide();
        g.steps.splice(i, 1);
        paint();
      });
    });

    view.querySelectorAll('[data-rm-check]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.closest('[data-i]')?.dataset.i);
        collectGuide();
        g.checklist.splice(i, 1);
        paint();
      });
    });

    view.querySelectorAll('[data-rm-comm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.closest('[data-i]')?.dataset.i);
        collectGuide();
        g.commendations.splice(i, 1);
        paint();
      });
    });

    document.getElementById('save-guide')?.addEventListener('click', async () => {
      collectGuide();
      if (!g.title) {
        setMsg(t('editor.required'), 'error');
        return;
      }
      try {
        setMsg(t('admin.saving'));
        await adminPost({ action: 'saveGuide', guide: g });
        editingGuide = null;
        stepQuills = [];
        SOTGuides.clearCache();
        await refreshData();
        setMsg(t('admin.savedGuide'), 'success');
        paint();
      } catch (err) {
        setMsg(err.message, 'error');
      }
    });
  }

  try {
    await refreshData();
    paint();
  } catch (err) {
    root.innerHTML = `<div class="empty-state">${esc(err.message || t('admin.error'))}</div>`;
  }
});
