/* =============================================================================
   GET /api/stripe?resource=payments&orders=1234,1235
                                    — what happened to the money on those orders
   GET /api/stripe?resource=summary&days=30
                                    — fees, refunds and disputes over a period

   Stripe CAN be called. There was never anything about Stripe that prevented
   it — the blocker was that HQ is served as a static site with nowhere to keep
   a secret key, which is equally true of WooCommerce. Once this Function
   exists, both work.

   What Stripe is and is not good for here:

     IS   — payment status, the processing fee, refunds, disputes, when it
            settled, and which method actually paid (card, Klarna, Affirm...).
            None of that exists anywhere in WooCommerce.

     IS NOT — the contents of an order. A PaymentIntent is an amount and a
            customer, not a basket. Line items and SKUs live in WooCommerce,
            which is why the order list is built from there.

   The two are joined on the WooCommerce order number, which the Woo Stripe
   plugin writes into the payment's metadata. If that join fails, this returns
   the payment unmatched rather than guessing — a payment attached to the wrong
   order is worse than one attached to none.

   App settings required:
     STRIPE_KEY   a RESTRICTED key, read-only. See SETUP.md — a full secret key
                  (sk_live_...) can issue refunds and move money, and nothing
                  here ever needs to.
============================================================================= */

const API = 'https://api.stripe.com/v1';

module.exports = async function (context, req) {
  const fail = (status, error) => { context.res = { status, jsonBody: { ok: false, error } }; };

  if (!req.headers['x-ms-client-principal']) return fail(401, 'Not signed in.');

  const key = process.env.STRIPE_KEY;
  if (!key) return fail(503, 'Stripe is not configured on the server yet.');
  if (/^sk_(live|test)_/.test(key)) {
    /* Refuse rather than quietly work. A full secret key here would give this
       endpoint the ability to move money, and the whole point of the setup
       instructions is that it never should. */
    context.log.error('STRIPE_KEY is a full secret key, not a restricted one');
    return fail(500, 'STRIPE_KEY is a full secret key. Replace it with a restricted, read-only key.');
  }

  const get = async (path) => {
    const r = await fetch(`${API}/${path}`, { headers: { Authorization: 'Bearer ' + key } });
    const d = await r.json();
    if (!r.ok) throw new Error((d.error && d.error.message) || `Stripe returned ${r.status}`);
    return d;
  };

  const money = cents => Math.round(Number(cents || 0)) / 100;

  try {
    if (req.query.resource === 'summary') {
      const days = Math.min(Number(req.query.days) || 30, 365);
      const since = Math.floor(Date.now() / 1000) - days * 86400;
      /* Balance transactions carry the fee, which the charge itself does not. */
      const tx = await get(`balance_transactions?limit=100&created[gte]=${since}`);
      const rows = tx.data || [];
      const sum = t => rows.filter(r => r.type === t)
        .reduce((n, r) => n + money(r.amount), 0);
      context.res = {
        status: 200,
        jsonBody: {
          ok: true, days,
          gross: sum('charge'),
          refunds: sum('refund'),
          disputes: sum('adjustment'),
          fees: rows.reduce((n, r) => n + money(r.fee), 0),
          net: rows.reduce((n, r) => n + money(r.net), 0),
          count: rows.filter(r => r.type === 'charge').length,
          /* Says so when there is more than one page, rather than quietly
             reporting a partial period as if it were the whole thing. */
          truncated: !!tx.has_more
        }
      };
      return;
    }

    /* Payment status for specific website orders. */
    const wanted = String(req.query.orders || '').split(',').map(s => s.trim()).filter(Boolean);
    const limit = Math.min(Number(req.query.limit) || 100, 100);
    const pi = await get(`payment_intents?limit=${limit}&expand[]=data.latest_charge`);

    const payments = (pi.data || []).map(p => {
      const ch = p.latest_charge && typeof p.latest_charge === 'object' ? p.latest_charge : null;
      const meta = p.metadata || {};
      /* The Woo Stripe plugin has used a few different metadata keys over the
         years, so check the ones it actually writes rather than assuming one. */
      const orderId = meta.order_id || meta.order_number || meta.woocommerce_order_id || null;
      return {
        id: p.id,
        orderId: orderId ? String(orderId) : null,
        status: p.status,
        amount: money(p.amount),
        currency: (p.currency || '').toUpperCase(),
        method: ch && ch.payment_method_details ? ch.payment_method_details.type : '',
        fee: ch && ch.balance_transaction && typeof ch.balance_transaction === 'object'
          ? money(ch.balance_transaction.fee) : null,
        refunded: ch ? money(ch.amount_refunded) : 0,
        disputed: !!(ch && ch.disputed),
        receipt: ch ? ch.receipt_url : null,
        at: p.created ? new Date(p.created * 1000).toISOString() : null
      };
    });

    context.res = {
      status: 200,
      jsonBody: {
        ok: true,
        payments: wanted.length
          ? payments.filter(p => p.orderId && wanted.includes(p.orderId))
          : payments,
        /* Payments Stripe has that carry no order reference. Usually a payment
           link, an invoice, or a phone order keyed in by hand — real revenue
           that will never appear in WooCommerce, so it is surfaced rather than
           filtered away. */
        unmatched: payments.filter(p => !p.orderId).length,
        truncated: !!pi.has_more
      }
    };
  } catch (e) {
    context.log.error(e);
    fail(502, e.message);
  }
};
