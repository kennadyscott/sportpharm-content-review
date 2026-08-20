/* =============================================================================
   GET /api/woo?period=week          — totals for the KPI grid
   GET /api/woo?resource=orders      — the orders placed on sportpharm.com

   This function exists so the store credentials never reach the browser. The
   WooCommerce REST API wants a consumer key and secret on every request, and
   they are read/write against the live store — a static bundle has nowhere to
   keep them, which is why HQ could not call Woo directly.

   Here the credentials are app settings on the server, the browser calls this
   with its Static Web Apps session, and what comes back is totals only. No
   customer names, no email addresses, no order numbers cross this boundary —
   that is deliberate, and it is what makes the KPI figures safe to hold.

   App settings required:
     WOO_URL       https://sportpharm.com
     WOO_KEY       consumer key   (create it read-only)
     WOO_SECRET    consumer secret
============================================================================= */

/* WooCommerce reports want an explicit window. Weeks run Monday to Sunday to
   match the week on Today; months and quarters are calendar. */
function window_(period, now) {
  const d = new Date(now);
  const iso = x => x.toISOString().slice(0, 10);
  if (period === 'month') {
    const a = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    return { after: iso(a), before: iso(d) };
  }
  if (period === 'quarter') {
    const q = Math.floor(d.getUTCMonth() / 3) * 3;
    const a = new Date(Date.UTC(d.getUTCFullYear(), q, 1));
    return { after: iso(a), before: iso(d) };
  }
  const day = (d.getUTCDay() + 6) % 7;                 /* Monday = 0 */
  const a = new Date(d); a.setUTCDate(d.getUTCDate() - day);
  return { after: iso(a), before: iso(d) };
}

module.exports = async function (context, req) {
  const fail = (status, error) => { context.res = { status, jsonBody: { ok: false, error } }; };

  const raw = req.headers['x-ms-client-principal'];
  if (!raw) return fail(401, 'Not signed in.');

  const { WOO_URL, WOO_KEY, WOO_SECRET } = process.env;
  if (!WOO_URL || !WOO_KEY || !WOO_SECRET) {
    return fail(503, 'WooCommerce is not configured on the server yet.');
  }

  const period = ['week', 'month', 'quarter'].includes(req.query.period)
    ? req.query.period : 'week';
  const { after, before } = window_(period, new Date());
  const auth = 'Basic ' + Buffer.from(`${WOO_KEY}:${WOO_SECRET}`).toString('base64');

  const get = async path => {
    const r = await fetch(`${WOO_URL.replace(/\/$/, '')}/wp-json/wc/v3/${path}`,
      { headers: { Authorization: auth } });
    if (!r.ok) throw new Error(`Woo ${path} returned ${r.status}`);
    return r.json();
  };

  /* ------------------------------ orders -------------------------------
     Unlike the KPI path, this one DOES carry customer detail — a name and a
     shipping address, because an order nobody can ship is not an order. It
     is only ever returned to a signed-in member of the tenant, and only the
     fields fulfilment actually needs: no card details, no billing history,
     no customer account record.

     Stripe is deliberately not the source here. It sees a payment, not a
     basket — no line items, no SKUs, no shipping address unless someone
     thought to put them in metadata — and the store also offers Affirm,
     Klarna, Afterpay and Amazon Pay, which may not pass through Stripe at
     all. WooCommerce sees every order regardless of how it was paid for. */
  if (req.query.resource === 'orders') {
    const status = (req.query.status || 'processing,on-hold,completed')
      .split(',').map(x => x.trim()).filter(Boolean).join(',');
    const per = Math.min(Number(req.query.per_page) || 25, 100);
    try {
      const rows = await get(`orders?status=${encodeURIComponent(status)}&per_page=${per}&orderby=date&order=desc`);
      context.res = {
        status: 200,
        jsonBody: {
          ok: true,
          orders: (Array.isArray(rows) ? rows : []).map(o => ({
            id: o.id,
            number: o.number,
            status: o.status,
            date: o.date_created,
            total: Number(o.total) || 0,
            currency: o.currency,
            /* Which gateway actually took the money. Worth surfacing: it is
               how you tell a Stripe order from a Klarna one at a glance. */
            paidWith: o.payment_method_title || o.payment_method || '',
            customer: [o.billing && o.billing.first_name, o.billing && o.billing.last_name]
              .filter(Boolean).join(' '),
            email: (o.billing || {}).email || '',
            shipTo: o.shipping && o.shipping.address_1 ? [
              [o.shipping.first_name, o.shipping.last_name].filter(Boolean).join(' '),
              o.shipping.company, o.shipping.address_1, o.shipping.address_2,
              [o.shipping.city, o.shipping.state, o.shipping.postcode].filter(Boolean).join(', '),
              o.shipping.country
            ].filter(Boolean).join('\n') : '',
            lines: (o.line_items || []).map(l => ({
              sku: l.sku || '', name: l.name, qty: l.quantity,
              price: Number(l.price) || 0, total: Number(l.total) || 0
            })),
            shipping: Number((o.shipping_lines || []).reduce((n, l) => n + (Number(l.total) || 0), 0)) || 0,
            note: o.customer_note || ''
          }))
        }
      };
    } catch (e) {
      context.log.error(e);
      fail(502, e.message);
    }
    return;
  }

  try {
    /* The reports endpoints return aggregates, which is exactly what is
       wanted — asking for the orders list would pull customer records across
       a boundary they have no reason to cross. */
    const sales = await get(`reports/sales?date_min=${after}&date_max=${before}`);
    const totals = Array.isArray(sales) ? sales[0] || {} : sales || {};
    const customers = await get(`reports/customers/totals`).catch(() => null);

    const revenue = Number(totals.total_sales) || 0;
    const orders = Number(totals.total_orders) || 0;

    context.res = {
      status: 200,
      jsonBody: {
        ok: true, period, after, before,
        /* Keys match KPI_METRICS in hq-data.js so the client can drop this
           straight into the grid. Anything Woo cannot answer is left out
           rather than sent as zero — an absent number and a real zero are
           different things, and the grid renders them differently. */
        metrics: {
          revenue,
          orders,
          newCust: customers ? Number((customers.find(c => c.slug === 'customer') || {}).total) || undefined : undefined
        }
      }
    };
  } catch (e) {
    context.log.error(e);
    fail(502, e.message);
  }
};
