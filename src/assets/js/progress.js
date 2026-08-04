(function () {
  const PROGRESS_KEY = 'sot_progress';

  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function writeAll(data) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  }

  function getUserProgress(userId) {
    const all = readAll();
    return all[userId] || {};
  }

  function setChecked(userId, guideId, itemId, checked) {
    const all = readAll();
    if (!all[userId]) all[userId] = {};
    if (!all[userId][guideId]) all[userId][guideId] = { checked: {} };
    all[userId][guideId].checked[itemId] = !!checked;
    all[userId][guideId].updatedAt = new Date().toISOString();
    writeAll(all);
    return all[userId][guideId];
  }

  function getGuideProgress(userId, guideId) {
    return getUserProgress(userId)[guideId] || { checked: {} };
  }

  function getGuideStats(userId, guide) {
    const items = guide.checklist || [];
    const progress = getGuideProgress(userId, guide.id);
    const done = items.filter((item) => progress.checked?.[item.id]).length;
    const total = items.length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    return { done, total, percent };
  }

  function getOverallStats(userId, guides) {
    let done = 0;
    let total = 0;
    let guidesStarted = 0;
    let guidesCompleted = 0;

    guides.forEach((guide) => {
      const stats = getGuideStats(userId, guide);
      done += stats.done;
      total += stats.total;
      if (stats.done > 0) guidesStarted += 1;
      if (stats.total > 0 && stats.done === stats.total) guidesCompleted += 1;
    });

    return {
      done,
      total,
      percent: total ? Math.round((done / total) * 100) : 0,
      guidesStarted,
      guidesCompleted,
    };
  }

  window.SOTProgress = {
    getUserProgress,
    getGuideProgress,
    setChecked,
    getGuideStats,
    getOverallStats,
  };
})();
