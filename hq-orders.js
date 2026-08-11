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
    const all = Store.visibleOrders();
    const list = all.filter(o =>
      filter === 'all' ? true : filter === 'open' ? o.status !== 'complete' : o.status === filter);
    const count = k => all.filter(o => o.status === k).length;

    return `<div class="wrap">
      <div class="page-head">
        <div><h1>Orders</h1>
          <p>One form, filled once. It covers every base the order email used to carry, produces
             the same record every time, and moves through the handoff instead of being retyped.</p></div>
        <div class="page-actions">
          ${Store.can('edit') && Store.isOwn()
            ? `<button class="btn btn-dark" id="new-order">${svg('plus')}New order</button>` : ''}
        </div>
      </div>

      ${Store.can('edit') && Store.isOwn() ? `<div class="ord-drop" id="ord-drop">
        <div class="ord-drop-in">
          <b>Drop a filled order form here</b>
          <span>The PDF Julia or Marissa emailed to orders@ — HQ reads it and raises the order,
                so nobody types it a second time. It is read in this browser; the file is not
                uploaded anywhere.</span>
          <button class="btn btn-outline btn-sm" id="ord-pick-file">Choose a PDF…</button>
          <input type="file" id="ord-file" accept="application/pdf,.pdf" hidden>
        </div>
        <div class="ord-drop-msg" id="ord-drop-msg" hidden></div>
      </div>` : ''}

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

      ${!Store.isOwn() ? `<p class="wk-note">Orders SportPharm has sent you. Open one to see what
         they need and to reply on it.</p>` : ''}
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

  /* ----------------------------- the money side ---------------------------
     On the order rather than only on the Money page, because the moment
     somebody wants to raise an invoice is the moment they are looking at the
     order. The state is never set directly — it follows the numbers, so a
     part payment cannot sit under a heading that says "sent".
  ------------------------------------------------------------------------ */
  function moneyCard(o, ed) {
    if (!Store.isOwn()) return '';
    const m = Store.moneyOf(o);
    const st = MONEY_STATES[m.state] || MONEY_STATES.none;
    const total = Store.orderTotal(o);
    const due = Store.outstandingOf(o);
    const tone = st.tone === 'muted' ? 'navy' : st.tone;

    return `<div class="side-card t-${tone}">
      <h4>Money</h4>
      <span class="a-pill t-${tone} ${st.tone === 'muted' ? 'muted' : ''}">${esc(st.label)}</span>
      <p class="side-sub">${esc(st.hint)}</p>

      ${m.state === 'none' ? `
        <div class="os-row"><span>Order total</span><b>${money(total)}</b></div>
        ${ed ? `<button class="btn btn-dark btn-sm" id="ord-raise-inv"
          ${(o.lines || []).length ? '' : 'disabled title="Nothing on the order to invoice"'}>
          ${svg('plus')}Raise invoice</button>` : ''}
      ` : `
        <div class="os-row"><span>${esc(m.invoiceNo || 'Invoice')}</span><b>${money(total)}</b></div>
        <div class="os-row"><span>Paid</span><b>${money(m.amountPaid)}</b></div>
        <div class="os-row big"><span>Still due</span><b>${money(due)}</b></div>
        ${ed ? `
          <div class="field"><label for="m-paid">Paid to date</label>
            <input id="m-paid" type="number" step="0.01" min="0" value="${esc(m.amountPaid || 0)}"
                   data-money="amountPaid"></div>
          <div class="field"><label for="m-terms">Terms</label>
            <input id="m-terms" value="${esc(m.terms || '')}" data-money="terms" placeholder="Net 30"></div>
          <div class="img-acts">
            ${!m.sentAt ? `<button class="btn btn-outline btn-sm" id="ord-inv-sent">Mark invoice sent</button>` : ''}
            <button class="btn btn-dark btn-sm" id="ord-invoice-pdf">${svg('doc')}Invoice PDF</button>
            ${due > 0 ? `<button class="btn btn-ghost btn-sm" id="ord-paid-full">Settle in full</button>` : ''}
          </div>
          ${m.sentAt ? `<p class="side-sub">Sent ${esc(ago(m.sentAt))}.</p>` : ''}
        ` : ''}
      `}
    </div>`;
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
            <h3 class="ord-h">Who fulfils it</h3>
            <div class="field"><label for="o-toCompany">Send it to</label>
              <select id="o-toCompany" data-of="toCompany" ${dis}>
                ${Store.companies().filter(c => c.kind === 'partner').map(c =>
                  `<option value="${c.id}" ${o.toCompany === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
              </select></div>

            <h3 class="ord-h" style="margin-top:1.1rem">Who it is for</h3>
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

          ${Store.isOwn() ? `<div class="side-card">
            <h4>The message</h4>
            <p class="side-sub">Written from the form, so it reads the same every time. It goes to
               ${ORDER_RECIPIENTS.map(r => r.to).join(' and ')}.</p>
            <pre class="ord-msg" id="ord-msg">${esc(Store.orderMessage(o))}</pre>
            ${o.sentAt ? `<p class="ord-sent">${svg('check')} Sent ${esc(ago(o.sentAt))}${
              o.sentBy ? ' by ' + esc(o.sentBy) : ''}</p>` : ''}
            <div class="img-acts">
              ${ed ? `<button class="btn btn-dark btn-sm" id="ord-send"
                ${ready.ok ? '' : 'disabled title="' + esc(ready.error) + '"'}>${svg('arrow')}Send${
                o.sentAt ? ' again' : ' to Enova'}</button>` : ''}
              <button class="btn btn-outline btn-sm" id="ord-copy">${svg('copy')}Copy</button>
              <button class="btn btn-outline btn-sm" id="ord-pdf">${svg('doc')}Order form PDF</button>
              <button class="btn btn-ghost btn-sm" id="ord-print">Print</button>
            </div>
            <p class="side-sub">The PDF is the same one-page form the team fills by hand —
               filled in from this record, in SportPharm branding, ready to attach.</p>
            ${HQ.mailer && HQ.mailer.ready()
              ? `<p class="side-sub">Sends from ${esc(HQ.mailer.from())} — a real message, with a copy in that mailbox.</p>`
              : `<p class="side-sub">No server to send from yet, so Send opens this in your mail app
                   with everything filled in. Mark it sent once it has gone.</p>
                 <p class="side-sub">Prefer your desktop app? <a class="linky" href="${esc(HQ.mailer.mailtoUrl({
                     to: ORDER_RECIPIENTS.filter(r => !/cc/i.test(r.role)).map(r => r.to),
                     cc: ORDER_RECIPIENTS.filter(r => /cc/i.test(r.role)).map(r => r.to),
                     subject: `SportPharm order ${o.ref} — ${o.org || 'new order'}`,
                     body: Store.orderMessage(o)
                   }))}">open it in whatever mail app this machine defaults to</a>
                   — that is an OS setting, so it may not be Outlook. Copy always works.</p>`}
          </div>` : ''}

          ${moneyCard(o, ed)}

          <div class="side-card">
            <h4>Talk to ${esc((Store.company(o.toCompany) || {}).name || 'them')}</h4>
            <p class="side-sub">On the order itself, so it is not in an email chain nobody else
               can find. Both companies see this.</p>
            <div class="cthread ord-talk">
              ${Store.orderThread(o).map(n => {
                const who = Store.user(n.by), co = Store.company(n.company);
                const mine = n.company === (Store.myCompany() || {}).id;
                return `<div class="cnote ${mine ? 'mine' : ''}"><div class="cnote-body">
                  <span class="cnote-who"><b>${esc(who ? who.name.split(' ')[0] : 'Someone')}</b>
                    ${co ? `<span class="co-chip sm t-${co.tone}">${esc(co.short)}</span>` : ''}
                    · ${ago(n.at)}</span>
                  <p>${esc(n.text)}</p>
                </div></div>`;
              }).join('') || '<p class="ord-hint">Nothing said yet.</p>'}
            </div>
            ${Store.can('edit') ? `<form class="ord-talk-form" id="ord-talk-form">
              <input id="ord-talk-in" placeholder="Add a note both sides can see…" maxlength="2000">
              <button class="btn btn-dark btn-sm" type="submit">Post</button>
            </form>` : ''}
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
          <!-- These are SportPharm-hosted aliases that route to Enova, not
               Enovachem's own domain. Calling the block "Vendor" and putting
               an @sportpharm.com address under Enovachem's name reads as
               their address, which it is not. Say where it goes instead. -->
          <h2>Sent to</h2>
          <p>${ORDER_RECIPIENTS.map(r =>
            `<b>${esc(r.to)}</b><span class="doc-note">${esc(r.role)}</span>`).join('')}</p>
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

  /* ---------------------------- order analytics ---------------------------
     Computed from the order records, so it needs nothing entered and holds
     nothing private. The giveaway panel is the point of the page: freebies
     and SWAG carry no price on an order, so they never show up in a total,
     and the only way anyone sees the size of it is to count it. */
  HQ.view('ordstats', {
    render() {
      const s = Store.orderStats();
      const pc = n => s.count ? Math.round((n / s.count) * 100) : 0;

      const bar = (label, n, of, tone) => `<div class="os-bar">
        <span class="os-bar-l">${esc(label)}</span>
        <span class="os-bar-t"><i class="t-${tone}" style="width:${of ? (n / of) * 100 : 0}%"></i></span>
        <span class="os-bar-n">${n}</span>
      </div>`;

      return `<div class="wrap">
        <div class="page-head">
          <div><h1>Order analytics</h1>
            <p>Worked out from the orders themselves — nothing to enter, and no customer
               data in it. What has been raised, what it is worth, how long each handoff
               takes, and what is going out for free.</p></div>
        </div>

        ${!s.count ? `<section class="panel"><p class="wk-empty">No orders raised yet.
          Everything here fills in as they go through.</p></section>` : `

        <div class="metric-grid" style="margin-bottom:1.2rem">
          <div class="metric-card big"><h3>${money(s.total)}</h3><p>Raised, all time</p></div>
          <div class="metric-card big"><h3>${money(s.openValue)}</h3><p>Open — not yet complete</p></div>
          <div class="metric-card big"><h3>${money(s.avg)}</h3><p>Average order</p></div>
          <div class="metric-card big"><h3>${s.count}</h3><p>Orders${
            s.openCount ? ` · ${s.openCount} open` : ''}</p></div>
        </div>

        <div class="os-grid">
          <section class="panel">
            <div class="panel-head"><h2>Where they are</h2>
              <span class="note">${s.doneCount} of ${s.count} complete</span></div>
            ${ORDER_FLOW.map(k => bar(ORDER_STATES[k].label, s.byStatus[k], s.count,
              ORDER_STATES[k].tone)).join('')}
          </section>

          <section class="panel ${s.unapproved ? 't-amber' : ''}">
            <div class="panel-head"><h2>Given away</h2>
              <span class="note">no price on the order, so it never shows in a total</span></div>
            <div class="os-pair">
              <div><b>${s.freeUnits}</b><span>free units</span></div>
              <div><b>${s.swagUnits}</b><span>SWAG items</span></div>
              <div><b>${pc(s.freeOrders)}%</b><span>of orders carry something free</span></div>
            </div>
            ${s.unapproved ? `<p class="os-warn">${s.unapproved} order${s.unapproved === 1 ? '' : 's'}
              give${s.unapproved === 1 ? 's' : ''} something away with nobody named as having
              approved it. That is the line that gets queried later.</p>`
              : '<p class="wk-note">Every giveaway has an approver named.</p>'}
          </section>

          <section class="panel">
            <div class="panel-head"><h2>How long each step takes</h2>
              <span class="note">average days from raised</span></div>
            ${ORDER_FLOW.slice(1).map(k => {
              const d = s.stepDays[k];
              return `<div class="os-row">
                <span>${esc(ORDER_STATES[k].label)}</span>
                <b>${d ? d.days.toFixed(1) + ' days' : '—'}</b>
                <span class="os-n">${d ? 'from ' + d.n : 'not reached yet'}</span>
              </div>`;
            }).join('')}
          </section>

          <section class="panel">
            <div class="panel-head"><h2>Who orders</h2></div>
            ${s.orgs.slice(0, 8).map(o => `<div class="os-row">
              <span>${esc(o.org)}</span><b>${money(o.value)}</b>
              <span class="os-n">${o.n} order${o.n === 1 ? '' : 's'}</span>
            </div>`).join('')}
          </section>

          <section class="panel">
            <div class="panel-head"><h2>What they order</h2></div>
            ${s.skus.length ? s.skus.slice(0, 8).map(x => `<div class="os-row">
              <span>${esc(x.name)}</span><b>${money(x.value)}</b>
              <span class="os-n">${x.qty} unit${x.qty === 1 ? '' : 's'}</span>
            </div>`).join('') : '<p class="wk-empty">No priced lines yet.</p>'}
          </section>

          <section class="panel">
            <div class="panel-head"><h2>How they pay</h2>
              <span class="note">${money(s.shipping)} shipping billed</span></div>
            ${s.pay.length ? s.pay.map(p => bar(p.k, p.n, s.count, 'blue')).join('')
              : '<p class="wk-empty">Nothing recorded yet.</p>'}
          </section>
        </div>`}
      </div>`;
    }
  });

  /* ---------------------------- raise an order ----------------------------
     The simple way in. The order record has thirty-odd fields and the full
     editor shows all of them, which is right for correcting an order and
     wrong for raising one — Julia knows four things when she starts: who it
     is for, what they want, what is free, how they are paying.

     So this asks for those, in that order, on one screen, with the catalogue
     as buttons rather than a dropdown and a price to type. Everything else
     takes a sensible default and is editable on the record afterwards, which
     is the "fill it, then tweak it" the CEO asked for.

     Kept in a draft object rather than a real order, so abandoning it half
     done does not leave an empty SP-00xx on the list for someone to wonder
     about later.
  ------------------------------------------------------------------------ */
  let nu = null;
  const blankNew = () => ({
    org: '', contactName: '', contactEmail: '', shipTo: '',
    qty: {},        /* sku -> how many, charged */
    freeQty: {},    /* sku -> how many, free of charge */
    approvedBy: '', swag: [], pay: 'Invoice', ship: 'Ground',
    shipCost: '', needBy: '', poNumber: '', invoiceEmail: '', notes: ''
  });

  const newTotals = () => {
    const goods = Object.keys(nu.qty).reduce((n, sku) => {
      const c = Store.bySku(sku);
      return n + (c ? c.price * nu.qty[sku] : 0);
    }, 0);
    const ship = Number(nu.shipCost) || 0;
    return { goods, ship, total: goods + ship };
  };

  function newOrder() {
    if (!nu) nu = blankNew();
    const t = newTotals();
    const sellable = Store.catalog().filter(c => c.kind !== 'swag');
    const swag = Store.catalog().filter(c => c.kind === 'swag');
    const freeCount = Object.values(nu.freeQty).reduce((n, q) => n + q, 0);

    const fld = (key, label, ph, type) => `
      <div class="field"><label for="n-${key}">${label}</label>
        <input id="n-${key}" type="${type || 'text'}" value="${esc(nu[key] || '')}"
               placeholder="${esc(ph || '')}" data-nf="${key}"></div>`;

    const stepper = (c, bag, tone) => {
      const n = bag[c.sku] || 0;
      return `<div class="pick ${n ? 'on ' + tone : ''}">
        <button class="pick-body" data-add="${esc(c.sku)}:${bag === nu.qty ? 'qty' : 'freeQty'}">
          <b>${esc(c.name)}</b>
          <span>${c.price ? money(c.price) : 'no charge'}${c.note ? ' · ' + esc(c.note) : ''}</span>
        </button>
        <div class="pick-n">
          <button class="pick-pm" data-bump="${esc(c.sku)}:${bag === nu.qty ? 'qty' : 'freeQty'}:-1"
            ${n ? '' : 'disabled'}>−</button>
          <em>${n}</em>
          <button class="pick-pm" data-bump="${esc(c.sku)}:${bag === nu.qty ? 'qty' : 'freeQty'}:1">+</button>
        </div>
      </div>`;
    };

    return `<div class="wrap">
      <div class="page-head">
        <div><h1>Raise an order</h1>
          <p>Four things: who it is for, what they want, what is free, how they are paying.
             Everything else takes a default you can change on the order afterwards.</p></div>
      </div>

      <div class="editor-grid">
        <div class="ed-main">
          <div class="card-pad">
            <h3 class="ord-h">1 · Who it is for</h3>
            <div class="meta-grid">
              ${fld('org', 'Organisation / team', 'Oklahoma State Athletics')}
              ${fld('contactName', 'Contact name', 'Kevin Blaske')}
              ${fld('contactEmail', 'Contact email', 'name@school.edu', 'email')}
              ${fld('needBy', 'Needed by', 'ASAP')}
            </div>
            <div class="field"><label for="n-shipTo">Shipping address</label>
              <textarea id="n-shipTo" rows="3" data-nf="shipTo"
                placeholder="170 Athletic Center&#10;Stillwater, OK 74078">${esc(nu.shipTo)}</textarea></div>
          </div>

          <div class="card-pad">
            <h3 class="ord-h">2 · What they are ordering</h3>
            <div class="picks">${sellable.map(c => stepper(c, nu.qty, 't-blue')).join('')}</div>
          </div>

          <div class="card-pad">
            <h3 class="ord-h">3 · Anything free of charge</h3>
            <p class="ord-hint">Same catalogue, no price. Say who approved it — that is the
               line that gets queried later, and it is the number nobody could see before.</p>
            <div class="picks">${sellable.map(c => stepper(c, nu.freeQty, 't-amber')).join('')}</div>
            ${freeCount ? `<div class="field" style="margin-top:.7rem">
              <label for="n-approvedBy">Approved by</label>
              <input id="n-approvedBy" value="${esc(nu.approvedBy)}" data-nf="approvedBy"
                     placeholder="Brandon"></div>` : ''}
          </div>

          <div class="card-pad">
            <h3 class="ord-h">4 · SWAG in the box</h3>
            <div class="ord-chips">
              ${swag.map(c => `<button class="ord-swag ${nu.swag.includes(c.name) ? 'on' : ''}"
                data-nswag="${esc(c.name)}">${esc(c.name)}</button>`).join('')}
            </div>
          </div>

          <div class="card-pad">
            <h3 class="ord-h">5 · Paying and shipping</h3>
            <div class="meta-grid">
              <div class="field"><label for="n-pay">How they are paying</label>
                <select id="n-pay" data-nf="pay">
                  ${PAY_METHODS.map(m => `<option ${nu.pay === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}
                </select></div>
              <div class="field"><label for="n-ship">How it ships</label>
                <select id="n-ship" data-nf="ship">
                  ${SHIP_METHODS.map(m => `<option ${nu.ship === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}
                </select></div>
              ${fld('shipCost', 'Shipping charged', '10.00', 'number')}
              ${nu.pay === 'Purchase order' ? fld('poNumber', 'PO number', '') : ''}
              ${nu.pay === 'Invoice' ? fld('invoiceEmail', 'Send the invoice to', 'name@company.com', 'email') : ''}
            </div>
            <div class="field"><label for="n-notes">Anything else</label>
              <textarea id="n-notes" rows="2" data-nf="notes">${esc(nu.notes)}</textarea></div>
          </div>
        </div>

        <div class="ed-side">
          <div class="side-card">
            <h4>What it comes to</h4>
            <div class="os-row"><span>Goods</span><b>${money(t.goods)}</b></div>
            <div class="os-row"><span>Shipping</span><b>${money(t.ship)}</b></div>
            <div class="os-row big"><span>Total</span><b>${money(t.total)}</b></div>
            ${freeCount ? `<p class="side-sub">Plus ${freeCount} item${freeCount === 1 ? '' : 's'}
               free of charge${nu.swag.length ? ' and ' + nu.swag.length + ' SWAG' : ''}, which carry
               no price but do come off the shelf.</p>` : ''}
            <button class="btn btn-dark" id="n-create">${svg('arrow')}Create the order</button>
            <button class="btn btn-ghost btn-sm" id="n-clear">Start again</button>
            <p class="side-sub">It is created as a draft. Nothing is sent to Enova and no stock
               moves until you say so.</p>
          </div>
        </div>
      </div>
    </div>`;
  }

  function wireNew(root) {
    const bump = (sku, bag, by) => {
      nu[bag][sku] = Math.max(0, (nu[bag][sku] || 0) + by);
      if (!nu[bag][sku]) delete nu[bag][sku];
      HQ.render();
    };
    root.querySelectorAll('[data-add]').forEach(b =>
      b.addEventListener('click', () => {
        const [sku, bag] = b.dataset.add.split(':');
        bump(sku, bag, 1);
      }));
    root.querySelectorAll('[data-bump]').forEach(b =>
      b.addEventListener('click', e => {
        e.stopPropagation();
        const [sku, bag, by] = b.dataset.bump.split(':');
        bump(sku, bag, Number(by));
      }));
    root.querySelectorAll('[data-nswag]').forEach(b =>
      b.addEventListener('click', () => {
        const x = b.dataset.nswag;
        nu.swag = nu.swag.includes(x) ? nu.swag.filter(s => s !== x) : nu.swag.concat([x]);
        HQ.render();
      }));
    /* `input` rather than `change` on the plain fields would re-render on
       every keystroke and lose the caret. These only need to be current when
       Create is pressed, so they are read straight off the DOM there. */
    root.querySelectorAll('[data-nf]').forEach(el =>
      el.addEventListener('change', () => {
        nu[el.dataset.nf] = el.value;
        /* only the pickers change what is on screen */
        if (el.dataset.nf === 'pay') HQ.render();
      }));

    const clear = root.querySelector('#n-clear');
    if (clear) clear.addEventListener('click', () => { nu = blankNew(); HQ.render(); });

    const create = root.querySelector('#n-create');
    if (create) create.addEventListener('click', () => {
      root.querySelectorAll('[data-nf]').forEach(el => { nu[el.dataset.nf] = el.value; });

      const lines = Object.keys(nu.qty).map(sku => {
        const c = Store.bySku(sku);
        return { name: c.name, qty: nu.qty[sku], price: c.price, note: c.note || '' };
      });
      const freebies = Object.keys(nu.freeQty).map(sku => {
        const c = Store.bySku(sku);
        return { name: c.name, qty: nu.freeQty[sku], note: '' };
      });

      if (!lines.length && !freebies.length) return toast('Nothing on the order yet.');
      if (freebies.length && !nu.approvedBy.trim()) {
        return toast('Say who approved the free items — that is the line that gets queried.');
      }

      const o = Store.addOrder({
        org: nu.org, contactName: nu.contactName, contactEmail: nu.contactEmail,
        shipTo: nu.shipTo, needBy: nu.needBy, lines, freebies, swag: nu.swag,
        approvedBy: nu.approvedBy, pay: nu.pay, ship: nu.ship,
        shipCost: Number(nu.shipCost) || 0, poNumber: nu.poNumber,
        invoiceEmail: nu.invoiceEmail, notes: nu.notes
      });
      nu = blankNew();
      toast(o.ref + ' raised.');
      go('#/orders/' + o.id);
    });
  }

  HQ.view('neworder', {
    render() {
      return Store.can('edit') && Store.isOwn()
        ? newOrder()
        : '<div class="wrap"><p class="panel-empty">Only SportPharm staff raise orders.</p></div>';
    },
    wire(root) { if (Store.can('edit') && Store.isOwn()) wireNew(root); }
  });

  /* --------------------------- importing a form ---------------------------
     Drop the emailed PDF, get the order. The one rule here is that nothing is
     written until the person doing it has seen what came out — a silent import
     of a half-filled form is worse than no import, because the record then
     looks authoritative. */
  function wireImport(root) {
    const zone = root.querySelector('#ord-drop');
    if (!zone || !HQ.orderImport) return;
    const input = root.querySelector('#ord-file');
    const msg = root.querySelector('#ord-drop-msg');
    const pick = root.querySelector('#ord-pick-file');

    const say = (tone, title, lines) => {
      msg.hidden = false;
      msg.className = 'ord-drop-msg t-' + tone;
      msg.innerHTML = `<b>${esc(title)}</b>${
        (lines || []).map(l => `<span>${esc(l)}</span>`).join('')}`;
    };

    async function take(file) {
      if (!file) return;
      if (!/pdf$/i.test(file.name) && file.type !== 'application/pdf') {
        return say('red', 'That is not a PDF.', [file.name]);
      }
      say('navy', 'Reading ' + file.name + '…', []);
      let read;
      try {
        read = await HQ.orderImport.inspect(file);
      } catch (e) {
        return say('red', 'Could not read that form.', [e.message]);
      }

      const rec = read.record;
      const what = rec.org || rec.contactName || 'this order';
      const lines = rec.lines.length + ' line' + (rec.lines.length === 1 ? '' : 's') +
        (rec.freebies.length ? ', ' + rec.freebies.length + ' free' : '') +
        (rec.swag.length ? ', SWAG' : '');

      if (read.duplicate) {
        if (!confirm(`${read.duplicate.ref} already looks like this order — same ` +
                     `organisation, same lines, same total.\n\nRaise a second one anyway?`)) {
          return say('amber', 'Not imported.',
            ['It matches ' + read.duplicate.ref + ', which is already on the list.']);
        }
      }

      if (!confirm(`Raise an order for ${what}?\n\n${lines}` +
                   (read.warnings.length ? `\n\n${read.warnings.length} thing` +
                     `${read.warnings.length === 1 ? '' : 's'} to check first — ` +
                     `they will be listed after you confirm.` : ''))) {
        return say('amber', 'Not imported.', []);
      }

      const made = Store.addOrder(rec);
      if (read.warnings.length) {
        /* Parked on the record as well as shown, because the person who reads
           this next is usually not the person who dropped the file. */
        Store.updateOrder(made.id, {
          notes: [rec.notes, '', 'ON IMPORT, HQ FLAGGED:',
            ...read.warnings.map(w => '· ' + w)].filter(x => x !== undefined).join('\n').trim()
        });
        say('amber', made.ref + ' raised — ' + read.warnings.length + ' to check.',
            read.warnings);
        toast(made.ref + ' raised, with notes to check.');
      } else {
        say('green', made.ref + ' raised from ' + file.name + '.', [what + ' · ' + lines]);
        toast(made.ref + ' raised.');
      }
      setTimeout(() => go('#/orders/' + made.id), 700);
    }

    if (pick) pick.addEventListener('click', () => input.click());
    if (input) input.addEventListener('change', () => {
      take(input.files && input.files[0]);
      input.value = '';                 /* so the same file can be dropped twice */
    });

    /* dragleave fires when the pointer crosses onto a child, so the highlight
       only clears once it has actually left the zone. */
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      zone.classList.add('drop-on');
    });
    zone.addEventListener('dragleave', e => {
      if (!zone.contains(e.relatedTarget)) zone.classList.remove('drop-on');
    });
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drop-on');
      take(e.dataTransfer.files && e.dataTransfer.files[0]);
    });
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
        wireImport(root);
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

      const talk = root.querySelector('#ord-talk-form');
      if (talk) talk.addEventListener('submit', e => {
        e.preventDefault();
        const box = root.querySelector('#ord-talk-in');
        if (!box.value.trim()) return;
        Store.addOrderNote(o.id, box.value);
        HQ.render();
      });

      const snd = root.querySelector('#ord-send');
      if (snd) snd.addEventListener('click', async () => {
        const gate = Store.orderReady(o);
        if (!gate.ok) return toast(gate.error);
        const to = ORDER_RECIPIENTS.filter(r => !/cc/i.test(r.role)).map(r => r.to);
        const cc = ORDER_RECIPIENTS.filter(r => /cc/i.test(r.role)).map(r => r.to);
        const subject = `SportPharm order ${o.ref} — ${o.org || 'new order'}`;
        const body = Store.orderMessage(o);

        /* No server: hand it straight to the mail client, and do it
           SYNCHRONOUSLY. This was broken — the old code awaited the mailer
           first, and a mailto: navigation that is not inside the click's own
           user activation gets blocked, so nothing happened at all. The
           confirm() and the re-render immediately after made it worse.

           No confirm on this path either: opening a draft is not sending, so
           there is nothing to confirm, and the dialog was another thing
           between the click and the navigation. */
        if (!HQ.mailer.ready()) {
          /* Outlook on the web, not mailto:. A page cannot choose which mail
             app the OS opens, and on a Mac mailto: lands in Mail.app. This
             goes straight to Outlook, composing as whoever is signed in.

             Still synchronous inside the click — window.open outside a user
             activation gets popup-blocked, which is the same trap as before
             wearing a different hat. */
          const a = document.createElement('a');
          a.href = HQ.mailer.outlookUrl({ to, cc, subject, body });
          a.target = '_blank';
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          a.remove();
          toast('Opening Outlook. Nothing is sent until you send it there.');
          return;
        }

        if (!confirm(`Send ${o.ref} to ${to.join(', ')}?\n\nThis sends a real email.`)) return;

        snd.disabled = true;
        snd.textContent = 'Sending…';
        const res = await HQ.mailer.send({ to, cc, ref: o.ref, subject, body });

        if (!res.ok) {
          /* Say what went wrong and leave the order where it was. Marking it
             sent on a failure is the one outcome nobody could recover from. */
          alert(res.error);
          HQ.render();
          return;
        }
        Store.markOrderSent(o.id, res.sentBy);
        if (o.status === 'draft') Store.setOrderStatus(o.id, 'submitted');
        toast(`${o.ref} sent to ${res.to.join(', ')}.`);
        HQ.render();
      });

      const cp = root.querySelector('#ord-copy');
      if (cp) cp.addEventListener('click', () => copy(Store.orderMessage(o)));
      const pr = root.querySelector('#ord-print');
      if (pr) pr.addEventListener('click', () => window.print());

      /* ------------------------------- paper ------------------------------
         Both documents come out of the same record through hq-pdf.js. The
         warnings matter: the paper form holds five lines and two free rows,
         so an order bigger than that would otherwise reach the warehouse
         quietly missing something. */
      async function makePdf(btn, fn, what) {
        if (!HQ.pdf) return toast('The PDF builder did not load.');
        const label = btn.innerHTML;
        btn.disabled = true;
        btn.textContent = 'Building…';
        try {
          const res = await fn();
          if (res.warnings.length) alert(what + ' built, but read this first:\n\n· ' +
            res.warnings.join('\n· '));
          else toast(res.filename + ' downloaded.');
        } catch (e) {
          alert('Could not build the ' + what.toLowerCase() + '.\n\n' + e.message);
        } finally {
          btn.disabled = false;
          btn.innerHTML = label;
        }
      }

      const pdfBtn = root.querySelector('#ord-pdf');
      if (pdfBtn) pdfBtn.addEventListener('click', () =>
        makePdf(pdfBtn, () => HQ.pdf.orderForm(o), 'The order form'));

      const invBtn = root.querySelector('#ord-invoice-pdf');
      if (invBtn) invBtn.addEventListener('click', () =>
        makePdf(invBtn, () => HQ.pdf.invoice(Store.order(o.id)), 'The invoice'));

      /* ------------------------------- money ------------------------------ */
      const raise = root.querySelector('#ord-raise-inv');
      if (raise) raise.addEventListener('click', () => {
        const r = Store.raiseInvoice(o.id);
        if (!r.ok) return toast(r.error);
        toast(r.invoiceNo + ' raised.');
        HQ.render();
      });
      const sent = root.querySelector('#ord-inv-sent');
      if (sent) sent.addEventListener('click', () => {
        Store.setMoney(o.id, { sentAt: new Date().toISOString() });
        toast('Marked sent — the clock starts today.');
        HQ.render();
      });
      const settle = root.querySelector('#ord-paid-full');
      if (settle) settle.addEventListener('click', () => {
        Store.setMoney(o.id, { amountPaid: Store.orderTotal(o) });
        toast('Settled.');
        HQ.render();
      });
      root.querySelectorAll('[data-money]').forEach(el =>
        el.addEventListener('change', () => {
          Store.setMoney(o.id, { [el.dataset.money]: el.value });
          HQ.render();
        }));

      const del = root.querySelector('#ord-del');
      if (del) del.addEventListener('click', () => {
        if (!confirm('Delete ' + o.ref + '? There is no undo.')) return;
        Store.removeOrder(o.id); go('#/orders'); toast('Deleted.');
      });
    }
  });
})();
