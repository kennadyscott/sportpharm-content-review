/* =============================================================================
   SportPharm HQ — reading approvals back from the Content Studio

   One direction only, on purpose. The Studio is where creative gets signed
   off; HQ reads that verdict and shows it next to the ship date. Nothing here
   ever writes to the Studio — approving stays in one place.

   The contract, taken from the Studio's own source:
     <campaignId>:<assetId>   -> { status: "pending"|"approved"|"revise"|"scheduled", notes }
     <campaignId>:__campaign  -> { approved: true|false }        (direction sign-off)

   Two things worth knowing:

   1. The Studio only writes to Supabase when somebody is SIGNED IN. If a
      reviewer is signed out, their approval goes to their own browser and no
      one else — HQ included — can ever see it. That is a property of the
      Studio, not of this file.
   2. This reads with the Studio's public anon key, which is already in its
      bundle. Read-only, and it only ever asks for the review table.
============================================================================= */
const StudioSync = (() => {
  'use strict';

  const CFG = {
    url: 'https://vleudvlmvnuvoipgcmfc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsZXVkdmxtdm51dm9pcGdjbWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NzY1NzksImV4cCI6MjEwMDI1MjU3OX0.lmaqiq3pN1uwybycU1MbnELfQ8kn4z0smFm1LeBsREY'
  };

  /* what the Studio's vocabulary means over here */
  const MAP = {
    approved:  { label: 'Approved',      tone: 'green', ok: true },
    scheduled: { label: 'Approved',      tone: 'green', ok: true },
    revise:    { label: 'Needs changes', tone: 'red',   ok: false },
    pending:   { label: 'Not reviewed',  tone: 'muted', ok: false }
  };

  let cache = null;          /* key -> record */
  let state = 'idle';        /* idle | loading | ready | error | empty */
  let fetchedAt = null;
  let lastError = '';
  const listeners = new Set();

  const notify = () => listeners.forEach(fn => { try { fn(); } catch (e) {} });
  const onChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };

  async function refresh(force) {
    if (state === 'loading') return;
    if (!force && cache && Date.now() - fetchedAt < 60000) return;   /* a minute is plenty */
    state = 'loading'; notify();
    try {
      const res = await fetch(
        CFG.url + '/rest/v1/kv?select=k,v',
        { headers: { apikey: CFG.key, Authorization: 'Bearer ' + CFG.key } }
      );
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rows = await res.json();
      cache = {};
      (rows || []).forEach(r => { if (r && r.k) cache[r.k] = r.v || {}; });
      fetchedAt = Date.now();
      state = rows && rows.length ? 'ready' : 'empty';
      lastError = '';
    } catch (e) {
      state = 'error';
      lastError = e.message || String(e);
    }
    notify();
  }

  /* The verdict on one asset. Returns null when we simply have not heard —
     which is different from "not approved", and the UI says so. */
  function assetStatus(campaignId, assetId) {
    if (!cache || !campaignId || !assetId) return null;
    const rec = cache[campaignId + ':' + assetId];
    if (!rec || !rec.status) return null;
    return { key: rec.status, ...(MAP[rec.status] || MAP.pending), notes: rec.notes || '' };
  }

  /* Whether the campaign's overall direction has been signed off. */
  function directionApproved(campaignId) {
    if (!cache) return null;
    const rec = cache[campaignId + ':__campaign'];
    return rec ? !!rec.approved : null;
  }

  /* Roll a set of plan pieces up into a one-line answer. */
  function summarise(pieces) {
    const linked = pieces.filter(p => p.assetId);
    let approved = 0, changes = 0, unknown = 0;
    linked.forEach(p => {
      const s = assetStatus(p.campaign, p.assetId);
      if (!s) unknown++;
      else if (s.ok) approved++;
      else if (s.key === 'revise') changes++;
      else unknown++;
    });
    return { linked: linked.length, approved, changes, unknown };
  }

  return {
    refresh, onChange, assetStatus, directionApproved, summarise,
    get state() { return state; },
    get error() { return lastError; },
    get fetchedAt() { return fetchedAt; },
    MAP
  };
})();
