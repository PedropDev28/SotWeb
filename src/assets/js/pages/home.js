document.addEventListener('DOMContentLoaded', async () => {
  const t = (key) => window.SOTI18n?.t?.(key) ?? key;

  const embers = document.getElementById('hero-embers');
  if (embers) {
    embers.innerHTML = Array.from({ length: 18 }, () => {
      const left = Math.round(Math.random() * 100);
      const delay = (Math.random() * 6).toFixed(1);
      const duration = (5 + Math.random() * 7).toFixed(1);
      const size = 2 + Math.round(Math.random() * 4);
      return `<span style="left:${left}%;width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${duration}s"></span>`;
    }).join('');
  }

  async function renderNews() {
    const newsMount = document.getElementById('home-news');
    if (!newsMount) return;
    window.SOTFx?.skeletonCards(newsMount, 3);
    try {
      window.SOTNews?.clearCache?.();
      window.SOTNews?.syncOfficialHubLinks?.();
      const news = await SOTNews.loadNews();
      newsMount.innerHTML = news.map((item) => SOTNews.renderNewsItem(item)).join('');
    } catch {
      newsMount.innerHTML = `<div class="empty-state">${t('home.newsError')}</div>`;
    }
  }

  await renderNews();
  window.addEventListener('sot:localechange', () => {
    renderNews();
  });

  const mount = document.getElementById('home-guides');
  if (!mount) return;
  window.SOTFx?.skeletonCards(mount, 3);

  try {
    const guides = (await SOTGuides.loadGuides())
      .filter((g) => g.category !== 'Plantillas')
      .slice(0, 3);
    const session = SOTAuth.getSession();
    mount.innerHTML = guides
      .map((g) => {
        const stats = session
          ? SOTProgress.getGuideStats(session.id, g)
          : { percent: 0 };
        return SOTGuides.renderGuideCard(g, stats);
      })
      .join('');
  } catch {
    mount.innerHTML = `<div class="empty-state">${t('home.guidesError')}</div>`;
  }
});
