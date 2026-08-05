/* ============================================================
   BURNING BLADE FX — motor de efectos y microinteracciones
   Vanilla, sin dependencias. Respeta prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarseQuery = window.matchMedia('(hover: none), (pointer: coarse)');

  let reduced = motionQuery.matches;
  let coarse = coarseQuery.matches;

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  function layer(className, tag) {
    const el = document.createElement(tag || 'div');
    el.className = className;
    el.setAttribute('data-bb-layer', '');
    el.setAttribute('aria-hidden', 'true');
    return el;
  }

  /* ---------- Capas de ambiente ---------- */

  function mountAmbience() {
    const frag = document.createDocumentFragment();
    frag.appendChild(layer('bb-fx-layer bb-fog'));
    frag.appendChild(layer('bb-fx-layer bb-vignette'));
    document.body.prepend(frag);
  }

  /* ---------- Progreso de scroll + estado del header ---------- */

  function mountScrollProgress() {
    const bar = layer('bb-scroll-progress');
    document.body.appendChild(bar);

    let ticking = false;

    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      bar.style.transform = `scaleX(${ratio})`;
      document.body.classList.toggle('bb-scrolled', window.scrollY > 24);
      document.body.classList.toggle('bb-deep-scrolled', window.scrollY > window.innerHeight * 0.9);
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );

    update();
  }

  /* ---------- Volver arriba ---------- */

  function mountBackToTop() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bb-top';
    btn.setAttribute('data-bb-layer', '');
    btn.setAttribute(
      'aria-label',
      window.SOTI18n?.t?.('a11y.backToTop') || 'Volver arriba'
    );
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 19V5M5 12l7-7 7 7"/></svg>';

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });

    document.body.appendChild(btn);
  }

  /* ---------- Aura de brasa que sigue al puntero ---------- */

  function mountCursorGlow() {
    if (reduced || coarse) return;

    const glow = layer('bb-cursor-glow');
    document.body.appendChild(glow);

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let running = false;

    const frame = () => {
      x = lerp(x, targetX, 0.13);
      y = lerp(y, targetY, 0.13);
      glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(x - targetX) > 0.4 || Math.abs(y - targetY) > 0.4) {
        requestAnimationFrame(frame);
      } else {
        running = false;
      }
    };

    window.addEventListener(
      'pointermove',
      (event) => {
        if (event.pointerType !== 'mouse') return;
        targetX = event.clientX;
        targetY = event.clientY;
        document.body.classList.add('bb-pointer-active');
        if (!running) {
          running = true;
          requestAnimationFrame(frame);
        }
      },
      { passive: true }
    );

    document.addEventListener('mouseleave', () => {
      document.body.classList.remove('bb-pointer-active');
    });
  }

  /* ---------- Brasas y humo en canvas ---------- */

  function mountParticles() {
    if (reduced) return;

    const canvas = layer('bb-fx-layer', 'canvas');
    canvas.id = 'bb-particles';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const density = coarse ? 26 : 58;
    let dpr = 1;
    let width = 0;
    let height = 0;
    let embers = [];
    let smoke = [];
    let rafId = null;
    let last = 0;

    const rand = (min, max) => min + Math.random() * (max - min);

    function makeEmber(seed) {
      return {
        x: rand(0, width),
        y: seed ? rand(0, height) : height + rand(0, 90),
        r: rand(0.6, 2.3),
        vy: rand(0.16, 0.62),
        vx: rand(-0.22, 0.22),
        life: rand(0.35, 1),
        drift: rand(0.4, 1.9),
        phase: rand(0, Math.PI * 2),
        hot: Math.random() > 0.72,
      };
    }

    function makeSmoke(seed) {
      return {
        x: rand(-80, width + 80),
        y: seed ? rand(height * 0.35, height) : height + rand(40, 220),
        r: rand(90, 230),
        vy: rand(0.06, 0.2),
        vx: rand(-0.1, 0.14),
        alpha: rand(0.012, 0.045),
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      embers = Array.from({ length: density }, () => makeEmber(true));
      smoke = Array.from({ length: coarse ? 4 : 8 }, () => makeSmoke(true));
    }

    function draw(now) {
      rafId = requestAnimationFrame(draw);

      // ~40fps es suficiente y ahorra batería
      if (now - last < 24) return;
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;

      ctx.clearRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';

      for (const s of smoke) {
        s.y -= s.vy * dt;
        s.x += s.vx * dt;
        if (s.y + s.r < -40) Object.assign(s, makeSmoke(false));

        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        grad.addColorStop(0, `rgba(150, 120, 100, ${s.alpha})`);
        grad.addColorStop(1, 'rgba(120, 100, 90, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const e of embers) {
        e.y -= e.vy * dt;
        e.phase += 0.02 * dt;
        e.x += (e.vx + Math.sin(e.phase) * 0.28 * e.drift) * dt;

        if (e.y < -20 || e.x < -40 || e.x > width + 40) {
          Object.assign(e, makeEmber(false));
        }

        const flicker = 0.55 + Math.sin(e.phase * 2.4) * 0.45;
        const alpha = clamp(e.life * flicker, 0, 1) * 0.85;
        const glowR = e.r * 5.5;

        const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, glowR);
        if (e.hot) {
          grad.addColorStop(0, `rgba(255, 226, 170, ${alpha})`);
          grad.addColorStop(0.35, `rgba(255, 140, 45, ${alpha * 0.45})`);
        } else {
          grad.addColorStop(0, `rgba(255, 168, 80, ${alpha * 0.9})`);
          grad.addColorStop(0.35, `rgba(210, 80, 20, ${alpha * 0.32})`);
        }
        grad.addColorStop(1, 'rgba(150, 50, 10, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(e.x, e.y, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
    }

    function start() {
      if (rafId == null) {
        last = performance.now();
        rafId = requestAnimationFrame(draw);
      }
    }

    function stop() {
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    let resizeTimer = null;
    window.addEventListener(
      'resize',
      () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 180);
      },
      { passive: true }
    );

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    resize();
    start();
  }

  /* ---------- Parallax de ratón en el hero ---------- */

  function mountHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero || reduced || coarse) return;

    const targets = [
      { el: hero.querySelector('.hero-media'), depth: 12 },
      { el: hero.querySelector('.bb-hero-fog'), depth: 26 },
      { el: hero.querySelector('.bb-hero-ship'), depth: 40 },
      { el: hero.querySelector('.hero-content'), depth: -14 },
    ].filter((t) => t.el);

    if (!targets.length) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let running = false;

    const frame = () => {
      cx = lerp(cx, tx, 0.07);
      cy = lerp(cy, ty, 0.07);

      for (const t of targets) {
        t.el.style.setProperty('--px', `${(cx * t.depth).toFixed(2)}px`);
        t.el.style.setProperty('--py', `${(cy * t.depth).toFixed(2)}px`);
      }

      if (Math.abs(cx - tx) > 0.001 || Math.abs(cy - ty) > 0.001) {
        requestAnimationFrame(frame);
      } else {
        running = false;
      }
    };

    hero.addEventListener(
      'pointermove',
      (event) => {
        if (event.pointerType !== 'mouse') return;
        const rect = hero.getBoundingClientRect();
        tx = (event.clientX - rect.left) / rect.width - 0.5;
        ty = (event.clientY - rect.top) / rect.height - 0.5;
        if (!running) {
          running = true;
          requestAnimationFrame(frame);
        }
      },
      { passive: true }
    );

    hero.addEventListener('pointerleave', () => {
      tx = 0;
      ty = 0;
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    });

    // Parallax vertical al hacer scroll
    let ticking = false;
    const media = hero.querySelector('.hero-media');
    const content = hero.querySelector('.hero-content');

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y < window.innerHeight * 1.2) {
            const p = y / window.innerHeight;
            if (media) media.style.setProperty('--sy', `${(p * 90).toFixed(1)}px`);
            if (content) {
              content.style.setProperty('--sy', `${(p * 130).toFixed(1)}px`);
              content.style.opacity = String(clamp(1 - p * 1.5, 0, 1));
            }
          }
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* ---------- Tilt 3D + aura en tarjetas ---------- */

  function mountTilt(scope) {
    if (coarse) return;

    const cards = (scope || document).querySelectorAll(
      '.guide-tile, .news-item, .hook-item, .comm-card, .admin-card'
    );

    cards.forEach((card) => {
      if (card.dataset.bbTilt) return;
      card.dataset.bbTilt = '1';

      let raf = null;
      let rect = null;

      const onMove = (event) => {
        if (!rect) rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;

        // Aura que sigue al puntero (la usa el ::before en CSS)
        card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);

        if (reduced) return;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const rx = (0.5 - py) * 7;
          const ry = (px - 0.5) * 9;
          card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(
            2
          )}deg) translateY(-8px)`;
          raf = null;
        });
      };

      const onLeave = () => {
        rect = null;
        if (raf) {
          cancelAnimationFrame(raf);
          raf = null;
        }
        card.style.transform = '';
      };

      card.addEventListener('pointerenter', () => {
        rect = card.getBoundingClientRect();
      });
      card.addEventListener('pointermove', onMove, { passive: true });
      card.addEventListener('pointerleave', onLeave);
    });
  }

  /* ---------- Botones magnéticos ---------- */

  function mountMagnetic(scope) {
    if (reduced || coarse) return;

    (scope || document).querySelectorAll('.btn, .nav-search-btn').forEach((btn) => {
      if (btn.dataset.bbMag) return;
      btn.dataset.bbMag = '1';
      btn.classList.add('bb-magnetic');

      let raf = null;

      btn.addEventListener(
        'pointermove',
        (event) => {
          if (event.pointerType !== 'mouse') return;
          if (raf) return;
          raf = requestAnimationFrame(() => {
            const rect = btn.getBoundingClientRect();
            const dx = (event.clientX - (rect.left + rect.width / 2)) * 0.22;
            const dy = (event.clientY - (rect.top + rect.height / 2)) * 0.32;
            btn.style.transform = `translate(${dx.toFixed(1)}px, ${(dy - 3).toFixed(1)}px)`;
            raf = null;
          });
        },
        { passive: true }
      );

      btn.addEventListener('pointerleave', () => {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = null;
        }
        btn.style.transform = '';
      });
    });
  }

  /* ---------- Ondas al pulsar (delegado) ---------- */

  function mountRipple() {
    document.addEventListener(
      'pointerdown',
      (event) => {
        const btn = event.target.closest('.btn, .filter-btn, .auth-tab, .nav-search-btn');
        if (!btn || btn.disabled || reduced) return;

        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement('span');
        ripple.className = 'bb-ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

        if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
      },
      { passive: true }
    );
  }

  /* ---------- Apariciones al hacer scroll ---------- */

  const revealObserver =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            });
          },
          { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
        )
      : null;

  function autoReveal(scope) {
    const root = scope || document;

    // Secciones y rejillas obtienen reveal sin tocar el HTML
    root
      .querySelectorAll('.section-head, .discord-banner, .alert-strip-inner, .walk-step, .panel')
      .forEach((el) => el.classList.add('reveal-on-scroll'));

    root
      .querySelectorAll('.guide-grid, .news-grid, .hook-grid, .comm-grid')
      .forEach((grid) => {
        grid.classList.add('bb-stagger');
        Array.from(grid.children).forEach((child, i) => {
          child.style.setProperty('--bb-i', String(Math.min(i, 12)));
        });
      });

    const targets = root.querySelectorAll('.reveal-on-scroll:not(.is-visible), .bb-stagger:not(.is-visible)');

    if (reduced || !revealObserver) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    targets.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Transición entre páginas ---------- */

  function mountPageTransition() {
    const veil = layer('bb-page-veil');
    document.body.appendChild(veil);

    if (reduced) return;

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }
      if (link.target && link.target !== '_self') return;
      if (link.hasAttribute('download')) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      event.preventDefault();
      document.body.classList.add('bb-leaving');
      setTimeout(() => {
        window.location.href = url.href;
      }, 340);
    });

    // Al volver con el botón atrás, retiramos el velo
    window.addEventListener('pageshow', () => {
      document.body.classList.remove('bb-leaving');
    });
  }

  /* ---------- Skeletons ---------- */

  function skeletonCards(container, count) {
    if (!container) return;
    container.innerHTML = Array.from(
      { length: count || 3 },
      () =>
        '<div class="bb-skeleton-card">' +
        '<div class="bb-skeleton bb-skeleton-line sm"></div>' +
        '<div class="bb-skeleton bb-skeleton-line lg"></div>' +
        '<div class="bb-skeleton bb-skeleton-line"></div>' +
        '<div class="bb-skeleton bb-skeleton-line"></div>' +
        '<div class="bb-skeleton bb-skeleton-line sm"></div>' +
        '</div>'
    ).join('');
  }

  /* ---------- Contadores animados ---------- */

  function animateCount(el, to, duration) {
    if (reduced) {
      el.textContent = String(to);
      return;
    }
    const start = performance.now();
    const from = Number(el.textContent.replace(/\D/g, '')) || 0;
    const total = duration || 900;

    const step = (now) => {
      const p = clamp((now - start) / total, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(lerp(from, to, eased)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Refresco tras render dinámico ---------- */

  function refresh(scope) {
    autoReveal(scope);
    mountTilt(scope);
    mountMagnetic(scope);
  }

  /* Los renders del sitio son asíncronos: observamos el DOM y refrescamos */
  function watchDynamicContent() {
    const hosts = ['#home-guides', '#home-news', '#guides-list', '#guide-body', '#cms-body'];
    const observer = new MutationObserver(() => {
      clearTimeout(watchDynamicContent._t);
      watchDynamicContent._t = setTimeout(() => refresh(document), 60);
    });

    hosts.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) observer.observe(el, { childList: true });
    });
  }

  /* ---------- Arranque ---------- */

  function init() {
    mountAmbience();
    mountScrollProgress();
    mountBackToTop();
    mountParticles();
    mountCursorGlow();
    mountHeroParallax();
    mountRipple();
    mountPageTransition();
    refresh(document);
    watchDynamicContent();
  }

  motionQuery.addEventListener?.('change', (event) => {
    reduced = event.matches;
  });
  coarseQuery.addEventListener?.('change', (event) => {
    coarse = event.matches;
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.SOTFx = {
    refresh,
    skeletonCards,
    animateCount,
    autoReveal,
    mountTilt,
    mountMagnetic,
  };
})();
