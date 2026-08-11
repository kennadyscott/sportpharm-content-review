/* =============================================================================
   SportPharm HQ — data layer + session

   Everything the app reads or writes goes through here, so swapping
   localStorage for the Supabase tables in supabase/hq.sql is a change to this
   file alone. hq-cloud.js already write-throughs each top-level key.

   Campaign review is NOT here. It lives in the Content Studio
   (campaigns/index.html) against its own Supabase project — HQ only holds the
   index of campaigns so it can link in.
============================================================================= */

const Store = (() => {
  const KEY = 'sphq-state-v1';
  const SESSION = 'sphq-session';

  let state = null;
  const listeners = new Set();

  /* A door, not a lock — see README before this link leaves the team. */
  function hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return 's' + h.toString(36);
  }
  function uid(p) { return p + '-' + Math.random().toString(36).slice(2, 9); }
  function now() { return new Date().toISOString(); }
  function today() { return new Date().toISOString().slice(0, 10); }

  function seed() {
    return {
      users: SEED_USERS.map((u, i) => ({
        id: u.id, name: u.name, email: u.email, role: u.role, tone: u.tone,
        title: u.title, seed: !!u.seed, invite: !!u.invite,
        pass: hash(u.pass), createdAt: now(), order: i
      })),
      messages: SEED_MESSAGES.slice(),
      projects: SEED_PROJECTS.map(p => ({
        ...p,
        tasks: p.tasks.map((t, i) => ({ notes: '', createdAt: now(), updatedAt: now(), ...t, order: i }))
      })),
      articles: SEED_ARTICLES.concat(typeof LIVE_ARTICLES !== 'undefined' ? LIVE_ARTICLES : []).map((a, i) => ({
        checks: {}, thread: [], createdBy: null, scheduledFor: '', series: '', sourceUrl: '',
        createdAt: now(), updatedAt: now(), order: i, ...a,
        /* whichever side was authored, derive the other — `blocks` is the truth,
           `body` is the plain-text shadow that search and read-time run on */
        blocks: a.blocks || blocksFromText(a.body),
        body: a.body || textOfBlocks(a.blocks || [])
      })),
      media: SEED_MEDIA.map((m, i) => ({ createdAt: now(), order: i, ...m })),
      ideas: SEED_IDEAS.map((d, i) => ({ ...d, at: now(), order: i, voters: [] })),
      platforms: SEED_PLATFORMS.map((p, i) => ({ ...p, order: i, createdAt: now(), updatedAt: now() })),
      plan: LAUNCH_PIECES.map((p, i) => ({ notes: '', owner: null, ...p, order: i, createdAt: now(), updatedAt: now() })),
      planRules: { ...DEFAULT_PLAN_RULES },
      reminders: SEED_REMINDERS.map((r, i) => ({ resolved: false, ...r, order: i, createdAt: now(), updatedAt: now() })),
      orders: SEED_ORDERS.map((o, i) => ({ order: i, ...o })),
      todos: SEED_TODOS.map((t, i) => ({ done: false, repeats: null, tag: '', detail: '',
        day: null, order: i, createdAt: now(), ...t })),
      metrics: {},    /* rowKey -> { col: value }, plus .margin — HQ-level rollup */
      kpis: {},       /* "<periodKey>:<metric>" -> number. Empty on purpose; see hq-data.js */
      campReview: {}, /* "campId:sec:<key>" | "campId:asset:<id>" -> { status, thread[] } */
      flags: {},      /* one-off markers: migrations, dismissals */
      invites: [],
      activity: [],
      createdAt: now()
    };
  }

  /* ---------------------------- migrations ------------------------------
     A seed only ever applies to a brand-new store, so changing SEED_PROJECTS
     did nothing for anyone who had already opened HQ — they kept the four
     original projects and wondered why the reset never arrived.

     Each migration runs once, recorded in `flags`. The rule for all of them:
     only touch data that is still recognisably the seed. If somebody has
     renamed a project or added a task to it, that is their work and it stays,
     migration or not. Better to leave one stale row than delete real work.
  --------------------------------------------------------------------- */
  const MIGRATIONS = {
    /* The four launch-era projects were replaced by a single Website
       Redesign. Drop them only where they are untouched. */
    'projects-2026-08': (s, base) => {
      const OLD = ['CMS & publishing', 'Direct-to-site sales',
                   'Website build-out', 'Professional channel'];
      if (!Array.isArray(s.projects)) return;
      const untouched = p => OLD.includes(p.name) &&
        (p.tasks || []).every(t => !t.notes && !(t.handoffs || []).length && t.status !== 'shipped');
      const kept = s.projects.filter(p => !untouched(p));
      /* Only if every one of them was untouched — a partial clear would be
         more confusing than leaving them all. */
      if (kept.length !== s.projects.length) s.projects = kept;
      if (!s.projects.some(p => p.id === 'p-web')) {
        const seedWeb = base.projects.find(p => p.id === 'p-web');
        if (seedWeb) s.projects.unshift(seedWeb);
      }
    }
  };

  function runMigrations(s, base) {
    if (!s.flags) s.flags = {};
    let ran = false;
    Object.keys(MIGRATIONS).forEach(k => {
      if (s.flags['mig:' + k]) return;
      try { MIGRATIONS[k](s, base); } catch (e) { /* never block a load */ }
      s.flags['mig:' + k] = { done: true, at: now() };
      ran = true;
    });
    return ran;
  }

  function load() {
    if (state) return state;
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : seed();
      /* forward-compatible: fill in any key a newer build expects */
      const base = seed();
      Object.keys(base).forEach(k => { if (state[k] === undefined) state[k] = base[k]; });
      /* ...and any key inside the settings objects. Backfilling only the top
         level silently left new rules unset on every existing store, so a rule
         could look switched on in Settings and never actually fire. */
      ['planRules'].forEach(k => {
        if (state[k] && typeof state[k] === 'object') {
          Object.keys(base[k]).forEach(sub => {
            if (state[k][sub] === undefined) state[k][sub] = base[k][sub];
          });
        }
      });
      /* Seats added by a later build. `users` already exists, so the top-level
         backfill above skips it and Julia and Marissa would never appear in a
         store that was created before they were added. Match on id, and never
         overwrite a seat someone has already claimed. */
      if (Array.isArray(state.users)) {
        base.users.forEach(u => {
          if (!state.users.some(x => x.id === u.id)) state.users.push(u);
        });
      }
      runMigrations(state, base);
    } catch (e) { state = seed(); }
    if (runSchedule()) save();
    return state;
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    if (typeof Cloud !== 'undefined' && Cloud.enabled) Cloud.push(state);
    listeners.forEach(fn => fn(state));
  }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  /* -------------------------------- cloud -------------------------------- */
  function injectState(remote) {
    const base = seed();
    state = base;
    Object.keys(remote).forEach(k => { if (remote[k] !== null && remote[k] !== undefined) state[k] = remote[k]; });
    localStorage.setItem(KEY, JSON.stringify(state));
    if (typeof Cloud !== 'undefined' && Cloud.enabled) Cloud.snapshot(state);
    if (runSchedule()) save();
  }
  function applyRemote(k, v) {
    load()[k] = v;
    localStorage.setItem(KEY, JSON.stringify(state));
    listeners.forEach(fn => fn(state));
  }
  function findUserByEmail(email) {
    if (!email) return null;
    return load().users.find(u =>
      (u.authEmail || '').toLowerCase() === email || (u.email || '').toLowerCase() === email) || null;
  }
  function claimSeat(userId, email) {
    const u = load().users.find(x => x.id === userId);
    if (!u) return null;
    u.authEmail = email;
    localStorage.setItem(SESSION, u.id);
    u.lastSeen = now();
    save();
    return u;
  }

  /* ------------------------------- session ------------------------------- */
  function currentUser() {
    const id = localStorage.getItem(SESSION);
    return id ? load().users.find(u => u.id === id) || null : null;
  }
  function signIn(userId, passcode) {
    const u = load().users.find(x => x.id === userId);
    if (!u) return { ok: false, error: 'That seat no longer exists.' };
    if (u.pass !== hash(passcode)) return { ok: false, error: 'That passcode doesn’t match.' };
    localStorage.setItem(SESSION, u.id);
    u.lastSeen = now();
    save();
    return { ok: true, user: u };
  }
  function signInSeat(userId) {
    const u = load().users.find(x => x.id === userId);
    if (!u) return { ok: false, error: 'That seat no longer exists.' };
    localStorage.setItem(SESSION, u.id);
    u.lastSeen = now();
    save();
    return { ok: true, user: u };
  }
  function signOut() {
    localStorage.removeItem(SESSION);
    try { sessionStorage.removeItem('sphq-key'); localStorage.removeItem('sphq-key'); } catch (e) {}
    if (typeof Cloud !== 'undefined' && Cloud.enabled) Cloud.signOutCloud();
  }

  function can(action) {
    const u = currentUser();
    if (!u) return false;
    if (u.role === 'owner') return true;
    if (u.role === 'editor') return action !== 'manageTeam';
    return action === 'comment';
  }

  function log(action, target) {
    const me = currentUser();
    const s = load();
    s.activity.unshift({ id: uid('act'), by: me ? me.id : null, action, target: target || '', at: now() });
    if (s.activity.length > 200) s.activity.length = 200;
  }

  /* ------------------------------- lookups ------------------------------- */
  const users = () => load().users;
  const user = id => load().users.find(u => u.id === id) || null;
  const projects = () => load().projects;
  const project = id => load().projects.find(p => p.id === id) || null;
  const campaigns = () => SEED_CAMPAIGNS;
  const campaign = id => SEED_CAMPAIGNS.find(c => c.id === id) || null;
  const ideas = () => load().ideas;
  const activity = () => load().activity;

  function allTasks() {
    const out = [];
    load().projects.forEach(p => p.tasks.forEach(t => out.push({ ...t, project: p })));
    return out;
  }

  /* =========================================================================
     THE CMS — articles, the review loop, scheduling, and the media library.

     An article moves draft → review → approved → (scheduled) → published.
     Nothing skips review while `planRules.requireReview` is on, and an editor
     cannot approve their own writing. Publishing sets `publishedAt`, which is
     what the public site reads; `status` is what HQ reads.
  ========================================================================= */
  const articles = () => load().articles;
  const article = id => load().articles.find(a => a.id === id) || null;

  /* ---------------------------- blocks -----------------------------------
     An article body is an ordered list of blocks, the way a page gets built
     in Squarespace. `body` is kept in sync as plain text so search, excerpts
     and read-time still work on something simple.
  ----------------------------------------------------------------------- */
  const blocksOf = a => (a && Array.isArray(a.blocks)) ? a.blocks : [];

  function newBlock(type) {
    const b = { id: uid('b'), type };
    const d = BLOCK_DEFAULTS[type];
    if (d) Object.assign(b, JSON.parse(JSON.stringify(d)));
    return b;
  }

  /* Turn the old markdown-lite body into blocks, once, so nothing is lost. */
  function blocksFromText(body) {
    const out = [];
    String(body || '').split(/\n{2,}/).forEach(chunk => {
      const lines = chunk.split('\n').filter(l => l.trim());
      if (!lines.length) return;
      if (/^#{1,3}\s/.test(lines[0])) {
        const level = (lines[0].match(/^#+/) || ['##'])[0].length;
        out.push({ ...newBlock('heading'), text: lines[0].replace(/^#+\s*/, ''), level: Math.min(Math.max(level, 2), 3) });
        const rest = lines.slice(1).join(' ').trim();
        if (rest) out.push({ ...newBlock('text'), text: rest });
        return;
      }
      if (lines.every(l => /^[-*]\s/.test(l.trim()))) {
        out.push({ ...newBlock('list'), items: lines.map(l => l.trim().replace(/^[-*]\s*/, '')) });
        return;
      }
      out.push({ ...newBlock('text'), text: lines.join(' ') });
    });
    return out.length ? out : [newBlock('text')];
  }

  /* The plain-text shadow of the blocks — what search and read-time use. */
  function textOfBlocks(blocks) {
    return blocks.map(b => {
      switch (b.type) {
        case 'heading': return '#'.repeat(b.level || 2) + ' ' + (b.text || '');
        case 'text': case 'split': case 'callout': case 'quote': return b.text || '';
        case 'list': return (b.items || []).map(i => '- ' + i).join('\n');
        case 'columns': return [b.left, b.right].filter(Boolean).join('\n\n');
        default: return '';
      }
    }).filter(Boolean).join('\n\n');
  }

  function ensureBlocks(a) {
    if (!a) return [];
    if (!Array.isArray(a.blocks) || !a.blocks.length) a.blocks = blocksFromText(a.body);
    return a.blocks;
  }

  const blockIndex = (a, blockId) => blocksOf(a).findIndex(b => b.id === blockId);

  function addBlock(articleId, type, atIndex) {
    const a = article(articleId);
    if (!a) return null;
    ensureBlocks(a);
    const b = newBlock(type);
    const i = (atIndex == null || atIndex < 0) ? a.blocks.length : Math.min(atIndex, a.blocks.length);
    a.blocks.splice(i, 0, b);
    syncBody(a);
    log('added a ' + (BLOCK_TYPES[type] || {}).label + ' block', a.title);
    save();
    return b;
  }

  /* Typing shouldn't repaint the page or hammer localStorage — mutate now,
     write a moment later. */
  let blockTimer = null;
  function setBlock(articleId, blockId, patch) {
    const a = article(articleId);
    if (!a) return;
    const b = blocksOf(a).find(x => x.id === blockId);
    if (!b) return;
    Object.assign(b, patch);
    a.updatedAt = now();
    clearTimeout(blockTimer);
    blockTimer = setTimeout(() => { syncBody(a); save(); }, 400);
  }

  function moveBlock(articleId, blockId, dir) {
    const a = article(articleId);
    if (!a) return;
    const i = blockIndex(a, blockId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= a.blocks.length) return;
    const [b] = a.blocks.splice(i, 1);
    a.blocks.splice(j, 0, b);
    syncBody(a);
    save();
  }

  /* Drop a block at an arbitrary index — what drag-and-drop calls. */
  function placeBlock(articleId, blockId, toIndex) {
    const a = article(articleId);
    if (!a) return;
    const i = blockIndex(a, blockId);
    if (i < 0) return;
    const [b] = a.blocks.splice(i, 1);
    let j = toIndex;
    if (i < toIndex) j -= 1;
    a.blocks.splice(Math.max(0, Math.min(j, a.blocks.length)), 0, b);
    syncBody(a);
    save();
  }

  function duplicateBlock(articleId, blockId) {
    const a = article(articleId);
    if (!a) return;
    const i = blockIndex(a, blockId);
    if (i < 0) return;
    const copy = { ...JSON.parse(JSON.stringify(a.blocks[i])), id: uid('b') };
    a.blocks.splice(i + 1, 0, copy);
    syncBody(a);
    save();
  }

  function removeBlock(articleId, blockId) {
    const a = article(articleId);
    if (!a) return;
    a.blocks = blocksOf(a).filter(b => b.id !== blockId);
    if (!a.blocks.length) a.blocks = [newBlock('text')];
    syncBody(a);
    save();
  }

  function syncBody(a) { a.body = textOfBlocks(blocksOf(a)); a.updatedAt = now(); }
  function flushBlocks() { clearTimeout(blockTimer); const s = load(); s.articles.forEach(syncBody); save(); }

  function slugify(s) {
    return String(s || '').toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  }
  /* Slugs are the article's URL, so they have to be unique. */
  function uniqueSlug(base, ignoreId) {
    const want = slugify(base) || 'untitled';
    const taken = new Set(articles().filter(a => a.id !== ignoreId).map(a => a.slug));
    if (!taken.has(want)) return want;
    let n = 2;
    while (taken.has(want + '-' + n)) n++;
    return want + '-' + n;
  }

  function addArticle(fields) {
    const me = currentUser();
    const title = (fields && fields.title) || 'Untitled article';
    const a = {
      id: uid('a'), title, slug: uniqueSlug(title), category: ARTICLE_CATS[0], tags: [],
      author: me ? me.name : 'SportPharm Team', createdBy: me ? me.id : null,
      status: 'draft', date: today(), scheduledFor: '', publishedAt: '', views: 0,
      series: '', sourceUrl: '', image: '', excerpt: '', body: '', blocks: [newBlock('text')], checks: {}, thread: [],
      order: -Date.now() / 1000, createdAt: now(), updatedAt: now(), ...fields
    };
    load().articles.unshift(a);
    log('started an article', a.title);
    save();
    return a;
  }

  function updateArticle(id, patch, logText) {
    const a = article(id);
    if (!a) return null;
    if (patch && patch.slug) patch.slug = uniqueSlug(patch.slug, id);
    Object.assign(a, patch, { updatedAt: now() });
    if (logText) log(logText, a.title);
    save();
    return a;
  }

  function removeArticle(id) {
    const s = load();
    const a = article(id);
    s.articles = s.articles.filter(x => x.id !== id);
    if (a) log('deleted an article', a.title);
    save();
  }

  /* Who may sign off. An editor writing a piece cannot also clear it; an owner
     can, because on a three-person team someone has to be able to unblock. */
  function canApprove(a) {
    const me = currentUser();
    if (!me || !a) return false;
    if (me.role === 'viewer') return false;
    if (me.role === 'owner') return true;
    return a.createdBy !== me.id;
  }
  function approveBlockedReason(a) {
    const me = currentUser();
    if (!me) return 'Sign in first.';
    if (me.role === 'viewer') return 'Viewers can leave notes, not approve.';
    if (a && a.createdBy === me.id) return 'You wrote this one — someone else signs it off.';
    return '';
  }

  /* Every guardrail still outstanding on a piece. */
  function openChecks(a) {
    return ARTICLE_CHECKS.filter(c => !(a.checks || {})[c.k]);
  }
  function toggleCheck(id, k) {
    const a = article(id);
    if (!a) return;
    a.checks = a.checks || {};
    a.checks[k] = !a.checks[k];
    a.updatedAt = now();
    save();
  }

  function submitForReview(id) {
    const a = article(id);
    if (!a) return { ok: false, error: 'Gone.' };
    flushBlocks();
    if (!a.title.trim()) return { ok: false, error: 'It needs a title first.' };
    if (!a.body.trim()) return { ok: false, error: 'There’s no body to review yet.' };
    a.status = 'review'; a.updatedAt = now();
    log('sent for review', a.title);
    save();
    return { ok: true };
  }

  function approveArticle(id) {
    const a = article(id);
    if (!a) return { ok: false, error: 'Gone.' };
    if (!canApprove(a)) return { ok: false, error: approveBlockedReason(a) };
    const open = openChecks(a);
    if (open.length) return { ok: false, error: 'Still unchecked — ' + open.map(c => c.label.toLowerCase()).join(', ') + '.' };
    a.status = 'approved'; a.approvedBy = (currentUser() || {}).id; a.approvedAt = now();
    a.updatedAt = now();
    log('approved', a.title);
    save();
    return { ok: true };
  }

  function requestChanges(id, note) {
    const a = article(id);
    if (!a) return { ok: false, error: 'Gone.' };
    if (!canApprove(a)) return { ok: false, error: approveBlockedReason(a) };
    a.status = 'changes'; a.updatedAt = now();
    if (note && note.trim()) addArticleNote(id, note, null, true);
    log('sent back with changes', a.title);
    save();
    return { ok: true };
  }

  /* Publishing is the only state the public site can see. */
  function publishArticle(id) {
    const a = article(id);
    if (!a) return { ok: false, error: 'Gone.' };
    const rules = planRules();
    if (rules.requireReview && ['approved', 'scheduled', 'published'].indexOf(a.status) === -1) {
      return { ok: false, error: 'It has to be approved before it can go live.' };
    }
    a.status = 'published';
    a.publishedAt = now();
    a.date = today();
    a.scheduledFor = '';
    a.updatedAt = now();
    log('published', a.title);
    save();
    return { ok: true };
  }

  function scheduleArticle(id, date) {
    const a = article(id);
    if (!a) return { ok: false, error: 'Gone.' };
    const rules = planRules();
    if (rules.requireReview && ['approved', 'scheduled'].indexOf(a.status) === -1) {
      return { ok: false, error: 'It has to be approved before it can be scheduled.' };
    }
    if (!date) return { ok: false, error: 'Pick a date.' };
    if (date < today()) return { ok: false, error: 'That date has already passed.' };
    a.status = 'scheduled'; a.scheduledFor = date; a.updatedAt = now();
    log('scheduled', a.title + ' → ' + date);
    save();
    return { ok: true };
  }

  function unpublishArticle(id) {
    const a = article(id);
    if (!a) return { ok: false, error: 'Gone.' };
    a.status = 'approved'; a.publishedAt = ''; a.scheduledFor = ''; a.updatedAt = now();
    log('pulled from the site', a.title);
    save();
    return { ok: true };
  }

  /* Scheduled pieces whose date has arrived. With no server behind this they go
     live on the first load after the date — see the launch gate on Today. */
  function dueToPublish() {
    return load().articles.filter(a => a.status === 'scheduled' && a.scheduledFor && a.scheduledFor <= today());
  }
  function runSchedule() {
    if (!state || !Array.isArray(state.articles)) return false;
    const t = today();
    let changed = false;
    state.articles.forEach(a => {
      if (a.status === 'scheduled' && a.scheduledFor && a.scheduledFor <= t) {
        a.status = 'published';
        a.publishedAt = a.scheduledFor + 'T09:00:00.000Z';
        a.date = a.scheduledFor;
        a.scheduledFor = '';
        a.updatedAt = now();
        changed = true;
      }
    });
    return changed;
  }

  /* The review conversation on a piece. Notes survive edits to the article. */
  function addArticleNote(id, text, parentId, quiet) {
    const me = currentUser();
    const a = article(id);
    if (!a || !me || !text.trim()) return null;
    a.thread = a.thread || [];
    const note = { id: uid('n'), by: me.id, at: now(), text: text.trim(), replies: [] };
    if (parentId) {
      const parent = a.thread.find(n => n.id === parentId);
      if (parent) { parent.replies = parent.replies || []; parent.replies.push(note); }
    } else {
      a.thread.push(note);
    }
    if (!quiet) { log('left a note', a.title); save(); }
    return note;
  }
  function removeArticleNote(id, noteId) {
    const a = article(id);
    if (!a) return;
    a.thread = (a.thread || []).filter(n => n.id !== noteId);
    a.thread.forEach(n => { n.replies = (n.replies || []).filter(x => x.id !== noteId); });
    save();
  }
  const noteCount = a => (a.thread || []).reduce((n, t) => n + 1 + (t.replies || []).length, 0);

  function articleStats() {
    const all = articles();
    const by = st => all.filter(a => a.status === st).length;
    return {
      total: all.length,
      draft: by('draft'), review: by('review'), changes: by('changes'),
      approved: by('approved'), scheduled: by('scheduled'), published: by('published'),
      views: all.reduce((n, a) => n + (Number(a.views) || 0), 0)
    };
  }
  /* Exactly what the public site would fetch. */
  /* `blocks` is the structured truth; `html` is there so the site can inject it
     without knowing anything about our block types. */
  const publishedFeed = () => articles()
    .filter(a => a.status === 'published')
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
    .map(a => ({
      slug: a.slug, title: a.title, excerpt: a.excerpt, category: a.category,
      series: a.series || '', sourceUrl: a.sourceUrl || '', tags: a.tags, author: a.author, image: a.image,
      publishedAt: a.publishedAt || a.date,
      blocks: blocksOf(a),
      html: (typeof HQ !== 'undefined' && HQ.renderBlocks) ? HQ.renderBlocks(blocksOf(a)) : '',
      body: a.body
    }));

  /* ------------------------------ the media ------------------------------ */
  const media = () => load().media;
  const mediaItem = id => load().media.find(m => m.id === id) || null;

  function addMedia(fields) {
    const m = {
      id: uid('m'), name: 'Untitled', alt: '', kind: 'link', src: '', tags: [],
      createdAt: now(), order: -Date.now() / 1000, ...fields
    };
    load().media.unshift(m);
    log('added to the media library', m.name);
    save();
    return m;
  }
  function updateMedia(id, patch) {
    const m = mediaItem(id);
    if (m) { Object.assign(m, patch); save(); }
    return m;
  }
  function removeMedia(id) {
    const s = load();
    s.media = s.media.filter(m => m.id !== id);
    save();
  }
  /* Which articles point at this image — so nothing is deleted out from under one. */
  const mediaUsedBy = src => (src ? articles().filter(a => a.image === src) : []);

  /* ------------------------------- projects ------------------------------ */
  function taskRef(projectId, taskId) {
    const p = project(projectId);
    return p ? p.tasks.find(t => t.id === taskId) : null;
  }
  function updateTask(projectId, taskId, patch, logText) {
    const t = taskRef(projectId, taskId);
    if (!t) return null;
    Object.assign(t, patch, { updatedAt: now() });
    if (logText) log(logText, t.title);
    save();
    return t;
  }
  function createTask(projectId, fields) {
    const p = project(projectId);
    if (!p) return null;
    const me = currentUser();
    const t = {
      id: uid('t'), title: 'Untitled task', status: 'someday', owner: me ? me.id : null,
      due: '', campaign: '', notes: '',
      order: -Date.now() / 1000, createdAt: now(), updatedAt: now(), ...fields
    };
    p.tasks.unshift(t);
    log('added a task', t.title);
    save();
    return t;
  }
  function removeTask(projectId, taskId) {
    const p = project(projectId);
    if (!p) return;
    p.tasks = p.tasks.filter(t => t.id !== taskId);
    save();
  }
  function createProject(fields) {
    const p = { id: uid('p'), name: 'New project', area: 'content', tone: 'blue', goal: '', due: '', tasks: [], ...fields };
    load().projects.push(p);
    log('started a project', p.name);
    save();
    return p;
  }
  function updateProject(id, patch) {
    const p = project(id);
    if (p) { Object.assign(p, patch); save(); }
    return p;
  }

  /* ---------------------------- project tabs ----------------------------
     Every project opens on its board. Anything else is a page someone added
     — a spec, a decision log, a list of URLs — and holds free text, because
     the moment it holds a schema it stops being the place you put the thing
     that does not fit anywhere. */
  function projectTabs(id) {
    const p = project(id);
    if (!p) return [];
    return [{ id: 'board', label: 'Board', fixed: true }].concat(p.tabs || []);
  }
  function addProjectTab(id, label) {
    const p = project(id);
    if (!p) return null;
    if (!Array.isArray(p.tabs)) p.tabs = [];
    const t = { id: uid('tab'), label: (label || 'New page').slice(0, 40), notes: '' };
    p.tabs.push(t);
    save();
    return t;
  }
  function updateProjectTab(id, tabId, patch) {
    const p = project(id);
    const t = p && (p.tabs || []).find(x => x.id === tabId);
    if (t) { Object.assign(t, patch); save(); }
    return t || null;
  }
  function removeProjectTab(id, tabId) {
    const p = project(id);
    if (!p || !Array.isArray(p.tabs)) return;
    p.tabs = p.tabs.filter(t => t.id !== tabId);
    save();
  }
  function removeProject(id) {
    const s = load();
    s.projects = s.projects.filter(p => p.id !== id);
    save();
  }

  /* Order is a float between neighbours, so a move never renumbers a column. */
  function moveTask(projectId, taskId, status, beforeId) {
    const p = project(projectId);
    const t = taskRef(projectId, taskId);
    if (!p || !t) return;
    const changed = t.status !== status;
    const col = p.tasks.filter(x => x.status === status && x.id !== taskId).sort((a, b) => a.order - b.order);
    let before = null, after = null;
    if (beforeId) {
      const i = col.findIndex(x => x.id === beforeId);
      if (i !== -1) { after = col[i]; before = col[i - 1] || null; }
    } else {
      before = col[col.length - 1] || null;
    }
    const lo = before ? before.order : (after ? after.order - 2 : 0);
    const hi = after ? after.order : lo + 2;
    t.order = (lo + hi) / 2;
    t.status = status;
    t.updatedAt = now();
    if (changed) log('moved to ' + (STATUSES.find(s => s.id === status) || {}).label, t.title);
    save();
  }
  function nudgeTask(projectId, taskId, dir) {
    const p = project(projectId);
    const t = taskRef(projectId, taskId);
    if (!p || !t) return;
    const col = p.tasks.filter(x => x.status === t.status).sort((a, b) => a.order - b.order);
    const i = col.findIndex(x => x.id === taskId);
    const swap = col[i + dir];
    if (!swap) return;
    const o = t.order; t.order = swap.order; swap.order = o;
    save();
  }
  function shiftTask(projectId, taskId, dir) {
    const t = taskRef(projectId, taskId);
    if (!t) return;
    const i = STATUSES.findIndex(s => s.id === t.status);
    const next = STATUSES[i + dir];
    if (next) moveTask(projectId, taskId, next.id, null);
  }

  /* ------------------------------- metrics ------------------------------- */
  /* HQ-level channel rollup. Per-campaign ROI lives in the Content Studio. */
  function metricsOf() {
    const s = load();
    if (!s.metrics) s.metrics = {};
    return s.metrics;
  }
  function setMetric(row, col, value) {
    const m = metricsOf();
    if (!m[row]) m[row] = {};
    m[row][col] = value;
    save();
  }
  function setMargin(v) { metricsOf().margin = v; save(); }

  /* -------------------------------- ideas -------------------------------- */
  function addIdea(text, area) {
    const me = currentUser();
    const d = {
      id: uid('d'), text: text.trim(), by: me ? me.id : null, area: area || 'content',
      votes: 0, voters: [], state: 'open', at: now(), order: -Date.now() / 1000
    };
    load().ideas.unshift(d);
    log('added an idea', d.text);
    save();
    return d;
  }
  function voteIdea(id) {
    const me = currentUser();
    const d = load().ideas.find(x => x.id === id);
    if (!d || !me) return;
    d.voters = d.voters || [];
    const i = d.voters.indexOf(me.id);
    if (i === -1) { d.voters.push(me.id); d.votes = (d.votes || 0) + 1; }
    else { d.voters.splice(i, 1); d.votes = Math.max(0, (d.votes || 1) - 1); }
    save();
  }
  function setIdeaState(id, st) {
    const d = load().ideas.find(x => x.id === id);
    if (d) { d.state = st; save(); }
  }
  function removeIdea(id) {
    const s = load();
    s.ideas = s.ideas.filter(d => d.id !== id);
    save();
  }
  function promoteIdea(id, projectId) {
    const d = load().ideas.find(x => x.id === id);
    if (!d) return null;
    const t = createTask(projectId, { title: d.text, status: 'next', notes: 'Came from the idea bank.' });
    d.state = 'promoted';
    save();
    return t;
  }
  /* An idea can also become a draft article — the shortest path from
     "someone said this" to "somebody is writing it". */
  function ideaToArticle(id) {
    const d = load().ideas.find(x => x.id === id);
    if (!d) return null;
    const a = addArticle({ title: d.text, excerpt: '', body: '' });
    d.state = 'promoted';
    save();
    return a;
  }

  /* --------------------------------- plan -------------------------------- */
  const pieces = () => load().plan;
  const piece = id => load().plan.find(p => p.id === id) || null;
  const planRules = () => load().planRules;
  function setPlanRules(patch) { Object.assign(load().planRules, patch); save(); }

  function addPiece(fields) {
    const me = currentUser();
    const p = {
      id: uid('pp'), title: 'Untitled piece', campaign: (SEED_CAMPAIGNS[0] || {}).id || '',
      format: 'Post', channel: 'instagram', status: 'drafting', date: '', owner: me ? me.id : null,
      facing: 'athlete', pillar: '', notes: '', order: -Date.now() / 1000, createdAt: now(), updatedAt: now(), ...fields
    };
    load().plan.unshift(p);
    log('added a piece to the plan', p.title);
    save();
    return p;
  }
  function updatePiece(id, patch, logText) {
    const p = piece(id);
    if (!p) return null;
    Object.assign(p, patch, { updatedAt: now() });
    if (logText) log(logText, p.title);
    save();
    return p;
  }
  function removePieces(ids) {
    const s = load();
    s.plan = s.plan.filter(p => !ids.includes(p.id));
    save();
  }

  /* Honors the require-review rule: a drafting piece cannot jump straight to
     scheduled. Returns the titles it refused so the UI can say why. */
  /* The Studio signs off creative before the Plan schedules it. We only refuse
     on a definite negative verdict — if the Studio has said nothing about a
     piece, that is silence, not rejection, and blocking on silence would make
     the Plan unusable. */
  function briefBlocks(p) {
    const rules = planRules();
    if (!rules.requireBriefApproval) return null;
    if (!p.assetId || typeof StudioSync === 'undefined') return null;
    const v = StudioSync.assetStatus(p.campaign, p.assetId);
    if (!v || v.ok) return null;
    return v.label;
  }

  function bulkStatus(ids, status) {
    const rules = planRules();
    const refused = [];
    ids.forEach(id => {
      const p = piece(id);
      if (!p) return;
      if (status === 'scheduled' && rules.requireReview && p.status === 'drafting') { refused.push(p.title); return; }
      if (status === 'scheduled' && briefBlocks(p)) { refused.push(p.title + ' — brief ' + briefBlocks(p).toLowerCase()); return; }
      p.status = status;
      p.updatedAt = now();
    });
    log('bulk-marked ' + (PLAN_STATUS[status] || {}).label, ids.length + ' pieces');
    save();
    return refused;
  }
  function bulkMove(ids, campaignId) {
    ids.forEach(id => { const p = piece(id); if (p) { p.campaign = campaignId; p.updatedAt = now(); } });
    save();
  }
  function nextDates(from, count) {
    const rules = planRules();
    const out = [];
    const d = new Date((from || today()) + 'T12:00:00');
    while (out.length < count) {
      if (!(rules.avoidWeekends && (d.getDay() === 0 || d.getDay() === 6))) out.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }
  function bulkSchedule(ids, startDate) {
    const rules = planRules();
    const all = ids.map(piece).filter(Boolean);
    const eligible = all.filter(p => !(rules.requireReview && p.status === 'drafting') && !briefBlocks(p));
    const refused = all.filter(p => eligible.indexOf(p) === -1).map(p => p.title);
    const dates = nextDates(startDate, eligible.length);
    eligible.forEach((p, i) => { p.status = 'scheduled'; p.date = dates[i]; p.updatedAt = now(); });
    log('bulk-scheduled', eligible.length + ' pieces');
    save();
    return refused;
  }

  /* =========================================================================
     CAMPAIGN REVIEW — native, not embedded.

     Briefs are content (hq-campaign-data.js) and treated as read-only; only
     the review layer is stored, so a brief can be rewritten without wiping
     anyone's feedback. Keyed per section and per asset.
  ========================================================================= */
  const briefs = () => (typeof CAMPAIGN_BRIEFS !== 'undefined' ? CAMPAIGN_BRIEFS : []);
  const brief = id => briefs().find(c => c.id === id) || null;

  function reviewOf(key) {
    const s = load();
    if (!s.campReview) s.campReview = {};
    if (!s.campReview[key]) s.campReview[key] = { status: 'pending', thread: [] };
    if (!s.campReview[key].thread) s.campReview[key].thread = [];
    return s.campReview[key];
  }
  const rk = (campId, part) => campId + ':' + part;

  const reviewState = (campId, part) => reviewOf(rk(campId, part)).status || 'pending';
  function setReviewState(campId, part, status, label) {
    const r = reviewOf(rk(campId, part));
    r.status = status;
    r.at = now();
    r.by = (currentUser() || {}).id || null;
    log((REVIEW_STATES[status] || {}).logged || 'reviewed', label || part);
    save();
  }

  const reviewThread = (campId, part) => reviewOf(rk(campId, part)).thread;
  function addReviewNote(campId, part, text, parentId) {
    const me = currentUser();
    if (!me || !text.trim()) return null;
    const thread = reviewThread(campId, part);
    const note = { id: uid('n'), by: me.id, at: now(), text: text.trim(), replies: [] };
    if (parentId) {
      const parent = thread.find(n => n.id === parentId);
      if (parent) { parent.replies = parent.replies || []; parent.replies.push(note); }
    } else {
      thread.push(note);
    }
    log('left a note', part);
    save();
    return note;
  }
  function removeReviewNote(campId, part, noteId) {
    const r = reviewOf(rk(campId, part));
    r.thread = (r.thread || []).filter(n => n.id !== noteId);
    r.thread.forEach(n => { n.replies = (n.replies || []).filter(x => x.id !== noteId); });
    save();
  }

  /* How far through a campaign's assets the team is. */
  function campaignProgress(campId) {
    const c = brief(campId);
    if (!c) return { total: 0, done: 0, approved: 0, changes: 0 };
    const states = (c.assets || []).map(a => reviewState(campId, 'asset:' + a.id));
    return {
      total: states.length,
      done: states.filter(x => x !== 'pending').length,
      approved: states.filter(x => x === 'approved').length,
      changes: states.filter(x => x === 'changes').length
    };
  }
  function campaignNoteCount(campId) {
    const r = load().campReview || {};
    let n = 0;
    Object.keys(r).forEach(k => {
      if (k.indexOf(campId + ':') !== 0) return;
      (r[k].thread || []).forEach(t => { n += 1 + (t.replies || []).length; });
    });
    return n;
  }

  /* =========================================================================
     THE WEEK — days, and the running log

     Straight from the ClearK12 model: a todo with a `day` belongs to that day,
     and a todo with no day is the running task log. Nothing else distinguishes
     them, so moving work between the two is just setting or clearing a date.

     A day section also shows project tasks due that day, because "what am I
     doing Monday" doesn't care which list a thing came from.
  ========================================================================= */
  const todos = () => load().todos;
  const todo = id => load().todos.find(t => t.id === id) || null;

  const ymd = d => d.toISOString().slice(0, 10);
  /* Monday of whatever week that date falls in. */
  function mondayOf(iso) {
    const d = new Date((iso || today()) + 'T12:00:00');
    const off = (d.getDay() + 6) % 7;          /* Sun=0 -> 6, Mon=1 -> 0 */
    d.setDate(d.getDate() - off);
    return ymd(d);
  }
  function addDays(iso, n) {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return ymd(d);
  }
  /* Mon–Fri. Weekend work happens, but planning it here would imply it should. */
  const weekDays = start => [0, 1, 2, 3, 4].map(i => addDays(start, i));

  function addTodo(fields) {
    const me = currentUser();
    const t = {
      id: uid('td'), title: 'New item', detail: '', day: null, done: false,
      repeats: null, tag: '', owner: me ? me.id : null,
      order: -Date.now() / 1000, createdAt: now(), ...fields
    };
    load().todos.unshift(t);
    save();
    return t;
  }
  function updateTodo(id, patch) {
    const t = todo(id);
    if (!t) return null;
    Object.assign(t, patch);
    save();
    return t;
  }
  function toggleTodo(id) {
    const t = todo(id);
    if (!t) return;
    t.done = !t.done;
    t.doneAt = t.done ? now() : null;
    save();
  }
  function removeTodo(id) {
    const s = load();
    s.todos = s.todos.filter(t => t.id !== id);
    save();
  }

  /* Everything on a given day: what you put there, plus project work due then. */
  function dayItems(iso) {
    const me = currentUser();
    const mine = todos().filter(t => t.day === iso).sort((a, b) => a.order - b.order);
    const tasks = allTasks().filter(t =>
      t.due === iso && t.status !== 'shipped' && (!me || !t.owner || t.owner === me.id));
    return { todos: mine, tasks };
  }
  /* The running log — anything not yet given a day. */
  const runningLog = () => todos().filter(t => !t.day).sort((a, b) => a.order - b.order);

  /* Work somebody handed you. The question isn't which day — it's whether you
     know about it — so it stands on its own until you plan it. */
  /* Everything sitting with me: work I own, plus anything just handed to me.
     A handoff shows here even if it already has a date, because someone
     passing you a task with a note is news — the date does not make it less
     so, and the old `!t.due` filter would have hidden exactly the handoffs
     this list exists to surface. */
  function assignedToMe() {
    const me = currentUser();
    if (!me) return [];
    return allTasks().filter(t => {
      if (t.owner !== me.id || t.status === 'shipped') return false;
      const h = lastHandoff(t);
      const handedToMe = h && h.to === me.id && h.by !== me.id;
      return handedToMe || !t.due;
    }).sort((a, b) => {
      /* Unopened handoffs first — they are the ones someone is waiting on. */
      const un = t => { const h = lastHandoff(t); return h && !h.seen && h.by !== me.id ? 0 : 1; };
      return un(a) - un(b);
    });
  }

  /* =========================================================================
     HANDOFFS

     Passing the same piece of work back and forth is most of what a shared
     workspace is: "I've done my bit — over to you." The reason has to travel
     with the task, because the other person reads it in a different browser
     hours later, and "why is this mine now?" is otherwise unanswerable.

     Each pass appends to the task's own thread and re-owns it, so there is
     one history rather than a task and a separate conversation about it.
  ========================================================================= */
  function handOff(projectId, taskId, toUserId, note, status) {
    const t = taskRef(projectId, taskId);
    if (!t) return null;
    const me = currentUser();
    t.handoffs = t.handoffs || [];
    t.handoffs.push({
      id: uid('h'),
      by: me ? me.id : null,
      to: toUserId || null,
      note: (note || '').trim(),
      at: now(),
      seen: false
    });
    /* A long-lived task should not grow forever; the recent trail is the
       useful part. */
    if (t.handoffs.length > 40) t.handoffs.splice(0, t.handoffs.length - 40);
    t.owner = toUserId || null;
    if (status && status !== t.status) moveTask(projectId, taskId, status, null);
    t.updatedAt = now();
    const who = user(toUserId);
    log('passed “' + t.title + '” to ' + (who ? who.name.split(' ')[0] : 'no one'), '');
    save();
    return t;
  }

  /* Opening the task is the acknowledgement — no separate "mark read" chore. */
  function seeHandoffs(projectId, taskId) {
    const t = taskRef(projectId, taskId);
    const me = currentUser();
    if (!t || !me || !t.handoffs) return;
    let changed = false;
    t.handoffs.forEach(h => { if (h.to === me.id && !h.seen) { h.seen = true; changed = true; } });
    if (changed) save();
  }

  /* One running conversation: entries with a `to` are passes, entries without
     are someone thinking out loud. Same array either way, so the thread reads
     in order instead of splitting into two histories. */
  function taskLog(t) { return (t && t.handoffs) || []; }

  function addTaskNote(projectId, taskId, text) {
    const body = (text || '').trim();
    if (!body) return null;
    const t = taskRef(projectId, taskId);
    if (!t) return null;
    const me = currentUser();
    t.handoffs = t.handoffs || [];
    t.handoffs.push({ id: uid('h'), by: me ? me.id : null, to: null, note: body, at: now(), seen: true });
    if (t.handoffs.length > 60) t.handoffs.splice(0, t.handoffs.length - 60);
    t.updatedAt = now();
    save();
    return t;
  }

  /* The last actual pass, and only while it still describes the current
     owner. Once the task is reassigned by other means the note is stale, not
     news. Plain notes are skipped — they hand nothing to anyone. */
  function lastHandoff(t) {
    const passes = taskLog(t).filter(h => h.to);
    if (!passes.length) return null;
    const h = passes[passes.length - 1];
    return h.to === t.owner ? h : null;
  }
  /* Newest thing anyone said, whatever kind — what a row should surface. */
  function lastNote(t) {
    const said = taskLog(t).filter(h => h.note);
    return said.length ? said[said.length - 1] : null;
  }

  /* Handed to me and not yet opened — this is the notification. */
  function handoffInbox() {
    const me = currentUser();
    if (!me) return [];
    return allTasks()
      .filter(t => t.status !== 'shipped')
      .map(t => ({ t, h: lastHandoff(t) }))
      .filter(x => x.h && x.h.to === me.id && !x.h.seen && x.h.by !== me.id)
      .sort((a, b) => b.h.at.localeCompare(a.h.at));
  }

  /* What I have passed on and not had back — the other half of "who is doing
     what", and the thing that stops work quietly stalling with someone. */
  function handoffOutbox() {
    const me = currentUser();
    if (!me) return [];
    return allTasks()
      .filter(t => t.status !== 'shipped' && t.owner !== me.id)
      .map(t => ({ t, h: lastHandoff(t) }))
      .filter(x => x.h && x.h.by === me.id && x.h.to)
      .sort((a, b) => a.h.at.localeCompare(b.h.at));
  }

  /* =========================================================================
     KPIs

     One flat map, `kpis`, keyed "<periodKey>:<metric>" — so a week, a month
     and a quarter are the same storage with different keys, and nothing has
     to be recomputed when the period toggle moves.

     Derived metrics are not stored. They are computed on read from whatever
     the entered ones say, so they cannot drift out of agreement with them.
  ========================================================================= */
  function kpiMap() {
    const s = load();
    if (!s.kpis) s.kpis = {};
    return s.kpis;
  }
  const kpiKey = (period, metric) => period + ':' + metric;
  function setKpi(period, metric, value) {
    const m = kpiMap();
    const v = String(value == null ? '' : value).replace(/[$,%×\s,]/g, '');
    if (v === '') delete m[kpiKey(period, metric)];
    else m[kpiKey(period, metric)] = Number(v);
    save();
  }
  /* Every metric for one period: entered values first, then the derived ones
     on top of them. Returns null for anything with no basis rather than 0,
     so an empty week reads as empty and not as a week that sold nothing. */
  function kpiRow(period) {
    const m = kpiMap();
    const v = {};
    KPI_METRICS.forEach(def => {
      if (!def.derive) v[def.k] = m[kpiKey(period, def.k)];
    });
    const nz = k => (typeof v[k] === 'number' ? v[k] : 0);
    const basis = { revenue: nz('revenue'), orders: nz('orders'), spend: nz('spend'),
      sessions: nz('sessions'), newCust: nz('newCust'), repeatCust: nz('repeatCust') };
    KPI_METRICS.forEach(def => {
      if (def.derive) { const d = def.derive(basis); v[def.k] = (d == null || !isFinite(d)) ? undefined : d; }
    });
    return v;
  }

  /* Period keys. Weekly is the Monday, so it lines up with the week on Today;
     monthly is YYYY-MM; quarterly is YYYY-Qn. */
  function kpiPeriods(kind, n) {
    const out = [];
    if (kind === 'week') {
      let d = mondayOf(today());
      for (let i = 0; i < n; i++) { out.push({ key: 'w' + d, label: shortRange(d) }); d = addDays(d, -7); }
    } else if (kind === 'month') {
      const now0 = new Date(today() + 'T00:00:00');
      for (let i = 0; i < n; i++) {
        const d = new Date(now0.getFullYear(), now0.getMonth() - i, 1);
        const key = 'm' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        /* "Aug ’26", not "Aug 26" — the latter reads as the 26th of August. */
        out.push({ key, label: d.toLocaleDateString(undefined, { month: 'short' })
          + ' ’' + String(d.getFullYear()).slice(2) });
      }
    } else {
      const now0 = new Date(today() + 'T00:00:00');
      let y = now0.getFullYear(), q = Math.floor(now0.getMonth() / 3) + 1;
      for (let i = 0; i < n; i++) {
        out.push({ key: 'q' + y + '-Q' + q, label: 'Q' + q + ' ’' + String(y).slice(2) });
        q--; if (q === 0) { q = 4; y--; }
      }
    }
    return out;
  }
  function shortRange(monday) {
    const a = new Date(monday + 'T00:00:00'), b = new Date(addDays(monday, 6) + 'T00:00:00');
    const f = d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return f(a) + '–' + (a.getMonth() === b.getMonth() ? b.getDate() : f(b));
  }

  /* =========================================================================
     MESSAGES

     Threads, not one shared log: you pick who it goes to. A message carries
     `to` — either a user id (a DM) or 'team' (the room everyone sees).

     Two pieces of state that look similar and are not:
       done  — shared. If Jessie has dealt with it, Brandon should see that.
       read  — personal, and deliberately kept in localStorage outside the
               synced state, because otherwise opening a thread is a write,
               and a write is a sync for everyone.
  ========================================================================= */
  const MSG_CAP = 600;

  function messages() {
    const s = load();
    if (!Array.isArray(s.messages)) s.messages = [];
    return s.messages;
  }

  /* Everyone but me, plus the Team room. Seed accounts are demo rows, not
     people, so they are not somewhere you can send a message. */
  function threads() {
    const me = currentUser();
    const list = [{ id: TEAM_THREAD, name: 'Team', title: 'Everyone', tone: 'navy', isRoom: true }];
    load().users.filter(u => !u.seed && (!me || u.id !== me.id))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(u => list.push({ id: u.id, name: u.name, title: u.title || '', tone: u.tone || 'navy' }));
    return list;
  }

  /* A DM belongs to a thread if I am either end of it. The room is simply
     everything addressed to 'team'. */
  function threadMessages(to) {
    const me = currentUser();
    const mine = me ? me.id : null;
    return messages().filter(m => to === TEAM_THREAD
      ? m.to === TEAM_THREAD
      : (m.to === to && m.by === mine) || (m.to === mine && m.by === to));
  }

  function sendMessage(to, text) {
    const t = (text || '').trim();
    if (!t || !to) return null;
    const me = currentUser();
    const m = { id: uid('msg'), by: me ? me.id : null, to, text: t.slice(0, 2000), at: now() };
    const list = messages();
    list.push(m);
    if (list.length > MSG_CAP) list.splice(0, list.length - MSG_CAP);
    save();
    return m;
  }

  function toggleMessageDone(id) {
    const m = messages().find(x => x.id === id);
    if (!m) return null;
    m.done = !m.done;
    m.doneBy = m.done ? ((currentUser() || {}).id || null) : null;
    m.updatedAt = now();
    save();
    return m;
  }

  const readKey = to => 'sphq-msgread-' + ((currentUser() || {}).id || 'anon') + '-' + to;
  function lastReadAt(to) { try { return localStorage.getItem(readKey(to)) || ''; } catch (e) { return ''; } }
  function markThreadRead(to) { try { localStorage.setItem(readKey(to), now()); } catch (e) {} }

  /* Unread = addressed to me (or to the room), by someone else, since I last
     looked at that particular thread. */
  function unreadIn(to) {
    const me = currentUser();
    const since = lastReadAt(to);
    return threadMessages(to).filter(m =>
      m.by !== (me && me.id) && String(m.at) > since).length;
  }
  function unreadTotal() { return threads().reduce((n, t) => n + unreadIn(t.id), 0); }

  /* The newest line in a thread, for the preview under each name. */
  function lastInThread(to) {
    const list = threadMessages(to);
    return list.length ? list[list.length - 1] : null;
  }

  /* =========================================================================
     ORDERS

     One record per order, carrying everything the email used to carry — and
     the same record moves through the handoff rather than being retyped at
     each step. `message()` renders the note to Enova from the record, so the
     wording is the form's job and not Julia's.
  ========================================================================= */
  const orders = () => load().orders;
  const order = id => load().orders.find(o => o.id === id) || null;

  function addOrder(fields) {
    const me = currentUser();
    const o = {
      id: uid('o'), ref: 'SP-' + String(load().orders.length + 1).padStart(4, '0'),
      status: 'draft', raisedBy: me ? me.id : null,
      org: '', contactName: '', contactEmail: '', contactPhone: '',
      shipTo: '', lines: [], freebies: [], swag: [], approvedBy: '',
      pay: 'Invoice', poNumber: '', ship: 'Ground', shipCost: 0,
      needBy: '', notes: '', tracking: '', history: [],
      createdAt: now(), updatedAt: now(), order: -Date.now() / 1000, ...fields
    };
    load().orders.unshift(o);
    log('raised an order', o.ref);
    save();
    return o;
  }
  function updateOrder(id, patch) {
    const o = order(id);
    if (!o) return null;
    Object.assign(o, patch, { updatedAt: now() });
    save();
    return o;
  }
  function removeOrder(id) {
    const s = load();
    s.orders = s.orders.filter(o => o.id !== id);
    save();
  }
  /* Every move is stamped, so "where is this" has an answer without asking. */
  function setOrderStatus(id, status, note) {
    const o = order(id);
    if (!o) return { ok: false, error: 'Gone.' };
    if (status !== 'draft' && !orderReady(o).ok) return orderReady(o);
    const me = currentUser();
    o.history = (o.history || []).concat([{
      at: now(), by: me ? me.id : null, from: o.status, to: status, note: note || ''
    }]);
    o.status = status;
    o.updatedAt = now();
    log('order ' + (ORDER_STATES[status] || {}).label.toLowerCase(), o.ref);
    save();
    return { ok: true };
  }
  /* The point of the form is that nothing leaves half-filled. */
  function orderReady(o) {
    const missing = [];
    if (!o.org.trim() && !o.contactName.trim()) missing.push('who it is for');
    if (!o.contactEmail.trim()) missing.push('a contact email');
    if (!o.shipTo.trim()) missing.push('a shipping address');
    if (!(o.lines || []).length) missing.push('at least one line');
    if (!o.pay) missing.push('how they are paying');
    return missing.length
      ? { ok: false, error: 'Still needs ' + missing.join(', ') + '.' }
      : { ok: true };
  }
  const orderTotal = o => (o.lines || []).reduce((n, l) =>
    n + (Number(l.price) || 0) * (Number(l.qty) || 0), 0) + (Number(o.shipCost) || 0);

  /* ---------------------------- order analytics ----------------------------
     What the orders themselves say, computed from the records rather than
     entered. Everything here is internal — order values, what is being given
     away, and how long each handoff takes — so unlike the KPI grid there is
     no customer data in it and nothing to keep private.

     `giveaway` is the one worth watching: freebies and SWAG have no price on
     the order, so their cost is invisible in the total. Counting them is the
     only way anyone sees how much is going out the door for nothing. */
  function orderStats() {
    const all = orders();
    const done = all.filter(o => o.status === 'complete');
    const open = all.filter(o => o.status !== 'complete');
    const value = o => orderTotal(o);
    const sum = list => list.reduce((n, o) => n + value(o), 0);

    const byStatus = {};
    ORDER_FLOW.forEach(k => { byStatus[k] = all.filter(o => o.status === k).length; });

    /* Average days between raising an order and each step. Only orders that
       actually reached the step count — averaging in the ones still waiting
       would make the handoff look faster the longer it stalls. */
    const stepDays = {};
    ORDER_FLOW.slice(1).forEach(step => {
      const spans = [];
      all.forEach(o => {
        const h = (o.history || []).find(x => x.to === step);
        if (h && o.createdAt) {
          spans.push((new Date(h.at) - new Date(o.createdAt)) / 86400000);
        }
      });
      stepDays[step] = spans.length
        ? { days: spans.reduce((a, b) => a + b, 0) / spans.length, n: spans.length }
        : null;
    });

    const freeUnits = all.reduce((n, o) =>
      n + (o.freebies || []).reduce((m, f) => m + (Number(f.qty) || 0), 0), 0);
    const swagUnits = all.reduce((n, o) => n + (o.swag || []).length, 0);

    /* Who it goes to, biggest first. */
    const orgs = {};
    all.forEach(o => {
      const k = (o.org || '').trim() || 'Unnamed';
      if (!orgs[k]) orgs[k] = { org: k, n: 0, value: 0 };
      orgs[k].n++; orgs[k].value += value(o);
    });

    /* What is actually being ordered, by line. */
    const skus = {};
    all.forEach(o => (o.lines || []).forEach(l => {
      if (!l.name) return;
      const k = l.sku || l.name;
      if (!skus[k]) skus[k] = { name: l.name, qty: 0, value: 0 };
      skus[k].qty += Number(l.qty) || 0;
      skus[k].value += (Number(l.price) || 0) * (Number(l.qty) || 0);
    }));

    return {
      count: all.length, openCount: open.length, doneCount: done.length,
      total: sum(all), openValue: sum(open), doneValue: sum(done),
      avg: all.length ? sum(all) / all.length : 0,
      shipping: all.reduce((n, o) => n + (Number(o.shipCost) || 0), 0),
      freeUnits, swagUnits,
      freeOrders: all.filter(o => (o.freebies || []).length || (o.swag || []).length).length,
      unapproved: all.filter(o => (o.freebies || []).length && !o.approvedBy).length,
      byStatus, stepDays,
      orgs: Object.values(orgs).sort((a, b) => b.value - a.value),
      skus: Object.values(skus).sort((a, b) => b.value - a.value),
      pay: PAY_METHODS.map(p => ({ k: p, n: all.filter(o => o.pay === p).length }))
        .filter(x => x.n)
    };
  }

  /* Recorded only after the send endpoint confirms it. "Sent" has to mean the
     mail server accepted it, not that someone pressed a button — the whole
     point of the status is that people downstream can trust it. */
  function markOrderSent(id, by) {
    const o = order(id);
    if (!o) return null;
    o.sentAt = now();
    o.sentBy = by || ((currentUser() || {}).name || null);
    save();
    return o;
  }

  /* The note to Enova, written from the record. */
  function orderMessage(o) {
    const money = n => '$' + (Number(n) || 0).toFixed(2);
    const L = [];
    L.push('Good morning Team,');
    L.push('');
    L.push('Could we please get this order processed as soon as possible?');
    if (o.pay === 'Invoice') L.push('Invoicing team — they would like to be invoiced for this order, please.');
    L.push('');
    L.push('ORDER  ' + o.ref);
    (o.lines || []).forEach(l => {
      L.push('  ' + l.qty + ' × ' + l.name + '   ' + money((Number(l.price) || 0) * (Number(l.qty) || 0)));
      if (l.note) L.push('      ' + l.note);
    });
    if ((o.freebies || []).length) {
      L.push('');
      L.push('NO CHARGE' + (o.approvedBy ? ' (approved by ' + o.approvedBy + ')' : ''));
      o.freebies.forEach(f => L.push('  ' + f.qty + ' × ' + f.name));
    }
    if ((o.swag || []).length) {
      L.push('');
      L.push('SWAG');
      o.swag.forEach(x => L.push('  ' + x));
    }
    L.push('');
    L.push('PRICING');
    L.push('  Items    ' + money(orderTotal(o) - (Number(o.shipCost) || 0)));
    L.push('  Shipping ' + money(o.shipCost));
    L.push('  Total    ' + money(orderTotal(o)));
    L.push('');
    L.push('PAYMENT   ' + o.pay + (o.poNumber ? '  ·  PO ' + o.poNumber : ''));
    L.push('SHIPPING  ' + o.ship + (o.needBy ? '  ·  needed by ' + o.needBy : ''));
    L.push('');
    L.push('SHIP TO');
    L.push('  ' + (o.contactName || ''));
    if (o.org) L.push('  ' + o.org);
    (o.shipTo || '').split('\n').filter(Boolean).forEach(x => L.push('  ' + x.trim()));
    L.push('');
    L.push('CONTACT');
    L.push('  ' + (o.contactName || '') + (o.contactEmail ? '  ·  ' + o.contactEmail : '') +
           (o.contactPhone ? '  ·  ' + o.contactPhone : ''));
    if (o.notes) { L.push(''); L.push('NOTES'); L.push('  ' + o.notes); }
    const me = currentUser();
    L.push('');
    L.push('Thank you all for your help — any questions, let me know.');
    if (me) L.push(me.name + ' · SportPharm');
    return L.join('\n');
  }

  /* ------------------------------- playbook ------------------------------ */
  /* Ticked operational actions in the launch playbook. Kept in `flags` so they
     survive the plan being rewritten around them. */
  function actionDone(key) {
    const f = load().flags || {};
    return !!(f[key] && f[key].done);
  }
  function tickAction(key, label) {
    const s = load();
    s.flags = s.flags || {};
    const nowDone = !(s.flags[key] && s.flags[key].done);
    s.flags[key] = { done: nowDone, at: now(), by: (currentUser() || {}).id || null };
    if (label) log(nowDone ? 'checked off' : 'reopened', label);
    save();
  }

  /* ------------------------------ launch gates --------------------------- */
  const reminders = () => load().reminders;
  const reminder = id => load().reminders.find(r => r.id === id) || null;

  function addReminder(fields) {
    const r = {
      id: uid('r'), level: 'important', text: 'New reminder', why: '', due: '',
      resolved: false, order: -Date.now() / 1000, createdAt: now(), updatedAt: now(), ...fields
    };
    load().reminders.unshift(r);
    log('added a launch gate', r.text);
    save();
    return r;
  }
  function updateReminder(id, patch, logText) {
    const r = reminder(id);
    if (!r) return null;
    Object.assign(r, patch, { updatedAt: now() });
    if (logText) log(logText, r.text);
    save();
    return r;
  }
  function toggleReminder(id) {
    const r = reminder(id);
    if (!r) return;
    r.resolved = !r.resolved;
    r.updatedAt = now();
    log(r.resolved ? 'resolved a launch gate' : 'reopened a launch gate', r.text);
    save();
  }
  function removeReminder(id) {
    const s = load();
    s.reminders = s.reminders.filter(r => r.id !== id);
    save();
  }

  /* ------------------------------ platforms ------------------------------ */
  const platforms = () => load().platforms;
  const platform = id => load().platforms.find(p => p.id === id) || null;

  function addPlatform(fields) {
    const p = {
      id: uid('pl'), name: 'New platform', cat: 'infra', status: 'evaluating',
      cost: 0, pricing: '', what: '', judge: '', verdict: '', owner: null,
      decideBy: '', order: -Date.now() / 1000, createdAt: now(), updatedAt: now(), ...fields
    };
    load().platforms.unshift(p);
    log('added a platform to evaluate', p.name);
    save();
    return p;
  }
  function updatePlatform(id, patch, logText) {
    const p = platform(id);
    if (!p) return null;
    Object.assign(p, patch, { updatedAt: now() });
    if (logText) log(logText, p.name);
    save();
    return p;
  }
  function removePlatform(id) {
    const s = load();
    s.platforms = s.platforms.filter(p => p.id !== id);
    save();
  }
  function setPlatformStatus(id, status) {
    const p = platform(id);
    if (!p) return;
    p.status = status;
    p.updatedAt = now();
    log('marked ' + (PLATFORM_STATES[status] || {}).label, p.name);
    save();
  }

  /* --------------------------------- team -------------------------------- */
  function invite(name, email, role) {
    const s = load();
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const u = {
      id: uid('u'), name: name.trim(), email: email.trim(), role,
      tone: ['red', 'blue', 'green', 'navy', 'amber'][s.users.length % 5],
      title: '', pass: hash(code), createdAt: now(), order: s.users.length, pending: true
    };
    s.users.push(u);
    s.invites.unshift({ id: uid('inv'), userId: u.id, code, at: now() });
    log('invited', u.name);
    save();
    return { user: u, code };
  }
  function setRole(id, role) { const u = user(id); if (u) { u.role = role; save(); } }
  function removeUser(id) {
    const s = load();
    s.users = s.users.filter(u => u.id !== id);
    s.projects.forEach(p => p.tasks.forEach(t => { if (t.owner === id) t.owner = null; }));
    save();
  }
  function setPasscode(id, code) { const u = user(id); if (u) { u.pass = hash(code); u.pending = false; save(); } }

  /* ------------------------------- settings ------------------------------ */
  function resetAll() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SESSION);
    state = null;
  }

  return {
    load, save, subscribe, uid, now, today, log, slugify,
    currentUser, signIn, signInSeat, signOut, can,
    injectState, applyRemote, findUserByEmail, claimSeat,
    users, user, projects, project, campaigns, campaign, ideas, activity, allTasks,
    createProject, updateProject, removeProject,
    projectTabs, addProjectTab, updateProjectTab, removeProjectTab,
    createTask, updateTask, removeTask, moveTask, nudgeTask, shiftTask, taskRef,
    articles, article, addArticle, updateArticle, removeArticle, uniqueSlug,
    blocksOf, ensureBlocks, newBlock, addBlock, setBlock, moveBlock, placeBlock,
    duplicateBlock, removeBlock, flushBlocks, blocksFromText,
    canApprove, approveBlockedReason, openChecks, toggleCheck,
    submitForReview, approveArticle, requestChanges, publishArticle, scheduleArticle,
    unpublishArticle, dueToPublish, runSchedule, articleStats, publishedFeed,
    addArticleNote, removeArticleNote, noteCount,
    media, mediaItem, addMedia, updateMedia, removeMedia, mediaUsedBy,
    todos, todo, addTodo, updateTodo, toggleTodo, removeTodo,
    mondayOf, addDays, weekDays, dayItems, runningLog, assignedToMe,
    handOff, seeHandoffs, taskLog, addTaskNote, lastHandoff, lastNote,
    handoffInbox, handoffOutbox,
    kpiMap, setKpi, kpiRow, kpiPeriods,
    messages, threads, threadMessages, sendMessage, toggleMessageDone,
    lastReadAt, markThreadRead, unreadIn, unreadTotal, lastInThread,
    orders, order, addOrder, updateOrder, removeOrder, setOrderStatus,
    orderReady, orderTotal, orderMessage, orderStats, markOrderSent,
    metricsOf, setMetric, setMargin,
    briefs, brief, reviewState, setReviewState, reviewThread,
    addReviewNote, removeReviewNote, campaignProgress, campaignNoteCount,
    addIdea, voteIdea, setIdeaState, removeIdea, promoteIdea, ideaToArticle,
    platforms, platform, addPlatform, updatePlatform, removePlatform, setPlatformStatus,
    reminders, reminder, addReminder, updateReminder, toggleReminder, removeReminder,
    pieces, piece, planRules, setPlanRules, addPiece, updatePiece, removePieces,
    bulkStatus, bulkMove, bulkSchedule, nextDates, briefBlocks,
    invite, setRole, removeUser, setPasscode,
    actionDone, tickAction,
    resetAll
  };
})();
