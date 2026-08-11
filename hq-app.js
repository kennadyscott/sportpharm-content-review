/* =============================================================================
   SportPharm HQ — shell: helpers, sign-in, rail, router, sheet, command palette.
   Views register themselves into HQ.views from hq-views.js / hq-campaigns.js.
============================================================================= */
const HQ = (() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const ICON = {
    today:   '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
    board:   '<rect x="3" y="4" width="6" height="16" rx="1.5"/><rect x="11" y="4" width="6" height="11" rx="1.5"/><rect x="19" y="4" width="2" height="7" rx="1"/>',
    mega:    '<path d="M4 10v4a1 1 0 0 0 1 1h3l6 4V5L8 9H5a1 1 0 0 0-1 1Z"/><path d="M18 9a4 4 0 0 1 0 6"/>',
    cal:     '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    quote:   '<path d="M8 7H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3v3a3 3 0 0 1-3 3"/><path d="M19 7h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3v3a3 3 0 0 1-3 3"/>',
    bulb:    '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z"/>',
    chart:   '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    team:    '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.5a3.2 3.2 0 0 1 0 6.4M17.5 14.8c2.1.7 3.5 2.6 3.5 5.2"/>',
    gear:    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
    plus:    '<path d="M12 5v14M5 12h14"/>',
    close:   '<path d="M6 6l12 12M18 6 6 18"/>',
    left:    '<path d="m15 5-7 7 7 7"/>',
    right:   '<path d="m9 5 7 7-7 7"/>',
    up:      '<path d="m5 15 7-7 7 7"/>',
    down:    '<path d="m5 9 7 7 7-7"/>',
    copy:    '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    lock:    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    arrow:   '<path d="M5 12h14M13 6l6 6-6 6"/>',
    search:  '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    trash:   '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
    check:   '<path d="m5 13 4 4L19 7"/>',
    reply:   '<path d="M9 14 4 9l5-5"/><path d="M4 9h9a7 7 0 0 1 7 7v4"/>',
    heart:   '<path d="M12 20s-7-4.5-7-9.5A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.5C19 15.5 12 20 12 20Z"/>',
    doc:     '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    send:    '<path d="M21 3 3 10.5l7 3.5L14 21l7-18Z"/><path d="M10 14 21 3"/>',
    coin:    '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2a3 3 0 0 0-2.8-1.4c-1.6 0-2.8.9-2.8 2.1 0 2.9 5.8 1.3 5.8 4.2 0 1.2-1.2 2.1-3 2.1a3.2 3.2 0 0 1-3-1.5M12 6.2v1.6M12 16.2v1.6"/>',
    image:   '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.7"/><path d="m3 17 5-4 4 3 3-2.5 6 4.5"/>',
    pen:     '<path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m14 6 4 4"/>',
    /* block-editor icons */
    text:    '<path d="M4 6h16M4 11h16M4 16h10"/>',
    head:    '<path d="M5 5v14M15 5v14M5 12h10"/><path d="M18 10h3v9"/>',
    button:  '<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M9 12h6"/>',
    line:    '<path d="M3 12h18"/>',
    spacer:  '<path d="M5 4h14M5 20h14"/><path d="M12 8v8M9.5 10.5 12 8l2.5 2.5M9.5 13.5 12 16l2.5-2.5"/>',
    split:   '<rect x="3" y="5" width="8" height="14" rx="1.5"/><path d="M14 8h7M14 12h7M14 16h5"/>',
    columns: '<rect x="3" y="5" width="7.5" height="14" rx="1.5"/><rect x="13.5" y="5" width="7.5" height="14" rx="1.5"/>',
    gallery: '<rect x="3" y="5" width="8" height="7" rx="1.5"/><rect x="13" y="5" width="8" height="7" rx="1.5"/><rect x="3" y="14" width="8" height="5" rx="1.5"/><rect x="13" y="14" width="8" height="5" rx="1.5"/>',
    list:    '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>',
    video:   '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m10 9.5 5 2.5-5 2.5z"/>',
    callout: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M12 9v4M12 15.6v.1"/>',
    box:     '<path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/>',
    shield:  '<path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    grip:    '<circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/>'
  };
  const svg = (n, cls) =>
    `<svg ${cls ? `class="${cls}" ` : ''}viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ''}</svg>`;

  const initials = n => (n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const avatar = (u, size) => u
    ? `<span class="avatar ${size || ''} t-${u.tone || 'navy'}" title="${esc(u.name)}">${esc(initials(u.name))}</span>`
    : `<span class="card-none" title="No one yet"></span>`;

  const areaOf = id => AREAS.find(a => a.id === id) || AREAS[0];
  const statusOf = id => STATUSES.find(s => s.id === id) || STATUSES[0];

  function ago(iso) {
    if (!iso) return '';
    const d = (Date.now() - new Date(iso).getTime()) / 1000;
    if (d < 90) return 'just now';
    if (d < 3600) return Math.round(d / 60) + 'm ago';
    if (d < 86400) return Math.round(d / 3600) + 'h ago';
    const days = Math.round(d / 86400);
    if (days < 30) return days + 'd ago';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  const daysSince = iso => (Date.now() - new Date(iso).getTime()) / 86400000;

  function dueLabel(due) {
    if (!due) return null;
    const d = new Date(due + 'T12:00:00');
    const days = Math.round((d - Date.now()) / 86400000);
    const txt = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (days < 0) return { txt: txt + ' · overdue', tone: 'late' };
    if (days <= 7) return { txt: txt + ' · this week', tone: 'soon' };
    return { txt, tone: '' };
  }

  /* ------------------------- editing in place --------------------------- */
  /* Click the text, type, blur or Enter saves, Escape puts it back. Used
     everywhere a title appears so the detail sheet is somewhere you go for the
     long fields, not somewhere you are forced through to rename something. */
  function inlineText(root, sel, onSave) {
    root.querySelectorAll(sel).forEach(el => {
      el.setAttribute('contenteditable', 'plaintext-only');
      el.setAttribute('spellcheck', 'false');
      el.classList.add('inline-edit');
      const was = el.textContent;
      el.addEventListener('mousedown', e => e.stopPropagation());
      el.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); });
      el.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
        else if (e.key === 'Escape') { el.textContent = was; el.blur(); }
      });
      el.addEventListener('blur', () => {
        const v = el.textContent.replace(/\s+/g, ' ').trim();
        if (!v) { el.textContent = was; return; }
        if (v === was.replace(/\s+/g, ' ').trim()) return;
        onSave(el, v);
      });
    });
  }

  /* A control on a row that must not trigger the row itself. */
  function stopRow(root, sel) {
    root.querySelectorAll(sel).forEach(el => {
      ['click', 'mousedown', 'keydown'].forEach(ev =>
        el.addEventListener(ev, e => e.stopPropagation()));
    });
  }

  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2400);
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    toast('Copied.');
  }

  /* ============================== SIGN IN ============================== */
  const GATE_LINES = [
    'We take our drugs <em>seriously.</em>',
    'Perform. Recover. <em>Return.</em>',
    'What touches the athlete <em>matters.</em>',
    'Stay ready for <em>whatever moves you.</em>'
  ];

  let gateSeat = null;
  let cloudClaim = false;  /* live mode, first sign-in: bind the account to a seat */

  function renderGate() {
    $('#gate-line').innerHTML = GATE_LINES[Math.floor(Math.random() * GATE_LINES.length)];
    const card = $('#gate-card');
    const list = Store.users().slice().sort((a, b) => (a.order || 0) - (b.order || 0));

    if (!gateSeat) {
      card.innerHTML = `
        <h1>${cloudClaim ? 'Almost in.' : 'Who’s here?'}</h1>
        <p class="sub">${cloudClaim
          ? 'First time on this account — which seat is you? You’ll only do this once.'
          : 'Pick your seat. Everything SportPharm is working on lives behind this.'}</p>
        <div class="seats">
          ${list.map(u => `
            <button class="seat" data-seat="${u.id}">
              ${avatar(u)}
              <span>
                <span class="seat-name">${esc(u.name)}</span>
                <span class="seat-meta">${esc(ROLES[u.role].label)}${u.title ? ' · ' + esc(u.title) : ''}${u.pending ? ' · invited' : ''}</span>
              </span>
              <span class="seat-go">${svg('arrow')}</span>
            </button>`).join('')}
        </div>`;
      card.querySelectorAll('[data-seat]').forEach(b =>
        b.addEventListener('click', () => {
          if (cloudClaim) {
            Store.claimSeat(b.dataset.seat, Cloud.email());
            cloudClaim = false;
            Store.log('signed in', '');
            boot();
            return;
          }
          gateSeat = b.dataset.seat; renderGate();
        }));
      return;
    }

    const u = Store.user(gateSeat);
    card.innerHTML = `
      <div class="gate-who">
        ${avatar(u, 'lg')}
        <div><h1 style="font-size:1.4rem">${esc(u.name.split(' ')[0])}</h1>
        <p class="sub" style="margin-top:.15rem">${esc(u.email)}</p></div>
      </div>
      <form class="gate-form" id="gate-form">
        <div class="field">
          <label for="gate-pass">${u.pending ? 'Invite code' : 'Your passcode'}</label>
          <input id="gate-pass" type="password" autocomplete="current-password"
                 placeholder="${u.pending ? 'From your invite' : '••••••••'}">
        </div>
        <p class="gate-err" id="gate-err" hidden></p>
        <button class="btn btn-dark" type="submit">Come in</button>
      </form>
      <button class="gate-back" id="gate-back">← Someone else</button>`;

    $('#gate-back').addEventListener('click', () => { gateSeat = null; renderGate(); });
    $('#gate-form').addEventListener('submit', e => {
      e.preventDefault();
      const r = Store.signIn(gateSeat, $('#gate-pass').value);
      if (!r.ok) {
        const err = $('#gate-err');
        err.textContent = r.error; err.hidden = false;
        $('#gate-pass').select();
        return;
      }
      gateSeat = null;
      Store.log('signed in', '');
      boot();
    });
    setTimeout(() => { const p = $('#gate-pass'); if (p) p.focus(); }, 30);
  }

  function renderCloudGate(err) {
    $('#gate').hidden = false; $('#app').hidden = true;
    $('#gate-line').innerHTML = GATE_LINES[Math.floor(Math.random() * GATE_LINES.length)];
    $('#gate-card').innerHTML = `
      <h1>Sign in</h1>
      <p class="sub">Real accounts now — you each sign in as yourself, and everything is shared.</p>
      <form class="gate-form" id="cloud-form">
        <div class="field"><label for="cg-email">Email</label>
          <input id="cg-email" type="email" autocomplete="username" placeholder="you@sportpharm"></div>
        <div class="field"><label for="cg-pass">Password</label>
          <input id="cg-pass" type="password" autocomplete="current-password" placeholder="••••••••"></div>
        <p class="gate-err" id="cg-err" ${err ? '' : 'hidden'}>${esc(err || '')}</p>
        <button class="btn btn-dark" type="submit" id="cg-go">Come in</button>
      </form>`;
    $('#cloud-form').addEventListener('submit', async e => {
      e.preventDefault();
      const go = $('#cg-go');
      go.disabled = true; go.textContent = 'Signing in…';
      const r = await Cloud.signIn($('#cg-email').value.trim(), $('#cg-pass').value);
      if (!r.ok) {
        const el = $('#cg-err');
        el.textContent = 'That didn’t work — check both and try again.';
        el.hidden = false;
        go.disabled = false; go.textContent = 'Come in';
        return;
      }
      enterCloud();
    });
    setTimeout(() => { const el = $('#cg-email'); if (el) el.focus(); }, 30);
  }

  async function enterCloud() {
    try {
      const remote = await Cloud.pull();
      if (remote) Store.injectState(remote);
      else await Cloud.pushAll(Store.load());   /* first device seeds the shared workspace */
    } catch (e) {
      renderCloudGate('Signed in, but the workspace didn’t load — check the SQL was run, then refresh.');
      return;
    }
    Cloud.subscribe((k, v) => {
      Store.applyRemote(k, v);
      const a = document.activeElement;
      if (!/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) { render(); }
    });
    const me = Store.findUserByEmail(Cloud.email());
    if (me) {
      Store.signInSeat(me.id);
      boot();
    } else {
      localStorage.removeItem('sphq-session');
      cloudClaim = true;
      $('#gate').hidden = false; $('#app').hidden = true;
      renderGate();
    }
  }

  /* ============================== ROUTER ============================== */
  /* Two rails: the section down the left, and each section's own rail inside
     it. Marketing and Analytics are groups; everything under them is its own
     surface rather than a tab bar hidden one level down. */
  const MARKETING_KIDS = [
    { id: 'campaigns', label: 'Campaigns',    icon: 'mega' },
    { id: 'plan',      label: 'Content Plan', icon: 'cal' },
    { id: 'content',   label: 'Articles',     icon: 'pen' },
    { id: 'media',     label: 'Media',        icon: 'image' },
    { id: 'ideas',     label: 'Idea Bank',    icon: 'bulb' },
    { id: 'strategy',  label: 'Branding',     icon: 'quote' }
  ];
  const ANALYTICS_KIDS = [
    { id: 'analytics', label: 'Overview',  icon: 'chart' },
    { id: 'kpis',      label: 'KPIs',      icon: 'today' },
    { id: 'platforms', label: 'Platforms', icon: 'coin' }
  ];
  const GROUPS = { Marketing: MARKETING_KIDS, Analytics: ANALYTICS_KIDS };

  /* Project Planning's children are the projects themselves, so the second
     rail is the project list — open one and its own tabs sit under it. That
     means NAV cannot be a constant: it is rebuilt on each rail render so a
     project created a second ago is already in the rail. */
  function navTree() {
    const kids = [{ id: 'projects', label: 'All projects', icon: 'board' }]
      .concat(Store.projects().map(p => ({
        id: 'projects', pid: p.id, label: p.name, icon: 'dot', tone: p.tone
      })));
    return [
      { id: 'today',    label: 'Today',            icon: 'today' },
      { parent: 'Project Planning', icon: 'board', children: kids },
      { parent: 'Marketing', icon: 'doc',  children: MARKETING_KIDS },
      { id: 'orders',   label: 'Orders',           icon: 'box' },
      { parent: 'Analytics', icon: 'chart', children: ANALYTICS_KIDS },
      { id: 'team',     label: 'Team',     icon: 'team' },
      { id: 'settings', label: 'Settings', icon: 'gear' }
    ];
  }
  /* flat list for the palette and anything that wants every route. Built from
     the static sections only — a project is reached through its own id, and
     listing each one here would put five near-identical rows in the palette. */
  const NAV = [
    { id: 'today',    label: 'Today',            icon: 'today' },
    { id: 'projects', label: 'Project Planning', icon: 'board' },
    { parent: 'Marketing', icon: 'doc',  children: MARKETING_KIDS },
    { id: 'orders',   label: 'Orders',           icon: 'box' },
    { parent: 'Analytics', icon: 'chart', children: ANALYTICS_KIDS },
    { id: 'team',     label: 'Team',     icon: 'team' },
    { id: 'settings', label: 'Settings', icon: 'gear' }
  ];
  const NAV_FLAT = NAV.flatMap(n => n.children ? n.children : [n]);
  const groupOpen = {};   /* per group: undefined = follow the route */

  const views = {};
  function view(id, def) { views[id] = def; }

  function route() {
    const raw = (location.hash || '#/today').replace(/^#\/?/, '');
    const parts = raw.split('/').filter(Boolean);
    return { view: views[parts[0]] ? parts[0] : 'today', id: parts[1] || null, sub: parts[2] || null };
  }
  function go(hash) { location.hash = hash; }

  function counts() {
    const s = Store.articleStats();
    return {
      open: Store.allTasks().filter(t => t.status !== 'shipped').length,
      content: s.review + s.changes,
      ideas: Store.ideas().filter(d => d.state === 'open').length,
      orders: Store.orders().filter(o => o.status !== 'complete').length,
      unread: Store.unreadTotal(),
      planning: Store.pieces().filter(p => p.status === 'drafting' || p.status === 'review').length
    };
  }

  function renderRail() {
    const { view: v, id: rid } = route();
    const me = Store.currentUser();
    const c = counts();
    const TREE = navTree();
    const badge = { projects: c.open, content: c.content, ideas: c.ideas, plan: c.planning,
                    orders: c.orders, today: c.unread };
    /* the Content parent rolls up only its own children, not Content Plan */
    /* A project row carries its own id in the href, and is only "on" when
       that project is the one open — otherwise every project would light up
       whenever any of them was. "All projects" is the inverse: on only when
       no project is open. */
    const link = (n, sub) => {
      const href = n.pid ? `#/${n.id}/${n.pid}` : `#/${n.id}`;
      const on = n.id !== v ? false
        : n.pid ? rid === n.pid
        : n.id === 'projects' ? !rid : true;
      return `
      <a class="rail-link ${sub ? 'sub' : ''} ${n.pid ? 'rail-proj' : ''} ${on ? 'on' : ''}" href="${href}">
        ${n.pid ? `<i class="rail-dot t-${n.tone || 'navy'}"></i>` : svg(n.icon)}<span>${n.label}</span>
        ${!n.pid && badge[n.id] ? `<span class="rail-count ${n.id === 'today' ? 'alert' : ''}">${badge[n.id]}</span>` : ''}
      </a>`;
    };
    /* The tab title carries it too, so an unread message is visible from a
       different tab. This is the whole of the notification for now — until
       Supabase is connected there is no server to push from, so a message
       only reaches someone else when their browser next loads the state. */
    document.title = (c.unread ? `(${c.unread}) ` : '') + 'SportPharm HQ';
    $('#rail-nav').innerHTML = TREE.map(n => {
      if (!n.children) return link(n, false);
      const activeChild = n.children.some(k => k.id === v);
      const open = groupOpen[n.parent] === undefined ? activeChild : groupOpen[n.parent];
      /* Project rows have no badge of their own, so the parent rolls up once
         rather than once per project. */
      const kidBadge = n.children.reduce((t, k) => t + (k.pid ? 0 : (badge[k.id] || 0)), 0);
      return `
        <button class="rail-link rail-parent ${activeChild && !open ? 'on' : ''}" data-navtoggle="${esc(n.parent)}" aria-expanded="${open}">
          ${svg(n.icon)}<span>${n.parent}</span>
          ${!open && kidBadge ? `<span class="rail-count">${kidBadge}</span>` : ''}
          <span class="rail-caret ${open ? 'open' : ''}">${svg('down')}</span>
        </button>
        ${open ? n.children.map(k => link(k, true)).join('') : ''}`;
    }).join('');
    /* Every group, not just the first — and each remembers its own state, so
       opening Marketing does not fold Analytics away underneath you. */
    $('#rail-nav').querySelectorAll('[data-navtoggle]').forEach(tg =>
      tg.addEventListener('click', () => {
        const parent = tg.dataset.navtoggle;
        const grp = TREE.find(x => x.parent === parent);
        if (!grp) return;
        const activeChild = grp.children.some(k => k.id === route().view);
        const open = groupOpen[parent] === undefined ? activeChild : groupOpen[parent];
        groupOpen[parent] = !open;
        renderRail();
      }));
    $('#rail-me').innerHTML = me ? `${avatar(me)}
      <span><b>${esc(me.name)}</b><span>${esc(ROLES[me.role].label)} · Sign out</span></span>` : '';
    $('#tb-right').innerHTML =
      `<span class="tb-date">${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>`;
  }

  function render() {
    const r = route();
    const def = views[r.view];
    const root = $('#view');
    root.innerHTML = def.render(r);
    renderRail();
    if (def.wire) def.wire(root, r);
    root.querySelectorAll('[data-go]').forEach(b =>
      b.addEventListener('click', () => go(b.dataset.go)));
  }

  /* ============================== SHEET ============================== */
  /* One reusable right-hand sheet. Views hand it a title + body + wiring. */
  let sheetRenderer = null;

  function openSheet(renderer) {
    sheetRenderer = renderer;
    paintSheet();
  }
  function paintSheet() {
    if (!sheetRenderer) return;
    const out = sheetRenderer();
    if (!out) { closeSheet(); return; }
    const sheet = $('#sheet');
    sheet.className = 'sheet ' + (out.cls || '');
    sheet.innerHTML = out.html;
    $('#scrim').hidden = false;
    sheet.hidden = false;
    const c = sheet.querySelector('[data-sheet-close]');
    if (c) c.addEventListener('click', closeSheet);
    if (out.wire) out.wire(sheet);
  }
  function refreshSheet() { if (sheetRenderer) paintSheet(); }
  function closeSheet() {
    sheetRenderer = null;
    $('#sheet').hidden = true;
    $('#sheet').innerHTML = '';
    $('#scrim').hidden = true;
  }

  /* ============================== PALETTE ============================== */
  let palSel = 0, palItems = [];

  function palOpen() {
    $('#palette').hidden = false;
    $('#pal-q').value = '';
    palFilter('');
    $('#pal-q').focus();
  }
  function palClose() { $('#palette').hidden = true; }

  function palFilter(q) {
    q = q.trim().toLowerCase();
    const out = [];
    NAV_FLAT.filter(n => !q || n.label.toLowerCase().includes(q))
      .forEach(n => out.push({ group: 'Go to', icon: n.icon, label: n.label, run: () => go('#/' + n.id) }));

    Store.articles()
      .filter(a => !q || a.title.toLowerCase().includes(q) || (a.tags || []).join(' ').toLowerCase().includes(q))
      .slice(0, 8)
      .forEach(a => out.push({
        group: 'Articles', icon: 'pen', label: a.title,
        hint: (ARTICLE_STATES[a.status] || {}).label, run: () => go('#/content/' + a.id)
      }));

    Store.campaigns()
      .filter(c => !q || c.title.toLowerCase().includes(q) || c.strand.toLowerCase().includes(q))
      .forEach(c => out.push({ group: 'Campaigns', icon: 'mega', label: c.title, hint: c.strand, run: () => go('#/campaigns/' + c.id) }));

    Store.allTasks()
      .filter(t => q && t.title.toLowerCase().includes(q))
      .slice(0, 6)
      .forEach(t => out.push({ group: 'Tasks', icon: 'board', label: t.title, hint: t.project.name, run: () => go('#/projects/' + t.project.id) }));

    Store.projects()
      .filter(p => !q || p.name.toLowerCase().includes(q))
      .forEach(p => out.push({ group: 'Projects', icon: 'board', label: p.name, run: () => go('#/projects/' + p.id) }));

    if (q && Store.can('edit')) {
      out.push({ group: 'Do', icon: 'pen', label: `Start an article — “${q}”`, run: () => { const a = Store.addArticle({ title: q }); go('#/content/' + a.id); } });
      out.push({ group: 'Do', icon: 'bulb', label: `Capture idea — “${q}”`, run: () => { Store.addIdea(q, 'content'); go('#/ideas'); toast('Captured.'); } });
    }
    out.push({ group: 'Do', icon: 'lock', label: 'Sign out', run: () => { Store.signOut(); location.reload(); } });

    palItems = out; palSel = 0; palPaint();
  }

  function palPaint() {
    let html = '', last = null;
    palItems.forEach((it, i) => {
      if (it.group !== last) { html += `<div class="pal-group">${it.group}</div>`; last = it.group; }
      html += `<button class="pal-item ${i === palSel ? 'sel' : ''}" data-pal="${i}">
        ${svg(it.icon)}<span>${esc(it.label)}</span>${it.hint ? `<small>${esc(it.hint)}</small>` : ''}</button>`;
    });
    const box = $('#pal-results');
    box.innerHTML = html || '<div class="pal-group">Nothing matches</div>';
    box.querySelectorAll('[data-pal]').forEach(b =>
      b.addEventListener('click', () => { palClose(); palItems[Number(b.dataset.pal)].run(); }));
    const sel = box.querySelector('.sel');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  /* ============================== BOOT ============================== */
  function boot() {
    const me = Store.currentUser();
    if (!me) { $('#gate').hidden = false; $('#app').hidden = true; renderGate(); return; }
    $('#gate').hidden = true;
    $('#app').hidden = false;
    if (!location.hash) { location.hash = '#/today'; return; }
    render();
  }

  function start() {
    $('#scrim').addEventListener('click', closeSheet);
    $('#tb-search').addEventListener('click', palOpen);
    $('#tb-menu').addEventListener('click', () => $('#rail').classList.toggle('open'));
    $('#rail').addEventListener('click', e => {
      const l = e.target.closest('.rail-link');
      if (l && !l.matches('.rail-parent')) $('#rail').classList.remove('open');
    });
    $('#rail-me').addEventListener('click', () => go('#/settings'));

    $('#pal-q').addEventListener('input', e => palFilter(e.target.value));
    $('#palette').addEventListener('click', e => { if (e.target.id === 'palette') palClose(); });
    $('#pal-q').addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palSel + 1, palItems.length - 1); palPaint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(palSel - 1, 0); palPaint(); }
      else if (e.key === 'Enter') { e.preventDefault(); const it = palItems[palSel]; if (it) { palClose(); it.run(); } }
    });

    window.addEventListener('hashchange', () => {
      if (!Store.currentUser()) return;
      closeSheet();
      render();
    });

    document.addEventListener('keydown', e => {
      if (!Store.currentUser()) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palOpen(); return; }
      if (e.key === 'Escape') {
        if (!$('#palette').hidden) palClose();
        else if (!$('#sheet').hidden) closeSheet();
        return;
      }
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
      if (e.key === '/') { e.preventDefault(); palOpen(); }
    });

    if (typeof Cloud !== 'undefined' && Cloud.enabled) {
      Cloud.init().then(() => { Cloud.session() ? enterCloud() : renderCloudGate(); });
    } else {
      boot();
    }
  }

  return {
    $, esc, svg, avatar, initials, areaOf, statusOf, ago, daysSince, dueLabel,
    toast, copy, view, views, NAV, route, go, render, renderRail,
    inlineText, stopRow,
    openSheet, closeSheet, refreshSheet, boot, start
  };
})();
