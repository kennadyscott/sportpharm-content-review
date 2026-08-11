/* =============================================================================
   SportPharm HQ — Inventory and Money

   Two questions the order email could never answer: what have we actually
   sent out, and who owes us for it.

   Inventory counts units, not orders, and it counts the free ones too. That
   is the whole point — a bundle, a freebie and a SWAG hat all leave the shelf
   the same way, but only the bundle ever showed up in a total. Everything
   here is derived from the order records, so there is nothing to keep in step
   by hand and nothing to forget to update.

   Money is deliberately not the order pipeline. An order can be delivered and
   unpaid; folding the two together is how a shipped order stops being chased.
============================================================================= */
(() => {
  'use strict';
  const { esc, svg, toast, go } = HQ;

  const money = n => '$' + (Number(n) || 0).toFixed(2);
  const ago = d => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : 0;

  /* =============================== INVENTORY ============================= */
  HQ.view('inventory', {
    render() {
      const rows = Store.inventory();
      const unset = Store.bundlesWithoutContents();
      const doubles = Store.allDoubles();
      const counted = rows.filter(r => r.onHand !== 0).length;
      const totalOut = rows.reduce((n, r) => n + r.out, 0);
      const freeOut = rows.reduce((n, r) => n + r.free + r.swag, 0);
      const short = rows.filter(r => r.onHand < 0);

      const bar = r => {
        const w = Math.max(r.out + r.committed, 1);
        const seg = (n, tone) => n ? `<i class="t-${tone}" style="width:${(n / w) * 100}%"></i>` : '';
        return `<span class="inv-bar">${seg(r.sold, 'blue')}${seg(r.free, 'amber')}${
          seg(r.swag, 'red')}${seg(r.committed, 'navy')}</span>`;
      };

      return `<div class="wrap">
        <div class="page-head">
          <div><h1>Inventory</h1>
            <p>Units, not orders — and the free ones count. Worked out from the orders
               themselves, so there is nothing to keep up to date by hand. Stock leaves
               when an order is marked shipped.</p></div>
        </div>

        <div class="metric-grid" style="margin-bottom:1.1rem">
          <div class="metric-card big"><h3>${totalOut}</h3><p>Units shipped, all time</p></div>
          <div class="metric-card big"><h3>${freeOut}</h3><p>Of those, given away</p></div>
          <div class="metric-card big"><h3>${rows.reduce((n, r) => n + r.committed, 0)}</h3>
            <p>Committed on orders not yet shipped</p></div>
          <div class="metric-card big"><h3>${counted}</h3><p>Lines with a counted shelf</p></div>
        </div>

        ${short.length ? `<section class="panel t-red" style="margin-bottom:1rem">
          <div class="panel-head"><h2>Below zero</h2>
            <span class="note">more has gone out than was ever counted in</span></div>
          <p class="wk-note">${short.map(r => esc(r.name) + ' (' + r.onHand + ')').join(' · ')}.
            That is not a theft alarm — it means nobody has entered an opening count yet.
            Put the real number in the On hand column and it starts tracking properly.</p>
        </section>` : ''}

        ${doubles.length ? `<section class="panel t-amber" style="margin-bottom:1rem">
          <div class="panel-head"><h2>Counted twice</h2></div>
          ${doubles.map(d => `<p class="wk-note">
            <b>${esc(d.o.ref)}</b> lists ${d.items.map(esc).join(', ')} as free
            <em>and</em> ticks the same thing as SWAG. If that is one item rather than
            two, take it off one of them — as it stands this page counts two.
            <button class="linky" data-goorder="${d.o.id}">Open ${esc(d.o.ref)}</button></p>`).join('')}
        </section>` : ''}

        ${unset.length ? `<section class="panel t-amber" style="margin-bottom:1rem">
          <div class="panel-head"><h2>Bundles nobody has broken down</h2></div>
          <p class="wk-note">Shipping one of these takes an unknown number of units off the
            shelf, so they are left out of the counts rather than counted as one of
            themselves. Set what is in each and they start counting.</p>
          <div class="inv-recipes">
            ${unset.map(b => `<div class="inv-recipe">
              <b>${esc(b.name)}</b>
              <div class="inv-recipe-rows" data-recipe="${esc(b.sku)}">
                ${Store.catalog().filter(c => c.kind === 'unit').map(c => `
                  <label><span>${esc(c.name)}</span>
                    <input type="number" min="0" step="1" value=""
                           data-rq="${esc(b.sku)}:${esc(c.sku)}" placeholder="0"></label>`).join('')}
              </div>
              <button class="btn btn-outline btn-sm" data-savercp="${esc(b.sku)}">Save contents</button>
            </div>`).join('')}
          </div>
        </section>` : ''}

        <div class="a-table-wrap">
          <table class="a-table inv-table">
            <thead><tr>
              <th>Item</th><th class="n">On hand</th><th class="n">Committed</th>
              <th class="n">Sold</th><th class="n">Free</th><th class="n">SWAG</th>
              <th class="n">Out</th><th>Where it went</th>
            </tr></thead>
            <tbody>
              ${rows.map(r => `<tr>
                <td><span class="a-title">${esc(r.name)}</span>
                  ${r.unknown ? '<span class="a-sub t-red">not in the catalogue</span>'
                    : `<span class="a-sub">${esc(r.sku)}</span>`}</td>
                <td class="n">${r.unknown ? '—' : `<input class="inv-in ${r.onHand < 0 ? 'neg' : ''}"
                  type="number" step="1" value="${r.onHand}" data-stock="${esc(r.sku)}"
                  ${Store.can('edit') ? '' : 'disabled'}>`}</td>
                <td class="n">${r.committed || '—'}</td>
                <td class="n">${r.sold || '—'}</td>
                <td class="n ${r.free ? 't-amber-txt' : ''}">${r.free || '—'}</td>
                <td class="n ${r.swag ? 't-red-txt' : ''}">${r.swag || '—'}</td>
                <td class="n"><b>${r.out || '—'}</b></td>
                <td>${bar(r)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <p class="inv-key">
          <span class="k t-blue"></span>Sold
          <span class="k t-amber"></span>Free of charge
          <span class="k t-red"></span>SWAG
          <span class="k t-navy"></span>Committed, not yet shipped
        </p>
      </div>`;
    },

    wire(root) {
      root.querySelectorAll('[data-stock]').forEach(el =>
        el.addEventListener('change', () => {
          Store.setStock(el.dataset.stock, el.value);
          HQ.render();
        }));
      root.querySelectorAll('[data-goorder]').forEach(b =>
        b.addEventListener('click', () => go('#/orders/' + b.dataset.goorder)));
      root.querySelectorAll('[data-savercp]').forEach(b =>
        b.addEventListener('click', () => {
          const sku = b.dataset.savercp;
          const pairs = [];
          root.querySelectorAll(`[data-rq^="${sku}:"]`).forEach(inp => {
            const n = Number(inp.value) || 0;
            if (n > 0) pairs.push([inp.dataset.rq.split(':')[1], n]);
          });
          if (!pairs.length) return toast('Put a quantity against at least one item.');
          Store.setRecipe(sku, pairs);
          toast('Contents saved — the counts include it now.');
          HQ.render();
        }));
    }
  });

  /* ================================= MONEY =============================== */
  HQ.view('money', {
    render() {
      const s = Store.moneyStats();
      const all = Store.visibleOrders().filter(o => o.status !== 'draft');

      const pill = o => {
        const m = Store.moneyOf(o);
        const st = MONEY_STATES[m.state] || MONEY_STATES.none;
        return `<span class="a-pill t-${st.tone === 'muted' ? 'navy' : st.tone} ${
          st.tone === 'muted' ? 'muted' : ''}">${esc(st.label)}</span>`;
      };

      return `<div class="wrap">
        <div class="page-head">
          <div><h1>Money</h1>
            <p>What has been invoiced, what has come in, and what is still out. Kept apart
               from the order pipeline on purpose — an order can be delivered and unpaid,
               and that is exactly the one worth seeing.</p></div>
        </div>

        <div class="metric-grid" style="margin-bottom:1.1rem">
          <div class="metric-card big"><h3>${money(s.outstanding)}</h3><p>Outstanding</p></div>
          <div class="metric-card big"><h3>${money(s.paid)}</h3><p>Received</p></div>
          <div class="metric-card big"><h3>${money(s.invoiced)}</h3><p>Invoiced, all time</p></div>
          <div class="metric-card big"><h3>${money(s.notInvoiced)}</h3>
            <p>Shipped or in flight, never invoiced${s.notInvoicedCount ? ` · ${s.notInvoicedCount} order${
              s.notInvoicedCount === 1 ? '' : 's'}` : ''}</p></div>
        </div>

        ${s.notInvoicedCount ? `<section class="panel t-amber" style="margin-bottom:1rem">
          <div class="panel-head"><h2>Nobody has asked for this money</h2></div>
          <p class="wk-note">${s.notInvoicedCount} order${s.notInvoicedCount === 1 ? '' : 's'}
            worth ${money(s.notInvoiced)} ${s.notInvoicedCount === 1 ? 'has' : 'have'} left
            draft without an invoice being raised. Open one and press <b>Raise invoice</b>.</p>
        </section>` : ''}

        <div class="os-grid">
          <section class="panel">
            <div class="panel-head"><h2>How old the debt is</h2>
              <span class="note">from the day the invoice was sent</span></div>
            ${s.ageing.every(b => !b.n) ? '<p class="wk-empty">Nothing outstanding.</p>'
              : s.ageing.map(b => `<div class="os-row">
                  <span>${esc(b.label)}</span><b>${money(b.value)}</b>
                  <span class="os-n">${b.n} order${b.n === 1 ? '' : 's'}</span>
                </div>`).join('')}
          </section>

          <section class="panel">
            <div class="panel-head"><h2>Longest outstanding</h2></div>
            ${s.owing.length ? s.owing.slice(0, 8).map(x => `<div class="os-row">
              <span><button class="linky" data-goorder="${x.o.id}">${esc(x.o.ref)}</button>
                — ${esc(x.o.org || x.o.contactName || '')}</span>
              <b>${money(x.due)}</b>
              <span class="os-n">${x.days} day${x.days === 1 ? '' : 's'}</span>
            </div>`).join('') : '<p class="wk-empty">Nothing outstanding.</p>'}
          </section>
        </div>

        <div class="a-table-wrap" style="margin-top:1rem">
          <table class="a-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Invoice</th><th>Total</th>
              <th>Paid</th><th>Due</th><th>Where it is</th></tr></thead>
            <tbody>
              ${all.length ? all.map(o => {
                const m = Store.moneyOf(o);
                return `<tr data-goorder="${o.id}">
                  <td><span class="a-title">${esc(o.ref)}</span>
                    <span class="a-sub">${esc((ORDER_STATES[o.status] || {}).label || '')}</span></td>
                  <td><span class="a-title">${esc(o.org || o.contactName || '—')}</span></td>
                  <td class="a-date">${esc(m.invoiceNo || '—')}</td>
                  <td class="a-date">${money(Store.orderTotal(o))}</td>
                  <td class="a-date">${m.amountPaid ? money(m.amountPaid) : '—'}</td>
                  <td class="a-date"><b>${Store.outstandingOf(o) ? money(Store.outstandingOf(o)) : '—'}</b></td>
                  <td>${pill(o)}</td>
                </tr>`;
              }).join('') : '<tr><td colspan="7" class="ord-empty">No orders have left draft yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
    },

    wire(root) {
      root.querySelectorAll('[data-goorder]').forEach(el =>
        el.addEventListener('click', e => {
          e.stopPropagation();
          go('#/orders/' + el.dataset.goorder);
        }));
    }
  });
})();
