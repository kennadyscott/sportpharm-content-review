/* =============================================================================
   SportPharm HQ — Today, Projects, Calendar, Strategy, Ideas, Analytics,
   Team, Settings. (Campaigns lives in hq-campaigns.js.)
============================================================================= */
(() => {
  'use strict';
  const { esc, svg, avatar, areaOf, statusOf, ago, daysSince, dueLabel, toast, copy, go } = HQ;
  const $ = HQ.$;

  /* ============================== TODAY ============================== */
  function greeting() {
    const h = new Date().getHours();
    if (h < 5) return 'You’re up late';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function taskRow(t) {
    const a = areaOf(t.project.area);
    const d = dueLabel(t.due);
    const ed = Store.can('edit');
    const ref = t.project.id + ':' + t.id;
    return `<div class="row t-${a.tone}" data-task="${ref}" tabindex="0" role="button">
      <i class="row-dot"></i>
      <span class="row-body">
        <span class="row-title" ${ed ? `data-ititle="${ref}"` : ''}>${esc(t.title)}</span>
        <span class="row-meta">${esc(t.project.name)}${d && !ed ? ' · <span class="due ' + d.tone + '">' + esc(d.txt) + '</span>' : ''}</span>
      </span>
      <span class="row-side">
        ${ed ? `<button class="row-stat st-${t.status}" data-istatus="${ref}"
                  title="Click to move it along">${esc(statusOf(t.status).label)}</button>
                <input class="row-date" type="date" value="${esc(t.due || '')}" data-idate="${ref}"
                  aria-label="Due date">`
             : `<span class="row-stat st-${t.status}">${esc(statusOf(t.status).label)}</span>`}
        ${t.owner ? avatar(Store.user(t.owner), 'sm') : ''}
      </span>
    </div>`;
  }

  HQ.view('today', {
    render() {
      const me = Store.currentUser();
      const tasks = Store.allTasks();
      const mine = tasks.filter(t => t.owner === me.id && t.status !== 'shipped');
      const moving = tasks.filter(t => t.status === 'building' || t.status === 'review');
      const soon = tasks.filter(t => t.due && t.status !== 'shipped' && daysSince(t.due) > -8)
        .sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
      const quiet = tasks.filter(t => t.status !== 'shipped' && daysSince(t.updatedAt) > 14)
        .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)).slice(0, 4);

      /* the content queue — what is actually stuck waiting on a person */
      const stats = Store.articleStats();
      const inReview = Store.articles().filter(a => a.status === 'review');
      const sendBacks = Store.articles().filter(a => a.status === 'changes');
      const scheduled = Store.articles().filter(a => a.status === 'scheduled')
        .sort((a, b) => (a.scheduledFor || '').localeCompare(b.scheduledFor || ''));

      let line;
      if (mine.length === 0) line = 'nothing is waiting on you.';
      else if (mine.length === 1) line = 'one thing is waiting on <em>you</em>.';
      else line = `<em>${mine.length} things</em> are waiting on you.`;

      const feed = Store.activity().slice(0, 8);

      const LV_ORDER = ['blocker', 'important', 'note'];
      const rems = Store.reminders().slice().sort((a, b) =>
        LV_ORDER.indexOf(a.level) - LV_ORDER.indexOf(b.level) ||
        (a.due || '9999').localeCompare(b.due || '9999'));
      const remOpen = rems.filter(r => !r.resolved);
      const remDone = rems.filter(r => r.resolved);
      const gates = remOpen.filter(r => r.level === 'blocker').length;

      const remRow = r => {
        const lv = REMINDER_LEVELS[r.level] || REMINDER_LEVELS.important;
        const d = r.due ? dueLabel(r.due) : null;
        return `<div class="rem ${r.resolved ? 'done' : ''}" data-rem="${r.id}">
          <input type="checkbox" ${r.resolved ? 'checked' : ''} data-remck="${r.id}"
                 aria-label="${r.resolved ? 'Reopen' : 'Resolve'} — ${esc(r.text)}" ${Store.can('edit') ? '' : 'disabled'}>
          <span class="rem-lv lv-${r.level}">${lv.label}</span>
          <span class="rem-text">${esc(r.text)}</span>
          ${d ? `<span class="due ${d.tone}">${esc(d.txt)}</span>` : ''}
        </div>`;
      };

      return `<div class="wrap">
        <section class="today-hero">
          <h1>${greeting()}, ${esc(me.name.split(' ')[0])}. <br>${line}</h1>
          <p class="today-sub">Everything SportPharm is building, writing, marketing and deciding — in one
            place, so it stops living in eleven browser tabs and one person’s memory.</p>
          <div class="today-pills">
            <span class="pill t-blue"><b>${tasks.filter(t => t.status !== 'shipped').length}</b> open tasks</span>
            <span class="pill t-red"><b>${stats.review + stats.changes}</b> articles in the review loop</span>
            <span class="pill t-green"><b>${stats.published}</b> live on the site</span>
            <span class="pill t-amber"><b>${Store.campaigns().length}</b> campaigns briefed</span>
          </div>
        </section>

        <section class="panel rem-panel stack">
          <div class="panel-head">
            <h2>Before launch</h2>
            <span class="note">${gates ? gates + ' gate' + (gates === 1 ? '' : 's') + ' still closed' : remOpen.length ? 'no closed gates — the rest is judgment' : 'everything revisited'}</span>
            ${Store.can('edit') ? `<button class="btn btn-outline btn-sm" id="rem-add" style="margin-left:auto">${svg('plus')}Add a reminder</button>` : ''}
          </div>
          <p class="rem-sub">Fine in a prototype, not fine the day real people arrive. Kept here so they get
            re-seen instead of re-found. Click one for the full why.</p>
          ${remOpen.length ? remOpen.map(remRow).join('') : '<p class="panel-empty">Nothing open. Launch when ready.</p>'}
          ${remDone.length ? `<details class="rem-done-wrap"><summary>${remDone.length} resolved</summary>
            ${remDone.map(remRow).join('')}</details>` : ''}
        </section>

        <div class="col-2 stack">
          <section class="panel">
            <div class="panel-head"><h2>Waiting on you</h2></div>
            ${mine.length ? mine.map(taskRow).join('') : '<p class="panel-empty">Nothing assigned to you right now. That’s allowed.</p>'}
          </section>
          <section class="panel">
            <div class="panel-head"><h2>In the review loop</h2><span class="note">nothing ships past this</span></div>
            ${inReview.concat(sendBacks).length ? inReview.concat(sendBacks).map(a => {
              const st = ARTICLE_STATES[a.status];
              const open = Store.openChecks(a).length;
              const mineToClear = a.status === 'review' && Store.canApprove(a);
              return `<button class="row t-${st.tone}" data-go="#/content/${a.id}">
                <i class="row-dot"></i>
                <span class="row-body">
                  <span class="row-title">${esc(a.title)}</span>
                  <span class="row-meta">${esc(st.label)} · ${esc(a.author)}${
                    open ? ' · ' + open + ' unchecked' : ''}${
                    mineToClear ? ' · <b>you can sign this off</b>' : ''}</span>
                </span>
                <span class="row-side">${svg('arrow')}</span>
              </button>`;
            }).join('') : '<p class="panel-empty">Nothing is waiting on a reviewer.</p>'}
            ${scheduled.length ? `<div class="today-sched">
              ${scheduled.slice(0, 3).map(a => `<button class="sched-row" data-go="#/content/${a.id}">
                ${svg('cal')}<span>${esc(a.title)}</span><b>${esc(a.scheduledFor)}</b></button>`).join('')}
            </div>` : ''}
          </section>
        </div>

        <div class="col-2 stack">
          <section class="panel">
            <div class="panel-head"><h2>Coming up</h2><span class="note">by date</span></div>
            ${soon.length ? soon.map(taskRow).join('') : '<p class="panel-empty">Nothing dated in the near term.</p>'}
          </section>
          <section class="panel">
            <div class="panel-head"><h2>Moving</h2><span class="note">across the team</span></div>
            ${moving.length ? moving.map(taskRow).join('') : '<p class="panel-empty">Nothing in progress yet.</p>'}
          </section>
        </div>

        <div class="col-2 stack">
          <section class="panel">
            <div class="panel-head"><h2>Quiet for a while</h2><span class="note">just noticing</span></div>
            ${quiet.length ? quiet.map(taskRow).join('') : '<p class="panel-empty">Everything has been touched recently.</p>'}
          </section>
          <section class="panel">
            <div class="panel-head"><h2>Lately</h2></div>
            ${feed.length ? `<ul class="activity">${feed.map(f => {
              const u = Store.user(f.by);
              return `<li><b>${esc(u ? u.name.split(' ')[0] : 'Someone')}</b> ${esc(f.action)}${f.target ? ' — ' + esc(f.target) : ''} · ${ago(f.at)}</li>`;
            }).join('')}</ul>` : '<p class="panel-empty">Nothing logged yet.</p>'}
          </section>
        </div>
      </div>`;
    },
    wire(root) {
      wireTaskRows(root);
      root.querySelectorAll('[data-remck]').forEach(ck =>
        ck.addEventListener('change', e => {
          e.stopPropagation();
          Store.toggleReminder(ck.dataset.remck);
          HQ.render();
        }));
      root.querySelectorAll('[data-rem]').forEach(row =>
        row.addEventListener('click', e => {
          if (e.target.closest('input')) return;
          openReminderSheet(row.dataset.rem);
        }));
      const add = root.querySelector('#rem-add');
      if (add) add.addEventListener('click', () => {
        const r = Store.addReminder({ text: 'New reminder' });
        HQ.render(); openReminderSheet(r.id);
      });
    }
  });

  function openReminderSheet(id) {
    HQ.openSheet(() => {
      const r = Store.reminder(id);
      if (!r) return null;
      const lv = REMINDER_LEVELS[r.level] || REMINDER_LEVELS.important;
      const editable = Store.can('edit');
      return {
        cls: 't-' + lv.tone,
        html: `
          <div class="sheet-head">
            <span class="rem-lv lv-${r.level}">${lv.label}</span>
            <button class="btn btn-ghost btn-sm" data-sheet-close aria-label="Close" style="margin-left:auto">${svg('close')}</button>
          </div>
          <div class="sheet-body">
            <textarea class="sheet-title" id="rm-text" rows="2" ${editable ? '' : 'readonly'}>${esc(r.text)}</textarea>
            <div class="meta-grid">
              <div class="field"><label>How serious</label>
                <select id="rm-level" ${editable ? '' : 'disabled'}>
                  ${Object.entries(REMINDER_LEVELS).map(([k, v]) => `<option value="${k}" ${k === r.level ? 'selected' : ''}>${v.label}</option>`).join('')}
                </select></div>
              <div class="field"><label>Revisit by</label>
                <input type="date" id="rm-due" value="${esc(r.due || '')}" ${editable ? '' : 'disabled'}></div>
            </div>
            <div class="field"><label for="rm-why">The full why</label>
              <textarea id="rm-why" style="min-height:130px" ${editable ? '' : 'readonly'}>${esc(r.why || '')}</textarea></div>
            ${editable ? `<div style="display:flex;gap:.5rem">
              <button class="btn ${r.resolved ? 'btn-outline' : 'btn-dark'}" id="rm-toggle">
                ${r.resolved ? 'Reopen it' : svg('check') + ' Mark it resolved'}</button>
            </div>
            <div class="sheet-danger">
              <span style="font-size:.78rem;color:var(--ink-faint)">Added ${ago(r.createdAt)}</span>
              <button class="link-danger" id="rm-del">Remove this reminder</button>
            </div>` : ''}
          </div>`,
        wire(sheet) {
          if (!editable) return;
          const t = sheet.querySelector('#rm-text');
          const auto = () => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; };
          auto(); t.addEventListener('input', auto);
          t.addEventListener('change', () => { Store.updateReminder(r.id, { text: t.value.trim() || 'Untitled reminder' }); HQ.render(); });
          sheet.querySelector('#rm-level').addEventListener('change', e => { Store.updateReminder(r.id, { level: e.target.value }); HQ.render(); HQ.refreshSheet(); });
          sheet.querySelector('#rm-due').addEventListener('change', e => { Store.updateReminder(r.id, { due: e.target.value }); HQ.render(); });
          sheet.querySelector('#rm-why').addEventListener('change', e => Store.updateReminder(r.id, { why: e.target.value }));
          sheet.querySelector('#rm-toggle').addEventListener('click', () => { Store.toggleReminder(r.id); HQ.render(); HQ.refreshSheet(); });
          sheet.querySelector('#rm-del').addEventListener('click', () => {
            if (!confirm('Remove “' + r.text + '”?')) return;
            Store.removeReminder(r.id); HQ.closeSheet(); HQ.render(); toast('Removed.');
          });
        }
      };
    });
  }

  function wireTaskRows(root) {
    root.querySelectorAll('[data-task]').forEach(b => {
      b.addEventListener('click', () => {
        const [pid, tid] = b.dataset.task.split(':');
        openTaskSheet(pid, tid);
      });
      b.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (e.target !== b) return;
        e.preventDefault();
        const [pid, tid] = b.dataset.task.split(':');
        openTaskSheet(pid, tid);
      });
    });
    wireInlineTask(root);
  }

  /* Rename, re-date and advance a task without opening anything. */
  function wireInlineTask(root) {
    HQ.inlineText(root, '[data-ititle]', (el, v) => {
      const [pid, tid] = el.dataset.ititle.split(':');
      Store.updateTask(pid, tid, { title: v });
      HQ.render();
    });
    HQ.stopRow(root, '[data-idate]');
    root.querySelectorAll('[data-idate]').forEach(el =>
      el.addEventListener('change', () => {
        const [pid, tid] = el.dataset.idate.split(':');
        Store.updateTask(pid, tid, { due: el.value });
        HQ.render();
      }));
    HQ.stopRow(root, '[data-istatus]');
    root.querySelectorAll('[data-istatus]').forEach(el =>
      el.addEventListener('click', () => {
        const [pid, tid] = el.dataset.istatus.split(':');
        const t = Store.taskRef(pid, tid);
        if (!t) return;
        const i = STATUSES.findIndex(x => x.id === t.status);
        Store.moveTask(pid, tid, STATUSES[(i + 1) % STATUSES.length].id, null);
        HQ.render();
      }));
  }

  /* ============================== PROJECTS ============================== */
  function projectStats(p) {
    const done = p.tasks.filter(t => t.status === 'shipped').length;
    return { done, total: p.tasks.length, pct: p.tasks.length ? Math.round(done / p.tasks.length * 100) : 0 };
  }

  /* The same work, cut three ways. Project is the board you drag things on;
     Monthly answers "what lands this month"; Campaign answers "what does the
     Feel It Work push still need". Nothing moves — only the grouping. */
  let projView = 'tasks';   /* tasks | campaign | project  (plan is its own route) */
  let showAllCampaigns = false;
  let taskMonth = null;     /* which month the Tasks board is showing */

  /* One toggle across two routes. Content Plan lives at #/plan but renders the
     same bar, so the four read as one surface rather than a page and a tab. */
  const VIEWS = [
    ['tasks',    'Tasks',        'The board, a month at a time'],
    ['campaign', 'Campaign',     'What the campaign in flight still needs'],
    ['plan',     'Content Plan', 'Every piece on its way out the door'],
    ['project',  'Projects',     'The projects themselves']
  ];

  function projToggle(active) {
    return `<div class="seg seg-views">
      ${VIEWS.map(([k, label, hint]) =>
        `<button data-pview="${k}" class="${active === k ? 'on' : ''}" title="${esc(hint)}">${label}</button>`).join('')}
    </div>`;
  }
  /* the Plan module renders the same bar */
  HQ.projToggle = projToggle;
  HQ.setProjView = v => { projView = v; };

  function monthKeyOf(d) { return d ? d.slice(0, 7) : ''; }
  function monthLabelOf(k) {
    if (!k) return 'No date yet';
    return new Date(k + '-15T12:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  /* Every month that has work in it, plus an undated bucket, in date order. */
  function taskMonths() {
    const keys = new Set();
    Store.allTasks().forEach(t => keys.add(monthKeyOf(t.due)));
    const out = [...keys].sort((a, b) => (a || '9999').localeCompare(b || '9999'));
    return out;
  }

  /* Tasks = a board, one month at a time. Same drag behaviour as a project
     board, but the cards come from every project — which is how the work
     actually arrives. */
  function taskBoard() {
    const months = taskMonths();
    if (!months.length) return '<p class="panel-empty">No tasks yet.</p>';
    if (taskMonth === null || months.indexOf(taskMonth) === -1) {
      const thisMonth = new Date().toISOString().slice(0, 7);
      taskMonth = months.indexOf(thisMonth) !== -1 ? thisMonth : months[0];
    }
    const tasks = Store.allTasks()
      .filter(t => monthKeyOf(t.due) === taskMonth)
      .sort((a, b) => a.order - b.order);

    return `<div class="month-caps">
        ${months.map(k => {
          const n = Store.allTasks().filter(t => monthKeyOf(t.due) === k).length;
          const done = Store.allTasks().filter(t => monthKeyOf(t.due) === k && t.status === 'shipped').length;
          return `<button class="month-cap ${k === taskMonth ? 'on' : ''}" data-tmonth="${k}">
            <span>${esc(monthLabelOf(k))}</span><b>${done}/${n}</b>
          </button>`;
        }).join('')}
      </div>

      <div class="board" id="task-board">
        ${STATUSES.map(st => {
          const col = tasks.filter(t => t.status === st.id);
          return `<section class="col" data-col="${st.id}">
            <div class="col-head"><h3>${st.label}</h3><span class="n">${col.length}</span>
              <span class="hint">${esc(st.hint)}</span></div>
            <div class="col-list">${col.length ? col.map(t => {
              const a = areaOf(t.project.area);
              const d = dueLabel(t.due);
              return `<article class="card t-${a.tone}" draggable="${Store.can('edit')}"
                        data-tcard="${t.project.id}:${t.id}" tabindex="0">
                <span class="card-proj">${esc(t.project.name)}</span>
                <h4 ${Store.can('edit') ? `data-ititle="${t.project.id}:${t.id}"` : ''}>${esc(t.title)}</h4>
                <div class="card-foot">
                  ${d ? `<span class="due ${d.tone}">${esc(d.txt)}</span>` : '<span class="mini-prog">no date</span>'}
                  ${t.campaign ? `<span class="card-camp">${esc((Store.campaign(t.campaign) || {}).title || '')}</span>` : ''}
                </div>
              </article>`;
            }).join('') : '<p class="col-empty">Drop something here</p>'}</div>
          </section>`;
        }).join('')}
      </div>`;
  }

  /* Content Plan is its own route; the other three are in-page. Either way the
     bar behaves like one control. */
  function wireProjToggle(root) {
    root.querySelectorAll('[data-pview]').forEach(b =>
      b.addEventListener('click', () => {
        const v = b.dataset.pview;
        if (v === 'plan') { go('#/plan'); return; }
        projView = v;
        if (HQ.route().view === 'plan') { go('#/projects'); return; }
        HQ.render();
      }));
  }
  HQ.wireProjToggle = wireProjToggle;

  function wireTaskBoard(root) {
    wireInlineTask(root);
    root.querySelectorAll('[data-tmonth]').forEach(b =>
      b.addEventListener('click', () => { taskMonth = b.dataset.tmonth; HQ.render(); }));

    const board = root.querySelector('#task-board');
    if (!board) return;
    let dragRef = null;

    board.querySelectorAll('[data-tcard]').forEach(card => {
      card.addEventListener('dragstart', e => {
        dragRef = card.dataset.tcard;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', dragRef); } catch (err) {}
      });
      card.addEventListener('dragend', () => { card.classList.remove('dragging'); dragRef = null; });
      card.addEventListener('click', () => {
        const [pid, tid] = card.dataset.tcard.split(':');
        openTaskSheet(pid, tid);
      });
      card.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const [pid, tid] = card.dataset.tcard.split(':');
        openTaskSheet(pid, tid);
      });
    });

    board.querySelectorAll('[data-col]').forEach(col => {
      col.addEventListener('dragover', e => {
        if (!dragRef) return;
        e.preventDefault(); e.dataTransfer.dropEffect = 'move';
        col.classList.add('over');
      });
      col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
      col.addEventListener('drop', e => {
        e.preventDefault(); col.classList.remove('over');
        if (!dragRef) return;
        const [pid, tid] = dragRef.split(':');
        const cards = [...col.querySelectorAll('[data-tcard]')].filter(c => c.dataset.tcard !== dragRef);
        let beforeId = null;
        for (const c of cards) {
          const r = c.getBoundingClientRect();
          if (e.clientY < r.top + r.height / 2) { beforeId = c.dataset.tcard.split(':')[1]; break; }
        }
        Store.moveTask(pid, tid, col.dataset.col, beforeId);
        dragRef = null;
        HQ.render();
      });
    });
  }

  /* Everything about the campaign in flight, on one page: its tasks, its dated
     pieces, and the actual brief embedded from the Content Studio — so you can
     read what was agreed without leaving the place you plan the work. */
  function campaignCockpit() {
    const c = Store.campaign(CURRENT_CAMPAIGN);
    if (!c) return groupedView('campaign');

    const tasks = Store.allTasks().filter(t => t.campaign === c.id);
    const openTasks = tasks.filter(t => t.status !== 'shipped');
    const pieces = Store.pieces().filter(p => p.campaign === c.id)
      .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
    const linked = pieces.filter(p => p.assetId).length;

    const pieceRow = p => {
      const st = PLAN_STATUS[p.status] || PLAN_STATUS.drafting;
      const ch = CHANNELS[p.channel] || { label: p.channel, tone: 'blue' };
      const d = p.date ? dueLabel(p.date) : null;
      return `<div class="cc-piece" data-piece="${p.id}" tabindex="0" role="button">
        <span class="cc-piece-date">${p.date ? esc(new Date(p.date + 'T12:00:00')
          .toLocaleDateString(undefined, { month: 'short', day: 'numeric' })) : '—'}</span>
        <span class="cc-piece-body">
          <span class="cc-piece-title"><span ${Store.can('edit') ? `data-ipiece="${p.id}"` : ''}>${esc(p.title)}</span>${p.assetId
            ? '<span class="pl-linked">brief</span>' : ''}</span>
          <span class="cc-piece-meta">${esc(p.format)} · ${esc(ch.label)}</span>
        </span>
        ${Store.can('edit')
          ? `<button class="pl-st t-${st.tone}" data-ipstatus="${p.id}" title="Click to move it along"><i></i>${st.label}</button>`
          : `<span class="pl-st t-${st.tone}"><i></i>${st.label}</span>`}
      </div>`;
    };

    return `
      <div class="metric-grid cc-stats">
        <div class="metric-card stat"><h3>${c.assets}</h3><p>Assets briefed</p></div>
        <div class="metric-card stat"><h3>${openTasks.length}</h3><p>Tasks still open</p></div>
        <div class="metric-card stat"><h3>${pieces.length}</h3><p>Pieces dated</p></div>
        <div class="metric-card stat"><h3>${linked}</h3><p>Linked to a brief</p></div>
      </div>

      <div class="col-2 stack cc-work">
        <section class="panel">
          <div class="panel-head"><h2>What it still needs</h2>
            <span class="note">${openTasks.length} open</span></div>
          ${tasks.length ? tasks.map(taskRow).join('')
            : '<p class="panel-empty">No tasks tagged to this campaign yet.</p>'}
        </section>

        <section class="panel">
          <div class="panel-head"><h2>What ships, and when</h2>
            <span class="note">from the Content Plan</span></div>
          <div class="cc-pieces">
            ${pieces.length ? pieces.map(pieceRow).join('')
              : '<p class="panel-empty">Nothing dated yet.</p>'}
          </div>
        </section>
      </div>

      <section class="cc-brief">
        <div class="cc-brief-head">
          ${svg('mega')}
          <div>
            <h2>The brief</h2>
            <p>Live from the Content Studio — the same one Brandon and Jessie review.
               Creative approval happens in here.</p>
          </div>
          <a class="btn btn-ghost btn-sm" href="campaigns/index.html?c=${esc(c.id)}"
             target="_blank" rel="noopener">Open in a tab</a>
        </div>
        <iframe class="cc-brief-frame" id="cc-brief-frame"
          src="campaigns/index.html?c=${esc(c.id)}"
          title="${esc(c.title)} — campaign brief"></iframe>
      </section>`;
  }

  function projectCards() {
    const ps = Store.projects();
    return `<div class="proj-grid">
      ${ps.map(p => {
        const s = projectStats(p);
        const d = dueLabel(p.due);
        const owners = [...new Set(p.tasks.map(t => t.owner).filter(Boolean))];
        return `<button class="proj-card t-${p.tone}" data-go="#/projects/${p.id}">
          <span class="tag">${esc(areaOf(p.area).label)}</span>
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.goal)}</p>
          <div class="progbar"><i style="width:${s.pct}%"></i></div>
          <div class="proj-foot">
            <span class="mini-prog">${s.done}/${s.total} done</span>
            ${d ? `<span class="due ${d.tone}">${esc(d.txt)}</span>` : ''}
            <span class="stackav">${owners.map(o => avatar(Store.user(o), 'sm')).join('')}</span>
          </div>
        </button>`;
      }).join('')}
    </div>`;
  }

  /* Build the buckets for whichever non-board view is showing. */
  function buckets(mode) {
    const tasks = Store.allTasks();
    const map = new Map();
    const push = (k, t) => { if (!map.has(k)) map.set(k, []); map.get(k).push(t); };

    if (mode === 'month') {
      tasks.forEach(t => push(monthKeyOf(t.due), t));
      const keys = [...map.keys()].sort((a, b) => (a || '9999').localeCompare(b || '9999'));
      return keys.map(k => ({
        key: k, label: monthLabelOf(k), tone: k ? 'navy' : 'blue',
        meta: '', items: map.get(k)
      }));
    }

    tasks.forEach(t => push(t.campaign || '', t));
    const order = Store.campaigns().map(c => c.id);
    let keys = [...map.keys()].sort((a, b) => {
      if (!a) return 1;
      if (!b) return -1;
      return order.indexOf(a) - order.indexOf(b);
    });
    /* Default to the campaign actually in flight — the other ten are briefed,
       not being worked. `showAllCampaigns` opens the rest. */
    if (!showAllCampaigns) keys = keys.filter(k => k === CURRENT_CAMPAIGN);
    return keys.map(k => {
      const c = Store.campaign(k);
      return {
        key: k, label: c ? c.title : 'Not tied to a campaign',
        tone: c ? c.tone : 'blue',
        meta: c ? c.strand : 'Useful work that isn’t serving a campaign — which is fine, but worth seeing.',
        link: c ? '#/campaigns/' + c.id : null,
        items: map.get(k)
      };
    });
  }

  function groupedView(mode) {
    const groups = buckets(mode);
    if (!groups.length) return '<p class="panel-empty">No tasks yet.</p>';
    return groups.map(g => {
      const done = g.items.filter(t => t.status === 'shipped').length;
      const pct = g.items.length ? Math.round(done / g.items.length * 100) : 0;
      const open = g.items.filter(t => t.status !== 'shipped');
      const sorted = open.concat(g.items.filter(t => t.status === 'shipped'));
      return `<section class="pgroup t-${g.tone}">
        <div class="pgroup-head">
          <h2>${esc(g.label)}</h2>
          <span class="pgroup-n">${done}/${g.items.length} done</span>
          <div class="progbar"><i style="width:${pct}%"></i></div>
          ${g.link ? `<button class="btn btn-outline btn-sm" data-go="${g.link}">Brief</button>` : ''}
        </div>
        ${g.meta ? `<p class="pgroup-meta">${esc(g.meta)}</p>` : ''}
        ${sorted.map(taskRow).join('')}
      </section>`;
    }).join('');
  }

  function projectsIndex() {
    const blurb = {
      tasks: 'Every task on one board, a month at a time. Drag between columns; the months are up top.',
      project: 'The work itself — every project SportPharm has going.',
      campaign: 'The same tasks, read as "what does this campaign still need before it can run".'
    }[projView];

    const cur = Store.campaign(CURRENT_CAMPAIGN);
    const otherCount = Store.campaigns().length - 1;

    return `<div class="wrap">
      <div class="page-head">
        <div><h1>Project Planning</h1><p>${esc(blurb)}</p></div>
        <div class="page-actions">
          ${Store.can('edit') && projView === 'project'
            ? `<button class="btn btn-dark" id="new-project">${svg('plus')}Add a project</button>` : ''}
        </div>
      </div>

      ${projToggle(projView)}

      ${projView === 'campaign' ? `
        <div class="camp-scope">
          <span class="camp-scope-now">${svg('mega')}<b>${esc(cur ? cur.title : 'Current campaign')}</b>
            <i>in flight</i></span>
          <button class="btn btn-outline btn-sm" id="camp-scope-toggle">
            ${showAllCampaigns ? 'Just the current campaign' : 'See all campaigns (' + otherCount + ' more)'}
          </button>
          <button class="btn btn-ghost btn-sm" data-go="#/campaigns">Open the Studio${svg('arrow')}</button>
        </div>` : ''}

      ${projView === 'project' ? projectCards()
        : projView === 'tasks' ? taskBoard()
        : projView === 'campaign' && !showAllCampaigns ? campaignCockpit()
        : groupedView(projView)}
    </div>`;
  }

  /* ------------------------------- board -------------------------------- */
  function taskCard(p, t) {
    const si = STATUSES.findIndex(s => s.id === t.status);
    const editable = Store.can('edit');
    const d = dueLabel(t.due);
    return `<article class="card t-${p.tone}" draggable="${editable}" data-card="${t.id}" tabindex="0">
      ${editable ? `<span class="nudge">
        <button data-shift="${t.id}" data-dir="-1" ${si === 0 ? 'disabled' : ''} aria-label="Move left">${svg('left')}</button>
        <button data-nudge="${t.id}" data-dir="-1" aria-label="Move up">${svg('up')}</button>
        <button data-nudge="${t.id}" data-dir="1" aria-label="Move down">${svg('down')}</button>
        <button data-shift="${t.id}" data-dir="1" ${si === STATUSES.length - 1 ? 'disabled' : ''} aria-label="Move right">${svg('right')}</button>
      </span>` : ''}
      <h4>${esc(t.title)}</h4>
      <div class="card-foot">
        ${d ? `<span class="due ${d.tone}">${esc(d.txt)}</span>` : '<span class="mini-prog">no date</span>'}
        ${t.owner ? avatar(Store.user(t.owner), 'sm') : '<span class="card-none"></span>'}
      </div>
    </article>`;
  }

  function boardHTML(p) {
    const tasks = p.tasks.slice().sort((a, b) => a.order - b.order);
    return `<div class="board" id="board">
      ${STATUSES.map(s => {
        const col = tasks.filter(t => t.status === s.id);
        return `<section class="col" data-col="${s.id}">
          <div class="col-head"><h3>${s.label}</h3><span class="n">${col.length}</span>
            <span class="hint">${esc(s.hint)}</span></div>
          <div class="col-list">${col.length ? col.map(t => taskCard(p, t)).join('') : '<p class="col-empty">Drop something here</p>'}</div>
        </section>`;
      }).join('')}
    </div>`;
  }

  function projectDetail(p) {
    const s = projectStats(p);
    const d = dueLabel(p.due);
    return `<div class="wrap">
      <button class="crumb" data-go="#/projects">${svg('left')} All projects</button>
      <div class="page-head">
        <div>
          <span class="tag t-${p.tone}">${esc(areaOf(p.area).label)}</span>
          <h1>${esc(p.name)}</h1>
          <p>${esc(p.goal)}</p>
        </div>
        <div class="page-actions">
          <span class="pill t-green"><b>${s.done}</b>/${s.total} done</span>
          ${d ? `<span class="pill t-red">${esc(d.txt)}</span>` : ''}
          ${Store.can('edit') ? `<button class="btn btn-outline" id="edit-project">Edit month</button>
          <button class="btn btn-dark" id="new-task">${svg('plus')}New task</button>` : ''}
        </div>
      </div>
      <p class="board-hint">Drag a card between columns — or use the little arrows on each card to move it
        left, right, up, or down without a mouse.</p>
      ${boardHTML(p)}
    </div>`;
  }

  let dragId = null;

  function wireBoard(root, p) {
    root.querySelectorAll('[data-card]').forEach(card => {
      card.addEventListener('dragstart', e => {
        dragId = card.dataset.card;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', dragId); } catch (err) {}
      });
      card.addEventListener('dragend', () => { card.classList.remove('dragging'); dragId = null; });
      card.addEventListener('click', e => {
        if (e.target.closest('.nudge')) return;
        openTaskSheet(p.id, card.dataset.card);
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTaskSheet(p.id, card.dataset.card); }
      });
    });

    root.querySelectorAll('[data-col]').forEach(col => {
      col.addEventListener('dragover', e => {
        if (!dragId) return;
        e.preventDefault(); e.dataTransfer.dropEffect = 'move';
        col.classList.add('over');
      });
      col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
      col.addEventListener('drop', e => {
        e.preventDefault(); col.classList.remove('over');
        if (!dragId) return;
        const cards = [...col.querySelectorAll('[data-card]')].filter(c => c.dataset.card !== dragId);
        let beforeId = null;
        for (const c of cards) {
          const r = c.getBoundingClientRect();
          if (e.clientY < r.top + r.height / 2) { beforeId = c.dataset.card; break; }
        }
        Store.moveTask(p.id, dragId, col.dataset.col, beforeId);
        dragId = null;
        HQ.render();
      });
    });

    root.querySelectorAll('[data-nudge]').forEach(b =>
      b.addEventListener('click', e => { e.stopPropagation(); Store.nudgeTask(p.id, b.dataset.nudge, Number(b.dataset.dir)); HQ.render(); }));
    root.querySelectorAll('[data-shift]').forEach(b =>
      b.addEventListener('click', e => { e.stopPropagation(); Store.shiftTask(p.id, b.dataset.shift, Number(b.dataset.dir)); HQ.render(); }));
  }

  function openTaskSheet(projectId, taskId) {
    HQ.openSheet(() => {
      const p = Store.project(projectId);
      const t = Store.taskRef(projectId, taskId);
      if (!p || !t) return null;
      const editable = Store.can('edit');
      return {
        cls: 't-' + p.tone,
        html: `
          <div class="sheet-head">
            <span class="tag">${esc(p.name)}</span>
            <button class="btn btn-ghost btn-sm" data-sheet-close aria-label="Close">${svg('close')}</button>
          </div>
          <div class="sheet-body">
            <textarea class="sheet-title" id="f-title" rows="2" ${editable ? '' : 'readonly'}>${esc(t.title)}</textarea>
            <div class="meta-grid">
              <div class="field"><label>Status</label>
                <select id="f-status" ${editable ? '' : 'disabled'}>
                  ${STATUSES.map(s => `<option value="${s.id}" ${s.id === t.status ? 'selected' : ''}>${s.label}</option>`).join('')}
                </select></div>
              <div class="field"><label>On it</label>
                <select id="f-owner" ${editable ? '' : 'disabled'}>
                  <option value="">No one yet</option>
                  ${Store.users().map(u => `<option value="${u.id}" ${u.id === t.owner ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}
                </select></div>
              <div class="field"><label>Due</label>
                <input type="date" id="f-due" value="${esc(t.due || '')}" ${editable ? '' : 'disabled'}></div>
              <div class="field"><label>Project</label>
                <select id="f-project" ${editable ? '' : 'disabled'}>
                  ${Store.projects().map(x => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}
                </select></div>
              <div class="field" style="grid-column:1/-1"><label>Campaign it serves</label>
                <select id="f-campaign" ${editable ? '' : 'disabled'}>
                  <option value="">Not tied to a campaign</option>
                  ${Store.campaigns().map(c => `<option value="${c.id}" ${c.id === (t.campaign || '') ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}
                </select></div>
            </div>
            <div class="field"><label for="f-notes">Notes</label>
              <textarea id="f-notes" ${editable ? '' : 'readonly'}>${esc(t.notes || '')}</textarea></div>
            ${editable ? `<div class="sheet-danger">
              <span style="font-size:.78rem;color:var(--ink-faint)">Added ${ago(t.createdAt)}</span>
              <button class="link-danger" id="del-task">Remove this task</button>
            </div>` : ''}
          </div>`,
        wire(sheet) {
          const ta = sheet.querySelector('#f-title');
          const autosize = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
          autosize();
          if (!editable) return;
          ta.addEventListener('input', autosize);
          ta.addEventListener('change', () => { Store.updateTask(p.id, t.id, { title: ta.value.trim() || 'Untitled task' }); HQ.render(); });
          sheet.querySelector('#f-status').addEventListener('change', e => { Store.moveTask(p.id, t.id, e.target.value, null); HQ.render(); HQ.refreshSheet(); });
          sheet.querySelector('#f-owner').addEventListener('change', e => { Store.updateTask(p.id, t.id, { owner: e.target.value || null }); HQ.render(); });
          sheet.querySelector('#f-due').addEventListener('change', e => { Store.updateTask(p.id, t.id, { due: e.target.value }); HQ.render(); });
          sheet.querySelector('#f-campaign').addEventListener('change', e => { Store.updateTask(p.id, t.id, { campaign: e.target.value }); HQ.render(); });
          sheet.querySelector('#f-notes').addEventListener('change', e => Store.updateTask(p.id, t.id, { notes: e.target.value }));
          sheet.querySelector('#f-project').addEventListener('change', e => {
            const target = e.target.value;
            if (target === p.id) return;
            Store.createTask(target, { title: t.title, status: t.status, owner: t.owner, due: t.due, notes: t.notes });
            Store.removeTask(p.id, t.id);
            HQ.closeSheet(); HQ.render(); toast('Moved to another project.');
          });
          sheet.querySelector('#del-task').addEventListener('click', () => {
            if (!confirm('Remove “' + t.title + '”?')) return;
            Store.removeTask(p.id, t.id); HQ.closeSheet(); HQ.render(); toast('Removed.');
          });
        }
      };
    });
  }

  function openProjectSheet(projectId) {
    HQ.openSheet(() => {
      const p = Store.project(projectId);
      if (!p) return null;
      const editable = Store.can('edit');
      return {
        cls: 't-' + p.tone,
        html: `
          <div class="sheet-head">
            <span class="tag">${esc(areaOf(p.area).label)}</span>
            <button class="btn btn-ghost btn-sm" data-sheet-close aria-label="Close" style="margin-left:auto">${svg('close')}</button>
          </div>
          <div class="sheet-body">
            <textarea class="sheet-title" id="pj-name" rows="2" ${editable ? '' : 'readonly'}>${esc(p.name)}</textarea>
            <div class="field"><label for="pj-goal">The goal — what this month is for</label>
              <textarea id="pj-goal" ${editable ? '' : 'readonly'}>${esc(p.goal || '')}</textarea></div>
            <div class="meta-grid">
              <div class="field"><label>Area</label>
                <select id="pj-area" ${editable ? '' : 'disabled'}>
                  ${AREAS.map(a => `<option value="${a.id}" ${a.id === p.area ? 'selected' : ''}>${a.label}</option>`).join('')}
                </select></div>
              <div class="field"><label>Wraps up by</label>
                <input type="date" id="pj-due" value="${esc(p.due || '')}" ${editable ? '' : 'disabled'}></div>
            </div>
            ${editable ? `<div class="sheet-danger">
              <span style="font-size:.78rem;color:var(--ink-faint)">${p.tasks.length} task${p.tasks.length === 1 ? '' : 's'} inside</span>
              <button class="link-danger" id="pj-del">Remove this month</button>
            </div>` : ''}
          </div>`,
        wire(sheet) {
          if (!editable) return;
          const n = sheet.querySelector('#pj-name');
          const auto = () => { n.style.height = 'auto'; n.style.height = n.scrollHeight + 'px'; };
          auto(); n.addEventListener('input', auto);
          n.addEventListener('change', () => { Store.updateProject(p.id, { name: n.value.trim() || 'Untitled month' }); HQ.render(); });
          sheet.querySelector('#pj-goal').addEventListener('change', e => { Store.updateProject(p.id, { goal: e.target.value }); HQ.render(); });
          sheet.querySelector('#pj-area').addEventListener('change', e => {
            Store.updateProject(p.id, { area: e.target.value, tone: areaOf(e.target.value).tone });
            HQ.render(); HQ.refreshSheet();
          });
          sheet.querySelector('#pj-due').addEventListener('change', e => { Store.updateProject(p.id, { due: e.target.value }); HQ.render(); });
          sheet.querySelector('#pj-del').addEventListener('click', () => {
            if (!confirm('Remove “' + p.name + '” and the ' + p.tasks.length + ' task(s) inside it?')) return;
            Store.removeProject(p.id);
            HQ.closeSheet(); go('#/projects'); toast('Removed.');
          });
        }
      };
    });
  }

  HQ.view('projects', {
    render(r) {
      const p = r.id ? Store.project(r.id) : null;
      return p ? projectDetail(p) : projectsIndex();
    },
    wire(root, r) {
      const p = r.id ? Store.project(r.id) : null;
      if (p) {
        wireBoard(root, p);
        const nt = root.querySelector('#new-task');
        if (nt) nt.addEventListener('click', () => {
          const t = Store.createTask(p.id, { status: 'next' });
          HQ.render(); openTaskSheet(p.id, t.id);
        });
        const ep = root.querySelector('#edit-project');
        if (ep) ep.addEventListener('click', () => openProjectSheet(p.id));
      } else {
        wireProjToggle(root);
        const cs = root.querySelector('#camp-scope-toggle');
        if (cs) cs.addEventListener('click', () => { showAllCampaigns = !showAllCampaigns; HQ.render(); });
        wireTaskRows(root);
        wireTaskBoard(root);
        root.querySelectorAll('[data-piece]').forEach(b =>
          b.addEventListener('click', () => go('#/plan')));
        HQ.inlineText(root, '[data-ipiece]', (el, v) => {
          Store.updatePiece(el.dataset.ipiece, { title: v }); HQ.render();
        });
        HQ.stopRow(root, '[data-ipstatus]');
        root.querySelectorAll('[data-ipstatus]').forEach(el =>
          el.addEventListener('click', () => {
            const keys = Object.keys(PLAN_STATUS);
            const p = Store.piece(el.dataset.ipstatus);
            if (!p) return;
            const next = keys[(keys.indexOf(p.status) + 1) % keys.length];
            Store.updatePiece(p.id, { status: next });
            HQ.render();
          }));
        const bf = root.querySelector('#cc-brief-frame');
        if (bf) bf.addEventListener('load', () => {
          try {
            const d = bf.contentDocument;
            if (d && !d.documentElement.getAttribute('data-theme')) {
              d.documentElement.setAttribute('data-theme', 'light');
            }
          } catch (e) {}
        });
        const np = root.querySelector('#new-project');
        if (np) np.addEventListener('click', () => {
          const proj = Store.createProject({ name: 'New project' });
          go('#/projects/' + proj.id);
          setTimeout(() => openProjectSheet(proj.id), 60);
        });
      }
    }
  });

  /* ============================== STRATEGY ============================== */
  HQ.view('strategy', {
    render() {
      return `<div class="wrap-narrow">
        <div class="page-head">
          <div><h1>Branding</h1><p>The decisions that are already made — so nobody rewrites the brand from
            memory at eleven at night. Click any line to copy it.</p></div>
        </div>

        ${MESSAGING.map(g => `<section class="msg-group">
          <h2 style="font-size:1.15rem">${esc(g.group)}</h2>
          <p>${esc(g.note)}</p>
          <div class="msg-lines">
            ${g.lines.map(l => `<button class="msg-line" data-copy="${esc(l.text)}">
              <q>${esc(l.text)}</q><span class="msg-use">${esc(l.use)}</span>
              <span class="msg-copy">${svg('copy')}</span></button>`).join('')}
          </div>
        </section>`).join('')}

        <section class="msg-group">
          <h2 style="font-size:1.15rem">Palette</h2>
          <p>Red is the accent, navy is the ground. Red is never a surface you put body copy on.</p>
          <div class="swatches">
            ${BRAND_TOKENS.map(t => `<button class="swatch" data-copy="${t.hex}">
              <i style="background:${t.hex}"></i>
              <b>${esc(t.name)}</b><span>${t.hex}</span><small>${esc(t.use)}</small></button>`).join('')}
          </div>
        </section>

        <section class="msg-group">
          <h2 style="font-size:1.15rem">The product lineup</h2>
          <p>Prices as they are in the live store. The colour is the relief tier, not the brand palette.</p>
          <div class="prod-grid">
            ${PRODUCTS.map(p => `<div class="prod t-${p.tone}">
              <div class="prod-top">
                <b>${esc(p.name)}</b>
                <span class="prod-price">${p.price ? '$' + p.price.toFixed(2) : (p.status === 'rx' ? 'Rx' : 'Soon')}</span>
              </div>
              <span class="prod-tier">${esc(p.tier)}</span>
              <p>${esc(p.line)}</p>
            </div>`).join('')}
          </div>
        </section>

        <section class="msg-group">
          <h2 style="font-size:1.15rem">Settled arguments</h2>
          <p>Things that have already been decided, sometimes twice. These override a good idea.</p>
          <ul class="speclist guard-list">
            ${BRAND_RULES.map(r => `<li>${esc(r)}</li>`).join('')}
          </ul>
        </section>

        <section class="msg-group">
          <h2 style="font-size:1.15rem">Offer codes</h2>
          <p>What exists or is proposed. A code has to be live in-store before the asset that names it posts.</p>
          <div class="code-grid">
            ${OFFER_CODES.map(o => `<button class="codechip" data-copy="${esc(o.code)}">
              <b>${esc(o.code)}</b><span>${esc(o.what)}</span></button>`).join('')}
          </div>
        </section>
      </div>`;
    },
    wire(root) {
      root.querySelectorAll('[data-copy]').forEach(b =>
        b.addEventListener('click', () => copy(b.dataset.copy)));
    }
  });

  /* ============================== IDEAS ============================== */
  let ideaFilter = 'open';

  HQ.view('ideas', {
    render() {
      const me = Store.currentUser();
      const all = Store.ideas();
      const list = all.filter(d => ideaFilter === 'all' || d.state === ideaFilter)
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));
      const tabs = [['open', 'Open'], ['promoted', 'Promoted'], ['parked', 'Parked'], ['all', 'Everything']];
      return `<div class="wrap-narrow">
        <div class="page-head">
          <div><h1>Idea Bank</h1><p>Somewhere to put a thought so it stops taking up room. Nothing here is a
            commitment until someone promotes it into a project.</p></div>
        </div>

        ${Store.can('edit') ? `<form class="idea-add" id="idea-add">
          <input id="idea-text" placeholder="What if we…" aria-label="New idea">
          <select id="idea-area" aria-label="Area">
            ${AREAS.map(a => `<option value="${a.id}">${a.label}</option>`).join('')}
          </select>
          <button class="btn btn-dark" type="submit">${svg('plus')}Capture</button>
        </form>` : ''}

        <div class="seg" style="margin:1.2rem 0 .9rem">
          ${tabs.map(([k, l]) => `<button data-ideatab="${k}" class="${ideaFilter === k ? 'on' : ''}">${l}</button>`).join('')}
        </div>

        <div class="idea-list">
          ${list.length ? list.map(d => {
            const u = Store.user(d.by);
            const voted = (d.voters || []).includes(me.id);
            const a = areaOf(d.area);
            return `<div class="idea t-${a.tone} ${d.state !== 'open' ? 'muted' : ''}">
              <button class="idea-vote ${voted ? 'on' : ''}" data-vote="${d.id}" aria-label="Vote">
                ${svg('up')}<b>${d.votes || 0}</b>
              </button>
              <div class="idea-body">
                <p>${esc(d.text)}</p>
                <span class="row-meta">${esc(a.label)} · ${esc(u ? u.name.split(' ')[0] : 'Someone')} · ${ago(d.at)}${d.state !== 'open' ? ' · ' + esc(d.state) : ''}</span>
              </div>
              ${Store.can('edit') ? `<div class="idea-acts">
                <button class="btn btn-outline btn-sm" data-write="${d.id}" title="Start an article from this">${svg('pen')}Write it</button>
                <select data-promote="${d.id}" aria-label="Promote to project">
                  <option value="">Promote to…</option>
                  ${Store.projects().map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}
                </select>
                <button class="btn btn-ghost btn-sm" data-park="${d.id}" title="${d.state === 'parked' ? 'Unpark' : 'Park it'}">${d.state === 'parked' ? svg('up') : svg('down')}</button>
                <button class="btn btn-ghost btn-sm" data-delidea="${d.id}" aria-label="Delete">${svg('trash')}</button>
              </div>` : ''}
            </div>`;
          }).join('') : '<p class="panel-empty">Nothing here yet.</p>'}
        </div>
      </div>`;
    },
    wire(root) {
      const f = root.querySelector('#idea-add');
      if (f) f.addEventListener('submit', e => {
        e.preventDefault();
        const t = root.querySelector('#idea-text');
        if (!t.value.trim()) return;
        Store.addIdea(t.value, root.querySelector('#idea-area').value);
        HQ.render(); toast('Captured.');
      });
      root.querySelectorAll('[data-ideatab]').forEach(b =>
        b.addEventListener('click', () => { ideaFilter = b.dataset.ideatab; HQ.render(); }));
      root.querySelectorAll('[data-vote]').forEach(b =>
        b.addEventListener('click', () => { Store.voteIdea(b.dataset.vote); HQ.render(); }));
      root.querySelectorAll('[data-promote]').forEach(s =>
        s.addEventListener('change', () => {
          if (!s.value) return;
          Store.promoteIdea(s.dataset.promote, s.value);
          HQ.render(); toast('Promoted into the project.');
        }));
      root.querySelectorAll('[data-write]').forEach(b =>
        b.addEventListener('click', () => {
          const a = Store.ideaToArticle(b.dataset.write);
          if (a) go('#/content/' + a.id);
        }));
      root.querySelectorAll('[data-park]').forEach(b =>
        b.addEventListener('click', () => {
          const d = Store.ideas().find(x => x.id === b.dataset.park);
          Store.setIdeaState(d.id, d.state === 'parked' ? 'open' : 'parked');
          HQ.render();
        }));
      root.querySelectorAll('[data-delidea]').forEach(b =>
        b.addEventListener('click', () => { Store.removeIdea(b.dataset.delidea); HQ.render(); }));
    }
  });

  /* ============================== ANALYTICS ============================== */
  let pasted = null;

  function num(v) { const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }

  HQ.view('analytics', {
    render() {
      const counts = pasted && pasted.counts ? pasted.counts : null;
      const m = Store.metricsOf();
      const editable = Store.can('edit');

      const t = { spend: 0, sessions: 0, orders: 0, revenue: 0 };
      ROI_ROWS.forEach(r => ROI_COLS.forEach(col => { t[col.k] += num(m[r.k] && m[r.k][col.k]); }));
      const roas = t.spend > 0 ? t.revenue / t.spend : 0;
      const cpo = t.orders > 0 ? t.spend / t.orders : 0;
      const aov = t.orders > 0 ? t.revenue / t.orders : 0;
      const margin = num(m.margin);
      const roi = t.spend > 0 && margin ? ((t.revenue * (margin / 100) - t.spend) / t.spend) * 100 : null;

      const cms = Store.articleStats();

      return `<div class="wrap">
        <div class="page-head">
          <div><h1>Analytics</h1><p>What the site counts, what the channels returned, and what the content
            is actually doing. Per-campaign ROI stays in the Studio — this is the rollup across all of it.</p></div>
        </div>

        <div class="metric-grid" style="margin-bottom:1.2rem">
          <div class="metric-card big"><h3>$${Math.round(t.revenue).toLocaleString()}</h3><p>Revenue logged</p></div>
          <div class="metric-card big"><h3>${roas ? roas.toFixed(2) + '×' : '—'}</h3><p>Blended ROAS</p></div>
          <div class="metric-card big"><h3>${cpo ? '$' + cpo.toFixed(2) : '—'}</h3><p>Cost per order</p></div>
          <div class="metric-card big"><h3>${aov ? '$' + aov.toFixed(2) : '—'}</h3><p>Average order — basket is $29.95–$39.95</p></div>
        </div>

        <section class="panel" style="margin-bottom:1.1rem">
          <div class="panel-head"><h2>By channel</h2>
            <span class="note">type the real numbers in — nothing is auto-pulled yet</span></div>
          <div class="mtable-wrap">
            <table class="m-track">
              <tr><th>Channel</th>${ROI_COLS.map(c => `<th>${c.label}</th>`).join('')}<th>Cost / order</th></tr>
              ${ROI_ROWS.map(r => {
                const row = m[r.k] || {};
                const sp = num(row.spend), or = num(row.orders);
                return `<tr>
                  <td class="m-rowlabel">${esc(r.label)}</td>
                  ${ROI_COLS.map(col => `<td><input class="m-in" data-metric="${r.k}:${col.k}"
                    value="${esc(row[col.k] == null ? '' : row[col.k])}" placeholder="—"
                    aria-label="${esc(r.label)} ${esc(col.label)}" ${editable ? '' : 'disabled'}></td>`).join('')}
                  <td>${or > 0 ? '$' + (sp / or).toFixed(2) : '—'}</td>
                </tr>`;
              }).join('')}
              <tr class="m-total">
                <td class="m-rowlabel">Total</td>
                ${ROI_COLS.map(col => `<td>${col.money ? '$' + Math.round(t[col.k]).toLocaleString() : Math.round(t[col.k]).toLocaleString()}</td>`).join('')}
                <td>${cpo ? '$' + cpo.toFixed(2) : '—'}</td>
              </tr>
            </table>
          </div>
          <div class="m-margin">
            <label for="m-margin-in">Gross margin %</label>
            <input id="m-margin-in" class="m-in" value="${esc(m.margin == null ? '' : m.margin)}" placeholder="e.g. 62" ${editable ? '' : 'disabled'}>
            <span class="m-roi">${roi == null ? 'Add a margin to see estimated ROI' : 'Estimated ROI <b>' + roi.toFixed(0) + '%</b>'}</span>
          </div>
        </section>

        <section class="panel" style="margin-bottom:1.1rem">
          <div class="panel-head"><h2>The content engine</h2><span class="note">from the CMS</span></div>
          <div class="metric-grid">
            <div class="metric-card stat"><h3>${cms.published}</h3><p>Published</p></div>
            <div class="metric-card stat"><h3>${cms.review + cms.changes}</h3><p>In the review loop</p></div>
            <div class="metric-card stat"><h3>${cms.scheduled}</h3><p>Scheduled ahead</p></div>
            <div class="metric-card stat"><h3>${cms.views.toLocaleString()}</h3><p>Article views recorded</p></div>
          </div>
        </section>

        <section class="panel" style="margin-bottom:1.1rem">
          <div class="panel-head"><h2>Read the site’s real counts</h2><span class="note">optional</span></div>
          <p style="font-size:.85rem;color:var(--ink-soft);margin-bottom:.7rem">
            Counts live in each browser under <code>sportpharm-metrics</code>. Paste that JSON here to read it —
            nothing leaves this page.
          </p>
          <form class="check-add" id="metrics-form">
            <input type="text" placeholder='{"counts":{"view_index":42,…}}' aria-label="Paste sportpharm-metrics JSON">
            <button class="btn btn-outline btn-sm" type="submit">Read it</button>
          </form>
        </section>

        <div class="metric-grid">
          ${ANALYTICS_PLAN.map(x => `<div class="metric-card">
            <h3 class="plan-h">${esc(x.name)}</h3><p>${esc(x.metric)}</p>
            ${x.events.map(ev => {
              const has = counts && counts[ev] != null;
              return `<div class="evt ${has ? '' : 'muted'}"><code>${esc(ev)}</code><b>${has ? counts[ev] : '—'}</b></div>`;
            }).join('')}
          </div>`).join('')}
        </div>
      </div>`;
    },
    wire(root) {
      const f = root.querySelector('#metrics-form');
      if (f) f.addEventListener('submit', e => {
        e.preventDefault();
        try {
          pasted = JSON.parse(e.target.querySelector('input').value.trim());
          toast('Read ' + Object.keys(pasted.counts || {}).length + ' events.');
        } catch (err) { pasted = null; toast('That isn’t valid JSON.'); }
        HQ.render();
      });
      root.querySelectorAll('[data-metric]').forEach(el =>
        el.addEventListener('change', () => {
          const [row, col] = el.dataset.metric.split(':');
          Store.setMetric(row, col, el.value);
          HQ.render();
        }));
      const mg = root.querySelector('#m-margin-in');
      if (mg) mg.addEventListener('change', () => { Store.setMargin(mg.value); HQ.render(); });
    }
  });

  /* ============================== TEAM ============================== */
  HQ.view('team', {
    render() {
      const me = Store.currentUser();
      const canManage = Store.can('manageTeam');
      return `<div class="wrap-narrow">
        <div class="page-head"><div><h1>Team</h1><p>Who can see this, and what each of them can do.</p></div></div>
        <div class="team-grid">
          ${Store.users().map(u => {
            const load = Store.allTasks().filter(t => t.owner === u.id && t.status !== 'shipped').length;
            return `<div class="team-row">
              ${avatar(u)}
              <div class="who"><b>${esc(u.name)}${u.id === me.id ? ' · you' : ''}</b>
                <span>${esc(u.email)}${u.title ? ' · ' + esc(u.title) : ''} · ${load} open</span></div>
              <div class="right">
                ${u.pending ? '<span class="badge-pending">Invited</span>' : ''}
                ${canManage && u.id !== me.id
                  ? `<select data-role="${u.id}">${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${u.role === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
                     <button class="btn btn-ghost btn-sm" data-remove="${u.id}" aria-label="Remove">${svg('trash')}</button>`
                  : `<span class="msg-use">${esc(ROLES[u.role].label)}</span>`}
              </div>
            </div>`;
          }).join('')}
        </div>

        ${canManage ? `<section class="panel" style="margin-top:1.4rem">
          <div class="panel-head"><h2>Invite someone</h2><span class="note">they get a one-time code</span></div>
          <form class="invite-form" id="invite-form">
            <div class="field"><label for="inv-name">Name</label><input id="inv-name" required placeholder="Their name"></div>
            <div class="field"><label for="inv-email">Email</label><input id="inv-email" type="email" required placeholder="them@sportpharm.care"></div>
            <div class="field"><label for="inv-role">Role</label>
              <select id="inv-role">${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${k === 'editor' ? 'selected' : ''}>${v.label}</option>`).join('')}</select></div>
            <button class="btn btn-dark" type="submit">Invite</button>
          </form>
          <div id="invite-out"></div>
        </section>` : ''}

        <section class="panel" style="margin-top:1.1rem">
          <div class="panel-head"><h2>What each role can do</h2></div>
          ${Object.entries(ROLES).map(([k, v]) => `<div class="set-row"><div class="body"><b>${v.label}</b><span>${v.can}</span></div></div>`).join('')}
        </section>

        <section class="panel" style="margin-top:1.1rem">
          <div class="panel-head"><h2>Everything that has happened</h2></div>
          ${Store.activity().length ? `<ul class="activity">${Store.activity().slice(0, 30).map(f => {
            const u = Store.user(f.by);
            return `<li><b>${esc(u ? u.name.split(' ')[0] : 'Someone')}</b> ${esc(f.action)}${f.target ? ' — ' + esc(f.target) : ''} · ${ago(f.at)}</li>`;
          }).join('')}</ul>` : '<p class="panel-empty">Nothing logged yet.</p>'}
        </section>
      </div>`;
    },
    wire(root) {
      root.querySelectorAll('[data-role]').forEach(s =>
        s.addEventListener('change', () => { Store.setRole(s.dataset.role, s.value); toast('Role updated.'); HQ.render(); }));
      root.querySelectorAll('[data-remove]').forEach(b =>
        b.addEventListener('click', () => {
          const u = Store.user(b.dataset.remove);
          if (!confirm('Remove ' + u.name + ' from SportPharm HQ?')) return;
          Store.removeUser(u.id); HQ.render(); toast('Removed.');
        }));
      const form = root.querySelector('#invite-form');
      if (form) form.addEventListener('submit', e => {
        e.preventDefault();
        const r = Store.invite($('#inv-name').value, $('#inv-email').value, $('#inv-role').value);
        HQ.render();
        const host = $('#invite-out');
        if (host) host.innerHTML = `<div class="invite-out">Send ${esc(r.user.name)} the workspace password and this one-time code — they pick their seat and enter the code as their passcode.<code>${esc(r.code)}</code></div>`;
      });
    }
  });

  /* ============================== SETTINGS ============================== */
  HQ.view('settings', {
    render() {
      const me = Store.currentUser();
      const rules = Store.planRules();
      return `<div class="wrap-narrow">
        <div class="page-head"><div><h1>Settings</h1><p>Small things, kept out of the way.</p></div></div>

        <section class="panel">
          <div class="panel-head"><h2>Your seat</h2></div>
          <div class="set-row">${avatar(me)}
            <div class="body"><b>${esc(me.name)}</b><span>${esc(me.email)} · ${esc(ROLES[me.role].label)}</span></div>
            <button class="btn btn-outline btn-sm" id="set-pass">Change passcode</button></div>
          <div class="set-row"><div class="body"><b>Sign out</b><span>Ends this session on this browser.</span></div>
            <button class="btn btn-outline btn-sm" id="set-out">Sign out</button></div>
        </section>

        <section class="panel" style="margin-top:1.1rem">
          <div class="panel-head"><h2>How publishing works here</h2></div>
          <div class="set-row"><div class="body"><b>Require review before publishing</b>
            <span>With this on, nothing goes from draft straight to live, and an editor can’t clear
              their own writing. Owners can always unblock.</span></div>
            <label class="toggle"><input type="checkbox" id="set-review" ${rules.requireReview ? 'checked' : ''}
              ${Store.can('manageTeam') ? '' : 'disabled'}><span></span></label></div>
          <div class="set-row"><div class="body"><b>Skip weekends when scheduling</b>
            <span>Applies to bulk-scheduling in the Plan.</span></div>
            <label class="toggle"><input type="checkbox" id="set-weekends" ${rules.avoidWeekends ? 'checked' : ''}
              ${Store.can('edit') ? '' : 'disabled'}><span></span></label></div>
        </section>

        <section class="panel" style="margin-top:1.1rem">
          <div class="panel-head"><h2>This workspace</h2></div>
          <div class="set-row"><div class="body"><b>Export</b><span>Everything as JSON — the same shape the Supabase tables use.</span></div>
            <button class="btn btn-outline btn-sm" id="set-export">Download</button></div>
          <div class="set-row"><div class="body"><b>Export the published feed</b>
            <span>Only what is live — the shape <code>articles.html</code> will read.</span></div>
            <button class="btn btn-outline btn-sm" id="set-feed">Download</button></div>
          <div class="set-row"><div class="body"><b>Start over</b><span>Wipes this browser and reseeds. There is no undo.</span></div>
            <button class="link-danger" id="set-reset">Reset everything</button></div>
        </section>

        <section class="panel" style="margin-top:1.1rem">
          <div class="panel-head"><h2>Where this data lives</h2></div>
          <p style="font-size:.85rem;color:var(--ink-soft);line-height:1.65">
            In this browser, for now. Every read and write goes through one file — <code>hq-store.js</code> —
            and <code>supabase/hq.sql</code> already defines the same tables with row-level security, so moving
            to real shared accounts is a swap of that one file rather than a rewrite.
          </p>
          <p style="font-size:.85rem;color:var(--ink-soft);line-height:1.65;margin-top:.7rem">
            One exception, on purpose: <b>Campaigns</b> is the Content Studio, and it keeps its own Supabase
            project and its own sign-in. Brandon and Jessie’s approvals and comment threads stay exactly where
            they already are, and nothing had to be migrated to mount it here.
          </p>
        </section>
      </div>`;
    },
    wire(root) {
      root.querySelector('#set-out').addEventListener('click', () => { Store.signOut(); location.reload(); });
      root.querySelector('#set-pass').addEventListener('click', () => {
        const code = prompt('New passcode for this seat:');
        if (!code) return;
        Store.setPasscode(Store.currentUser().id, code);
        toast('Passcode changed on this browser.');
      });
      const rv = root.querySelector('#set-review');
      if (rv) rv.addEventListener('change', () => {
        Store.setPlanRules({ requireReview: rv.checked });
        toast(rv.checked ? 'Review is required again.' : 'Review is off — anything can be published.');
      });
      const wk = root.querySelector('#set-weekends');
      if (wk) wk.addEventListener('change', () => Store.setPlanRules({ avoidWeekends: wk.checked }));

      const download = (data, name) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name; a.click();
        URL.revokeObjectURL(a.href);
      };
      root.querySelector('#set-export').addEventListener('click', () => download(Store.load(), 'sportpharm-hq.json'));
      root.querySelector('#set-feed').addEventListener('click', () => download(Store.publishedFeed(), 'sportpharm-articles.json'));
      root.querySelector('#set-reset').addEventListener('click', () => {
        if (!confirm('Reset everything on this browser?')) return;
        Store.resetAll(); location.reload();
      });
    }
  });
})();

/* =============================================================================
   PLATFORMS — what we might spend on, what it costs, and how we'll decide
============================================================================= */
(() => {
  'use strict';
  const { esc, svg, avatar, ago, toast } = HQ;

  const catOf = id => PLATFORM_CATS.find(c => c.id === id) || PLATFORM_CATS[0];
  const money = n => '$' + Math.round(Number(n) || 0).toLocaleString();
  let platFilter = 'all';

  function totals() {
    const t = { active: 0, trial: 0, ifAll: 0, count: 0 };
    Store.platforms().forEach(p => {
      const c = Number(p.cost) || 0;
      if (p.status === 'active') t.active += c;
      if (p.status === 'trial') t.trial += c;
      if (p.status !== 'passed') { t.ifAll += c; t.count++; }
    });
    return t;
  }

  function decideLabel(p) {
    if (p.status === 'active' || p.status === 'passed' || !p.decideBy) return null;
    return HQ.dueLabel(p.decideBy);
  }

  function card(p) {
    const cat = catOf(p.cat);
    const d = decideLabel(p);
    const editable = Store.can('edit');
    return `<article class="plat t-${cat.tone} pst-${p.status}" data-plat="${p.id}" tabindex="0">
      <div class="plat-top">
        <span class="tag">${esc(cat.label)}</span>
        <span class="plat-state ${p.status}">${PLATFORM_STATES[p.status].label}</span>
      </div>
      <div class="plat-name-row">
        <h4>${esc(p.name)}</h4>
        <span class="plat-cost">${Number(p.cost) ? money(p.cost) + '<small>/mo</small>' : '<small>free</small>'}</span>
      </div>
      ${p.pricing ? `<p class="plat-pricing">${esc(p.pricing)}</p>` : ''}
      <p class="plat-what">${esc(p.what)}</p>
      <div class="plat-judge"><span>How we’ll decide</span>${esc(p.judge)}</div>
      ${p.verdict ? `<div class="plat-verdict">${esc(p.verdict)}</div>` : ''}
      <div class="plat-foot">
        ${editable ? Object.keys(PLATFORM_STATES).map(k =>
          `<button class="pst-btn ${k} ${p.status === k ? 'on' : ''}" data-pstate="${p.id}:${k}">${PLATFORM_STATES[k].label}</button>`).join('') : ''}
        <span class="plat-side">
          ${d ? `<span class="due ${d.tone}">decide by ${esc(d.txt.replace(' · overdue', ''))}${d.tone === 'late' ? ' · overdue' : ''}</span>` : ''}
          ${p.owner ? avatar(Store.user(p.owner), 'sm') : ''}
        </span>
      </div>
    </article>`;
  }

  HQ.view('platforms', {
    render() {
      const t = totals();
      const order = ['trial', 'evaluating', 'active', 'passed'];
      const list = Store.platforms()
        .filter(p => platFilter === 'all' || p.cat === platFilter)
        .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || (Number(b.cost) || 0) - (Number(a.cost) || 0));
      return `<div class="wrap">
        <div class="page-head">
          <div><h1>Platforms</h1>
            <p>Everything SportPharm might spend money on — what it costs, what it’s for, and how we’ll
               decide. Passed platforms stay, so the “why not” is never re-argued from scratch.</p></div>
          <div class="page-actions">
            ${Store.can('edit') ? `<button class="btn btn-dark" id="new-plat">${svg('plus')}Add a platform</button>` : ''}
          </div>
        </div>

        <div class="metric-grid" style="margin-bottom:1.2rem">
          <div class="metric-card big"><h3>${money(t.active)}<small class="permo">/mo</small></h3><p>Active — what we actually pay now</p></div>
          <div class="metric-card big"><h3>${money(t.trial)}<small class="permo">/mo</small></h3><p>In trial — spending to learn</p></div>
          <div class="metric-card big"><h3>${money(t.ifAll)}<small class="permo">/mo</small></h3><p>If everything under evaluation is kept</p></div>
          <div class="metric-card big"><h3>${money(t.ifAll * 12)}</h3><p>That, as a year — the number to respect</p></div>
        </div>

        <div class="toolbar">
          <div class="chipbar">
            <button class="chip ${platFilter === 'all' ? 'on' : ''}" data-pcat="all">Everything</button>
            ${PLATFORM_CATS.map(c => `<button class="chip t-${c.tone} ${platFilter === c.id ? 'on' : ''}" data-pcat="${c.id}">${esc(c.label)}</button>`).join('')}
          </div>
        </div>

        <div class="plat-grid">
          ${list.length ? list.map(card).join('') : '<p class="panel-empty">Nothing in this category yet.</p>'}
        </div>
      </div>`;
    },
    wire(root) {
      root.querySelectorAll('[data-pcat]').forEach(b =>
        b.addEventListener('click', () => { platFilter = b.dataset.pcat; HQ.render(); }));

      root.querySelectorAll('[data-pstate]').forEach(b =>
        b.addEventListener('click', e => {
          e.stopPropagation();
          const [id, st] = b.dataset.pstate.split(':');
          Store.setPlatformStatus(id, st);
          HQ.render();
        }));

      root.querySelectorAll('[data-plat]').forEach(el => {
        el.addEventListener('click', e => {
          if (e.target.closest('.pst-btn')) return;
          openPlatformSheet(el.dataset.plat);
        });
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlatformSheet(el.dataset.plat); }
        });
      });

      const np = root.querySelector('#new-plat');
      if (np) np.addEventListener('click', () => {
        const p = Store.addPlatform({});
        HQ.render(); openPlatformSheet(p.id);
      });
    }
  });

  function openPlatformSheet(id) {
    HQ.openSheet(() => {
      const p = Store.platform(id);
      if (!p) return null;
      const cat = catOf(p.cat);
      const editable = Store.can('edit');
      const field = (label, id2, val, kind) => `
        <div class="field"><label for="${id2}">${label}</label>
          ${kind === 'area'
            ? `<textarea id="${id2}" ${editable ? '' : 'readonly'}>${esc(val || '')}</textarea>`
            : `<input id="${id2}" type="${kind || 'text'}" value="${esc(val == null ? '' : String(val))}" ${editable ? '' : 'disabled'}>`}
        </div>`;
      return {
        cls: 't-' + cat.tone,
        html: `
          <div class="sheet-head">
            <span class="tag">${esc(cat.label)}</span>
            <span class="plat-state ${p.status}">${PLATFORM_STATES[p.status].label}</span>
            <button class="btn btn-ghost btn-sm" data-sheet-close aria-label="Close" style="margin-left:auto">${svg('close')}</button>
          </div>
          <div class="sheet-body">
            <textarea class="sheet-title" id="pf-name" rows="2" ${editable ? '' : 'readonly'}>${esc(p.name)}</textarea>
            <div class="meta-grid">
              <div class="field"><label>Category</label>
                <select id="pf-cat" ${editable ? '' : 'disabled'}>
                  ${PLATFORM_CATS.map(c => `<option value="${c.id}" ${c.id === p.cat ? 'selected' : ''}>${c.label}</option>`).join('')}
                </select></div>
              <div class="field"><label>Status</label>
                <select id="pf-status" ${editable ? '' : 'disabled'}>
                  ${Object.entries(PLATFORM_STATES).map(([k, v]) => `<option value="${k}" ${k === p.status ? 'selected' : ''}>${v.label}</option>`).join('')}
                </select></div>
              ${field('Cost per month ($)', 'pf-cost', p.cost, 'number')}
              ${field('Decide by', 'pf-decide', p.decideBy, 'date')}
              <div class="field"><label>Who’s evaluating</label>
                <select id="pf-owner" ${editable ? '' : 'disabled'}>
                  <option value="">No one yet</option>
                  ${Store.users().map(u => `<option value="${u.id}" ${u.id === p.owner ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}
                </select></div>
            </div>
            ${field('Pricing notes', 'pf-pricing', p.pricing)}
            ${field('What it’s for', 'pf-what', p.what, 'area')}
            ${field('How we’ll decide', 'pf-judge', p.judge, 'area')}
            ${field('Verdict — the why, kept', 'pf-verdict', p.verdict, 'area')}
            ${editable ? `<div class="sheet-danger">
              <span style="font-size:.78rem;color:var(--ink-faint)">Added ${ago(p.createdAt)}</span>
              <button class="link-danger" id="pf-del">Remove this platform</button>
            </div>` : ''}
          </div>`,
        wire(sheet) {
          if (!editable) return;
          const bind = (sel, key, log) => {
            const el = sheet.querySelector(sel);
            el.addEventListener('change', () => {
              Store.updatePlatform(p.id, { [key]: el.value }, log);
              HQ.render(); HQ.refreshSheet();
            });
          };
          const name = sheet.querySelector('#pf-name');
          const autosize = () => { name.style.height = 'auto'; name.style.height = name.scrollHeight + 'px'; };
          autosize();
          name.addEventListener('input', autosize);
          name.addEventListener('change', () => { Store.updatePlatform(p.id, { name: name.value.trim() || 'Untitled platform' }); HQ.render(); });
          bind('#pf-cat', 'cat'); bind('#pf-status', 'status');
          bind('#pf-cost', 'cost'); bind('#pf-decide', 'decideBy');
          bind('#pf-pricing', 'pricing'); bind('#pf-what', 'what');
          bind('#pf-judge', 'judge');
          sheet.querySelector('#pf-verdict').addEventListener('change', e =>
            Store.updatePlatform(p.id, { verdict: e.target.value }, 'wrote a verdict'));
          sheet.querySelector('#pf-owner').addEventListener('change', e =>
            { Store.updatePlatform(p.id, { owner: e.target.value || null }); HQ.render(); });
          sheet.querySelector('#pf-del').addEventListener('click', () => {
            if (!confirm('Remove “' + p.name + '”?')) return;
            Store.removePlatform(p.id); HQ.closeSheet(); HQ.render(); toast('Removed.');
          });
        }
      };
    });
  }
})();
