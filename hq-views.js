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

  /* =========================================================================
     TODAY — the week, the way ClearK12 organises it.

     Days read downwards, each its own section with everything on it: the items
     you added, and the project work due that day. A todo with no day is the
     running log — that is the only thing that separates the two, so moving
     work between them is just setting or clearing a date.

     Deliberately not carried over: capacity planning and the 1:1. Those answer
     questions this team has not asked.
  ========================================================================= */
  let weekStart = null;                 /* null = the current week */
  let weekMode = 'day';                 /* day | week */
  let msgTo = null;                     /* open thread; null = the Team room */

  const DAY_TONE = ['red', 'amber', 'green', 'blue', 'navy'];
  const ordinal = n => {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const longDay = iso => {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short' }) + ', ' +
           d.toLocaleDateString(undefined, { month: 'long' }) + ' ' + ordinal(d.getDate());
  };
  const rangeLabel = start => {
    const a = new Date(start + 'T12:00:00'), b = new Date(Store.addDays(start, 4) + 'T12:00:00');
    const m = d => d.toLocaleDateString(undefined, { month: 'short' });
    return m(a) + ' ' + a.getDate() + ' – ' + (m(a) === m(b) ? '' : m(b) + ' ') + b.getDate();
  };

  /* Which day sections are folded away. Kept in the module rather than the
     store — it is how one person is looking at the page right now, not a fact
     about the work. */
  const wkShut = new Set();

  /* One row of the table. Draggable, because the whole point of the running
     log is that you pick something up and drop it on a day. */
  function todoRow(t) {
    const ed = Store.can('edit');
    return `<div class="wk-row ${t.done ? 'done' : ''}" data-todo="${t.id}"
      ${ed ? 'draggable="true"' : ''}>
      <span class="wk-grip" aria-hidden="true">${svg('right')}</span>
      <span class="wk-title" ${ed ? `data-itodo="${t.id}"` : ''}>${esc(t.title)}</span>
      ${t.repeats ? `<span class="wk-rep" title="Repeats ${esc(t.repeats)}">↻</span>` : ''}
      ${t.tag ? `<span class="wk-tag">${esc(t.tag)}</span>` : ''}
      <span class="wk-ck">
        <input type="checkbox" ${t.done ? 'checked' : ''} data-todock="${t.id}"
               aria-label="${esc(t.title)}" ${ed ? '' : 'disabled'}>
      </span>
      ${ed ? `<button class="wk-x" data-tododel="${t.id}" aria-label="Remove">${svg('close')}</button>` : ''}
    </div>`;
  }

  /* A project task that has been given this date. Not draggable and not
     deletable here — it belongs to its project, and the week is only showing
     it. Moving it means changing its due date, which the row does on click. */
  function taskRowInDay(t) {
    return `<div class="wk-row from-task" data-task="${t.project.id}:${t.id}" tabindex="0" role="button">
      <span class="wk-dot t-${areaOf(t.project.area).tone}"></span>
      <span class="wk-title">${esc(t.title)}</span>
      <span class="wk-tag from">${esc(t.project.name)}</span>
      <span class="wk-ck"><span class="wk-assigned" title="Assigned from a project">${svg('board')}</span></span>
    </div>`;
  }

  const wkHead = `<div class="wk-thead"><span>Item</span><span class="wk-ck">Done</span></div>`;

  function daySection(iso, i) {
    const { todos: ts, tasks } = Store.dayItems(iso);
    const total = ts.length + tasks.length;
    const done = ts.filter(t => t.done).length;
    const isToday = iso === Store.today();
    const shut = wkShut.has(iso);
    return `<section class="wk-day t-${DAY_TONE[i % DAY_TONE.length]} ${isToday ? 'now' : ''} ${shut ? 'shut' : ''}"
      data-drop="${iso}">
      <div class="wk-day-head">
        <button class="wk-fold" data-fold="${iso}" aria-expanded="${!shut}"
                aria-label="${shut ? 'Show' : 'Hide'} ${esc(longDay(iso))}">${svg('down')}</button>
        <h3>${esc(longDay(iso))}</h3>
        ${isToday ? '<span class="wk-today">Today</span>' : ''}
        <span class="wk-count">${done}/${total}</span>
      </div>
      ${shut ? '' : `<div class="wk-table">
        ${wkHead}
        ${total ? ts.map(todoRow).join('') + tasks.map(taskRowInDay).join('')
                : '<p class="wk-empty">Nothing planned.</p>'}
      </div>
      ${Store.can('edit') ? `<form class="wk-add" data-addday="${iso}">
        <input placeholder="+ add item" aria-label="Add an item to ${esc(longDay(iso))}">
      </form>` : ''}`}
    </section>`;
  }

  /* ---- drag and drop: the running log onto a day, or a day onto another ----
     One handler set, wired over the whole week grid. The row carries the todo
     id; every day section and the log itself carry the day they represent
     ("" for the log), so a drop is a one-line update. */
  let wkDrag = null;
  function wireWeekDnD(root) {
    if (!Store.can('edit')) return;

    root.querySelectorAll('[data-todo]').forEach(row => {
      row.addEventListener('dragstart', e => {
        wkDrag = row.dataset.todo;
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        /* Firefox will not start a drag without data on the transfer. */
        try { e.dataTransfer.setData('text/plain', wkDrag); } catch (err) {}
      });
      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        wkDrag = null;
        root.querySelectorAll('.drop-on').forEach(z => z.classList.remove('drop-on'));
      });
    });

    root.querySelectorAll('[data-drop]').forEach(zone => {
      zone.addEventListener('dragover', e => {
        if (!wkDrag) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('drop-on');
      });
      /* dragleave fires when crossing onto a child, so only clear when the
         pointer has actually left the zone's box. */
      zone.addEventListener('dragleave', e => {
        if (!zone.contains(e.relatedTarget)) zone.classList.remove('drop-on');
      });
      zone.addEventListener('drop', e => {
        if (!wkDrag) return;
        e.preventDefault();
        zone.classList.remove('drop-on');
        Store.updateTodo(wkDrag, { day: zone.dataset.drop || null });
        wkDrag = null;
        HQ.render();
      });
    });
  }

  /* ----------------------------- messages -----------------------------
     Left rail picks who it goes to, right side is the conversation. Runs of
     messages from the same person on the same day group together, because
     the repeated name is noise once you know who is talking. */
  function msgPanel(me) {
    const list = Store.threads();
    const to = msgTo || (list[0] && list[0].id);
    const open = list.find(t => t.id === to) || list[0];
    const all = Store.threadMessages(to);

    const day = t => new Date(t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const clock = t => new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    const today = day(new Date().toISOString());

    let lastDay = null, lastBy = null;
    const thread = all.slice(-80).map(m => {
      const d = day(m.at);
      const rule = d !== lastDay ? `<div class="mg-day"><span>${d === today ? 'Today' : esc(d)}</span></div>` : '';
      const runOn = d === lastDay && m.by === lastBy;
      lastDay = d; lastBy = m.by;
      const who = Store.user(m.by);
      const mine = m.by === (me && me.id);
      return rule + `<div class="mg ${mine ? 'me' : 'them'} ${runOn ? 'run' : ''} ${m.done ? 'is-done' : ''}">
        ${runOn ? '' : `<span class="mg-who">${esc(who ? who.name.split(' ')[0] : 'Someone')}</span>`}
        <span class="mg-line">
          <button class="mg-tick" data-msgdone="${m.id}" aria-pressed="${!!m.done}"
                  title="${m.done ? 'Mark not done' : 'Mark done'}">${m.done ? '✓' : ''}</button>
          <span class="mg-bubble">${esc(m.text)}</span>
        </span>
        <span class="mg-at">${clock(m.at)}${m.done ? ' · done' : ''}</span>
      </div>`;
    }).join('');

    const who = list.map(t => {
      const n = Store.unreadIn(t.id);
      const last = Store.lastInThread(t.id);
      return `<button class="mg-who-row ${t.id === to ? 'on' : ''}" data-msgto="${esc(t.id)}">
        <span class="mg-av t-${t.tone}">${t.isRoom ? svg('team') : esc(t.name.slice(0, 1))}</span>
        <span class="mg-who-body">
          <span class="mg-who-name">${esc(t.name)}</span>
          <span class="mg-who-last">${last ? esc(last.text.slice(0, 44)) : esc(t.title || 'No messages yet')}</span>
        </span>
        ${n ? `<span class="mg-dot">${n}</span>` : ''}
      </button>`;
    }).join('');

    return `<section class="panel mgs">
      <div class="panel-head"><h2>Messages</h2>
        <span class="note" style="margin-left:auto">Pick who it goes to</span></div>
      <div class="mg-body">
        <div class="mg-who-list">${who}</div>
        <div class="mg-main">
          <div class="mg-thread" id="mg-thread">${all.length ? thread
            : `<p class="wk-empty">Nothing here yet. Say something to ${esc(open ? open.name : 'the team')}.</p>`}</div>
          ${Store.can('edit') ? `<form class="mg-form" id="mg-form" autocomplete="off">
            <input id="mg-input" type="text" maxlength="2000"
                   placeholder="Message ${esc(open ? open.name.split(' ')[0] : 'the team')}…"
                   aria-label="Write a message">
            <button class="btn btn-dark btn-sm" type="submit">Send</button>
          </form>` : ''}
        </div>
      </div>
    </section>`;
  }

  HQ.view('today', {
    render() {
      const me = Store.currentUser();
      const start = weekStart || Store.mondayOf(Store.today());
      const days = Store.weekDays(start);
      const log = Store.runningLog();
      const assigned = Store.assignedToMe();
      const logDone = log.filter(t => t.done).length;

      const LV = ['blocker', 'important', 'note'];
      const rems = Store.reminders().slice().sort((a, b) =>
        LV.indexOf(a.level) - LV.indexOf(b.level) || (a.due || '9999').localeCompare(b.due || '9999'));
      const remOpen = rems.filter(r => !r.resolved);
      const gates = remOpen.filter(r => r.level === 'blocker').length;
      const remRow = r => {
        const lv = REMINDER_LEVELS[r.level] || REMINDER_LEVELS.important;
        const d = r.due ? dueLabel(r.due) : null;
        return `<div class="rem ${r.resolved ? 'done' : ''}" data-rem="${r.id}">
          <input type="checkbox" ${r.resolved ? 'checked' : ''} data-remck="${r.id}"
                 aria-label="Resolve — ${esc(r.text)}" ${Store.can('edit') ? '' : 'disabled'}>
          <span class="rem-lv lv-${r.level}">${lv.label}</span>
          <span class="rem-text">${esc(r.text)}</span>
          ${d ? `<span class="due ${d.tone}">${esc(d.txt)}</span>` : ''}
        </div>`;
      };

      return `<div class="wrap">
        <section class="today-hero">
          <h1>${greeting()}, ${esc(me.name.split(' ')[0])}.</h1>
          <p class="today-sub">Your week, and what is still on you.</p>
        </section>

        <div class="td-top">
          <section class="panel asg">
            <div class="panel-head"><h2>Assigned to you</h2>
              ${assigned.length ? `<span class="asg-n">${assigned.length}</span>` : ''}</div>
            ${assigned.length ? `<p class="wk-note">From a project — someone is waiting on these.</p>
            ${assigned.map(t => `<div class="asg-row">
              <span class="wk-dot t-${areaOf(t.project.area).tone}"></span>
              <span class="asg-body" data-task="${t.project.id}:${t.id}" tabindex="0" role="button">
                <span class="asg-title">${esc(t.title)}</span>
                <span class="asg-from">${esc(t.project.name)}</span>
              </span>
              ${Store.can('edit') ? `<select class="asg-plan" data-planday="${t.project.id}:${t.id}"
                  aria-label="Plan ${esc(t.title)} into a day">
                <option value="">Plan…</option>
                ${days.map(d => `<option value="${d}">${esc(longDay(d))}</option>`).join('')}
              </select>` : ''}
            </div>`).join('')}`
            : '<p class="wk-empty">Nothing is waiting on you.</p>'}
          </section>
          ${msgPanel(me)}
        </div>

        <div class="wk-head">
          <h2>Your week <span>${esc(rangeLabel(start))}</span></h2>
          <div class="seg wk-mode">
            <button data-wkmode="week" class="${weekMode === 'week' ? 'on' : ''}">The week</button>
            <button data-wkmode="day" class="${weekMode === 'day' ? 'on' : ''}">By day</button>
          </div>
          <div class="wk-nav">
            <button data-wknav="-7" aria-label="Previous week">${svg('left')}</button>
            <button data-wknav="0">This week</button>
            <button data-wknav="7" aria-label="Next week">${svg('right')}</button>
          </div>
        </div>

        <div class="wk-grid ${weekMode === 'week' ? 'across' : ''}">
          <div class="wk-days">${days.map(daySection).join('')}</div>

          <section class="wk-log" data-drop="">
            <div class="wk-day-head">
              <button class="wk-fold" data-fold="__log" aria-expanded="${!wkShut.has('__log')}"
                      aria-label="${wkShut.has('__log') ? 'Show' : 'Hide'} the running task log">${svg('down')}</button>
              <h3>Running task log</h3>
              <span class="wk-count">${logDone}/${log.length}</span>
            </div>
            ${wkShut.has('__log') ? '' : `<p class="wk-note">Things you have given yourself to do, with no day yet.
              Drag one onto a day to plan it — or drag it back here to unplan it.</p>
            <div class="wk-table">
              ${wkHead}
              ${log.length ? log.map(todoRow).join('') : '<p class="wk-empty">Nothing waiting.</p>'}
            </div>
            ${Store.can('edit') ? `<form class="wk-add" data-addday="">
              <input placeholder="+ add item" aria-label="Add to the running log">
            </form>` : ''}`}
          </section>
        </div>

        <section class="panel rem-panel stack" style="margin-top:1.4rem">
          <div class="panel-head">
            <h2>Before launch</h2>
            <span class="note">${gates ? gates + ' gate' + (gates === 1 ? '' : 's') + ' still closed'
              : remOpen.length ? 'no closed gates — the rest is judgment' : 'everything revisited'}</span>
          </div>
          ${remOpen.length ? remOpen.map(remRow).join('')
            : '<p class="panel-empty">Nothing open. Launch when ready.</p>'}
        </section>
      </div>`;
    },

    wire(root) {
      wireTaskRows(root);

      /* ---- messages ---- */
      const openTo = msgTo || ((Store.threads()[0] || {}).id);
      const th = root.querySelector('#mg-thread');
      /* Open at the newest message, like every chat app. */
      if (th) th.scrollTop = th.scrollHeight;
      if (openTo) Store.markThreadRead(openTo);

      root.querySelectorAll('[data-msgto]').forEach(b =>
        b.addEventListener('click', () => {
          msgTo = b.dataset.msgto;
          Store.markThreadRead(msgTo);
          HQ.render();
        }));

      root.querySelectorAll('[data-msgdone]').forEach(b =>
        b.addEventListener('click', () => {
          /* Hold the scroll position — ticking something halfway up the
             thread should not fling you back to the bottom. */
          const keep = th ? th.scrollTop : 0;
          Store.toggleMessageDone(b.dataset.msgdone);
          HQ.render();
          const again = HQ.$('#mg-thread');
          if (again) again.scrollTop = keep;
        }));

      const mf = root.querySelector('#mg-form');
      if (mf) mf.addEventListener('submit', e => {
        e.preventDefault();
        const box = root.querySelector('#mg-input');
        const text = box.value.trim();
        if (!text) return;
        Store.sendMessage(openTo, text);
        Store.markThreadRead(openTo);
        HQ.render();
        const again = HQ.$('#mg-input');
        if (again) again.focus();
      });

      wireWeekDnD(root);
      root.querySelectorAll('[data-fold]').forEach(b =>
        b.addEventListener('click', () => {
          const k = b.dataset.fold;
          if (wkShut.has(k)) wkShut.delete(k); else wkShut.add(k);
          HQ.render();
        }));

      root.querySelectorAll('[data-wkmode]').forEach(b =>
        b.addEventListener('click', () => { weekMode = b.dataset.wkmode; HQ.render(); }));
      root.querySelectorAll('[data-wknav]').forEach(b =>
        b.addEventListener('click', () => {
          const n = Number(b.dataset.wknav);
          const start = weekStart || Store.mondayOf(Store.today());
          weekStart = n === 0 ? null : Store.addDays(start, n);
          HQ.render();
        }));

      root.querySelectorAll('[data-todock]').forEach(c =>
        c.addEventListener('change', e => { e.stopPropagation(); Store.toggleTodo(c.dataset.todock); HQ.render(); }));
      root.querySelectorAll('[data-tododel]').forEach(b =>
        b.addEventListener('click', () => { Store.removeTodo(b.dataset.tododel); HQ.render(); }));
      HQ.inlineText(root, '[data-itodo]', (el, v) => {
        Store.updateTodo(el.dataset.itodo, { title: v }); HQ.render();
      });

      root.querySelectorAll('[data-addday]').forEach(f =>
        f.addEventListener('submit', e => {
          e.preventDefault();
          const inp = f.querySelector('input');
          if (!inp.value.trim()) return;
          Store.addTodo({ title: inp.value.trim(), day: f.dataset.addday || null });
          HQ.render();
        }));

      /* Planning an assigned task is just giving it a date — it then shows up
         in that day alongside everything else. */
      root.querySelectorAll('[data-planday]').forEach(sel =>
        sel.addEventListener('change', () => {
          if (!sel.value) return;
          const [pid, tid] = sel.dataset.planday.split(':');
          Store.updateTask(pid, tid, { due: sel.value });
          HQ.render();
          toast('Planned.');
        }));

      root.querySelectorAll('[data-remck]').forEach(ck =>
        ck.addEventListener('change', e => { e.stopPropagation(); Store.toggleReminder(ck.dataset.remck); HQ.render(); }));
      root.querySelectorAll('[data-rem]').forEach(row =>
        row.addEventListener('click', e => {
          if (e.target.closest('input')) return;
          openReminderSheet(row.dataset.rem);
        }));
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

  /* The Campaign step is the campaign — nothing else. Its tasks live in Tasks
     and its dated pieces live in the Content Plan; repeating them here just
     made the same work appear three times. */
  function campaignCockpit() {
    const c = Store.campaign(CURRENT_CAMPAIGN);
    if (!c) return groupedView('campaign');
    return `
      <section class="cc-brief">
        <div class="cc-brief-head">
          ${svg('mega')}
          <div>
            <h2>${esc(c.title)}</h2>
            <p>${esc(c.strand)} — ${c.assets} drafted assets. Approve the creative here;
               the Content Plan picks the verdict up.</p>
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

  function projectDetail(p, subId) {
    const s = projectStats(p);
    const d = dueLabel(p.due);
    const ed = Store.can('edit');
    const tabs = Store.projectTabs(p.id);
    const cur = tabs.find(t => t.id === subId) || tabs[0];
    const onBoard = cur.id === 'board';

    return `<div class="wrap">
      <button class="crumb" data-go="#/projects">${svg('left')} All projects</button>
      <div class="page-head">
        <div>
          <span class="tag t-${p.tone}">${esc(areaOf(p.area).label)}</span>
          <h1 ${ed ? `data-iproj="${p.id}"` : ''}>${esc(p.name)}</h1>
          <p>${esc(p.goal)}</p>
        </div>
        <div class="page-actions">
          <span class="pill t-green"><b>${s.done}</b>/${s.total} done</span>
          ${d ? `<span class="pill t-red">${esc(d.txt)}</span>` : ''}
          ${ed ? `<button class="btn btn-outline" id="edit-project">Edit project</button>
          ${onBoard ? `<button class="btn btn-dark" id="new-task">${svg('plus')}New task</button>` : ''}` : ''}
        </div>
      </div>

      <div class="ptabs">
        ${tabs.map(t => `<a class="ptab ${t.id === cur.id ? 'on' : ''}"
            href="#/projects/${p.id}/${t.id}">${esc(t.label)}</a>`).join('')}
        ${ed ? `<button class="ptab ptab-add" id="add-tab" title="Add a page to this project">${svg('plus')} Page</button>` : ''}
      </div>

      ${onBoard ? `<p class="board-hint">Drag a card between columns — or use the little arrows on each card to move it
        left, right, up, or down without a mouse.</p>
      ${boardHTML(p)}`
      : `<section class="panel ptab-page">
          <div class="panel-head">
            <h2 ${ed ? `data-itab="${p.id}:${cur.id}"` : ''}>${esc(cur.label)}</h2>
            ${ed ? `<button class="btn btn-ghost btn-sm" data-deltab="${p.id}:${cur.id}">Delete page</button>` : ''}
          </div>
          ${ed ? `<textarea class="ptab-notes" data-notes="${p.id}:${cur.id}"
              placeholder="Anything that belongs to this project but not on the board — decisions, specs, links, the reason something was rejected.">${esc(cur.notes || '')}</textarea>`
            : `<div class="ptab-read">${cur.notes ? esc(cur.notes) : '<span class="wk-empty">Nothing on this page yet.</span>'}</div>`}
        </section>`}
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
      return p ? projectDetail(p, r.sub) : projectsIndex();
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

        /* ---- project pages ---- */
        const at = root.querySelector('#add-tab');
        if (at) at.addEventListener('click', () => {
          const t = Store.addProjectTab(p.id, 'New page');
          go('#/projects/' + p.id + '/' + t.id);
        });
        HQ.inlineText(root, '[data-iproj]', (el, v) => {
          Store.updateProject(el.dataset.iproj, { name: v }); HQ.render();
        });
        HQ.inlineText(root, '[data-itab]', (el, v) => {
          const [pid, tid] = el.dataset.itab.split(':');
          Store.updateProjectTab(pid, tid, { label: v }); HQ.render();
        });
        /* Notes save as you leave the box, not on every keystroke — a write
           is a sync, and syncing once per character is not a plan. */
        const ta = root.querySelector('[data-notes]');
        if (ta) ta.addEventListener('blur', () => {
          const [pid, tid] = ta.dataset.notes.split(':');
          Store.updateProjectTab(pid, tid, { notes: ta.value });
        });
        root.querySelectorAll('[data-deltab]').forEach(b =>
          b.addEventListener('click', () => {
            const [pid, tid] = b.dataset.deltab.split(':');
            const t = Store.projectTabs(pid).find(x => x.id === tid);
            if (!confirm(`Delete the page “${t ? t.label : ''}”? Anything written on it goes with it.`)) return;
            Store.removeProjectTab(pid, tid);
            go('#/projects/' + pid);
          }));
      } else {
        wireProjToggle(root);
        const cs = root.querySelector('#camp-scope-toggle');
        if (cs) cs.addEventListener('click', () => { showAllCampaigns = !showAllCampaigns; HQ.render(); });
        wireTaskRows(root);
        wireTaskBoard(root);
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

  /* ================================= KPIs =================================
     Jessie's weekly report as a grid: metrics down, periods across, newest
     first. Weekly / monthly / quarterly are the same grid over different
     period keys.

     Derived cells are grey and not editable — they are computed, and a typed
     AOV that disagrees with revenue ÷ orders is a number nobody trusts. */
  let kpiKind = 'week';

  function kpiFmt(def, v) {
    if (v === undefined || v === null || v === '' || !isFinite(v)) return '—';
    if (def.unit === '$') return '$' + Math.round(v).toLocaleString();
    if (def.unit === '%') return v.toFixed(1) + '%';
    if (def.unit === '×') return v.toFixed(2) + '×';
    return Math.round(v).toLocaleString();
  }
  /* Change against the period before it. Only for entered metrics with both
     sides present — a delta against an empty period is not a delta. */
  function kpiDelta(def, cur, prev) {
    if (cur === undefined || prev === undefined || !prev || !isFinite(cur) || !isFinite(prev)) return '';
    const pc = ((cur - prev) / Math.abs(prev)) * 100;
    if (!isFinite(pc) || Math.abs(pc) < 0.5) return '';
    const up = pc > 0;
    /* Spend and cost-per-order going up is not good news, so the colour
       follows what the metric means, not which way the arrow points. */
    const lower = def.k === 'spend' || def.k === 'cpo';
    const good = lower ? !up : up;
    return `<span class="kpi-d ${good ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(pc).toFixed(0)}%</span>`;
  }

  HQ.view('kpis', {
    render() {
      const spec = KPI_PERIODS.find(p => p.k === kpiKind) || KPI_PERIODS[0];
      const periods = Store.kpiPeriods(spec.k, spec.n);
      const rows = periods.map(p => Store.kpiRow(p.key));
      const ed = Store.can('edit');
      const anything = rows.some(r => KPI_METRICS.some(d => !d.derive && r[d.k] !== undefined));

      const groups = [];
      KPI_METRICS.forEach(d => {
        const g = groups.find(x => x.name === d.group);
        (g || groups[groups.push({ name: d.group, items: [] }) - 1]).items.push(d);
      });

      return `<div class="wrap">
        <div class="page-head">
          <div><h1>KPIs</h1><p>The weekly report, kept in one place instead of rebuilt every Monday.
            Same metrics weekly, monthly and quarterly. Grey rows are worked out from the rows
            above them — enter revenue and orders and the average order value follows.</p></div>
          <div class="page-actions">
            <div class="seg">
              ${KPI_PERIODS.map(p => `<button data-kpikind="${p.k}"
                class="${p.k === kpiKind ? 'on' : ''}">${esc(p.label)}</button>`).join('')}
            </div>
          </div>
        </div>

        ${!anything ? `<section class="panel t-amber kpi-note">
          <h3>No numbers in here yet — and none were seeded.</h3>
          <p>The weekly report this is built from carries customer names, email addresses and
             order numbers. This dashboard is served publicly from GitHub Pages, so anything
             written into the bundle can be read by anyone with the link. Real figures go in
             here in the browser (they stay on this machine) until there is a private
             connection to put them behind.</p>
          <p class="kpi-note-2">The WooCommerce pull is the same problem: its REST API needs a
             key and secret on every request, and a public bundle has nowhere to keep a secret.
             It needs something server-side in between — a Supabase Edge Function or a
             Cloudflare Worker holding the credentials. Not built, because that decision is
             yours to make.</p>
        </section>` : ''}

        <div class="kpi-wrap">
          <table class="kpi-table">
            <thead><tr><th class="kpi-m">${esc(spec.note)}</th>
              ${periods.map(p => `<th>${esc(p.label)}</th>`).join('')}</tr></thead>
            ${groups.map(g => `<tbody>
              <tr class="kpi-grp"><td colspan="${periods.length + 1}">${esc(g.name)}</td></tr>
              ${g.items.map(d => `<tr class="${d.derive ? 'kpi-derived' : ''}">
                <td class="kpi-m">${esc(d.label)}</td>
                ${periods.map((p, i) => {
                  const v = rows[i][d.k];
                  if (d.derive || !ed) return `<td class="kpi-v">${kpiFmt(d, v)}
                    ${d.derive ? '' : kpiDelta(d, v, rows[i + 1] && rows[i + 1][d.k])}</td>`;
                  return `<td class="kpi-v"><input class="kpi-in" data-kpi="${p.key}:${d.k}"
                    value="${v === undefined ? '' : v}" placeholder="—"
                    aria-label="${esc(d.label)}, ${esc(p.label)}"
                    inputmode="decimal">${kpiDelta(d, v, rows[i + 1] && rows[i + 1][d.k])}</td>`;
                }).join('')}
              </tr>`).join('')}
            </tbody>`).join('')}
          </table>
        </div>
      </div>`;
    },

    wire(root) {
      root.querySelectorAll('[data-kpikind]').forEach(b =>
        b.addEventListener('click', () => { kpiKind = b.dataset.kpikind; HQ.render(); }));
      /* Save on the way out of the cell, not per keystroke — and re-render so
         everything derived from it moves at the same time. */
      root.querySelectorAll('[data-kpi]').forEach(inp =>
        inp.addEventListener('change', () => {
          const [period, metric] = inp.dataset.kpi.split(':');
          Store.setKpi(period, metric, inp.value);
          HQ.render();
        }));
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
                <span>${u.email ? esc(u.email)
                  : '<em class="u-noinvite">no address yet — needs an invite</em>'}${
                  u.title ? ' · ' + esc(u.title) : ''} · ${load} open</span></div>
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
