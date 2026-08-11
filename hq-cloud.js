/* =============================================================================
   SportPharm HQ — cloud adapter (live mode)

   One shared workspace in Supabase: state lives per-top-level-key in hq_kv,
   pushed on every save (only the keys that actually changed) and merged back in
   realtime. Identity is a real Supabase account; the seat is claimed once and
   remembered via users[].authEmail, so "who approved this" is actually who.

   `articles` is one of those keys, which is what makes the CMS shared: Jessie
   sends a piece for review on her laptop and it is in Brandon's queue before he
   refreshes. supabase/hq.sql also defines a published-articles view for the
   public site to read — see the README.
============================================================================= */
const Cloud = (() => {
  'use strict';
  const cfg = window.SPHQ_CLOUD || {};
  const enabled = !!(cfg.url && cfg.anonKey && window.supabase);

  /* Every top-level key the store owns. Keep this in step with seed() in
     hq-store.js — a key missing here does not sync, silently. `orders`,
     `messages`, `todos` and `kpis` were added to the store long after this
     list and were not in it, so turning live mode on would have shared the
     CMS and left every order and message stranded in one browser. */
  const KEYS = ['users', 'projects', 'articles', 'media', 'ideas', 'platforms',
                'plan', 'planRules', 'reminders', 'metrics', 'flags', 'invites', 'activity',
                'orders', 'messages', 'todos', 'kpis', 'campReview'];

  let client = null;
  let sess = null;
  const last = {};   /* k -> JSON last seen/pushed, to diff and to break echo loops */

  async function init() {
    if (!enabled) return false;
    client = window.supabase.createClient(cfg.url, cfg.anonKey);
    const { data } = await client.auth.getSession();
    sess = data.session;
    client.auth.onAuthStateChange((_e, s) => { sess = s; });
    return true;
  }

  async function signIn(email, password) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    sess = data.session;
    return { ok: true };
  }
  async function signOutCloud() { try { if (client) await client.auth.signOut(); } catch (e) {} }

  async function pull() {
    const { data, error } = await client.from('hq_kv').select('k,v');
    if (error) throw error;
    if (!data || !data.length) return null;
    const st = {};
    data.forEach(r => { st[r.k] = r.v; });
    return st;
  }

  function snapshot(state) {
    KEYS.forEach(k => { last[k] = JSON.stringify(state[k] === undefined ? null : state[k]); });
  }

  /* write-through from Store.save(): only the keys that actually changed */
  function push(state) {
    if (!enabled || !sess) return;
    const rows = [];
    KEYS.forEach(k => {
      const j = JSON.stringify(state[k] === undefined ? null : state[k]);
      if (j !== last[k]) { last[k] = j; rows.push({ k, v: JSON.parse(j) }); }
    });
    if (rows.length) client.from('hq_kv').upsert(rows).then(() => {}, () => {});
  }

  async function pushAll(state) {
    snapshot(state);
    const rows = KEYS.map(k => ({ k, v: state[k] === undefined ? null : state[k] }));
    const { error } = await client.from('hq_kv').upsert(rows);
    if (error) throw error;
  }

  function subscribe(onKey) {
    client.channel('hq_kv')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hq_kv' }, p => {
        const r = p.new;
        if (!r || !r.k) return;
        const j = JSON.stringify(r.v);
        if (j === last[r.k]) return;   /* our own write echoing back */
        last[r.k] = j;
        onKey(r.k, r.v);
      })
      .subscribe();
  }

  return {
    enabled, init, signIn, signOutCloud, pull, push, pushAll, snapshot, subscribe,
    session: () => sess,
    email: () => (sess && sess.user ? (sess.user.email || '').toLowerCase() : null)
  };
})();
