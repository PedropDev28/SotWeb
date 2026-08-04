document.addEventListener('DOMContentLoaded', async () => {
  const session = SOTAuth.requireAuth('auth.html');
  if (!session) return;

  const t = (key, vars) => window.SOTI18n?.t(key, vars) ?? key;
  const locale = window.SOTI18n?.getLocale?.() || 'es';
  const esc = (s) => SOTGuides.escapeHtml(String(s ?? ''));

  const profile = document.getElementById('profile-panel');
  const pirateRoot = document.getElementById('pirate-profile');
  const statsRow = document.getElementById('stats-row');
  const list = document.getElementById('account-guides');
  if (!profile || !pirateRoot || !statsRow || !list) return;

  const initial = (session.name || '?').trim().charAt(0).toUpperCase();
  const providerLabel =
    session.provider === 'google'
      ? t('account.providerGoogle')
      : t('account.providerLocal');

  profile.innerHTML = `
    <div class="user-chip" style="margin-bottom: 1.25rem;">
      <div class="avatar">
        ${
          session.avatar
            ? `<img src="${esc(session.avatar)}" alt="">`
            : initial
        }
      </div>
      <div>
        <strong style="display:block; font-family: var(--font-display);">${esc(
          session.name
        )}</strong>
        <span style="opacity:.7; font-size:.9rem;">${esc(session.email)}</span>
      </div>
    </div>
    <p style="margin-bottom: 1rem; opacity:.75;">
      ${esc(t('account.access', { provider: providerLabel }))}
    </p>
    <a class="btn btn-block" href="guias.html">${esc(t('account.followGuides'))}</a>
    <button class="btn btn-ghost btn-block" type="button" id="logout-btn" style="margin-top:.75rem;">
      ${esc(t('account.logout'))}
    </button>
  `;

  document.getElementById('logout-btn').addEventListener('click', () => {
    SOTAuth.logout();
    window.location.href = 'index.html';
  });

  function renderConnectForm(errorMsg) {
    const hasSessionRat = !!SOTPirate.getSessionRat(session.id);
    pirateRoot.innerHTML = `
      <div class="pirate-connect panel">
        <div class="pirate-connect-head">
          <h2>${esc(t('sot.heading'))}</h2>
          <p>${esc(t('sot.lead'))}</p>
        </div>

        <div class="pirate-warning" role="note">
          <strong>${esc(t('sot.warningTitle'))}</strong>
          <p>${esc(t('sot.warningBody'))}</p>
        </div>

        <ol class="pirate-steps">
          <li data-i18n-html>${t('sot.step1')}</li>
          <li>${esc(t('sot.step2'))}</li>
          <li>${esc(t('sot.step3'))}</li>
        </ol>

        <form id="sot-connect-form" class="pirate-form" autocomplete="off">
          <div class="form-group">
            <label for="sot-gamertag">${esc(t('sot.gamertag'))}</label>
            <input id="sot-gamertag" name="gamertag" type="text" maxlength="64"
              placeholder="${esc(t('sot.gamertagPh'))}" spellcheck="false">
          </div>
          <div class="form-group">
            <label for="sot-rat">${esc(t('sot.ratLabel'))}</label>
            <textarea id="sot-rat" name="rat" rows="3" required
              placeholder="${esc(t('sot.ratPh'))}" spellcheck="false"
              autocomplete="off"></textarea>
          </div>
          <label class="pirate-check">
            <input type="checkbox" id="sot-remember" ${hasSessionRat ? 'checked' : ''}>
            <span>${esc(t('sot.remember'))}</span>
          </label>
          ${
            errorMsg
              ? `<p class="form-msg error" role="alert">${esc(errorMsg)}</p>`
              : ''
          }
          <p class="form-msg" id="sot-form-status" hidden></p>
          <button class="btn btn-block" type="submit" id="sot-submit">
            ${esc(t('sot.connect'))}
          </button>
        </form>
      </div>
    `;

    // Apply HTML step with link
    const step1 = pirateRoot.querySelector('.pirate-steps li');
    if (step1) {
      step1.innerHTML = t('sot.step1');
    }

    const form = document.getElementById('sot-connect-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('sot-submit');
      const status = document.getElementById('sot-form-status');
      const rat = document.getElementById('sot-rat').value.trim();
      const gamertag = document.getElementById('sot-gamertag').value.trim();
      const rememberSession = document.getElementById('sot-remember').checked;

      btn.disabled = true;
      btn.textContent = t('sot.connecting');
      status.hidden = true;

      try {
        await SOTPirate.connect(session.id, { rat, gamertag, rememberSession });
        document.getElementById('sot-rat').value = '';
        renderPirate();
      } catch (err) {
        status.hidden = false;
        status.className = 'form-msg error';
        status.textContent = err?.message || t('sot.error');
        btn.disabled = false;
        btn.textContent = t('sot.connect');
      }
    });
  }

  function currencyCard(label, value, tone) {
    return `
      <div class="pirate-currency ${tone}">
        <span>${esc(label)}</span>
        <strong>${esc(SOTPirate.formatNumber(value, locale))}</strong>
      </div>
    `;
  }

  function groupStats(stats) {
    const map = new Map();
    (stats || []).forEach((s) => {
      const g = s.group || 'other';
      if (!map.has(g)) {
        map.set(g, {
          id: g,
          title: locale === 'en' ? s.groupEn || g : s.groupEs || g,
          items: [],
        });
      }
      map.get(g).items.push(s);
    });
    return [...map.values()];
  }

  function renderPirateCard(entry) {
    const p = entry.profile;
    const name = p.gamertag || session.name;
    const title = p.title || t('sot.noTitle');
    const synced = SOTPirate.relativeTime(entry.syncedAt, locale);
    const canRefresh = !!SOTPirate.getSessionRat(session.id);
    const statGroups = groupStats(p.stats);
    const featuredKeys = new Set([
      'Combat_Ships_Sunk',
      'Combat_Kraken_Defeated',
      'Player_TinyShark_Spawned',
      'Chests_HandedIn_Total',
      'Voyages_MetresSailed_Total',
      'Vomited_Total',
    ]);
    const featured = (p.stats || []).filter((s) => featuredKeys.has(s.key)).slice(0, 6);

    const companies = (p.companies || [])
      .map((c) => {
        const pct = c.progress != null ? Math.max(0, Math.min(100, c.progress)) : 0;
        const level =
          c.level != null ? `${t('sot.level')} ${c.level}` : t('sot.noLevel');
        const extras = [];
        if (c.titlesTotal != null) {
          extras.push(`${c.titlesUnlocked ?? 0}/${c.titlesTotal} ${t('sot.titles')}`);
        }
        if (c.itemsTotal != null) {
          extras.push(`${c.itemsUnlocked ?? 0}/${c.itemsTotal} ${t('sot.items')}`);
        }
        return `
          <div class="pirate-company">
            <div class="pirate-company-top">
              <strong>${esc(SOTPirate.companyName(c, locale))}</strong>
              <span>${esc(level)}${c.rank ? ` · ${esc(c.rank)}` : ''}</span>
            </div>
            <div class="pirate-meter" aria-hidden="true">
              <i style="width:${pct}%"></i>
            </div>
            <div class="pirate-company-meta">
              ${
                c.progress != null
                  ? `<span>${esc(String(c.progress))}%</span>`
                  : '<span></span>'
              }
              ${
                c.emblemsTotal != null
                  ? `<span>${esc(c.emblemsUnlocked ?? 0)}/${esc(
                      c.emblemsTotal
                    )} ${esc(t('sot.emblems'))}</span>`
                  : ''
              }
            </div>
            ${
              extras.length
                ? `<p class="pirate-company-extras">${esc(extras.join(' · '))}</p>`
                : ''
            }
          </div>
        `;
      })
      .join('');

    const featuredHtml = featured
      .map(
        (s) => `
        <div class="stat">
          <strong>${esc(SOTPirate.formatNumber(s.value, locale))}</strong>
          <span>${esc(SOTPirate.statLabel(s, locale))}</span>
        </div>
      `
      )
      .join('');

    const allStatsHtml = statGroups
      .map((group) => {
        const cards = group.items
          .map(
            (s) => `
            <div class="stat">
              <strong>${esc(SOTPirate.formatNumber(s.value, locale))}</strong>
              <span>${esc(SOTPirate.statLabel(s, locale))}</span>
            </div>
          `
          )
          .join('');
        return `
          <div class="pirate-stat-group">
            <h4>${esc(group.title)} <small>(${group.items.length})</small></h4>
            <div class="stat-row pirate-stat-row">${cards}</div>
          </div>
        `;
      })
      .join('');

    const alignments = p.captaincy?.pirateAlignments || [];
    const milestonesHtml = alignments.length
      ? alignments
          .map((a) => {
            const top = (a.accolades || [])
              .slice()
              .sort((x, y) => (y.level || 0) - (x.level || 0))
              .slice(0, 4)
              .map(
                (acc) => `
                <li>
                  <span>${esc(acc.title)}</span>
                  <strong>${esc(t('sot.milestoneLevel', { n: acc.level }))}</strong>
                </li>
              `
              )
              .join('');
            return `
              <div class="pirate-alignment">
                <div class="pirate-alignment-top">
                  <strong>${esc(a.title || a.id)}</strong>
                  <span>${esc(t('sot.milestonesSum', { n: a.milestoneSum }))}</span>
                </div>
                ${top ? `<ul class="pirate-accolade-list">${top}</ul>` : ''}
              </div>
            `;
          })
          .join('')
      : `<p class="empty-state">${esc(t('sot.noCaptaincy'))}</p>`;

    const shipsHtml = (p.captaincy?.ships || []).length
      ? (p.captaincy.ships || [])
          .map((ship) => {
            const shipMs = (ship.alignments || []).reduce(
              (sum, a) => sum + (a.milestoneSum || 0),
              0
            );
            return `
              <div class="pirate-ship">
                <strong>${esc(ship.name || t('sot.unnamedShip'))}</strong>
                <span>${esc(ship.type || '—')} · ${esc(
                  t('sot.milestonesSum', { n: shipMs })
                )}</span>
              </div>
            `;
          })
          .join('')
      : `<p class="empty-state">${esc(t('sot.noShips'))}</p>`;

    const guildsHtml = (p.guilds || []).length
      ? (p.guilds || [])
          .map(
            (g) => `
            <div class="pirate-guild">
              <strong>${esc(g.name)}</strong>
              <span>${
                g.level != null ? `${esc(t('sot.level'))} ${esc(g.level)}` : ''
              }${g.members != null ? ` · ${esc(g.members)} ${esc(t('sot.members'))}` : ''}</span>
            </div>
          `
          )
          .join('')
      : `<p class="empty-state">${esc(t('sot.noGuilds'))}</p>`;

    const ach = p.achievements
      ? `${SOTPirate.formatNumber(p.achievements.completed, locale)} / ${SOTPirate.formatNumber(
          p.achievements.total,
          locale
        )}`
      : '—';

    const season = p.season
      ? `
        <div class="pirate-season">
          <div>
            <strong>${esc(p.season.title || t('sot.season'))}</strong>
            <span>${esc(t('sot.tier'))} ${esc(
              p.season.tier != null ? p.season.tier : '—'
            )}</span>
          </div>
          ${
            p.season.levelProgress != null
              ? `<div class="pirate-meter"><i style="width:${Math.round(
                  Math.max(0, Math.min(1, p.season.levelProgress)) * 100
                )}%"></i></div>`
              : ''
          }
        </div>
      `
      : '';

    const statsCount = (p.stats || []).length;

    pirateRoot.innerHTML = `
      <div class="pirate-card">
        <div class="pirate-hero">
          <div class="pirate-avatar">
            ${
              p.avatar
                ? `<img src="${esc(p.avatar)}" alt="">`
                : `<span>${esc((name || '?').charAt(0).toUpperCase())}</span>`
            }
          </div>
          <div class="pirate-hero-text">
            <p class="pirate-kicker">${esc(t('sot.liveBadge'))}</p>
            <h2>${esc(name)}</h2>
            <p class="pirate-title">${esc(title)}</p>
            <p class="pirate-synced">${esc(t('sot.synced', { time: synced }))}
              · ${esc(t('sot.statsCount', { n: statsCount }))}</p>
          </div>
          <div class="pirate-actions">
            ${
              canRefresh
                ? `<button type="button" class="btn btn-ghost" id="sot-refresh">${esc(
                    t('sot.refresh')
                  )}</button>`
                : ''
            }
            <button type="button" class="btn btn-ghost" id="sot-reconnect">${esc(
              t('sot.reconnect')
            )}</button>
            <button type="button" class="btn btn-ghost" id="sot-disconnect">${esc(
              t('sot.disconnect')
            )}</button>
          </div>
        </div>

        <div class="pirate-currencies">
          ${currencyCard(t('sot.gold'), p.currencies?.gold, 'is-gold')}
          ${currencyCard(t('sot.doubloons'), p.currencies?.doubloons, 'is-doubloon')}
          ${currencyCard(
            t('sot.ancientCoins'),
            p.currencies?.ancientCoins,
            'is-ancient'
          )}
          <div class="pirate-currency is-ach">
            <span>${esc(t('sot.achievements'))}</span>
            <strong>${esc(ach)}</strong>
          </div>
        </div>

        ${season}

        <div class="pirate-tabs" role="tablist">
          <button type="button" class="pirate-tab is-active" data-tab="companies">${esc(
            t('sot.companies')
          )}</button>
          <button type="button" class="pirate-tab" data-tab="stats">${esc(
            t('sot.allStats')
          )}</button>
          <button type="button" class="pirate-tab" data-tab="captaincy">${esc(
            t('sot.captaincy')
          )}</button>
          <button type="button" class="pirate-tab" data-tab="ships">${esc(
            t('sot.ships')
          )}</button>
          <button type="button" class="pirate-tab" data-tab="guilds">${esc(
            t('sot.guilds')
          )}</button>
        </div>

        <div class="pirate-tab-panel is-active" data-panel="companies">
          <div class="pirate-companies">
            ${companies || `<p class="empty-state">${esc(t('sot.noCompanies'))}</p>`}
          </div>
        </div>

        <div class="pirate-tab-panel" data-panel="stats">
          ${
            featuredHtml
              ? `<div class="pirate-section">
                  <h3>${esc(t('sot.highlights'))}</h3>
                  <div class="stat-row pirate-stat-row">${featuredHtml}</div>
                </div>`
              : ''
          }
          <div class="pirate-section">
            <h3>${esc(t('sot.allStats'))}</h3>
            ${
              allStatsHtml ||
              `<p class="empty-state">${esc(t('sot.noStats'))}</p>`
            }
          </div>
        </div>

        <div class="pirate-tab-panel" data-panel="captaincy">
          <div class="pirate-alignments">${milestonesHtml}</div>
        </div>

        <div class="pirate-tab-panel" data-panel="ships">
          <div class="pirate-ships">${shipsHtml}</div>
        </div>

        <div class="pirate-tab-panel" data-panel="guilds">
          <div class="pirate-guilds">${guildsHtml}</div>
        </div>
      </div>
    `;

    pirateRoot.querySelectorAll('.pirate-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        pirateRoot
          .querySelectorAll('.pirate-tab')
          .forEach((b) => b.classList.toggle('is-active', b === btn));
        pirateRoot.querySelectorAll('.pirate-tab-panel').forEach((panel) => {
          panel.classList.toggle(
            'is-active',
            panel.getAttribute('data-panel') === tab
          );
        });
      });
    });

    document.getElementById('sot-disconnect')?.addEventListener('click', () => {
      SOTPirate.clearSnapshot(session.id);
      renderConnectForm();
    });

    document.getElementById('sot-reconnect')?.addEventListener('click', () => {
      renderConnectForm();
      const g = document.getElementById('sot-gamertag');
      if (g && p.gamertag) g.value = p.gamertag;
    });

    document.getElementById('sot-refresh')?.addEventListener('click', async () => {
      const btn = document.getElementById('sot-refresh');
      btn.disabled = true;
      btn.textContent = t('sot.connecting');
      try {
        await SOTPirate.refresh(session.id, { gamertag: p.gamertag });
        renderPirate();
      } catch (err) {
        renderConnectForm(err?.message || t('sot.error'));
      }
    });
  }

  function renderPirate() {
    const entry = SOTPirate.getSnapshot(session.id);
    if (entry?.profile) renderPirateCard(entry);
    else renderConnectForm();
  }

  renderPirate();

  try {
    const guides = (await SOTGuides.loadGuides()).filter(
      (g) => g.category !== 'Plantillas'
    );
    const overall = SOTProgress.getOverallStats(session.id, guides);

    statsRow.innerHTML = `
      <div class="stat"><strong>${overall.percent}%</strong><span>${esc(
        t('account.totalProgress')
      )}</span></div>
      <div class="stat"><strong>${overall.guidesStarted}</strong><span>${esc(
        t('account.started')
      )}</span></div>
      <div class="stat"><strong>${overall.guidesCompleted}</strong><span>${esc(
        t('account.completed')
      )}</span></div>
    `;

    const started = guides
      .map((g) => ({ guide: g, stats: SOTProgress.getGuideStats(session.id, g) }))
      .filter((x) => x.stats.done > 0)
      .sort((a, b) => b.stats.percent - a.stats.percent);

    if (!started.length) {
      list.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          ${esc(t('account.empty'))}
          <p style="margin-top:1rem;"><a class="btn" href="guias.html">${esc(
            t('account.goGuides')
          )}</a></p>
        </div>
      `;
      return;
    }

    list.innerHTML = started
      .map(({ guide, stats }) => SOTGuides.renderGuideCard(guide, stats))
      .join('');
  } catch {
    list.innerHTML = `<div class="empty-state">${esc(t('account.error'))}</div>`;
  }
});
