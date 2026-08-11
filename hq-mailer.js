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
     empty, which is the honest state: there is no server here to send from.

     Read on every call rather than captured once, so this does not depend on
     hq-config.js happening to load before this file. */
  const cfg = () => window.SPHQ_MAIL || {};

  const ready = () => !!cfg().endpoint;

  /* A mailto: with the whole message in it. Long bodies are fine in every
     desktop client; the encoding is what matters, so the line breaks survive
     rather than collapsing into one paragraph. */
  function mailtoUrl({ to, cc, subject, body }) {
    const list = v => (Array.isArray(v) ? v : [v]).filter(Boolean).join(',');
    const q = [];
    if (cc && list(cc)) q.push('cc=' + encodeURIComponent(list(cc)));
    q.push('subject=' + encodeURIComponent(subject || ''));
    q.push('body=' + encodeURIComponent(body || ''));
    return 'mailto:' + encodeURIComponent(list(to)).replace(/%40/g, '@').replace(/%2C/g, ',')
      + '?' + q.join('&');
  }
  /* Outlook on the web, composing directly. `mailto:` hands off to whatever
     the OS has registered as the default mail handler and a web page cannot
     override that — on a Mac that is usually Mail.app, not Outlook. This goes
     straight to Outlook in the browser instead, signed in as whoever they
     already are, which is the right answer for a Microsoft 365 tenant.

     office.com is the work/school host; outlook.live.com is the personal one.
     SportPharm is a tenant, so office.com is the default. */
  function outlookUrl({ to, cc, subject, body }) {
    const list = v => (Array.isArray(v) ? v : [v]).filter(Boolean).join(';');
    const host = cfg().outlookHost || 'https://outlook.office.com/mail/deeplink/compose';
    const q = new URLSearchParams();
    q.set('to', list(to));
    if (cc && list(cc)) q.set('cc', list(cc));
    q.set('subject', subject || '');
    q.set('body', body || '');
    return host + '?' + q.toString();
  }

  const from = () => cfg().from || 'orders@sportpharm.com';

  /* Why the caller gets a reason and not just false: every failure here is
     something a person can act on — sign in again, deploy the function, ask
     for an address to be allowlisted. Swallowing that turns a fixable problem
     into "it doesn't work". */
  async function send({ to, cc, subject, body, ref }) {
    if (!ready()) {
      /* No server to send from — but the message is already written, so hand
         it to whatever mail client they have. Outlook opens with the
         recipients, subject and body filled in and Julia presses send.

         Deliberately NOT reported as ok:true. Nothing has been sent yet, and
         marking the order sent because a compose window opened is exactly the
         lie this whole feature exists to stop. The caller shows the draft and
         leaves the status alone. */
      return {
        ok: false,
        reason: 'handoff-to-client',
        mailto: mailtoUrl({ to, cc, subject, body }),
        error: 'Opened this in your mail app instead — HQ has no server to send from yet, ' +
               'so it cannot send on its own. Everything is filled in; press send there. ' +
               'The order stays as it is until you mark it sent.'
      };
    }
    try {
      const r = await fetch(cfg().endpoint, {
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

  return { ready, from, send, mailtoUrl, outlookUrl, recipients: () => (window.ORDER_RECIPIENTS || []) };
})();
