/* =============================================================================
   SportPharm HQ — Campaigns

   The Content Studio, running natively. Not an iframe, not a rebuild: the
   Studio's own markup (hq-studio-shell.js), its own stylesheet scoped under
   `.studio` (hq-studio.css) and its own 96-function render layer
   (hq-studio-app.js), all lifted verbatim.

   What changed is underneath: it reads and writes through HQ's store, so a
   note left on an asset is HQ data like anything else — it syncs with the team
   when Supabase is connected, and the Content Plan can read approvals straight
   out of it rather than reaching across to another database.

   The design is not ours to reinterpret. If it needs restyling, that is a
   decision for whoever built it.
============================================================================= */

/* The seam. The Studio calls store.get/set; this points those at HQ. */
const HQStudioBridge = (() => {
  'use strict';
  let campaign = null;

  return {
    setCampaign(id) { campaign = id; },
    campaignId() { return campaign; },
    email() {
      const u = Store.currentUser();
      return u ? (u.authEmail || u.email || '') : '';
    },
    /* keys look like "<campaignId>:<assetId>" or "<campaignId>:sec:<key>" —
       exactly what the Studio already used, so nothing had to be re-keyed */
    get(k) { return Store.studioGet(k); },
    set(k, v) { Store.studioSet(k, v); }
  };
})();

(() => {
  'use strict';
  const { esc, svg, go } = HQ;

  function index() {
    const cs = Store.campaigns();
    const assets = cs.reduce((n, c) => n + c.assets, 0);
    return `<div class="wrap">
      <div class="page-head">
        <div><h1>Campaigns</h1>
          <p>Every brief, asset, calendar and ROI table — approve the creative here and the
             Content Plan picks the verdict up.</p></div>
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
        <div class="metric-card big"><h3>${assets}</h3><p>Assets drafted</p></div>
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

  /* The Studio's own shell, wrapped so its stylesheet applies and nothing
     leaks out into HQ. */
  function studio(id) {
    const c = id === 'all' ? null : Store.campaign(id);
    return `<div class="studio-host">
      <div class="studio-hostbar">
        <button class="crumb" data-go="#/campaigns">${svg('left')} All campaigns</button>
        ${c ? `<span class="studio-name t-${c.tone}"><i></i>${esc(c.title)}</span>`
            : '<span class="studio-name">Every campaign</span>'}
        <select id="studio-pick" aria-label="Jump to a campaign">
          <option value="all" ${!c ? 'selected' : ''}>Every campaign</option>
          ${Store.campaigns().map(x =>
            `<option value="${x.id}" ${c && c.id === x.id ? 'selected' : ''}>${esc(x.title)}</option>`).join('')}
        </select>
      </div>
      <div class="studio" data-theme="light" id="studio-root">${STUDIO_SHELL}</div>
    </div>`;
  }

  HQ.view('campaigns', {
    render(r) { return r.id ? studio(r.id) : index(); },
    wire(root, r) {
      if (!r.id) return;
      const pick = root.querySelector('#studio-pick');
      if (pick) pick.addEventListener('change', () => go('#/campaigns/' + pick.value));

      const host = root.querySelector('#studio-root');
      if (!host || typeof StudioApp === 'undefined') return;
      HQStudioBridge.setCampaign(r.id === 'all' ? null : r.id);
      StudioApp.mount(host);
    }
  });
})();
