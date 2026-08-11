/* =============================================================================
   SportPharm HQ — Orders

   The problem this replaces: Julia writes the order email from scratch every
   time, so it lands differently each time and Enova, invoicing and the
   warehouse each interpret it fresh. Things get missed, and everyone spends
   time rewriting and re-executing.

   So the form is the source and the message is generated from it. Every base
   the CEO listed has a field — who is ordering, what, what is free, what SWAG,
   how they pay, how it ships — and nothing can be sent until the ones that
   matter are filled. The same record then moves through the handoff instead of
   being retyped at each step, which is what makes it trackable.
============================================================================= */
(() => {
  'use strict';
  const { esc, svg, avatar, ago, toast, copy, go } = HQ;

  const stOf = o => ORDER_STATES[o.status] || ORDER_STATES.draft;
  const money = n => '$' + (Number(n) || 0).toFixed(2);
  const fmt = d => d ? new Date(d.length > 10 ? d : d + 'T12:00:00')
    .toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';

  /* ------------------------------- the list ------------------------------ */
  let filter = 'open';

  function index() {
    const all = Store.orders();
    const list = all.filter(o =>
      filter === 'all' ? true : filter === 'open' ? o.status !== 'complete' : o.status === filter);
    const count = k => all.filter(o => o.status === k).length;

    return `<div class="wrap">
      <div class="page-head">
        <div><h1>Orders</h1>
          <p>One form, filled once. It covers every base the order email used to carry, produces
             the same record every time, and moves through the handoff instead of being retyped.</p></div>
        <div class="page-actions">
          ${Store.can('edit') ? `<button class="btn btn-dark" id="new-order">${svg('plus')}New order</button>` : ''}
        </div>
      </div>

      <div class="pipeline">
        ${ORDER_FLOW.map((k, i) => `
          <button class="pipe ${filter === k ? 'on' : ''}" data-ofilter="${k}">
            <b>${count(k)}</b><span>${esc(ORDER_STATES[k].label)}</span>
          </button>
          ${i < ORDER_FLOW.length - 1 ? `<i class="pipe-arrow">${svg('right')}</i>` : ''}`).join('')}
      </div>

      <div class="toolbar">
        <div class="chipbar">
          ${[['open', 'Anything open'], ['all', 'Everything']].map(([k, l]) =>
            `<button class="chip ${filter === k ? 'on' : ''}" data-ofilter="${k}">${l}</button>`).join('')}
        </div>
      </div>

      ${list.length ? `<div class="a-table-wrap">
        <table class="a-table">
          <thead><tr><th>Order</th><th>For</th><th>Total</th><th>Status</th><th>Raised</th><th></th></tr></thead>
          <tbody>
            ${list.map(o => `<tr data-oopen="${o.id}">
              <td><span class="a-title">${esc(o.ref)}</span>
                <span class="a-sub">${(o.lines || []).length} line${(o.lines || []).length === 1 ? '' : 's'}${
                  (o.freebies || []).length ? ' · ' + o.freebies.length + ' free' : ''}${
                  (o.swag || []).length ? ' · swag' : ''}</span></td>
              <td><span class="a-title">${esc(o.org || o.contactName || '—')}</span>
                <span class="a-sub">${esc(o.contactEmail || '')}</span></td>
              <td class="a-date">${money(Store.orderTotal(o))}</td>
              <td><span class="a-pill t-${stOf(o).tone === 'muted' ? 'navy' : stOf(o).tone} ${
                stOf(o).tone === 'muted' ? 'muted' : ''}">${esc(stOf(o).label)}</span></td>
              <td class="a-date">${esc(ago(o.createdAt))}</td>
              <td class="a-acts">${svg('right')}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : `<p class="panel-empty">Nothing here.
        ${Store.can('edit') ? '<button class="linky" id="empty-order">Raise one</button>' : ''}</p>`}
    </div>`;
  }

  /* ------------------------------- the form ------------------------------ */
  function lineRows(o) {
    const ed = Store.can('edit');
    return `<table class="ord-lines">
      <thead><tr><th>Qty</th><th>Item</th><th>Each</th><th>Line</th><th></th></tr></thead>
      <tbody>
        ${(o.lines || []).map((l, i) => `<tr>
          <td><input class="ord-in qty" value="${esc(l.qty)}" data-line="${i}:qty" ${ed ? '' : 'disabled'}></td>
          <td><input class="ord-in" value="${esc(l.name)}" data-line="${i}:name" ${ed ? '' : 'disabled'}>
            ${l.note ? `<span class="ord-note">${esc(l.note)}</span>` : ''}</td>
          <td><input class="ord-in num" value="${esc(l.price)}" data-line="${i}:price" ${ed ? '' : 'disabled'}></td>
          <td class="ord-money">${money((Number(l.price) || 0) * (Number(l.qty) || 0))}</td>
          <td>${ed ? `<button class="wk-x" data-linedel="${i}" aria-label="Remove line">${svg('close')}</button>` : ''}</td>
        </tr>`).join('') || '<tr><td colspan="5" class="ord-empty">Nothing on the order yet.</td></tr>'}
      </tbody>
    </table>
    ${ed ? `<div class="ord-add">
      <select id="ord-pick"><option value="">Add from the catalogue…</option>
        ${ORDER_CATALOG.map(c => `<option value="${esc(c.sku)}">${esc(c.name)} — ${money(c.price)}</option>`).join('')}
      </select>
      <button class="btn btn-ghost btn-sm" id="ord-blank">${svg('plus')}Blank line</button>
    </div>` : ''}`;
  }

  function form(o) {
    const ed = Store.can('edit');
    const dis = ed ? '' : 'disabled';
    const st = stOf(o);
    const ready = Store.orderReady(o);
    const i = ORDER_FLOW.indexOf(o.status);
    const next = ORDER_FLOW[i + 1];

    const field = (label, key, ph, type) => `
      <div class="field"><label for="o-${key}">${label}</label>
        <input id="o-${key}" type="${type || 'text'}" value="${esc(o[key] == null ? '' : o[key])}"
               placeholder="${esc(ph || '')}" data-of="${key}" ${dis}></div>`;

    /* `ord-sheet` marks this page as an order record, so the print rules can
       keep the side rail — the status and the message to Enova belong on the
       printed sheet, unlike every other editor where the side is UI. */
    return `<div class="wrap ord-sheet">
      <button class="crumb" data-go="#/orders">${svg('left')} All orders</button>
      <div class="page-head">
        <div>
          <span class="a-pill t-${st.tone === 'muted' ? 'navy' : st.tone} ${st.tone === 'muted' ? 'muted' : ''}">${esc(st.label)}</span>
          <h1>${esc(o.ref)}</h1>
          <p>${esc(st.hint)}</p>
        </div>
        <div class="page-actions">
          <span class="pill t-navy"><b>${money(Store.orderTotal(o))}</b> total</span>
        </div>
      </div>

      <div class="editor-grid">
        <div class="ed-main">
          <div class="card-pad">
            <h3 class="ord-h">Who it is for</h3>
            <div class="meta-grid">
              ${field('Organisation', 'org', 'Oklahoma State Athletics')}
              ${field('Contact name', 'contactName', 'Kevin Blaske')}
              ${field('Contact email', 'contactEmail', 'name@school.edu', 'email')}
              ${field('Contact phone', 'contactPhone', '')}
            </div>
            <div class="field"><label for="o-shipTo">Shipping address</label>
              <textarea id="o-shipTo" rows="3" data-of="shipTo"
                placeholder="170 Athletic Center&#10;Stillwater, OK 74078" ${dis}>${esc(o.shipTo)}</textarea></div>
          </div>

          <div class="card-pad">
            <h3 class="ord-h">What they are ordering</h3>
            ${lineRows(o)}
          </div>

          <div class="card-pad">
            <h3 class="ord-h">Free of charge</h3>
            <p class="ord-hint">Anything added at no cost. Say who approved it — that is the line
               that gets queried later.</p>
            <div class="ord-chips">
              ${(o.freebies || []).map((f, i) => `<span class="ord-chip">${f.qty} × ${esc(f.name)}
                ${ed ? `<b data-freedel="${i}">×</b>` : ''}</span>`).join('') || '<span class="ord-none">None</span>'}
            </div>
            ${ed ? `<div class="ord-add">
              <input id="ord-free" placeholder="e.g. 2 Super Hot">
              <button class="btn btn-ghost btn-sm" id="ord-freeadd">${svg('plus')}Add</button>
            </div>
            ${field('Approved by', 'approvedBy', 'Brandon')}` : ''}
          </div>

          <div class="card-pad">
            <h3 class="ord-h">SWAG</h3>
            <div class="ord-chips">
              ${SWAG_ITEMS.map(x => {
                const on = (o.swag || []).includes(x);
                return `<button class="ord-swag ${on ? 'on' : ''}" data-swag="${esc(x)}" ${dis}>${esc(x)}</button>`;
              }).join('')}
            </div>
          </div>

          <div class="card-pad">
            <h3 class="ord-h">Payment &amp; shipping</h3>
            <div class="meta-grid">
              <div class="field"><label for="o-pay">How they are paying</label>
                <select id="o-pay" data-of="pay" ${dis}>
                  ${PAY_METHODS.map(m => `<option ${o.pay === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}
                </select></div>
              ${field('PO number', 'poNumber', 'if they have one')}
              <div class="field"><label for="o-ship">How it ships</label>
                <select id="o-ship" data-of="ship" ${dis}>
                  ${SHIP_METHODS.map(m => `<option ${o.ship === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}
                </select></div>
              ${field('Shipping cost', 'shipCost', '10', 'number')}
              ${field('Needed by', 'needBy', '', 'date')}
              ${field('Tracking', 'tracking', 'once it ships')}
            </div>
            <div class="field"><label for="o-notes">Anything else</label>
              <textarea id="o-notes" rows="2" data-of="notes" ${dis}>${esc(o.notes)}</textarea></div>
          </div>
        </div>

        <div class="ed-side">
          <div class="side-card t-${st.tone === 'muted' ? 'navy' : st.tone}">
            <h4>Where it is</h4>
            <div class="ord-flow">
              ${ORDER_FLOW.map((k, idx) => `<div class="ord-step ${idx <= i ? 'done' : ''} ${idx === i ? 'now' : ''}">
                <i></i><span>${esc(ORDER_STATES[k].label)}</span></div>`).join('')}
            </div>
            ${ed && next ? `<button class="btn btn-dark" id="ord-next">${svg('arrow')}Mark ${esc(ORDER_STATES[next].label.toLowerCase())}</button>` : ''}
            ${ed && i > 0 ? `<button class="btn btn-ghost btn-sm" id="ord-back">Step it back</button>` : ''}
            ${!ready.ok ? `<p class="w-note">${esc(ready.error)}</p>` : ''}
          </div>

          <div class="side-card">
            <h4>The message</h4>
            <p class="side-sub">Written from the form, so it reads the same every time. Copy it into
               the email to ${ORDER_RECIPIENTS.map(r => r.to).join(' and ')}.</p>
            <pre class="ord-msg" id="ord-msg">${esc(Store.orderMessage(o))}</pre>
            <div class="img-acts">
              <button class="btn btn-outline btn-sm" id="ord-copy">${svg('copy')}Copy</button>
              <button class="btn btn-ghost btn-sm" id="ord-print">Print / PDF</button>
            </div>
          </div>

          ${(o.history || []).length ? `<div class="side-card">
            <h4>History</h4>
            <div class="cthread">
              ${o.history.slice().reverse().map(h => {
                const u = Store.user(h.by);
                return `<div class="cnote"><div class="cnote-body">
                  <span class="cnote-who"><b>${esc(u ? u.name.split(' ')[0] : 'Someone')}</b> · ${ago(h.at)}</span>
                  <p>${esc((ORDER_STATES[h.from] || {}).label || h.from)} → ${esc((ORDER_STATES[h.to] || {}).label || h.to)}</p>
                </div></div>`;
              }).join('')}
            </div>
          </div>` : ''}

          ${ed ? `<div class="side-card danger">
            <button class="link-danger" id="ord-del">Delete this order</button>
          </div>` : ''}
        </div>
      </div>

      ${orderDoc(o)}
    </div>`;
  }

  /* ---------------------------- the paper copy ----------------------------
     Print gets its own document rather than the form with its boxes taken
     off. An order that goes to a vendor and an invoicing team has to read
     like a purchase order — letterhead, a reference and a date, who it is
     billed and shipped to, a priced line-item table that foots to a total,
     and the terms underneath. The form is for filling in; this is the record.

     It is in the DOM the whole time and hidden on screen, so Print/PDF is the
     browser's own print — no second window to be blocked, no library. */
  function orderDoc(o) {
    const st = stOf(o);
    const items = (o.lines || []).filter(l => l.name);
    const goods = items.reduce((n, l) => n + (Number(l.price) || 0) * (Number(l.qty) || 0), 0);
    const shipCost = Number(o.shipCost) || 0;
    const raised = Store.user(o.raisedBy);
    const dt = d => d ? new Date(d.length > 10 ? d : d + 'T12:00:00')
      .toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

    const row = (label, value) => value
      ? `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>` : '';

    return `<div class="ord-doc" aria-hidden="true">
      <header class="doc-head">
        <div class="doc-brand">
          <div class="doc-mark">★</div>
          <div>
            <b>SportPharm</b>
            <span>Sports recovery &amp; performance</span>
          </div>
        </div>
        <div class="doc-title">
          <h1>Purchase Order</h1>
          <table class="doc-ref">
            <tr><th>Order</th><td><b>${esc(o.ref)}</b></td></tr>
            <tr><th>Date</th><td>${dt(o.createdAt)}</td></tr>
            <tr><th>Status</th><td>${esc(st.label)}</td></tr>
            ${o.po ? `<tr><th>PO number</th><td>${esc(o.po)}</td></tr>` : ''}
          </table>
        </div>
      </header>

      <div class="doc-parties">
        <section>
          <h2>Vendor</h2>
          <p><b>Enovachem Pharmaceuticals</b><br>
             ${ORDER_RECIPIENTS.map(r => esc(r.to)).join('<br>')}</p>
        </section>
        <section>
          <h2>Ship to</h2>
          <p><b>${esc(o.org || '—')}</b><br>
             ${o.contactName ? esc(o.contactName) + '<br>' : ''}
             ${esc(o.shipTo || '').replace(/\n/g, '<br>')}</p>
          ${o.contactEmail ? `<p class="doc-sm">${esc(o.contactEmail)}${
            o.contactPhone ? ' · ' + esc(o.contactPhone) : ''}</p>` : ''}
        </section>
      </div>

      <table class="doc-lines">
        <thead><tr>
          <th class="n">Qty</th><th>Description</th><th class="m">Unit</th><th class="m">Amount</th>
        </tr></thead>
        <tbody>
          ${items.map(l => `<tr>
            <td class="n">${esc(l.qty)}</td>
            <td>${esc(l.name)}${l.note ? `<span class="doc-note">${esc(l.note)}</span>` : ''}</td>
            <td class="m">${money(l.price)}</td>
            <td class="m">${money((Number(l.price) || 0) * (Number(l.qty) || 0))}</td>
          </tr>`).join('')}
          ${(o.freebies || []).map(f => `<tr class="doc-free">
            <td class="n">${esc(f.qty)}</td>
            <td>${esc(f.name)}<span class="doc-note">No charge${
              o.approvedBy ? ' — approved by ' + esc(o.approvedBy) : ''}</span></td>
            <td class="m">—</td><td class="m">$0.00</td>
          </tr>`).join('')}
          ${(o.swag || []).length ? `<tr class="doc-free">
            <td class="n">—</td>
            <td>SWAG<span class="doc-note">${(o.swag || []).map(esc).join(' · ')}</span></td>
            <td class="m">—</td><td class="m">$0.00</td>
          </tr>` : ''}
          ${!items.length && !(o.freebies || []).length ? `<tr>
            <td colspan="4" class="doc-none">Nothing on this order yet.</td></tr>` : ''}
        </tbody>
        <tfoot>
          <tr><th colspan="3">Goods</th><td class="m">${money(goods)}</td></tr>
          <tr><th colspan="3">Shipping${o.ship ? ' — ' + esc(o.ship) : ''}</th><td class="m">${money(shipCost)}</td></tr>
          <tr class="doc-total"><th colspan="3">Total</th><td class="m">${money(Store.orderTotal(o))}</td></tr>
        </tfoot>
      </table>

      <div class="doc-terms">
        <table>
          ${row('Payment', o.pay)}
          ${row('Shipping method', o.ship)}
          ${row('Needed by', o.needBy ? dt(o.needBy) : '')}
          ${row('Tracking', o.tracking)}
          ${row('Raised by', raised ? raised.name : '')}
        </table>
        ${o.notes ? `<div class="doc-notes"><h2>Notes</h2><p>${esc(o.notes).replace(/\n/g, '<br>')}</p></div>` : ''}
      </div>

      <footer class="doc-foot">
        ${esc(o.ref)} · raised in SportPharm HQ${raised ? ' by ' + esc(raised.name) : ''} ·
        questions to ${esc((ORDER_RECIPIENTS[0] || {}).to || 'orders@sportpharm.com')}
      </footer>
    </div>`;
  }

  /* ------------------------------- wiring -------------------------------- */
  HQ.view('orders', {
    render(r) {
      const o = r.id ? Store.order(r.id) : null;
      return o ? form(o) : index();
    },
    wire(root, r) {
      const o = r.id ? Store.order(r.id) : null;

      if (!o) {
        root.querySelectorAll('[data-ofilter]').forEach(b =>
          b.addEventListener('click', () => { filter = b.dataset.ofilter; HQ.render(); }));
        root.querySelectorAll('[data-oopen]').forEach(el =>
          el.addEventListener('click', () => go('#/orders/' + el.dataset.oopen)));
        const mk = () => { const n = Store.addOrder({}); go('#/orders/' + n.id); };
        ['#new-order', '#empty-order'].forEach(sel => {
          const b = root.querySelector(sel);
          if (b) b.addEventListener('click', mk);
        });
        return;
      }

      /* plain fields — save on change so typing is never interrupted */
      root.querySelectorAll('[data-of]').forEach(el =>
        el.addEventListener('change', () => {
          Store.updateOrder(o.id, { [el.dataset.of]: el.value });
          HQ.render();
        }));

      /* lines */
      root.querySelectorAll('[data-line]').forEach(el =>
        el.addEventListener('change', () => {
          const [i, key] = el.dataset.line.split(':');
          const lines = (o.lines || []).slice();
          lines[Number(i)] = { ...lines[Number(i)], [key]: el.value };
          Store.updateOrder(o.id, { lines });
          HQ.render();
        }));
      root.querySelectorAll('[data-linedel]').forEach(b =>
        b.addEventListener('click', () => {
          const lines = (o.lines || []).slice();
          lines.splice(Number(b.dataset.linedel), 1);
          Store.updateOrder(o.id, { lines }); HQ.render();
        }));
      const pick = root.querySelector('#ord-pick');
      if (pick) pick.addEventListener('change', () => {
        const c = ORDER_CATALOG.find(x => x.sku === pick.value);
        if (!c) return;
        Store.updateOrder(o.id, { lines: (o.lines || []).concat([{ ...c, qty: 1 }]) });
        HQ.render();
      });
      const blank = root.querySelector('#ord-blank');
      if (blank) blank.addEventListener('click', () => {
        Store.updateOrder(o.id, { lines: (o.lines || []).concat([{ name: '', qty: 1, price: 0, note: '' }]) });
        HQ.render();
      });

      /* freebies — "2 Super Hot" parses into a qty and a name */
      const fadd = root.querySelector('#ord-freeadd');
      if (fadd) fadd.addEventListener('click', () => {
        const inp = root.querySelector('#ord-free');
        const v = inp.value.trim();
        if (!v) return;
        const m = v.match(/^(\d+)\s+(.*)$/);
        Store.updateOrder(o.id, {
          freebies: (o.freebies || []).concat([{ qty: m ? Number(m[1]) : 1, name: m ? m[2] : v }])
        });
        HQ.render();
      });
      root.querySelectorAll('[data-freedel]').forEach(b =>
        b.addEventListener('click', () => {
          const f = (o.freebies || []).slice();
          f.splice(Number(b.dataset.freedel), 1);
          Store.updateOrder(o.id, { freebies: f }); HQ.render();
        }));

      root.querySelectorAll('[data-swag]').forEach(b =>
        b.addEventListener('click', () => {
          const x = b.dataset.swag;
          const cur = o.swag || [];
          Store.updateOrder(o.id, {
            swag: cur.includes(x) ? cur.filter(s => s !== x) : cur.concat([x])
          });
          HQ.render();
        }));

      /* the handoff */
      const i = ORDER_FLOW.indexOf(o.status);
      const nx = root.querySelector('#ord-next');
      if (nx) nx.addEventListener('click', () => {
        const r2 = Store.setOrderStatus(o.id, ORDER_FLOW[i + 1]);
        if (!r2.ok) { toast(r2.error); return; }
        HQ.render(); toast('Moved on.');
      });
      const bk = root.querySelector('#ord-back');
      if (bk) bk.addEventListener('click', () => { Store.setOrderStatus(o.id, ORDER_FLOW[i - 1]); HQ.render(); });

      const cp = root.querySelector('#ord-copy');
      if (cp) cp.addEventListener('click', () => copy(Store.orderMessage(o)));
      const pr = root.querySelector('#ord-print');
      if (pr) pr.addEventListener('click', () => window.print());

      const del = root.querySelector('#ord-del');
      if (del) del.addEventListener('click', () => {
        if (!confirm('Delete ' + o.ref + '? There is no undo.')) return;
        Store.removeOrder(o.id); go('#/orders'); toast('Deleted.');
      });
    }
  });
})();
