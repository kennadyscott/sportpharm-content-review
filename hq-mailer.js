/* =============================================================================
   SportPharm HQ — sending an order for real

   HQ is a static bundle, so it cannot hold a mail credential and cannot send
   anything itself. What it can do is call an endpoint that holds one. That
   endpoint is `azure/api/sendOrder` — an Azure Function behind Entra ID,
   sending through Microsoft Graph as a real SportPharm mailbox.

   Until that is deployed, `ready()` is false and Send says exactly what is
   missing instead of appearing to work. A button that silently does nothing is
   worse than no button: Julia would believe the order was sent.
============================================================================= */
window.HQ = window.HQ || {};
HQ.mailer = (() => {
  'use strict';

  /* Set by azure/deploy — see azure/README.md. On GitHub Pages this stays
     empty, which is the honest state: there is no server here to send from. */
  const CFG = window.SPHQ_MAIL || {};

  const ready = () => !!CFG.endpoint;
  const from = () => CFG.from || 'orders@sportpharm.com';

  /* Why the caller gets a reason and not just false: every failure here is
     something a person can act on — sign in again, deploy the function, ask
     for an address to be allowlisted. Swallowing that turns a fixable problem
     into "it doesn't work". */
  async function send({ to, cc, subject, body, ref }) {
    if (!ready()) {
      return {
        ok: false,
        reason: 'not-configured',
        error: 'Sending is not connected yet. HQ is served as a static site, which cannot ' +
               'hold a mail credential — it needs the Azure Function in azure/api/sendOrder ' +
               'deployed to the SportPharm tenant first. Until then, use Copy and paste it ' +
               'into Outlook; the wording is identical.'
      };
    }
    try {
      const r = await fetch(CFG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        /* The Static Web Apps session cookie is what authenticates this. */
        credentials: 'include',
        body: JSON.stringify({ to, cc, subject, body, ref })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) {
        return { ok: false, reason: 'refused', error: data.error || `The server returned ${r.status}.` };
      }
      return { ok: true, sentBy: data.sentBy, to: data.to, cc: data.cc };
    } catch (e) {
      /* A network failure here usually means the session expired and the
         request was bounced to the sign-in page. */
      return {
        ok: false, reason: 'unreachable',
        error: 'Could not reach the send endpoint — you may need to sign in again. ' + e.message
      };
    }
  }

  return { ready, from, send, recipients: () => (window.ORDER_RECIPIENTS || []) };
})();
