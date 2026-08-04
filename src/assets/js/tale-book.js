(function () {
  const FLIP_MS = 900;
  const FLIP_EASE = 'cubic-bezier(0.645, 0.045, 0.355, 1)';
  const DRAG_RATIO = 0.45;
  const THRESHOLD = 0.28;

  function createTaleBook(options) {
    const { root, pages, renderSide, onPageChange, renderExtras } = options;
    let index = 0;
    let busy = false;
    let sheets = [];

    const drag = {
      active: false,
      startX: 0,
      mode: null,
      progress: 0,
      moved: false,
      sheet: null,
    };

    function canNext() {
      return index < pages.length - 1;
    }

    function canPrev() {
      return index > 0;
    }

    function updateChrome() {
      const indicator = root.querySelector('[data-page-indicator]');
      if (indicator) {
        indicator.textContent = `Hoja ${index + 1} / ${pages.length}`;
      }
      const prevBtn = root.querySelector('#prev-page');
      const nextBtn = root.querySelector('#next-page');
      if (prevBtn) prevBtn.disabled = !canPrev() || busy;
      if (nextBtn) nextBtn.disabled = !canNext() || busy;
    }

    function setSheetZ(sheetEl, i, flipped) {
      // Como en el pen: sin voltear, las primeras quedan arriba;
      // al voltear, el orden se invierte para apilar a la izquierda.
      sheetEl.style.zIndex = String(flipped ? i + 1 : pages.length - i);
    }

    function applyFlipState(animated) {
      sheets.forEach((sheetEl, i) => {
        const flipped = i < index;
        sheetEl.classList.toggle('is-flipped', flipped);
        setSheetZ(sheetEl, i, flipped);
        if (!animated) {
          sheetEl.style.transition = 'none';
          sheetEl.style.transform = flipped ? 'rotateY(-180deg)' : 'rotateY(0deg)';
          // force reflow then restore transition
          void sheetEl.offsetWidth;
          sheetEl.style.transition = '';
        } else {
          sheetEl.style.transition = `transform ${FLIP_MS}ms ${FLIP_EASE}`;
          sheetEl.style.transform = flipped ? 'rotateY(-180deg)' : 'rotateY(0deg)';
        }
      });
    }

    function paint() {
      const bookHost = root.querySelector('[data-tale-book-host]');
      if (!bookHost) return;

      const first = pages[0];

      const sheetsHtml = pages
        .map((page, i) => {
          const next = pages[i + 1];
          const frontNum = i * 2 + 2;
          const backNum = next ? i * 2 + 3 : '';
          const backContent = next
            ? renderSide(next.left, { pageNum: backNum })
            : `<div class="tale-page-inner"><p class="tale-cover-quote">Fin del relato</p></div>`;

          return `
            <div class="book-sheet" data-sheet="${i}">
              <div class="book-face book-face-front">
                <div class="tale-page">
                  <span class="tale-corner tale-corner-tr" aria-hidden="true"></span>
                  <span class="tale-corner tale-corner-br" aria-hidden="true"></span>
                  ${renderSide(page.right, {
                    pageNum: frontNum,
                    checklistId: i === pages.length - 1 ? 'checklist' : `checklist-${i}`,
                  })}
                </div>
              </div>
              <div class="book-face book-face-back">
                <div class="tale-page">
                  <span class="tale-corner tale-corner-tl" aria-hidden="true"></span>
                  <span class="tale-corner tale-corner-bl" aria-hidden="true"></span>
                  ${backContent}
                </div>
              </div>
            </div>
          `;
        })
        .join('');

      bookHost.innerHTML = `
        <div class="tale-book" aria-label="Libro del Gran Relato">
          <span class="tale-metal tale-metal-tl" aria-hidden="true"></span>
          <span class="tale-metal tale-metal-tr" aria-hidden="true"></span>
          <span class="tale-metal tale-metal-bl" aria-hidden="true"></span>
          <span class="tale-metal tale-metal-br" aria-hidden="true"></span>
          <div class="book" id="tale-book">
            <div class="book-left">
              <div class="tale-page">
                <span class="tale-corner tale-corner-tl" aria-hidden="true"></span>
                <span class="tale-corner tale-corner-bl" aria-hidden="true"></span>
                ${renderSide(first.left, { pageNum: 1 })}
              </div>
            </div>
            <div class="book-right">
              ${sheetsHtml}
            </div>
            <div class="tale-drag-hint" data-drag-hint>
              Arrastra la hoja como en el juego
            </div>
          </div>
        </div>
      `;

      sheets = [...bookHost.querySelectorAll('.book-sheet')];
      applyFlipState(false);
      updateChrome();
      bindDrag(bookHost.querySelector('#tale-book'));
      renderExtras?.(index);
      onPageChange?.(index);
    }

    function goTo(nextIndex, animated = true) {
      if (busy) return;
      if (nextIndex < 0 || nextIndex >= pages.length) return;
      if (nextIndex === index) return;

      const step = nextIndex > index ? 1 : -1;
      // Un paso cada vez (como el pen)
      const target = index + step;
      busy = true;
      index = target;
      updateChrome();
      applyFlipState(animated);

      window.setTimeout(() => {
        busy = false;
        updateChrome();
        renderExtras?.(index);
        onPageChange?.(index);
      }, animated ? FLIP_MS + 40 : 0);
    }

    function next() {
      goTo(index + 1, true);
    }

    function prev() {
      goTo(index - 1, true);
    }

    function bindDrag(bookEl) {
      if (!bookEl) return;

      const onDown = (e) => {
        if (busy) return;
        if (e.target.closest('input, label, a, button, .checklist')) return;
        if (e.button != null && e.button !== 0) return;

        const rect = bookEl.getBoundingClientRect();
        const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
        const fromRight = x >= rect.width / 2;

        if (fromRight && !canNext()) return;
        if (!fromRight && !canPrev()) return;

        // Hoja activa: la siguiente a voltear (derecha) o la última volteada (izquierda)
        const sheetIndex = fromRight ? index : index - 1;
        const sheet = sheets[sheetIndex];
        if (!sheet) return;

        drag.active = true;
        drag.startX = e.clientX ?? e.touches?.[0]?.clientX;
        drag.mode = fromRight ? 'next' : 'prev';
        drag.progress = 0;
        drag.moved = false;
        drag.sheet = sheet;

        sheet.style.transition = 'none';
        sheet.classList.add('is-dragging');
        // Durante el drag, la hoja debe estar encima
        sheet.style.zIndex = String(pages.length + 5);

        bookEl.classList.add('is-flipping');
        bookEl.querySelector('[data-drag-hint]')?.classList.add('hidden-hint');

        try {
          bookEl.setPointerCapture?.(e.pointerId);
        } catch {
          /* ignore */
        }
        e.preventDefault();
      };

      const onMove = (e) => {
        if (!drag.active || !drag.sheet) return;
        const clientX = e.clientX ?? e.touches?.[0]?.clientX;
        if (clientX == null) return;

        const rect = bookEl.getBoundingClientRect();
        const dx = clientX - drag.startX;
        if (Math.abs(dx) > 4) drag.moved = true;

        let raw =
          drag.mode === 'next'
            ? -dx / (rect.width * DRAG_RATIO)
            : dx / (rect.width * DRAG_RATIO);
        drag.progress = Math.max(0, Math.min(1, raw));

        // next: 0 → -180; prev: -180 → 0
        const angle =
          drag.mode === 'next'
            ? -180 * drag.progress
            : -180 + 180 * drag.progress;

        drag.sheet.style.transform = `rotateY(${angle}deg)`;
        e.preventDefault();
      };

      const onUp = () => {
        if (!drag.active || !drag.sheet) return;
        const sheet = drag.sheet;
        const mode = drag.mode;
        const progress = drag.progress;
        const moved = drag.moved;

        drag.active = false;
        drag.sheet = null;
        sheet.classList.remove('is-dragging');
        bookEl.classList.remove('is-flipping');
        bookEl.querySelector('[data-drag-hint]')?.classList.remove('hidden-hint');

        if (!moved) {
          applyFlipState(false);
          return;
        }

        const complete = progress >= THRESHOLD;
        sheet.style.transition = `transform ${FLIP_MS}ms ${FLIP_EASE}`;

        if (complete) {
          busy = true;
          if (mode === 'next') index += 1;
          else index -= 1;
          sheet.classList.toggle('is-flipped', mode === 'next');
          sheet.style.transform =
            mode === 'next' ? 'rotateY(-180deg)' : 'rotateY(0deg)';
          updateChrome();

          window.setTimeout(() => {
            applyFlipState(false);
            busy = false;
            updateChrome();
            renderExtras?.(index);
            onPageChange?.(index);
          }, FLIP_MS + 40);
        } else {
          // snap back
          sheet.style.transform =
            mode === 'next' ? 'rotateY(0deg)' : 'rotateY(-180deg)';
          window.setTimeout(() => {
            applyFlipState(false);
          }, FLIP_MS + 40);
        }
      };

      bookEl.addEventListener('pointerdown', onDown);
      bookEl.addEventListener('pointermove', onMove);
      bookEl.addEventListener('pointerup', onUp);
      bookEl.addEventListener('pointercancel', onUp);
      bookEl.addEventListener('lostpointercapture', onUp);
    }

    return {
      paint,
      next,
      prev,
      goTo,
      getIndex: () => index,
      canNext,
      canPrev,
    };
  }

  window.SOTTaleBook = { createTaleBook };
})();
