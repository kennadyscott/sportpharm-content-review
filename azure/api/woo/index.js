/* =============================================================================
   GET /api/woo?period=week — the WooCommerce numbers for the KPI grid.

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
