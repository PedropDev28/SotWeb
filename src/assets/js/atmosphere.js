(function () {
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function spawnEmbers(host, count = 14) {
    if (!host || REDUCED) return;
    host.innerHTML = Array.from({ length: count }, (_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 6;
      const duration = 5 + Math.random() * 7;
      const size = 2 + Math.random() * 4;
      return `<span class="ember-particle" style="--x:${left}%;--d:${delay}s;--t:${duration}s;--s:${size}px;--i:${i}"></span>`;
    }).join('');
  }

  function ensureAtmosphere() {
    if (document.querySelector('.site-embers')) return;
    const layer = document.createElement('div');
    layer.className = 'site-embers';
    layer.setAttribute('aria-hidden', 'true');
    document.body.prepend(layer);
    spawnEmbers(layer, 16);
  }

  function observeReveals(scope = document) {
    if (REDUCED) {
      scope.querySelectorAll('.reveal-on-scroll').forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const els = scope.querySelectorAll('.reveal-on-scroll');
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
  }

  function swayBrand() {
    if (REDUCED) return;
    document.querySelector('.brand-logo')?.classList.add('logo-sway');
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureAtmosphere();
    swayBrand();
    observeReveals(document);
  });

  window.SOTAtmosphere = {
    observeReveals,
    spawnEmbers,
  };
})();
