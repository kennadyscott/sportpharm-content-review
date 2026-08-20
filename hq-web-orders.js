/* =============================================================================
   SportPharm HQ — orders from the website

   sportpharm.com is WordPress + WooCommerce. wasabirub.com is a static
   marketing site and takes no orders at all; it links across to sportpharm.com,
   which is where the money actually changes hands.

   The source here is WooCommerce, not Stripe, and that is deliberate. Stripe
   sees a payment — an amount and an email — not a basket. No line items, no
   SKUs, no shipping address unless somebody remembered to put them in
   metadata. And the checkout also offers Affirm, Klarna, Afterpay and Amazon
   Pay; depending on configuration those may never touch Stripe, so a
   Stripe-only list would quietly miss orders and look complete while doing it.

   Stripe still has a job, just a different one — fees, payouts, refunds and
   disputes. That is money, and money is its own page.
============================================================================= */
(() => {
  'use strict';
  const { esc, svg, toast, go } = HQ;
  const money = n => '$' + (Number(n) || 0).toFixed(2);

  let busy = false;

  function when(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  HQ.view('weborders', {
    render() {
      const w = Store.webOrders();
      const connected = !!(window.SPHQ_STORE || {}).endpoint;

      const head = `<div class="wrap">
        <div class="page-head">
          <div><h1>From the website</h1>
            <p>Orders placed on sportpharm.com. Raise one here and it goes to Enovachem through
               the same handoff as everything else — instead of being retyped out of an inbox.</p></div>
          <div class="page-actions">
            ${connected ? `<button class="btn btn-outline" id="web-refresh" ${busy ? 'disabled' : ''}>
              ${busy ? 'Checking…' : 'Check for new orders'}</button>` : ''}
          </div>
        </div>`;

      if (!connected) {
        return head + `<section class="panel t-amber">
          <div class="panel-head"><h2>Not connected yet</h2></div>
          <p class="ord-hint">The store's API key and secret are read/write against the live shop,
             and HQ is a static site with nowhere to keep a secret — anyone with the link could
             read them out of the bundle. It needs the endpoint in
             <code>azure/api/woo</code> deployed first; then set
             <code>window.SPHQ_STORE</code> in <code>hq-config.js</code> and this fills in.</p>
          <p class="ord-hint" style="margin-top:.6rem"><b>Worth deciding before it is built:</b>
             the source here is WooCommerce, not Stripe. Stripe sees a payment, not a basket —
             no line items, no SKUs, no shipping address — and the checkout also takes Affirm,
             Klarna, Afterpay and Amazon Pay, which may never pass through Stripe. A Stripe-only
             list would miss those and still look complete.</p>
          <p class="ord-hint" style="margin-top:.6rem"><b>Stripe is wired up too</b>, for the half
             WooCommerce cannot answer: whether the payment actually cleared, the processing fee,
             refunds, disputes, and payments with no order attached — a payment link or a phone
             order that will never appear in WooCommerce at all. The two are joined on the
             WooCommerce order number, which the Stripe plugin writes into the payment. It needs
             <code>azure/api/stripe</code> deployed and <code>window.SPHQ_STRIPE</code> set.</p>
        </section>

        <section class="panel" style="margin-top:1.1rem">
          <div class="panel-head"><h2>One thing to fix on the store first</h2></div>
          <p class="ord-hint">The live store's SKUs do not match HQ's catalogue, and two products
             carry no SKU at all — including WasabiRub itself. Lines that cannot be matched will
             still import, flagged, rather than being guessed at: a wrong guess corrupts stock
             counts and nobody would ever spot it. Giving those products SKUs on the store is the
             cheaper fix.</p>
          <div class="a-table-wrap" style="margin-top:.7rem">
            <table class="a-table">
              <thead><tr><th>On the store</th><th>Maps to</th></tr></thead>
              <tbody>
                ${Object.entries(WEB_SKU_MAP).map(([k, v]) =>
                  `<tr><td><code>${esc(k)}</code></td><td>${esc(v)}</td></tr>`).join('')}
                <tr><td><em>no SKU</em> — WasabiRub (OTC) Sports Recovery</td><td>matched on name</td></tr>
                <tr><td><em>no SKU</em> — Infectious Control Towelettes</td><td class="t-red">nothing — will import unmatched</td></tr>
              </tbody>
            </table>
          </div>
        </section></div>`;
      }

      if (w.error && w.error !== 'not-configured') {
        return head + `<section class="panel t-red">
          <div class="panel-head"><h2>Could not reach the store</h2></div>
          <p class="ord-hint">${esc(w.error)}</p>
        </section></div>`;
      }

      if (!w.orders.length) {
        return head + `<section class="panel">
          <p class="wk-empty">${w.at ? 'No open orders on the store right now.'
            : 'Press “Check for new orders”.'}</p></section></div>`;
      }

      return head + `
        <p class="wk-note">${w.orders.length} order${w.orders.length === 1 ? '' : 's'} ·
          checked ${esc(when(w.at))}</p>
        <div class="a-table-wrap">
          <table class="a-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Paid with</th><th>Total</th><th>Stripe</th><th></th></tr></thead>
            <tbody>
              ${w.orders.map(o => {
                const lines = (o.lines || []).map(Store.matchWebLine);
                const bad = lines.filter(l => !l.matched);
                const done = Store.webAlreadyRaised(o.id);
                return `<tr>
                  <td><span class="a-title">#${esc(o.number || o.id)}</span>
                    <span class="a-sub">${esc(when(o.date))} · ${esc(o.status)}</span></td>
                  <td><span class="a-title">${esc(o.customer || '—')}</span>
                    <span class="a-sub">${esc(o.email || '')}</span></td>
                  <td><span class="a-sub">${esc(o.paidWith || '—')}</span></td>
                  <td class="a-date">${money(o.total)}</td>
                  <td class="a-date">${(() => {
                    const pay = Store.paymentFor(o.number || o.id);
                    if (!pay) return '<span class="a-sub">—</span>';
                    if (pay.disputed) return '<span class="a-pill t-red">disputed</span>';
                    if (pay.refunded > 0) return `<span class="a-pill t-amber">refunded ${money(pay.refunded)}</span>`;
                    if (pay.status !== 'succeeded') return `<span class="a-pill t-amber">${esc(pay.status)}</span>`;
                    return `<span class="a-sub">${pay.fee != null ? 'fee ' + money(pay.fee) : 'paid'}</span>`;
                  })()}</td>
                  <td class="a-acts">
                    ${done ? '<span class="a-sub">already raised</span>'
                      : Store.can('edit') && Store.isOwn()
                        ? `<button class="btn btn-outline btn-sm" data-raise="${esc(o.id)}">
                             Raise for Enovachem</button>` : ''}
                    ${bad.length ? `<span class="web-warn" title="${esc(bad.map(l => l.name).join(', '))}">
                      ${bad.length} unmatched</span>` : ''}
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div></div>`;
    },

    wire(root) {
      const rf = root.querySelector('#web-refresh');
      if (rf) rf.addEventListener('click', async () => {
        busy = true; HQ.render();
        const w = await Store.pullWebOrders();
        /* Ask Stripe about exactly the orders we just pulled. Failing here is
           not fatal — an order you cannot see the fee on is still shippable —
           so the money column just says so. */
        await Store.pullPayments((w.orders || []).map(o => o.number || o.id));
        busy = false; HQ.render();
      });

      root.querySelectorAll('[data-raise]').forEach(b =>
        b.addEventListener('click', () => {
          const w = Store.webOrders().orders.find(x => String(x.id) === b.dataset.raise);
          if (!w) return;
          const { order, unmatched } = Store.orderFromWeb(w);
          toast(unmatched.length
            ? `${order.ref} raised — ${unmatched.length} line${unmatched.length === 1 ? '' : 's'} could not be matched, check it.`
            : `${order.ref} raised from website order #${w.number || w.id}.`);
          go('#/orders/' + order.id);
        }));
    }
  });
})();
