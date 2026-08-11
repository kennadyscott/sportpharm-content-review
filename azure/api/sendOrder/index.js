/* =============================================================================
   POST /api/sendOrder — send an order to Enova as real email.

   Sends through Microsoft Graph from the SportPharm tenant, as a real mailbox.
   Not a third-party mailer putting @sportpharm.com in the From line: the
   message is genuinely sent by the tenant, so SPF/DKIM/DMARC pass, it does not
   land in Enova's junk, and a copy appears in the sending mailbox's Sent
   Items — which matters, because "did Julia actually send it" is exactly the
   question this whole feature exists to answer.

   Auth: Static Web Apps puts the signed-in user in x-ms-client-principal.
   There is no anonymous path to this function — see staticwebapp.config.json.
   The client never holds a secret; the secret lives in app settings here.

   App settings required (Configuration → Application settings):
     TENANT_ID        the Entra directory (tenant) ID
     CLIENT_ID        the app registration's application (client) ID
     CLIENT_SECRET    that app registration's client secret
     SEND_AS          the mailbox to send from, e.g. orders@sportpharm.com
     ALLOWED_TO       comma-separated allowlist of permitted recipients

   Graph permission required: Mail.Send (application), admin-consented. Scope
   it down with an ApplicationAccessPolicy so this app registration can only
   send as SEND_AS and not as any mailbox in the tenant.
============================================================================= */

const GRAPH = 'https://graph.microsoft.com/v1.0';

async function token() {
  const url = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!r.ok) throw new Error('Could not get a Graph token: ' + (await r.text()).slice(0, 300));
  return (await r.json()).access_token;
}

module.exports = async function (context, req) {
  const fail = (status, error) => { context.res = { status, jsonBody: { ok: false, error } }; };

  /* Who is asking. Static Web Apps has already validated this header; if it
     is absent the route config is wrong and we refuse rather than send. */
  let who = null;
  try {
    const raw = req.headers['x-ms-client-principal'];
    if (raw) who = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch (e) { /* fall through to the check below */ }
  if (!who || !who.userDetails) {
    return fail(401, 'Not signed in. This endpoint is not reachable anonymously.');
  }

  const { to, cc, subject, body, ref } = req.body || {};
  if (!subject || !body) return fail(400, 'A subject and a body are required.');

  const list = v => (Array.isArray(v) ? v : String(v || '').split(','))
    .map(s => s.trim()).filter(Boolean);
  const toList = list(to), ccList = list(cc);
  if (!toList.length) return fail(400, 'No recipient.');

  /* An allowlist, because this endpoint can send mail as the company. Without
     it, anyone who can sign in to HQ could use the tenant to mail anyone. */
  const allowed = list(process.env.ALLOWED_TO).map(s => s.toLowerCase());
  const bad = toList.concat(ccList).filter(a => !allowed.includes(a.toLowerCase()));
  if (allowed.length && bad.length) {
    return fail(403, 'These addresses are not on the allowlist: ' + bad.join(', '));
  }

  const rec = a => ({ emailAddress: { address: a } });

  try {
    const t = await token();
    const r = await fetch(`${GRAPH}/users/${encodeURIComponent(process.env.SEND_AS)}/sendMail`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          subject,
          /* Plain text on purpose: this is the same wording HQ shows on
             screen, and the vendor's systems have read it as text for years.
             The formatted copy is the printed PO, attached below. */
          body: { contentType: 'Text', content: body },
          toRecipients: toList.map(rec),
          ccRecipients: ccList.map(rec),
          /* So a reply goes to the person who raised it, not the shared
             mailbox where it will sit unread. */
          replyTo: [rec(who.userDetails)]
        },
        saveToSentItems: true
      })
    });

    if (!r.ok) {
      const detail = (await r.text()).slice(0, 400);
      context.log.error('Graph sendMail failed', r.status, detail);
      return fail(502, `The mail server refused it (${r.status}). ${detail}`);
    }

    context.log(`Order ${ref || '?'} sent by ${who.userDetails} to ${toList.join(', ')}`);
    context.res = {
      status: 200,
      jsonBody: { ok: true, sentBy: who.userDetails, to: toList, cc: ccList }
    };
  } catch (e) {
    context.log.error(e);
    fail(500, e.message);
  }
};
