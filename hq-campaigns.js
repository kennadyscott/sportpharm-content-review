/* =============================================================================
   SportPharm HQ — Campaigns

   This mounts the Content Studio as you built it. The design is yours and is
   not to be reinterpreted — 62KB of CSS, 394 classes, authored over months.

   NOTE: an earlier version of this file replaced that design with HQ's own
   styling while porting the data natively. That was not asked for and has been
   reverted. The native port is still the right direction, but it has to carry
   YOUR markup and YOUR stylesheet — only the storage layer changes.

   The extracted brief data (hq-campaign-data.js) and the review layer in
   hq-store.js both remain in place, unused for now, ready for that port.
============================================================================= */
(() => {
  'use strict';
  const { esc, svg, copy, go } = HQ;

  const STUDIO = 'campaigns/index.html';

  function index() {
    const cs = Store.campaigns();
    const t = cs.reduce((n, c) => n + c.assets, 0);
    return `<div class="wrap">
      <div class="page-head">
        <div><h1>Campaigns</h1>
          <p>The Content Studio — every brief, asset, calendar and ROI table,
             in the design it was built in.</p></div>
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
        <div class="metric-card big"><h3>${cs.length}</h3><p>Campaigns briefed</p></div>
        <div class="metric-card big"><h3>${t}</h3><p>Assets drafted</p></div>
        <div class="metric-card big"><h3>2</h3><p>Priority campaigns</p></div>
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
    </div>`;
  }

  function frame(id) {
    const c = id === 'all' ? null : Store.campaign(id);
    const src = c ? STUDIO + '?c=' + encodeURIComponent(c.id) : STUDIO;
    return `<div class="studio">
      <div class="studio-bar">
        <button class="crumb" data-go="#/campaigns">${svg('left')} All campaigns</button>
        ${c ? `<span class="studio-name t-${c.tone}"><i></i>${esc(c.title)}</span>`
            : '<span class="studio-name">Every campaign</span>'}
        <select id="studio-pick" aria-label="Jump to a campaign">
          <option value="all" ${!c ? 'selected' : ''}>Every campaign</option>
          ${Store.campaigns().map(x =>
            `<option value="${x.id}" ${c && c.id === x.id ? 'selected' : ''}>${esc(x.title)}</option>`).join('')}
        </select>
        <a class="btn btn-ghost btn-sm" href="${esc(src)}" target="_blank" rel="noopener">Open in a tab</a>
      </div>
      <iframe class="studio-frame" id="studio-frame" src="${esc(src)}"
        title="SportPharm Content Studio"></iframe>
    </div>`;
  }

  HQ.view('campaigns', {
    render(r) { return r.id ? frame(r.id) : index(); },
    wire(root) {
      const pick = root.querySelector('#studio-pick');
      if (pick) pick.addEventListener('change', () => go('#/campaigns/' + pick.value));
      const fr = root.querySelector('#studio-frame');
      if (fr) fr.addEventListener('load', () => {
        try {
          const d = fr.contentDocument;
          if (d && !d.documentElement.getAttribute('data-theme')) {
            d.documentElement.setAttribute('data-theme', 'light');
          }
        } catch (e) {}
      });
    }
  });
})();
