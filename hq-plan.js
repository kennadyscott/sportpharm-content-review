/* =============================================================================
   SportPharm HQ — Plan
   The Threadline planner pattern, in SportPharm's skin: every piece of content on
   its way out the door, in one table. Group it, sort it, select a handful and
   move them together. Three views: Planner, Board, Calendar.
============================================================================= */
(() => {
  'use strict';
  const { esc, svg, avatar, ago, toast, go } = HQ;
  const $ = HQ.$;

  const ui = {
    view: null,           /* null = follow the default-view rule */
    groupBy: 'month',     /* month | campaign | status | channel */
    sort: { col: 'date', dir: 1 },
    sel: new Set(),
    calMonth: null        /* 'YYYY-MM' shown in calendar view */
  };

  let pbOpen = null;   /* week index open; null = auto (today's week) */
  let pbHidden = false;

  function pbRowHTML(p) {
    const st = stOf(p.status);
    const ch = chOf(p.channel);
    const checked = ui.sel.has(p.id);
    const fchip = p.facing ? `<span class="face-chip fc-${p.facing}">${FACING[p.facing].short}</span>` : '';
    return `<tr class="pl-row ${checked ? 'sel' : ''}" data-piece="${p.id}">
      <td class="pl-ck"><input type="checkbox" data-sel="${p.id}" ${checked ? 'checked' : ''} aria-label="Select ${esc(p.title)}"></td>
      <td class="pl-title">${esc(p.title)} ${fchip}${p.assetId ? '<span class="pl-linked" title="Has a brief in the Content Studio">brief</span>' : ''}</td>
      <td><span class="pl-fmt fmt-${p.format.toLowerCase()}">${esc(p.format)}</span></td>
      <td><span class="tag t-${ch.tone}">${esc(ch.label)}</span></td>
      <td><span class="pl-st t-${st.tone}"><i></i>${st.label}</span></td>
      <td class="pl-date">${fmtDate(p.date)}</td>
      <td>${p.owner ? avatar(Store.user(p.owner), 'sm') : '<span class="card-none" style="margin:0"></span>'}</td>
    </tr>`;
  }

  function piecesInWeek(w) {
    return Store.pieces()
      .filter(p => p.date && p.date >= w.range[0] && p.date <= w.range[1])
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function pbCovered(p) {
    const pb = typeof LAUNCH_PLAYBOOK !== 'undefined' ? LAUNCH_PLAYBOOK : null;
    if (!pb || pbHidden || !p.date) return false;
    return p.date >= pb.weeks[0].range[0] && p.date <= pb.weeks[pb.weeks.length - 1].range[1];
  }

  function playbookHTML() {
    const pb = typeof LAUNCH_PLAYBOOK !== 'undefined' ? LAUNCH_PLAYBOOK : null;
    if (!pb) return '';
    const today = new Date().toISOString().slice(0, 10);
    let current = pb.weeks.findIndex(w => today >= w.range[0] && today <= w.range[1]);
    if (current === -1) current = today < pb.weeks[0].range[0] ? 0 : pb.weeks.length - 1;
    const open = pbOpen === null ? current : pbOpen;

    const keyOf = (w, ai) => 'pb:' + pb.campaign + ':' + w.key + ':' + ai;
    let total = 0, done = 0;
    pb.weeks.forEach(w => w.actions.forEach((a, ai) => { total++; if (Store.actionDone(keyOf(w, ai))) done++; }));
    const editable = Store.can('edit');

    if (pbHidden) {
      return `<section class="pb pb-min">
        <button class="pb-show" id="pb-toggle">✦ ${esc(pb.title)} — ${done}/${total} done · show</button>
      </section>`;
    }

    return `<section class="pb">
      <div class="pb-head">
        <div>
          <h2>✦ ${esc(pb.title)}</h2>
          <p>${esc(pb.sub)}</p>
        </div>
        <div class="pb-side">
          <span class="pb-prog"><b>${done}</b>/${total} done</span>
          <button class="btn btn-outline btn-sm" data-go="#/campaigns/${pb.campaign}">Full brief</button>
          <button class="btn btn-ghost btn-sm" id="pb-toggle">Hide</button>
        </div>
      </div>
      <div class="pb-weeks">
        ${pb.weeks.map((w, wi) => {
          const wDone = w.actions.filter((a, ai) => Store.actionDone(keyOf(w, ai))).length;
          const isOpen = wi === open;
          const isNow = wi === current;
          return `<div class="pb-week ${isOpen ? 'open' : ''} ${isNow ? 'now' : ''}">
            <button class="pb-week-head" data-pbweek="${wi}">
              <span class="pb-dot ${wDone === w.actions.length ? 'all' : wDone ? 'some' : ''}"></span>
              <span class="pb-wlabel"><b>${esc(w.label)}</b><i>${esc(w.theme)}</i></span>
              ${isNow ? '<span class="pb-now">This week</span>' : ''}
              <span class="pb-count">${wDone}/${w.actions.length} · ${piecesInWeek(w).length} posts</span>
            </button>
            ${isOpen ? `<div class="pb-body">
              <p class="pb-goal"><b>The goal:</b> ${esc(w.goal)}</p>
              <div class="pb-kpis"><span class="pb-kpis-label">Targets</span>${w.kpis.map(k => `<span>${esc(k)}</span>`).join('')}</div>
              <div class="pb-actions">
                ${w.actions.map((a, ai) => {
                  const k = keyOf(w, ai);
                  const on = Store.actionDone(k);
                  return `<label class="pb-act ${on ? 'done' : ''}">
                    <input type="checkbox" data-pbact="${k}" data-pblabel="${esc(a)}" ${on ? 'checked' : ''} ${editable ? '' : 'disabled'}>
                    <span>${esc(a)}</span>
                  </label>`;
                }).join('')}
              </div>
              ${(() => {
                const wp = piecesInWeek(w);
                if (!wp.length) return '<p class="pb-noposts">No posts dated in this window yet.</p>';
                const byCamp = new Map();
                wp.forEach(p => {
                  const k = p.campaign || '';
                  if (!byCamp.has(k)) byCamp.set(k, []);
                  byCamp.get(k).push(p);
                });
                return `<div class="pb-posts">
                  <h4>Posts this week — ${wp.length}</h4>
                  ${[...byCamp.entries()].map(([cid, items]) => {
                    const c = campOf(cid);
                    return `<div class="pb-campblock">
                      <div class="pb-camp-head">
                        <button class="pb-camp-link" data-go="#/campaigns/${cid}">${esc(c ? c.title : 'No campaign')}</button>
                        <span>${items.length} post${items.length === 1 ? '' : 's'}${c ? ' · ' + esc(c.line) : ''}</span>
                      </div>
                      <div class="mtable-wrap"><table class="pl-table pb-table">
                        ${items.map(pbRowHTML).join('')}
                      </table></div>
                    </div>`;
                  }).join('')}
                </div>`;
              })()}
            </div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </section>`;
  }

  const campOf = id => Store.campaign(id);
  const stOf = s => PLAN_STATUS[s] || PLAN_STATUS.drafting;
  const chOf = c => CHANNELS[c] || { label: c, tone: 'blue' };

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  function monthKey(d) { return d ? d.slice(0, 7) : ''; }
  function monthLabel(k) {
    if (!k) return 'No date yet';
    return new Date(k + '-15T12:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  /* ------------------------------ grouping ------------------------------ */
  function grouped() {
    const list = Store.pieces().filter(p => !pbCovered(p));
    const key = {
      month: p => monthKey(p.date),
      campaign: p => p.campaign,
      status: p => p.status,
      channel: p => p.channel
    }[ui.groupBy];
    const label = {
      month: monthLabel,
      campaign: k => (campOf(k) || { title: 'No campaign' }).title,
      status: k => stOf(k).label,
      channel: k => chOf(k).label
    }[ui.groupBy];

    const map = new Map();
    list.forEach(p => {
      const k = key(p) || '';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(p);
    });

    const orderKeys = [...map.keys()].sort((a, b) => {
      if (ui.groupBy === 'status') {
        const o = Object.keys(PLAN_STATUS);
        return o.indexOf(a) - o.indexOf(b);
      }
      if (ui.groupBy === 'month') return (a || '9999').localeCompare(b || '9999');
      return String(label(a)).localeCompare(String(label(b)));
    });

    const cmp = {
      title: (a, b) => a.title.localeCompare(b.title),
      campaign: (a, b) => ((campOf(a.campaign) || {}).title || '').localeCompare((campOf(b.campaign) || {}).title || ''),
      format: (a, b) => a.format.localeCompare(b.format),
      channel: (a, b) => a.channel.localeCompare(b.channel),
      status: (a, b) => Object.keys(PLAN_STATUS).indexOf(a.status) - Object.keys(PLAN_STATUS).indexOf(b.status),
      date: (a, b) => (a.date || '9999').localeCompare(b.date || '9999'),
      owner: (a, b) => ((Store.user(a.owner) || {}).name || 'zz').localeCompare((Store.user(b.owner) || {}).name || 'zz')
    }[ui.sort.col] || (() => 0);

    return orderKeys.map(k => ({
      key: k, label: label(k),
      items: map.get(k).sort((a, b) => cmp(a, b) * ui.sort.dir)
    }));
  }

  /* ------------------------------- pieces ------------------------------- */
  const COLS = [
    ['title', 'Piece'], ['campaign', 'Campaign'], ['format', 'Format'],
    ['channel', 'Channel'], ['status', 'Status'], ['date', 'Date'], ['owner', 'Who']
  ];

  function rowHTML(p) {
    const c = campOf(p.campaign);
    const st = stOf(p.status);
    const ch = chOf(p.channel);
    const checked = ui.sel.has(p.id);
    const fchip = p.facing ? `<span class="face-chip fc-${p.facing}">${FACING[p.facing].short}</span>` : '';
    return `<tr class="pl-row ${checked ? 'sel' : ''}" data-piece="${p.id}">
      <td class="pl-ck"><input type="checkbox" data-sel="${p.id}" ${checked ? 'checked' : ''} aria-label="Select ${esc(p.title)}"></td>
      <td class="pl-title">${esc(p.title)} ${fchip}${p.assetId ? '<span class="pl-linked" title="Has a brief in the Content Studio">brief</span>' : ''}</td>
      <td>${c ? `<span class="pl-camp">${esc(c.title)}</span>` : '<span class="pl-dim">—</span>'}</td>
      <td><span class="pl-fmt fmt-${p.format.toLowerCase()}">${esc(p.format)}</span></td>
      <td><span class="tag t-${ch.tone}">${esc(ch.label)}</span></td>
      <td><span class="pl-st t-${st.tone}"><i></i>${st.label}</span></td>
      <td class="pl-date">${fmtDate(p.date)}</td>
      <td>${p.owner ? avatar(Store.user(p.owner), 'sm') : '<span class="card-none" style="margin:0"></span>'}</td>
    </tr>`;
  }

  function plannerHTML() {
    const groups = grouped();
    const arrow = c => ui.sort.col === c ? (ui.sort.dir === 1 ? ' ↑' : ' ↓') : '';
    return groups.map(g => `
      <section class="pl-group">
        <div class="pl-group-head">
          <h3>${esc(g.label)}</h3><span class="n">${g.items.length}</span>
          <button class="pl-selgrp" data-selgrp="${g.items.map(p => p.id).join(',')}">Select all</button>
        </div>
        <div class="mtable-wrap"><table class="pl-table">
          <tr><th></th>${COLS.map(([k, l]) => `<th><button data-sort="${k}">${l}${arrow(k)}</button></th>`).join('')}</tr>
          ${g.items.map(rowHTML).join('')}
        </table></div>
      </section>`).join('') || '<p class="panel-empty">Everything dated for August lives inside the playbook weeks above. Later months and undated pieces will appear here.</p>';
  }

  function boardHTML() {
    const list = Store.pieces();
    return `<div class="board pl-board">
      ${Object.entries(PLAN_STATUS).map(([k, v]) => {
        const col = list.filter(p => p.status === k).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
        return `<section class="col" data-plcol="${k}">
          <div class="col-head"><h3>${v.label}</h3><span class="n">${col.length}</span></div>
          <div class="col-list">
            ${col.length ? col.map(p => {
              const ch = chOf(p.channel);
              return `<article class="card t-${ch.tone}" draggable="${Store.can('edit')}" data-plcard="${p.id}" tabindex="0">
                <div class="card-top"><span class="tag">${esc(ch.label)}</span><span class="pl-fmt fmt-${p.format.toLowerCase()}" style="margin-left:auto">${esc(p.format)}</span></div>
                <h4>${esc(p.title)}</h4>
                <div class="card-foot">
                  <span class="mini-prog">${fmtDate(p.date)}</span>
                  ${p.owner ? avatar(Store.user(p.owner), 'sm') : '<span class="card-none"></span>'}
                </div>
              </article>`;
            }).join('') : '<p class="col-empty">Drop something here</p>'}
          </div>
        </section>`;
      }).join('')}
    </div>`;
  }

  function calendarHTML() {
    const list = Store.pieces().filter(p => p.date);
    if (!ui.calMonth) {
      const dated = list.map(p => p.date).sort();
      ui.calMonth = dated.length ? monthKey(dated[0]) : new Date().toISOString().slice(0, 7);
    }
    const [y, m] = ui.calMonth.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const days = new Date(y, m, 0).getDate();
    const lead = (first.getDay() + 6) % 7; /* Monday-first */
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    const byDay = {};
    list.filter(p => monthKey(p.date) === ui.calMonth)
      .forEach(p => { const d = Number(p.date.slice(8, 10)); (byDay[d] = byDay[d] || []).push(p); });

    return `<div class="pl-cal">
      <div class="pl-cal-head">
        <button class="btn btn-ghost btn-sm" data-calnav="-1">${svg('left')}</button>
        <h3>${monthLabel(ui.calMonth)}</h3>
        <button class="btn btn-ghost btn-sm" data-calnav="1">${svg('right')}</button>
      </div>
      <div class="pl-cal-grid">
        ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="pl-cal-dow">${d}</div>`).join('')}
        ${cells.map((d, i) => {
          if (d == null) return '<div class="pl-cal-cell empty"></div>';
          const weekend = (i % 7) > 4;
          return `<div class="pl-cal-cell ${weekend ? 'weekend' : ''}">
            <span class="pl-cal-n">${d}</span>
            ${(byDay[d] || []).map(p => {
              const st = stOf(p.status);
              return `<button class="pl-cal-item t-${st.tone}" data-piece="${p.id}"><i></i>${esc(p.title)}</button>`;
            }).join('')}
          </div>`;
        }).join('')}
      </div>
      <p class="guard-note">Only dated pieces appear here. The Calendar tab still shows each campaign’s intended rhythm — this is what is actually booked.</p>
    </div>`;
  }

  /* -------------------------------- view -------------------------------- */
  HQ.view('plan', {
    render() {
      const rules = Store.planRules();
      const view = ui.view || rules.defaultView || 'planner';
      const list = Store.pieces();
      const nSel = ui.sel.size;
      const editable = Store.can('edit');
      const counts = Object.keys(PLAN_STATUS)
        .map(k => `<span class="pill t-${PLAN_STATUS[k].tone}"><b>${list.filter(p => p.status === k).length}</b> ${PLAN_STATUS[k].label.toLowerCase()}</span>`).join('');

      return `<div class="wrap">
        <div class="page-head">
          <div><h1>Plan</h1>
            <p>Every piece on its way out the door — by rhythm, status, and schedule.
               The campaigns say what; this says when.</p></div>
          <div class="page-actions">
            ${editable ? `<button class="btn btn-outline" id="pl-rules">${svg('gear')} Rules</button>
            <button class="btn btn-dark" id="pl-new">${svg('plus')}New piece</button>` : ''}
          </div>
        </div>

        <div class="role-bar">
          <button class="role-other" data-go="#/campaigns">${svg('check')}<b>Campaigns</b> — creative approval</button>
          <span class="role-sep"></span>
          <span class="role-mine">${svg('cal')}<b>Content Plan</b> — scheduled &amp; shipped</span>
        </div>

        ${playbookHTML()}

        <div class="today-pills" style="margin-bottom:1rem">${counts}</div>

        <div class="toolbar">
          <div class="seg">
            ${[['planner', 'Planner'], ['board', 'Board'], ['calendar', 'Calendar']]
              .map(([k, l]) => `<button data-plview="${k}" class="${view === k ? 'on' : ''}">${l}</button>`).join('')}
          </div>
          ${view === 'planner' ? `<div class="pl-groupby">Group by
            <div class="seg">${[['month', 'Month'], ['campaign', 'Campaign'], ['status', 'Status'], ['channel', 'Channel']]
              .map(([k, l]) => `<button data-plgroup="${k}" class="${ui.groupBy === k ? 'on' : ''}">${l}</button>`).join('')}</div>
          </div>` : ''}
        </div>

        ${view === 'planner' ? plannerHTML() : view === 'board' ? boardHTML() : calendarHTML()}

        ${nSel ? `<div class="pl-bulk">
          <b>${nSel} selected</b>
          <button class="btn btn-sm btn-outline" data-bulk="approved">${svg('check')} Approve</button>
          <button class="btn btn-sm btn-outline" data-bulk="__schedule">${svg('cal')} Schedule</button>
          <select id="pl-moveto" aria-label="Move to campaign">
            <option value="">Move to…</option>
            ${Store.campaigns().map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}
          </select>
          <button class="btn btn-sm btn-outline" data-bulk="__delete">${svg('trash')} Delete</button>
          <button class="btn btn-ghost btn-sm" id="pl-clear">✕</button>
        </div>` : ''}
      </div>`;
    },

    wire(root) {
      const editable = Store.can('edit');

      const pbt = root.querySelector('#pb-toggle');
      if (pbt) pbt.addEventListener('click', () => { pbHidden = !pbHidden; HQ.render(); });
      root.querySelectorAll('[data-pbweek]').forEach(b =>
        b.addEventListener('click', () => {
          const wi = Number(b.dataset.pbweek);
          pbOpen = pbOpen === wi ? -1 : wi;   /* click the open one to collapse all */
          HQ.render();
        }));
      root.querySelectorAll('[data-pbact]').forEach(ck =>
        ck.addEventListener('change', () => {
          Store.tickAction(ck.dataset.pbact, ck.dataset.pblabel);
          HQ.render();
        }));

      root.querySelectorAll('[data-plview]').forEach(b =>
        b.addEventListener('click', () => { ui.view = b.dataset.plview; HQ.render(); }));
      root.querySelectorAll('[data-plgroup]').forEach(b =>
        b.addEventListener('click', () => { ui.groupBy = b.dataset.plgroup; HQ.render(); }));
      root.querySelectorAll('[data-sort]').forEach(b =>
        b.addEventListener('click', () => {
          const c = b.dataset.sort;
          if (ui.sort.col === c) ui.sort.dir *= -1; else ui.sort = { col: c, dir: 1 };
          HQ.render();
        }));
      root.querySelectorAll('[data-calnav]').forEach(b =>
        b.addEventListener('click', () => {
          const [y, m] = ui.calMonth.split('-').map(Number);
          const d = new Date(y, m - 1 + Number(b.dataset.calnav), 15);
          ui.calMonth = d.toISOString().slice(0, 7);
          HQ.render();
        }));

      /* selection */
      root.querySelectorAll('[data-sel]').forEach(ck =>
        ck.addEventListener('change', () => {
          if (ck.checked) ui.sel.add(ck.dataset.sel); else ui.sel.delete(ck.dataset.sel);
          HQ.render();
        }));
      root.querySelectorAll('[data-selgrp]').forEach(b =>
        b.addEventListener('click', () => {
          const ids = b.dataset.selgrp.split(',');
          const all = ids.every(id => ui.sel.has(id));
          ids.forEach(id => all ? ui.sel.delete(id) : ui.sel.add(id));
          HQ.render();
        }));
      const clear = root.querySelector('#pl-clear');
      if (clear) clear.addEventListener('click', () => { ui.sel.clear(); HQ.render(); });

      /* open sheet from planner rows + calendar items */
      root.querySelectorAll('[data-piece]').forEach(el =>
        el.addEventListener('click', e => {
          if (e.target.closest('input,[data-sel]')) return;
          openPieceSheet(el.dataset.piece);
        }));

      /* board: click + drag between statuses */
      let dragging = null;
      root.querySelectorAll('[data-plcard]').forEach(card => {
        card.addEventListener('click', () => openPieceSheet(card.dataset.plcard));
        card.addEventListener('dragstart', e => {
          dragging = card.dataset.plcard;
          card.classList.add('dragging');
          try { e.dataTransfer.setData('text/plain', dragging); } catch (err) {}
        });
        card.addEventListener('dragend', () => { card.classList.remove('dragging'); dragging = null; });
      });
      root.querySelectorAll('[data-plcol]').forEach(col => {
        col.addEventListener('dragover', e => { if (dragging) { e.preventDefault(); col.classList.add('over'); } });
        col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
        col.addEventListener('drop', e => {
          e.preventDefault(); col.classList.remove('over');
          if (!dragging) return;
          const to = col.dataset.plcol;
          const rules = Store.planRules();
          const p = Store.piece(dragging);
          if (to === 'scheduled' && rules.requireReview && p.status === 'drafting') {
            toast('Needs review first — that’s the rule you set.');
          } else {
            Store.updatePiece(dragging, { status: to }, 'moved to ' + PLAN_STATUS[to].label);
          }
          dragging = null;
          HQ.render();
        });
      });

      /* bulk bar */
      root.querySelectorAll('[data-bulk]').forEach(b =>
        b.addEventListener('click', () => {
          if (!editable) return;
          const ids = [...ui.sel];
          const act = b.dataset.bulk;
          if (act === '__delete') {
            if (!confirm('Remove ' + ids.length + ' piece' + (ids.length === 1 ? '' : 's') + ' from the plan?')) return;
            Store.removePieces(ids); ui.sel.clear(); HQ.render(); toast('Removed.');
            return;
          }
          if (act === '__schedule') {
            const start = prompt('Schedule starting when? (YYYY-MM-DD, blank = tomorrow)') || '';
            const refused = Store.bulkSchedule(ids, start.trim() || null);
            ui.sel.clear(); HQ.render();
            toast(refused.length ? refused.length + ' still need review first.' : 'Scheduled.');
            return;
          }
          const refused = Store.bulkStatus(ids, act);
          ui.sel.clear(); HQ.render();
          toast(refused.length ? refused.length + ' still need review first.' : 'Done.');
        }));
      const mv = root.querySelector('#pl-moveto');
      if (mv) mv.addEventListener('change', () => {
        if (!mv.value) return;
        Store.bulkMove([...ui.sel], mv.value);
        ui.sel.clear(); HQ.render(); toast('Moved.');
      });

      /* header actions */
      const nb = root.querySelector('#pl-new');
      if (nb) nb.addEventListener('click', () => {
        const p = Store.addPiece({});
        HQ.render(); openPieceSheet(p.id);
      });
      const rb = root.querySelector('#pl-rules');
      if (rb) rb.addEventListener('click', openRulesSheet);
    }
  });

  /* ----------------------------- piece sheet ----------------------------- */
  function openPieceSheet(id) {
    HQ.openSheet(() => {
      const p = Store.piece(id);
      if (!p) return null;
      const st = stOf(p.status);
      const editable = Store.can('edit');
      return {
        cls: 't-' + st.tone,
        html: `
          <div class="sheet-head">
            <span class="pl-st t-${st.tone}"><i></i>${st.label}</span>
            <button class="btn btn-ghost btn-sm" data-sheet-close aria-label="Close" style="margin-left:auto">${svg('close')}</button>
          </div>
          <div class="sheet-body">
            <textarea class="sheet-title" id="pc-title" rows="2" ${editable ? '' : 'readonly'}>${esc(p.title)}</textarea>
            <div class="meta-grid">
              <div class="field"><label>Campaign</label>
                <select id="pc-camp" ${editable ? '' : 'disabled'}>
                  ${Store.campaigns().map(c => `<option value="${c.id}" ${c.id === p.campaign ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}
                </select></div>
              <div class="field"><label>Status</label>
                <select id="pc-status" ${editable ? '' : 'disabled'}>
                  ${Object.entries(PLAN_STATUS).map(([k, v]) => `<option value="${k}" ${k === p.status ? 'selected' : ''}>${v.label}</option>`).join('')}
                </select></div>
              <div class="field"><label>Format</label>
                <select id="pc-format" ${editable ? '' : 'disabled'}>
                  ${PLAN_FORMATS.map(f => `<option ${f === p.format ? 'selected' : ''}>${f}</option>`).join('')}
                </select></div>
              <div class="field"><label>Channel</label>
                <select id="pc-channel" ${editable ? '' : 'disabled'}>
                  ${Object.entries(CHANNELS).map(([k, v]) => `<option value="${k}" ${k === p.channel ? 'selected' : ''}>${v.label}</option>`).join('')}
                </select></div>
              <div class="field"><label>Facing</label>
                <select id="pc-facing" ${editable ? '' : 'disabled'}>
                  <option value="">Not set</option>
                  ${Object.entries(FACING).map(([k, v]) => `<option value="${k}" ${k === p.facing ? 'selected' : ''}>${v.label}</option>`).join('')}
                </select></div>
              <div class="field"><label>Content pillar</label>
                <select id="pc-pillar" ${editable && p.facing ? '' : 'disabled'}>
                  <option value="">${p.facing ? 'Pick a pillar' : 'Set facing first'}</option>
                  ${(PILLARS[p.facing] || []).map(x => `<option ${x === p.pillar ? 'selected' : ''}>${x}</option>`).join('')}
                </select></div>
              <div class="field"><label>Date</label>
                <input type="date" id="pc-date" value="${esc(p.date || '')}" ${editable ? '' : 'disabled'}></div>
              <div class="field" style="grid-column:1/-1"><label>Content Studio</label>
                ${p.assetId
                  ? `<button class="btn btn-outline btn-sm" data-go="#/campaigns/${esc(p.campaign)}">${svg('mega')}Open the brief for this piece</button>
                     <span class="pl-hint">Studio asset <code>${esc(p.assetId)}</code>. Creative approval lives there; the ship date lives here.</span>`
                  : `<span class="pl-hint">No Studio asset — this is an HQ-only piece (paid placement or offer mechanic).</span>`}
              </div>
              <div class="field"><label>Who</label>
                <select id="pc-owner" ${editable ? '' : 'disabled'}>
                  <option value="">No one yet</option>
                  ${Store.users().map(u => `<option value="${u.id}" ${u.id === p.owner ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}
                </select></div>
            </div>
            <div class="field"><label for="pc-notes">Notes</label>
              <textarea id="pc-notes" ${editable ? '' : 'readonly'}>${esc(p.notes || '')}</textarea></div>
            <p style="font-size:.78rem;color:var(--ink-faint)">The full brief lives in
              <button class="linky" id="pc-goc">${esc((campOf(p.campaign) || {}).title || 'its campaign')}</button>.</p>
            ${editable ? `<div class="sheet-danger">
              <span style="font-size:.78rem;color:var(--ink-faint)">Added ${ago(p.createdAt)}</span>
              <button class="link-danger" id="pc-del">Remove from the plan</button>
            </div>` : ''}
          </div>`,
        wire(sheet) {
          sheet.querySelector('#pc-goc').addEventListener('click', () => { HQ.closeSheet(); go('#/campaigns/' + p.campaign); });
          if (!editable) return;
          const t = sheet.querySelector('#pc-title');
          const auto = () => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; };
          auto(); t.addEventListener('input', auto);
          t.addEventListener('change', () => { Store.updatePiece(p.id, { title: t.value.trim() || 'Untitled piece' }); HQ.render(); });
          const bind = (sel, key) => sheet.querySelector(sel).addEventListener('change', e => {
            if (key === 'status') {
              const rules = Store.planRules();
              if (e.target.value === 'scheduled' && rules.requireReview && p.status === 'drafting') {
                toast('Needs review first — that’s the rule you set.');
                e.target.value = p.status;
                return;
              }
            }
            Store.updatePiece(p.id, { [key]: e.target.value || (key === 'owner' ? null : e.target.value) });
            HQ.render(); HQ.refreshSheet();
          });
          sheet.querySelector('#pc-facing').addEventListener('change', e => {
            Store.updatePiece(p.id, { facing: e.target.value, pillar: '' });
            HQ.render(); HQ.refreshSheet();
          });
          sheet.querySelector('#pc-pillar').addEventListener('change', e => {
            Store.updatePiece(p.id, { pillar: e.target.value });
            HQ.render();
          });
          bind('#pc-camp', 'campaign'); bind('#pc-status', 'status'); bind('#pc-format', 'format');
          bind('#pc-channel', 'channel'); bind('#pc-date', 'date'); bind('#pc-owner', 'owner');
          sheet.querySelector('#pc-notes').addEventListener('change', e => Store.updatePiece(p.id, { notes: e.target.value }));
          sheet.querySelector('#pc-del').addEventListener('click', () => {
            if (!confirm('Remove “' + p.title + '” from the plan?')) return;
            Store.removePieces([p.id]); HQ.closeSheet(); HQ.render(); toast('Removed.');
          });
        }
      };
    });
  }

  /* ----------------------------- rules sheet ----------------------------- */
  function openRulesSheet() {
    HQ.openSheet(() => {
      const r = Store.planRules();
      return {
        cls: 't-blue',
        html: `
          <div class="sheet-head">
            <span class="tag">How the Plan behaves</span>
            <button class="btn btn-ghost btn-sm" data-sheet-close aria-label="Close" style="margin-left:auto">${svg('close')}</button>
          </div>
          <div class="sheet-body">
            <div class="sheet-block">
              <h4>Reviews</h4>
              <label class="rule-row">
                <input type="checkbox" id="pr-review" ${r.requireReview ? 'checked' : ''}>
                <span><b>Require review before scheduling</b>
                A drafting piece can’t jump straight to Scheduled — it has to pass In review.
                Uncheck if it’s just you running the account.</span>
              </label>
            </div>
            <div class="sheet-block">
              <h4>Planning</h4>
              <label class="rule-row">
                <input type="checkbox" id="pr-weekends" ${r.avoidWeekends ? 'checked' : ''}>
                <span><b>Avoid weekends</b>
                Auto-fill and bulk scheduling skip Saturday and Sunday. SportPharm doesn’t post
                into anyone’s day of rest.</span>
              </label>
            </div>
            <div class="sheet-block">
              <h4>Default view — what Plan opens to</h4>
              <div class="seg">
                ${[['planner', 'Planner'], ['board', 'Board'], ['calendar', 'Calendar']]
                  .map(([k, l]) => `<button data-prview="${k}" class="${(r.defaultView || 'planner') === k ? 'on' : ''}">${l}</button>`).join('')}
              </div>
            </div>
            <p style="font-size:.8rem;color:var(--ink-faint);line-height:1.6">Rules save as you change them,
              for everyone who uses this workspace.</p>
          </div>`,
        wire(sheet) {
          sheet.querySelector('#pr-review').addEventListener('change', e => { Store.setPlanRules({ requireReview: e.target.checked }); toast('Saved.'); });
          sheet.querySelector('#pr-weekends').addEventListener('change', e => { Store.setPlanRules({ avoidWeekends: e.target.checked }); toast('Saved.'); });
          sheet.querySelectorAll('[data-prview]').forEach(b =>
            b.addEventListener('click', () => { Store.setPlanRules({ defaultView: b.dataset.prview }); HQ.refreshSheet(); toast('Saved.'); }));
        }
      };
    });
  }

})();
