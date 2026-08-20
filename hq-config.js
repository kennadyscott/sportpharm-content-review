/* =============================================================================
   SportPharm HQ — live mode switch

   Empty = solo mode: everything stays in this browser. That is where the build
   starts, and it is genuinely usable — but each person gets their own copy, so
   Brandon approving an article is invisible to Jessie.

   Filled = live mode: real Supabase accounts, one shared workspace, realtime
   sync. Run supabase/hq.sql first, then paste the project URL and anon key
   below. Both values are safe to embed — the anon key is designed to be
   public, and row-level security is what actually controls access.

   NOTE: this is HQ's own project, and it is deliberately NOT the Content
   Studio's. campaigns/index.html keeps its own Supabase project
   (vleudvlmvnuvoipgcmfc) and its own sign-in, so Brandon and Jessie's existing
   campaign approvals and comment threads stay exactly where they are.
============================================================================= */
window.SPHQ_CLOUD = {
  url: '',
  anonKey: ''
};

/* The WooCommerce proxy — azure/api/woo. Empty here because GitHub Pages has
   no server to run it, which is the honest state: the store's key and secret
   are read/write against the live shop and cannot sit in a public bundle.
   Set this once the Function is deployed and "From the website" fills in. */
window.SPHQ_STORE = { endpoint: '' };
