(function () {
  const FLIP_THRESHOLD = 0.32;
  const DRAG_DISTANCE_RATIO = 0.42;

  /**
   * Libro interactivo: arrastra una página para pasar hoja.
   * @param {object} options
   * @param {HTMLElement} options.root - contenedor #guide-root o similar
   * @param {object[]} options.pages
   * @param {function} options.renderSide - (side, opts) => html
   * @param {function} options.onPageChange - (index) => void
   * @param {function} [options.renderExtras] - se llama tras pintar (checklists, etc.)
   */
  function createTaleBook(options) {
    const { root, pages, renderSide, onPageChange, renderExtras } = options;
    let index = 0;
    let busy = false;

    const drag = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      mode: null, // 'next' | 'prev'
      progress: 0,
      moved: false,
    };

    function canNext() {
      return index < pages.length - 1;
    }

    function canPrev() {
      return index > 0;
    }

    function paint(staticOnly = false) {
      const page = pages[index];
      const next = canNext() ? pages[index + 1] : null;
      const prev = canPrev() ? pages[index - 1] : null;
      const leftNum = index * 2 + 1;
      const rightNum = index * 2 + 2;

      const bookHost = root.querySelector('[data-tale-book-host]');
      if (!bookHost) return;

      bookHost.innerHTML = `
        <div class="tale-book" aria-label="Libro del Gran Relato">
          <span class="tale-metal tale-metal-tl" aria-hidden="true"></span>
          <span class="tale-metal tale-metal-tr" aria-hidden="true"></span>
          <span class="tale-metal tale-metal-bl" aria-hidden="true"></span>
          <span class="tale-metal tale-metal-br" aria-hidden="true"></span>
          <div class="tale-spread" id="tale-spread">
            <div class="tale-base">
              <div class="tale-page tale-page-left" data-base="left">
                <span class="tale-corner tale-corner-tl" aria-hidden="true"></span>
                <span class="tale-corner tale-corner-bl" aria-hidden="true"></span>
                ${renderSide(page.left, { pageNum: leftNum })}
              </div>
              <div class="tale-page tale-page-right" data-base="right">
                <span class="tale-corner tale-corner-tr" aria-hidden="true"></span>
                <span class="tale-corner tale-corner-br" aria-hidden="true"></span>
                ${renderSide(page.right, {
                  pageNum: rightNum,
                  checklistId: 'checklist',
                })}
              </div>
            </div>

            <div class="tale-under" data-under hidden>
              <div class="tale-page tale-page-left" data-under-left></div>
              <div class="tale-page tale-page-right" data-under-right></div>
            </div>

            <div class="tale-flipper" id="tale-flipper" hidden>
              <div class="tale-flip-face tale-flip-front" data-flip-front></div>
              <div class="tale-flip-face tale-flip-back" data-flip-back></div>
            </div>

            <div class="tale-drag-hint" data-drag-hint>
              Arrastra la hoja como en el juego
            </div>
          </div>
        </div>
      `;

      // Preload under/flip content containers exist; filled on drag start
      bookHost.dataset.hasNext = canNext() ? '1' : '0';
      bookHost.dataset.hasPrev = canPrev() ? '1' : '0';

      // stash for drag
      bookHost._pageCache = { page, next, prev, leftNum, rightNum };

      const indicator = root.querySelector('[data-page-indicator]');
      if (indicator) {
        indicator.textContent = `Hoja ${index + 1} / ${pages.length}`;
      }

      const prevBtn = root.querySelector('#prev-page');
      const nextBtn = root.querySelector('#next-page');
      if (prevBtn) prevBtn.disabled = !canPrev() || busy;
      if (nextBtn) nextBtn.disabled = !canNext() || busy;

      bindDrag(bookHost);
      renderExtras?.(index);
      if (!staticOnly) onPageChange?.(index);
    }

    function fillFlipContent(mode) {
      const spread = root.querySelector('#tale-spread');
      const host = root.querySelector('[data-tale-book-host]');
      const cache = host._pageCache;
      const under = spread.querySelector('[data-under]');
      const underLeft = spread.querySelector('[data-under-left]');
      const underRight = spread.querySelector('[data-under-right]');
      const flipper = spread.querySelector('#tale-flipper');
      const front = spread.querySelector('[data-flip-front]');
      const back = spread.querySelector('[data-flip-back]');
      const baseLeft = spread.querySelector('[data-base="left"]');
      const baseRight = spread.querySelector('[data-base="right"]');

      under.hidden = false;
      flipper.hidden = false;
      flipper.classList.remove('is-animating', 'mode-next', 'mode-prev');
      flipper.classList.add(mode === 'next' ? 'mode-next' : 'mode-prev');
      flipper.style.transition = 'none';
      flipper.style.transform = 'rotateY(0deg)';

      if (mode === 'next') {
        // Debajo a la derecha: siguiente derecha; izquierda base se mantiene
        underLeft.innerHTML = renderSide(cache.page.left, {
          pageNum: cache.leftNum,
        });
        underRight.innerHTML = renderSide(cache.next.right, {
          pageNum: (index + 1) * 2 + 2,
          checklistId: 'checklist-under',
        });
        front.innerHTML = `<div class="tale-page">${renderSide(cache.page.right, {
          pageNum: cache.rightNum,
        })}</div>`;
        back.innerHTML = `<div class="tale-page">${renderSide(cache.next.left, {
          pageNum: (index + 1) * 2 + 1,
        })}</div>`;
        baseRight.style.visibility = 'hidden';
        baseLeft.style.visibility = 'visible';
      } else {
        underLeft.innerHTML = renderSide(cache.prev.left, {
          pageNum: (index - 1) * 2 + 1,
        });
        underRight.innerHTML = renderSide(cache.page.right, {
          pageNum: cache.rightNum,
          checklistId: 'checklist-under',
        });
        front.innerHTML = `<div class="tale-page">${renderSide(cache.page.left, {
          pageNum: cache.leftNum,
        })}</div>`;
        back.innerHTML = `<div class="tale-page">${renderSide(cache.prev.right, {
          pageNum: (index - 1) * 2 + 2,
        })}</div>`;
        baseLeft.style.visibility = 'hidden';
        baseRight.style.visibility = 'visible';
      }

      under.style.opacity = '1';
      spread.classList.add('is-flipping');
      spread.querySelector('[data-drag-hint]')?.classList.add('hidden-hint');
    }

    function setFlipProgress(mode, progress) {
      const flipper = root.querySelector('#tale-flipper');
      if (!flipper) return;
      const angle = mode === 'next' ? -180 * progress : 180 * progress;
      flipper.style.transform = `rotateY(${angle}deg)`;
      // sombra según progreso
      flipper.style.setProperty('--flip-shade', String(Math.sin(progress * Math.PI) * 0.35));
    }

    function resetFlipVisual() {
      const spread = root.querySelector('#tale-spread');
      if (!spread) return;
      const under = spread.querySelector('[data-under]');
      const flipper = spread.querySelector('#tale-flipper');
      const baseLeft = spread.querySelector('[data-base="left"]');
      const baseRight = spread.querySelector('[data-base="right"]');
      if (under) under.hidden = true;
      if (flipper) {
        flipper.hidden = true;
        flipper.style.transition = 'none';
        flipper.style.transform = 'rotateY(0deg)';
        flipper.classList.remove('is-animating', 'mode-next', 'mode-prev');
      }
      if (baseLeft) baseLeft.style.visibility = 'visible';
      if (baseRight) baseRight.style.visibility = 'visible';
      spread.classList.remove('is-flipping');
      spread.querySelector('[data-drag-hint]')?.classList.remove('hidden-hint');
    }

    function finishFlip(mode, completed) {
      const flipper = root.querySelector('#tale-flipper');
      if (!flipper) {
        busy = false;
        return;
      }

      busy = true;
      let settled = false;
      flipper.classList.add('is-animating');
      flipper.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';

      const target = completed
        ? mode === 'next'
          ? -180
          : 180
        : 0;

      requestAnimationFrame(() => {
        flipper.style.transform = `rotateY(${target}deg)`;
      });

      const onEnd = (event) => {
        if (settled) return;
        if (event && event.propertyName && event.propertyName !== 'transform') return;
        settled = true;
        flipper.removeEventListener('transitionend', onEnd);
        if (completed) {
          index += mode === 'next' ? 1 : -1;
          busy = false;
          paint();
        } else {
          resetFlipVisual();
          busy = false;
          const prevBtn = root.querySelector('#prev-page');
          const nextBtn = root.querySelector('#next-page');
          if (prevBtn) prevBtn.disabled = !canPrev();
          if (nextBtn) nextBtn.disabled = !canNext();
          renderExtras?.(index);
        }
      };

      flipper.addEventListener('transitionend', onEnd);
      setTimeout(() => onEnd(), 520);
    }

    function bindDrag(host) {
      const spread = host.querySelector('#tale-spread');
      if (!spread) return;

      const onDown = (e) => {
        if (busy) return;
        if (e.target.closest('input, label, a, button, .checklist')) return;
        if (e.button != null && e.button !== 0) return;

        const rect = spread.getBoundingClientRect();
        const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
        const mid = rect.width / 2;
        const fromRight = x >= mid;

        if (fromRight && !canNext()) return;
        if (!fromRight && !canPrev()) return;

        drag.active = true;
        drag.pointerId = e.pointerId;
        drag.startX = e.clientX ?? e.touches?.[0]?.clientX;
        drag.startY = e.clientY ?? e.touches?.[0]?.clientY;
        drag.mode = fromRight ? 'next' : 'prev';
        drag.progress = 0;
        drag.moved = false;

        try {
          spread.setPointerCapture?.(e.pointerId);
        } catch {
          /* ignore */
        }

        fillFlipContent(drag.mode);
        e.preventDefault();
      };

      const onMove = (e) => {
        if (!drag.active) return;
        const clientX = e.clientX ?? e.touches?.[0]?.clientX;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY;
        if (clientX == null) return;

        const rect = spread.getBoundingClientRect();
        const dx = clientX - drag.startX;
        const dy = clientY - drag.startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;

        let raw =
          drag.mode === 'next'
            ? -dx / (rect.width * DRAG_DISTANCE_RATIO)
            : dx / (rect.width * DRAG_DISTANCE_RATIO);

        drag.progress = Math.max(0, Math.min(1, raw));
        setFlipProgress(drag.mode, drag.progress);
        e.preventDefault();
      };

      const onUp = () => {
        if (!drag.active) return;
        const mode = drag.mode;
        const progress = drag.progress;
        drag.active = false;

        if (progress >= FLIP_THRESHOLD) {
          finishFlip(mode, true);
        } else if (drag.moved) {
          finishFlip(mode, false);
        } else {
          resetFlipVisual();
        }
      };

      spread.addEventListener('pointerdown', onDown);
      spread.addEventListener('pointermove', onMove);
      spread.addEventListener('pointerup', onUp);
      spread.addEventListener('pointercancel', onUp);
      spread.addEventListener('lostpointercapture', onUp);
    }

    function goTo(nextIndex, animate = true) {
      if (busy) return;
      if (nextIndex === index) return;
      if (nextIndex < 0 || nextIndex >= pages.length) return;

      if (!animate) {
        index = nextIndex;
        paint();
        return;
      }

      const mode = nextIndex > index ? 'next' : 'prev';
      if (mode === 'next' && !canNext()) return;
      if (mode === 'prev' && !canPrev()) return;

      // solo un paso animado
      fillFlipContent(mode);
      drag.mode = mode;
      drag.progress = 0;
      setFlipProgress(mode, 0.02);
      requestAnimationFrame(() => finishFlip(mode, true));
    }

    function next() {
      goTo(index + 1, true);
    }

    function prev() {
      goTo(index - 1, true);
    }

    function getIndex() {
      return index;
    }

    function remount() {
      paint(true);
    }

    return { paint, next, prev, goTo, getIndex, remount, canNext, canPrev };
  }

  window.SOTTaleBook = { createTaleBook };
})();
