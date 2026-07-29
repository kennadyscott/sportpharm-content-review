/* =============================================================================
   SportPharm HQ — Campaigns

   This module does NOT reimplement campaign review. The Content Studio already
   exists, it holds all eleven briefs and sixty-four assets, it carries Brandon
   and Jessie's comment threads, approvals, weekly calendars and ROI tables, and
   it talks to its own Supabase project. Rebuilding it here would have thrown
   that away.

   So HQ mounts it. campaigns/index.html is the Studio, served from the same
   origin as HQ, and this module is the index in front of it plus the frame it
   opens in. Deep links still work — the Studio's own ?c=<id> is what focuses a
   single campaign, exactly as it does when the link is shared on its own.
============================================================================= */
(() => {
  'use strict';
  const { esc, svg, toast, copy, go } = HQ;

  const STUDIO = 'campaigns/index.html';
  const PUBLIC = 'https://kennadyscott.github.io/sportpharm-content-review/';

  const totals = () => ({
    campaigns: Store.campaigns().length,
    assets: Store.campaigns().reduce((n, c) => n + c.assets, 0)
  });

  /* ------------------------------- the index ----------------------------- */
  function index() {
    const t = totals();
    const cs = Store.campaigns();
    return `<div class="wrap">
      <div class="page-head">
        <div><h1>Campaigns</h1>
          <p>The Content Studio, inside HQ. Every brief, asset mockup, comment thread, weekly calendar and
             ROI table is the same one Brandon and Jessie already review — opening one here opens that,
             focused on it.</p></div>
        <div class="page-actions">
          <button class="btn btn-dark" data-go="#/campaigns/all">${svg('mega')}Open the Studio</button>
        </div>
      </div>

      <div class="role-bar">
        <span class="role-mine">${svg('check')}<b>Campaigns</b> — creative approval</span>
        <span class="role-sep"></span>
        <button class="role-other" data-go="#/plan">${svg('cal')}<b>Content Plan</b> — scheduled &amp; shipped</button>
      </div>

      <div class="metric-grid" style="margin-bottom:1.2rem">
        <div class="metric-card big"><h3>${t.campaigns}</h3><p>Campaigns briefed</p></div>
        <div class="metric-card big"><h3>${t.assets}</h3><p>Assets drafted for review</p></div>
        <div class="metric-card big"><h3>2</h3><p>Priority campaigns — revenue and lead</p></div>
        <div class="metric-card big"><h3>${Store.pieces().length}</h3><p>Pieces dated in the Plan</p></div>
      </div>

      <div class="camp-grid">
        ${cs.map(c => `
          <button class="camp-card t-${c.tone}" data-go="#/campaigns/${c.id}">
            <div class="camp-top">
              <span class="chip-prio">${esc(c.prio)}</span>
              <span class="camp-n">${c.assets} assets</span>
            </div>
            <h3>${esc(c.title)}</h3>
            <p class="camp-strand">${esc(c.strand)}</p>
            <p class="camp-line">${esc(c.line)}</p>
            <div class="camp-foot">
              ${c.channels.map(ch => `<span class="camp-ch">${esc(ch)}</span>`).join('')}
              <span class="camp-go">${svg('arrow')}</span>
            </div>
          </button>`).join('')}
      </div>

      <section class="panel" style="margin-top:1.4rem">
        <div class="panel-head"><h2>Where review actually happens</h2><span class="note">worth knowing</span></div>
        <p class="rem-sub">The Studio keeps its own sign-in and its own Supabase project — the one Brandon and
          Jessie already have accounts on. That is deliberate: their approvals and notes stay exactly where
          they were, and nothing had to be migrated to put HQ in front of it. You will see its own sign-in
          inside the frame the first time.</p>
        <div class="feed-acts">
          <button class="btn btn-outline btn-sm" id="c-public">${svg('copy')}Copy the shareable Studio link</button>
          <a class="btn btn-ghost btn-sm" href="${STUDIO}" target="_blank" rel="noopener">Open it in its own tab</a>
        </div>
      </section>
    </div>`;
  }

  /* ------------------------------- the frame ----------------------------- */
  function frame(id) {
    const c = id === 'all' ? null : Store.campaign(id);
    const src = c ? STUDIO + '?c=' + encodeURIComponent(c.id) : STUDIO;
    return `<div class="studio">
      <div class="studio-bar">
        <button class="crumb" data-go="#/campaigns">${svg('left')} All campaigns</button>
        ${c ? `<span class="studio-name t-${c.tone}"><i></i>${esc(c.title)}</span>` : '<span class="studio-name">Every campaign</span>'}
        <select id="studio-pick" aria-label="Jump to a campaign">
          <option value="all" ${!c ? 'selected' : ''}>Every campaign</option>
          ${Store.campaigns().map(x =>
            `<option value="${x.id}" ${c && c.id === x.id ? 'selected' : ''}>${esc(x.title)}</option>`).join('')}
        </select>
        <a class="btn btn-ghost btn-sm" href="${esc(src)}" target="_blank" rel="noopener">Open in a tab</a>
      </div>
      <iframe class="studio-frame" id="studio-frame" src="${esc(src)}"
        title="SportPharm Content Studio — campaign review"></iframe>
    </div>`;
  }

  HQ.view('campaigns', {
    render(r) { return r.id ? frame(r.id) : index(); },
    wire(root, r) {
      const cp = root.querySelector('#c-public');
      if (cp) cp.addEventListener('click', () => copy(PUBLIC));

      const pick = root.querySelector('#studio-pick');
      if (pick) pick.addEventListener('click', e => e.stopPropagation());
      if (pick) pick.addEventListener('change', () => go('#/campaigns/' + pick.value));

      /* HQ is a light interface; the Studio follows the OS by default. Nudge it
         to match on load — its own toggle still wins afterwards. */
      const fr = root.querySelector('#studio-frame');
      if (fr) fr.addEventListener('load', () => {
        try {
          const d = fr.contentDocument;
          if (d && !d.documentElement.getAttribute('data-theme')) {
            d.documentElement.setAttribute('data-theme', 'light');
          }
        } catch (e) { /* different origin one day — harmless */ }
      });
    }
  });
})();
