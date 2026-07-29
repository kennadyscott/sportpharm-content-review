/* =============================================================================
   SportPharm HQ — Campaigns, native.

   This used to be an iframe of the Content Studio. It isn't any more: the
   eleven briefs are HQ's own data (hq-campaign-data.js) and the review layer
   lives in hq-store.js, so a campaign edits and approves exactly the way a
   task or an article does.

   The brief itself is content and stays read-only — rewriting a brief should
   never wipe the feedback attached to it. What's stored is the review: a
   status and a comment thread per section and per asset.
============================================================================= */
(() => {
  'use strict';
  const { esc, svg, avatar, ago, toast, copy, go } = HQ;

  const stOf = k => REVIEW_STATES[k] || REVIEW_STATES.pending;
  const meta = id => Store.campaign(id);            /* the index card in hq-data */
  const full = id => Store.brief(id);               /* the full brief */

  /* ---------------------------- small pieces ----------------------------- */
  const para = t => `<p>${esc(t)}</p>`;
  const paras = v => (Array.isArray(v) ? v : [v]).filter(Boolean).map(para).join('');
  /* The briefs were authored by hand over months, so the same field arrives as
     a string, a string[] or an object depending on the campaign. Normalise
     rather than assume. */
  const asList = v => !v ? [] : Array.isArray(v) ? v : typeof v === 'string' ? [v] : [];
  const bullets = v => {
    const l = asList(v).map(x => typeof x === 'string' ? x : (x.t || x.s || x.label || ''))
      .filter(Boolean);
    return l.length ? `<ul class="speclist">${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
  };
  /* use / avoid / note appears on both visual direction and guardrails */
  const useAvoid = (v, useLabel, avoidLabel) => {
    if (!v) return '';
    if (Array.isArray(v) || typeof v === 'string') return bullets(v);
    return `${v.use ? `<h4>${useLabel}</h4>${bullets(v.use)}` : ''}
      ${v.avoid ? `<h4>${avoidLabel}</h4><ul class="speclist guard-list">${asList(v.avoid)
        .map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${v.note ? `<p class="bf-note">${esc(v.note)}</p>` : ''}`;
  };

  /* The approve / needs-changes control that sits on every section and asset. */
  function reviewBar(campId, part, label) {
    const cur = Store.reviewState(campId, part);
    const n = Store.reviewThread(campId, part).length;
    const editable = Store.can('edit');
    return `<div class="rv-bar">
      ${editable ? Object.keys(REVIEW_STATES).map(k =>
        `<button class="rv-btn rv-${k} ${cur === k ? 'on' : ''}"
           data-rv="${esc(part)}" data-rvstate="${k}" data-rvlabel="${esc(label)}">${esc(REVIEW_STATES[k].label)}</button>`).join('')
        : `<span class="rv-btn rv-${cur} on">${esc(stOf(cur).label)}</span>`}
      <button class="rv-notes" data-rvnotes="${esc(part)}" data-rvlabel="${esc(label)}">
        ${svg('quote')}${n ? n + ' note' + (n === 1 ? '' : 's') : 'Add a note'}
      </button>
    </div>`;
  }

  /* ------------------------------ the index ------------------------------ */
  function index() {
    const cs = Store.campaigns();
    const totalAssets = cs.reduce((n, c) => n + c.assets, 0);
    const reviewed = cs.reduce((n, c) => n + Store.campaignProgress(c.id).done, 0);
    const notes = cs.reduce((n, c) => n + Store.campaignNoteCount(c.id), 0);

    return `<div class="wrap">
      <div class="page-head">
        <div><h1>Campaigns</h1>
          <p>Eleven briefs, sixty-four drafted assets. Read the thinking, approve the creative,
             leave notes on anything — all of it here, none of it somewhere else.</p></div>
      </div>

      <div class="role-bar">
        <span class="role-mine">${svg('check')}<b>Campaigns</b> — creative approval</span>
        <span class="role-sep"></span>
        <button class="role-other" data-go="#/plan">${svg('cal')}<b>Content Plan</b> — scheduled &amp; shipped</button>
      </div>

      <div class="metric-grid" style="margin-bottom:1.2rem">
        <div class="metric-card big"><h3>${cs.length}</h3><p>Campaigns briefed</p></div>
        <div class="metric-card big"><h3>${totalAssets}</h3><p>Assets drafted</p></div>
        <div class="metric-card big"><h3>${reviewed}</h3><p>Assets looked at</p></div>
        <div class="metric-card big"><h3>${notes}</h3><p>Notes left</p></div>
      </div>

      <div class="camp-grid">
        ${cs.map(c => {
          const p = Store.campaignProgress(c.id);
          const pct = p.total ? Math.round(p.done / p.total * 100) : 0;
          return `<button class="camp-card t-${c.tone}" data-go="#/campaigns/${c.id}">
            <div class="camp-top">
              <span class="chip-prio">${esc(c.prio)}</span>
              <span class="camp-n">${p.done}/${p.total} reviewed</span>
            </div>
            <h3>${esc(c.title)}</h3>
            <p class="camp-strand">${esc(c.strand)}</p>
            <p class="camp-line">${esc(c.line)}</p>
            <div class="progbar"><i style="width:${pct}%"></i></div>
            <div class="camp-foot">
              ${c.channels.map(ch => `<span class="camp-ch">${esc(ch)}</span>`).join('')}
              <span class="camp-go">${svg('arrow')}</span>
            </div>
          </button>`;
        }).join('')}
      </div>
    </div>`;
  }

  /* --------------------------- section renderers -------------------------- */
  /* Each returns null when the campaign has nothing for it, so a brief only
     shows the sections it actually has. */
  const SECTION = {
    platform: c => c.camp.platform && `
      ${c.camp.platformTag ? `<p class="bf-tag">${esc(c.camp.platformTag)}</p>` : ''}
      ${paras(c.camp.platform)}`,

    strategy: c => c.camp.strategy && (() => {
      const s = c.camp.strategy;
      return `
        <div class="bf-primary"><span>The primary goal</span><p>${esc(s.primary)}</p></div>
        ${s.supporting ? `<h4>Supporting goals</h4>${bullets(s.supporting)}` : ''}
        ${s.audiences ? `<h4>Who it is for</h4>
          <div class="bf-aud">${asList(s.audiences).map(a => `<div class="bf-aud-row">
            <b>${esc(a.who)}</b>
            <span>${esc(a.cares)}</span>
            <q>${esc(a.msg)}</q>
          </div>`).join('')}</div>` : ''}`;
    })(),

    offers: c => c.camp.offers && (() => {
      const o = c.camp.offers;
      return `${o.intro ? paras(o.intro) : ''}
        ${o.stack ? `<div class="bf-offers">${asList(o.stack).map(x => `<div class="bf-offer">
          <b>${esc(x.code || x.name || '')}</b><span>${esc(x.what || x.d || '')}</span>
        </div>`).join('')}</div>` : ''}`;
    })(),

    messages: c => c.camp.messages && (() => {
      const m = c.camp.messages;
      const rows = [['Emotional', m.emotional], ['Educational', m.educational],
                    ['Product', m.product], ['Brand', m.brand]].filter(r => r[1]);
      return `<div class="bf-msgs">${rows.map(([k, v]) =>
        `<div class="bf-msg"><span>${k}</span><p>${esc(v)}</p></div>`).join('')}</div>`;
    })(),

    structure: c => c.camp.structure && `
      ${c.camp.structureNote ? paras(c.camp.structureNote) : ''}
      <div class="bf-phases">${asList(c.camp.structure).map(p => `<div class="bf-phase">
        <b>${esc(p.phase || p.label || '')}</b>
        <p>${esc(p.what || p.d || '')}</p>
        ${p.posts ? bullets(p.posts) : ''}
      </div>`).join('')}</div>`,

    calendar: c => c.camp.calendar && (() => {
      const cal = c.camp.calendar;
      const weeks = cal.weeks || [];
      return `${cal.intro ? paras(cal.intro) : ''}
        ${weeks.map(w => `<details class="bf-week" open>
          <summary><b>${esc(w.label)}</b><span>${esc(w.focus || '')}</span></summary>
          <div class="bf-days">${(w.days || []).map(d => `<div class="bf-day">
            <span class="bf-day-n">${esc(d.d)}</span>
            <div>${(d.items || []).map(it =>
              `<span class="bf-item">${esc(it.x || it.t || '')}</span>`).join('') || '<i>—</i>'}</div>
          </div>`).join('')}</div>
        </details>`).join('')}
        ${cal.alwaysOn ? `<h4>Always on</h4>${bullets(cal.alwaysOn)}` : ''}`;
    })(),

    stories: c => c.camp.stories && `
      ${c.camp.storiesIntro ? paras(c.camp.storiesIntro) : ''}
      <div class="bf-stories">${asList(c.camp.stories).map(x => `<div class="bf-story">
        <p>${esc(typeof x === 'string' ? x : (x.d || x.s || ''))}</p>
      </div>`).join('')}</div>`,

    adaptations: c => c.camp.adaptations && `
      <div class="bf-adapts">${asList(c.camp.adaptations).map(a => `<div class="bf-adapt">
        <b>${esc(a.ch || a.channel || '')}</b>
        ${a.items ? bullets(a.items) : ''}
        ${a.cadence ? `<span class="bf-cadence">${esc(a.cadence)}</span>` : ''}
      </div>`).join('')}</div>`,

    paidAds: c => c.camp.paidAds && (() => {
      const p = c.camp.paidAds;
      const ads = asList(p.ads).length ? asList(p.ads) : asList(p);
      return `${p.intro ? paras(p.intro) : ''}
        <div class="bf-ads">${ads.map(a => `<div class="bf-ad">
          <span class="bf-ad-kind">${esc(a.kind || a.type || 'Ad')}</span>
          <b>${esc(a.title || a.name || '')}</b>
          ${a.hook ? `<q>${esc(a.hook)}</q>` : ''}
          ${a.body ? `<p>${esc(a.body)}</p>` : ''}
          ${a.targeting ? `<span class="bf-cadence">${esc(a.targeting)}</span>` : ''}
        </div>`).join('')}</div>
        ${p.note ? `<p class="bf-note">${esc(p.note)}</p>` : ''}`;
    })(),

    creators: c => c.camp.creators && (() => {
      const cr = c.camp.creators;
      return `${cr.intro ? paras(cr.intro) : ''}
        ${cr.who ? `<h4>Who to approach</h4>${bullets(cr.who)}` : ''}
        ${cr.mechanics ? `<h4>How it works</h4>
          <div class="bf-mech">${asList(cr.mechanics).map(m => `<div class="bf-mech-row">
            <b>${esc(m.k || m.label || '')}</b><span>${esc(m.v || m.d || '')}</span>
          </div>`).join('')}</div>` : ''}
        ${cr.note ? `<p class="bf-note">${esc(cr.note)}</p>` : ''}`;
    })(),

    landing: c => c.camp.landing && `
      ${c.camp.landingHero ? `<div class="bf-hero">
        <b>${esc(c.camp.landingHero.h || '')}</b>
        <p>${esc(c.camp.landingHero.dek || c.camp.landingHero.sub || '')}</p>
        ${c.camp.landingHero.note ? `<span class="bf-cadence">${esc(c.camp.landingHero.note)}</span>` : ''}
      </div>` : ''}
      <div class="bf-phases">${asList(c.camp.landing).map(x => `<div class="bf-phase">
        <b>${esc(x.t || x.s || x.label || '')}</b>${x.d || x.what ? `<p>${esc(x.d || x.what)}</p>` : ''}
      </div>`).join('')}</div>`,

    visual: c => (c.camp.visual || c.camp.visualFeel) && `
      ${c.camp.visualFeel ? paras(c.camp.visualFeel) : ''}
      ${c.camp.visualSwatches ? `<div class="bf-swatches">${asList(c.camp.visualSwatches).map(v =>
        `<span class="bf-swatch"><i style="background:${esc(v.hex || v)}"></i>${esc(v.name || v)}</span>`).join('')}</div>` : ''}
      ${useAvoid(c.camp.visual, 'Lean into', 'Steer clear of')}`,

    guardrails: c => c.camp.guardrails && useAvoid(c.camp.guardrails, 'Safe to say', 'Never say'),

    metrics: c => c.camp.metrics && `
      <div class="bf-metrics">${asList(c.camp.metrics).map(m => `<div class="bf-metric">
        <b>${esc(m.goal || m.k || '')}</b><span>${esc(m.kpi || m.why || '')}</span>
      </div>`).join('')}</div>`
  };

  /* ------------------------------ the brief ------------------------------ */
  let openSection = null;

  function detail(id) {
    const c = full(id);
    const m = meta(id);
    if (!c || !m) return `<div class="wrap"><p class="panel-empty">No such campaign.</p></div>`;

    const have = BRIEF_SECTIONS.filter(s => {
      const fn = SECTION[s.key];
      return fn && fn(c);
    });
    const prog = Store.campaignProgress(id);

    return `<div class="wrap">
      <button class="crumb" data-go="#/campaigns">${svg('left')} All campaigns</button>
      <div class="page-head">
        <div>
          <span class="chip-prio">${esc(m.prio)}</span>
          <h1>${esc(m.title)}</h1>
          <p>${esc(c.title)}</p>
        </div>
        <div class="page-actions">
          <span class="pill t-green"><b>${prog.approved}</b> approved</span>
          ${prog.changes ? `<span class="pill t-red"><b>${prog.changes}</b> need changes</span>` : ''}
          <span class="pill t-blue"><b>${prog.total - prog.done}</b> not looked at</span>
        </div>
      </div>

      <div class="bf-layout">
        <nav class="bf-rail">
          ${have.map(s => `<button class="bf-railbtn" data-jump="sec-${s.key}">
            <i class="rv-dot rv-${Store.reviewState(id, 'sec:' + s.key)}"></i>${esc(s.label)}
          </button>`).join('')}
          <button class="bf-railbtn" data-jump="sec-assets">
            <i class="rv-dot"></i>Drafted assets <b>${prog.total}</b>
          </button>
        </nav>

        <div class="bf-body">
          ${have.map(s => `<section class="bf-sec" id="sec-${s.key}">
            <div class="bf-sec-head">
              <h2>${esc(s.label)}</h2>
              ${reviewBar(id, 'sec:' + s.key, s.label)}
            </div>
            <div class="bf-sec-body">${SECTION[s.key](c)}</div>
            ${threadHTML(id, 'sec:' + s.key)}
          </section>`).join('')}

          <section class="bf-sec" id="sec-assets">
            <div class="bf-sec-head"><h2>Drafted assets</h2>
              <span class="note">${prog.done} of ${prog.total} looked at</span></div>
            <div class="bf-assets">
              ${(c.assets || []).map(a => {
                const st = Store.reviewState(id, 'asset:' + a.id);
                return `<article class="bf-asset rv-${st}">
                  <div class="bf-asset-head">
                    <span class="bf-asset-kind">${esc(a.type || a.kind || 'Asset')}</span>
                    ${a.week ? `<span class="bf-asset-week">${esc(a.week)}</span>` : ''}
                    ${(a.chs || []).map(ch => `<span class="camp-ch">${esc(ch)}</span>`).join('')}
                  </div>
                  <h3>${esc(a.title)}</h3>
                  ${a.purpose ? `<p class="bf-asset-purpose">${esc(a.purpose)}</p>` : ''}
                  ${a.cover ? `<div class="bf-cover">
                    ${a.cover.eyebrow ? `<span>${esc(a.cover.eyebrow)}</span>` : ''}
                    ${a.cover.hook ? `<b>${esc(a.cover.hook)}</b>` : ''}
                    ${a.cover.sub ? `<i>${esc(a.cover.sub)}</i>` : ''}
                  </div>` : ''}
                  ${a.scenes ? `<details class="bf-more"><summary>Shot list · ${a.scenes.length}</summary>
                    ${bullets(a.scenes)}</details>` : ''}
                  ${a.slides ? `<details class="bf-more"><summary>Slides · ${a.slides.length}</summary>
                    ${bullets(a.slides.map(x => typeof x === 'string' ? x : (x.h || '') + ' — ' + (x.b || '')))}</details>` : ''}
                  ${a.vo ? `<details class="bf-more"><summary>Voiceover</summary><p>${esc(a.vo)}</p></details>` : ''}
                  ${a.caption ? `<details class="bf-more"><summary>Caption</summary><p>${esc(a.caption)}</p></details>` : ''}
                  ${a.body ? `<details class="bf-more"><summary>Copy</summary><p>${esc(a.body)}</p></details>` : ''}
                  ${reviewBar(id, 'asset:' + a.id, a.title)}
                  ${threadHTML(id, 'asset:' + a.id)}
                </article>`;
              }).join('')}
            </div>
          </section>
        </div>
      </div>
    </div>`;
  }

  /* A thread renders inline, under whatever it is attached to. */
  function threadHTML(campId, part) {
    const thread = Store.reviewThread(campId, part);
    if (!thread.length && openSection !== part) return '';
    const note = (n, isReply) => {
      const u = Store.user(n.by);
      return `<div class="cnote ${isReply ? 'reply' : ''}">
        ${avatar(u, 'sm')}
        <div class="cnote-body">
          <span class="cnote-who"><b>${esc(u ? u.name.split(' ')[0] : 'Someone')}</b> · ${ago(n.at)}</span>
          <p>${esc(n.text)}</p>
        </div>
        ${Store.can('edit') ? `<button class="cnote-del" data-delnote="${esc(part)}:${n.id}" aria-label="Delete note">${svg('trash')}</button>` : ''}
      </div>
      ${(n.replies || []).map(r => note(r, true)).join('')}`;
    };
    return `<div class="rv-thread" data-thread="${esc(part)}">
      ${thread.map(n => note(n, false)).join('')}
      ${Store.can('comment') && openSection === part ? `<form class="cform" data-noteform="${esc(part)}">
        <textarea rows="2" placeholder="Leave a note…" aria-label="New note"></textarea>
        <button class="btn btn-outline btn-sm" type="submit">Add note</button>
      </form>` : ''}
    </div>`;
  }

  /* ------------------------------- wiring -------------------------------- */
  HQ.view('campaigns', {
    render(r) { return r.id ? detail(r.id) : index(); },
    wire(root, r) {
      if (!r.id) return;
      const id = r.id;

      root.querySelectorAll('[data-jump]').forEach(b =>
        b.addEventListener('click', () => {
          const el = root.querySelector('#' + b.dataset.jump);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }));

      root.querySelectorAll('[data-rv]').forEach(b =>
        b.addEventListener('click', () => {
          Store.setReviewState(id, b.dataset.rv, b.dataset.rvstate, b.dataset.rvlabel);
          HQ.render();
        }));

      root.querySelectorAll('[data-rvnotes]').forEach(b =>
        b.addEventListener('click', () => {
          const part = b.dataset.rvnotes;
          openSection = openSection === part ? null : part;
          HQ.render();
          const f = document.querySelector(`[data-noteform="${CSS.escape(part)}"] textarea`);
          if (f) f.focus();
        }));

      root.querySelectorAll('[data-noteform]').forEach(f =>
        f.addEventListener('submit', e => {
          e.preventDefault();
          const ta = f.querySelector('textarea');
          if (!ta.value.trim()) return;
          Store.addReviewNote(id, f.dataset.noteform, ta.value);
          HQ.render();
        }));

      root.querySelectorAll('[data-delnote]').forEach(b =>
        b.addEventListener('click', () => {
          const i = b.dataset.delnote.lastIndexOf(':');
          Store.removeReviewNote(id, b.dataset.delnote.slice(0, i), b.dataset.delnote.slice(i + 1));
          HQ.render();
        }));
    }
  });
})();
