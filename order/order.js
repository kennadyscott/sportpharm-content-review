/* =============================================================================
   SportPharm — standalone order form

   One page, one job. Julia or Marissa fills it, presses Create, and gets an
   order reference and a branded PDF. No sign-in, no rail, no back office.

   It shares HQ's store rather than keeping its own, so an order raised here is
   the same record HQ's Orders, Inventory and Money pages read. That is the
   whole reason this is not a separate little app with its own database: two
   stores would need syncing, and syncing is where the numbers start to differ.

   Because there is no sign-in, `Store.currentUser()` is null here and the
   record's `raisedBy` (a user id) stays empty. Whoever is filling it types
   their name instead, which is kept as `raisedByName` — the same field the PDF
   importer uses for a form filled on paper.
============================================================================= */
(() => {
  'use strict';

  const app = document.getElementById('app');
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const money = n => '$' + (Number(n) || 0).toFixed(2);

  let toastTimer = null;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
  }

  /* ------------------------------------------------------------ the draft */
  const blank = () => ({
    raisedByName: '', org: '', contactName: '', contactEmail: '', shipTo: '',
    qty: {}, freeQty: {}, approvedBy: '', swag: [],
    pay: 'Invoice', ship: 'Ground', shipCost: '', needBy: '',
    poNumber: '', invoiceEmail: '', notes: ''
  });

  let d = blank();
  let mode = 'form';       /* form | done */
  let madeId = null;       /* the record, once created — Edit comes back here */

  const totals = () => {
    const goods = Object.keys(d.qty).reduce((n, sku) => {
      const c = Store.bySku(sku);
      return n + (c ? c.price * d.qty[sku] : 0);
    }, 0);
    const ship = Number(d.shipCost) || 0;
    return { goods, ship, total: goods + ship };
  };
  const freeCount = () => Object.values(d.freeQty).reduce((n, q) => n + q, 0);

  /* Reading an existing record back into the draft is what makes "tweak"
     work: Create, look at it, go back, change it, Create again — the same
     record is updated rather than a second one raised. */
  function loadFrom(o) {
    d = blank();
    ['org', 'contactName', 'contactEmail', 'shipTo', 'approvedBy', 'pay', 'ship',
     'needBy', 'poNumber', 'invoiceEmail', 'notes', 'raisedByName'].forEach(k => {
      if (o[k] != null) d[k] = o[k];
    });
    d.shipCost = o.shipCost || '';
    d.swag = (o.swag || []).slice();
    (o.lines || []).forEach(l => {
      const sku = Store.skuFor(l.name);
      if (sku) d.qty[sku] = (d.qty[sku] || 0) + (Number(l.qty) || 1);
    });
    (o.freebies || []).forEach(f => {
      const sku = Store.skuFor(f.name);
      if (sku) d.freeQty[sku] = (d.freeQty[sku] || 0) + (Number(f.qty) || 1);
    });
  }

  /* ------------------------------------------------------------- the form */
  function stepper(c, bag) {
    const key = bag === 'qty' ? 'qty' : 'freeQty';
    const n = d[key][c.sku] || 0;
    return `<div class="pick ${n ? 'on' : ''} ${key === 'freeQty' ? 'free' : ''}">
      <button class="pick-body" data-bump="${esc(c.sku)}:${key}:1">
        <b>${esc(c.name)}</b>
        <span>${c.price ? money(c.price) : 'no charge'}${c.note ? ' · ' + esc(c.note) : ''}</span>
      </button>
      <div class="pick-n">
        <button class="pm" data-bump="${esc(c.sku)}:${key}:-1" ${n ? '' : 'disabled'}
                aria-label="One fewer">−</button>
        <em>${n}</em>
        <button class="pm" data-bump="${esc(c.sku)}:${key}:1" aria-label="One more">+</button>
      </div>
    </div>`;
  }

  const fld = (key, label, ph, type) => `
    <div class="field"><label for="f-${key}">${label}</label>
      <input id="f-${key}" type="${type || 'text'}" value="${esc(d[key] || '')}"
             placeholder="${esc(ph || '')}" data-f="${key}"></div>`;

  function formView() {
    const t = totals();
    const sellable = Store.catalog().filter(c => c.kind !== 'swag');
    const swag = Store.catalog().filter(c => c.kind === 'swag');
    const free = freeCount();

    return `<div class="page-head">
      <h1>${madeId ? 'Change this order' : 'Raise an order'}</h1>
      <p class="sub">${madeId
        ? 'Change whatever needs changing and save it again — it stays the same order.'
        : 'Four things: who it is for, what they want, what is free, how they are paying. ' +
          'It goes on record the moment you create it.'}</p>
    </div>

    <div class="grid">
      <div class="main">
        <section class="card">
          <h2><i>1</i>Who it is for</h2>
          <div class="fields">
            ${fld('org', 'Organisation / team', 'Oklahoma State Athletics')}
            ${fld('contactName', 'Contact name', 'Kevin Blaske')}
            ${fld('contactEmail', 'Contact email', 'name@school.edu', 'email')}
            ${fld('needBy', 'Needed by', 'ASAP')}
          </div>
          <div class="field"><label for="f-shipTo">Shipping address</label>
            <textarea id="f-shipTo" rows="3" data-f="shipTo"
              placeholder="170 Athletic Center&#10;Stillwater, OK 74078">${esc(d.shipTo)}</textarea></div>
        </section>

        <section class="card">
          <h2><i>2</i>What they are ordering</h2>
          <div class="picks">${sellable.map(c => stepper(c, 'qty')).join('')}</div>
        </section>

        <section class="card">
          <h2><i>3</i>Anything free of charge</h2>
          <p class="hint">Same catalogue, no price. It still comes off the shelf, so it has to
             be said here — and say who approved it.</p>
          <div class="picks">${sellable.map(c => stepper(c, 'freeQty')).join('')}</div>
          ${free ? `<div class="field"><label for="f-approvedBy">Approved by</label>
            <input id="f-approvedBy" value="${esc(d.approvedBy)}" data-f="approvedBy"
                   placeholder="Brandon"></div>` : ''}
        </section>

        <section class="card">
          <h2><i>4</i>SWAG in the box</h2>
          <div class="chips">
            ${swag.map(c => `<button class="chip ${d.swag.includes(c.name) ? 'on' : ''}"
              data-swag="${esc(c.name)}">${esc(c.name)}</button>`).join('')}
          </div>
        </section>

        <section class="card">
          <h2><i>5</i>Paying and shipping</h2>
          <div class="fields">
            <div class="field"><label for="f-pay">How they are paying</label>
              <select id="f-pay" data-f="pay">
                ${PAY_METHODS.map(m => `<option ${d.pay === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}
              </select></div>
            <div class="field"><label for="f-ship">How it ships</label>
              <select id="f-ship" data-f="ship">
                ${SHIP_METHODS.map(m => `<option ${d.ship === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}
              </select></div>
            ${fld('shipCost', 'Shipping charged', '10.00', 'number')}
            ${d.pay === 'Purchase order' ? fld('poNumber', 'PO number', '') : ''}
            ${d.pay === 'Invoice' ? fld('invoiceEmail', 'Send the invoice to', 'name@company.com', 'email') : ''}
          </div>
          <div class="field"><label for="f-notes">Anything else Enova or invoicing should know</label>
            <textarea id="f-notes" rows="2" data-f="notes">${esc(d.notes)}</textarea></div>
        </section>
      </div>

      <aside class="side">
        <section class="card">
          <h2>What it comes to</h2>
          <div class="row"><span>Goods</span><b id="t-goods">${money(t.goods)}</b></div>
          <div class="row"><span>Shipping</span><b id="t-ship">${money(t.ship)}</b></div>
          <div class="row big"><span>Total</span><b id="t-all">${money(t.total)}</b></div>
          ${free || d.swag.length ? `<p class="side-note">Plus ${free ? free + ' free item' + (free === 1 ? '' : 's') : ''}${
            free && d.swag.length ? ' and ' : ''}${d.swag.length ? d.swag.length + ' SWAG' : ''} —
            no price, but they still come off the shelf.</p>` : ''}
          <div class="field"><label for="f-raisedByName">Your name</label>
            <input id="f-raisedByName" value="${esc(d.raisedByName)}" data-f="raisedByName"
                   placeholder="Julia"></div>
          <button class="btn btn-red" id="create">${madeId ? 'Save the changes' : 'Create the order'}</button>
          <button class="btn btn-ghost" id="clear">${madeId ? 'Leave it as it was' : 'Start again'}</button>
        </section>
      </aside>
    </div>`;
  }

  /* ------------------------------------------------------------ once made */
  function doneView() {
    const o = Store.order(madeId);
    if (!o) { mode = 'form'; madeId = null; return formView(); }
    const m = Store.moneyOf(o);

    return `<div class="page-head">
      <div class="done-mark">✓</div>
      <h1>${esc(o.ref)} is on record</h1>
      <p class="sub">Nothing has been sent to Enova yet — it is a draft until somebody sends it.
         Download the form to attach to an email, or leave it and it will be picked up in HQ.</p>
    </div>

    <div class="grid">
      <div class="main">
        <section class="card">
          <h2>${esc(o.org || o.contactName || 'The order')}</h2>
          <p class="hint">${esc([o.contactName, o.contactEmail].filter(Boolean).join(' · '))}</p>
          <div class="summary">
            ${(o.lines || []).map(l => `<div class="line">
              <span>${l.qty} × ${esc(l.name)}</span>
              <b>${money((Number(l.price) || 0) * (Number(l.qty) || 0))}</b></div>`).join('')}
            ${(o.freebies || []).map(f => `<div class="line free">
              <span>${f.qty} × ${esc(f.name)}</span><b>$0.00</b></div>`).join('')}
            ${(o.swag || []).map(s => `<div class="line free">
              <span>1 × ${esc(s)}</span><b>$0.00</b></div>`).join('')}
            <div class="line"><span>Shipping — ${esc(o.ship)}</span><b>${money(o.shipCost)}</b></div>
            <div class="row big"><span>Total</span><b>${money(Store.orderTotal(o))}</b></div>
          </div>
          ${(o.freebies || []).length && !o.approvedBy ? `<div class="note warn">
            Something is going out free of charge with nobody named as having approved it.
            That is the line that gets queried later.</div>` : ''}
        </section>
      </div>

      <aside class="side">
        <section class="card">
          <h2>The paper</h2>
          <p class="side-note">The same one-page form, filled in from this order and branded.
             The invoice is a separate document for whoever bills it.</p>
          <div class="btn-row">
            <button class="btn btn-dark" id="pdf">Order form PDF</button>
          </div>
          <div class="btn-row">
            <button class="btn btn-outline" id="invoice">Invoice PDF</button>
          </div>
          ${m.invoiceNo ? `<p class="side-note">Invoice ${esc(m.invoiceNo)} raised against it.</p>` : ''}
        </section>

        <section class="card">
          <h2>Something not right?</h2>
          <button class="btn btn-outline" id="edit">Change this order</button>
          <button class="btn btn-ghost" id="another">Raise another one</button>
        </section>
      </aside>
    </div>`;
  }

  /* -------------------------------------------------------------- wiring */
  function readFields() {
    app.querySelectorAll('[data-f]').forEach(el => { d[el.dataset.f] = el.value; });
  }

  function buildRecord() {
    const lines = Object.keys(d.qty).map(sku => {
      const c = Store.bySku(sku);
      return { name: c.name, qty: d.qty[sku], price: c.price, note: c.note || '' };
    });
    const freebies = Object.keys(d.freeQty).map(sku => {
      const c = Store.bySku(sku);
      return { name: c.name, qty: d.freeQty[sku], note: '' };
    });
    return {
      fields: {
        org: d.org, contactName: d.contactName, contactEmail: d.contactEmail,
        shipTo: d.shipTo, needBy: d.needBy, lines, freebies, swag: d.swag,
        approvedBy: d.approvedBy, pay: d.pay, ship: d.ship,
        shipCost: Number(d.shipCost) || 0, poNumber: d.poNumber,
        invoiceEmail: d.invoiceEmail, notes: d.notes, raisedByName: d.raisedByName
      },
      lines, freebies
    };
  }

  async function makePdf(btn, fn, what) {
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Building…';
    try {
      const res = await fn();
      if (res.warnings.length) alert(what + ' built, but read this first:\n\n· ' + res.warnings.join('\n· '));
      else toast(res.filename + ' downloaded.');
    } catch (e) {
      alert('Could not build the ' + what.toLowerCase() + '.\n\n' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  }

  function wire() {
    if (mode === 'form') {
      app.querySelectorAll('[data-bump]').forEach(b => b.addEventListener('click', () => {
        const [sku, bag, by] = b.dataset.bump.split(':');
        readFields();
        d[bag][sku] = Math.max(0, (d[bag][sku] || 0) + Number(by));
        if (!d[bag][sku]) delete d[bag][sku];
        render();
      }));
      app.querySelectorAll('[data-swag]').forEach(b => b.addEventListener('click', () => {
        readFields();
        const x = b.dataset.swag;
        d.swag = d.swag.includes(x) ? d.swag.filter(s => s !== x) : d.swag.concat([x]);
        render();
      }));
      app.querySelectorAll('[data-f]').forEach(el => el.addEventListener('change', () => {
        d[el.dataset.f] = el.value;
        if (el.dataset.f === 'pay') render();     /* changes which fields exist */
      }));

      /* Shipping moves the total, so it updates in place rather than waiting
         for a re-render that would steal focus from the next field. */
      const shipIn = app.querySelector('#f-shipCost');
      if (shipIn) shipIn.addEventListener('input', () => {
        d.shipCost = shipIn.value;
        const t = totals();
        app.querySelector('#t-ship').textContent = money(t.ship);
        app.querySelector('#t-all').textContent = money(t.total);
      });

      app.querySelector('#clear').addEventListener('click', () => {
        if (madeId) { mode = 'done'; return render(); }
        d = blank();
        render();
      });

      app.querySelector('#create').addEventListener('click', () => {
        readFields();
        const { fields, lines, freebies } = buildRecord();
        if (!lines.length && !freebies.length) return toast('Nothing on the order yet.');
        if (!fields.org.trim() && !fields.contactName.trim()) return toast('Who is it for?');
        if (!fields.shipTo.trim()) return toast('It needs a shipping address.');
        if (freebies.length && !fields.approvedBy.trim()) {
          return toast('Say who approved the free items.');
        }
        if (madeId) {
          Store.updateOrder(madeId, fields);
          toast('Saved.');
        } else {
          madeId = Store.addOrder(fields).id;
          toast(Store.order(madeId).ref + ' raised.');
        }
        mode = 'done';
        render();
        window.scrollTo(0, 0);
      });
      return;
    }

    app.querySelector('#pdf').addEventListener('click', e =>
      makePdf(e.currentTarget, () => HQ.pdf.orderForm(Store.order(madeId)), 'The order form'));

    app.querySelector('#invoice').addEventListener('click', e => {
      /* An invoice needs a number, and the number is the thing finance asks
         for — so raise it here rather than producing an unnumbered document. */
      const r = Store.raiseInvoice(madeId);
      if (!r.ok) return toast(r.error);
      makePdf(e.currentTarget, () => HQ.pdf.invoice(Store.order(madeId)), 'The invoice')
        .then(render);
    });

    app.querySelector('#edit').addEventListener('click', () => {
      loadFrom(Store.order(madeId));
      mode = 'form';
      render();
      window.scrollTo(0, 0);
    });

    app.querySelector('#another').addEventListener('click', () => {
      d = blank();
      madeId = null;
      mode = 'form';
      render();
      window.scrollTo(0, 0);
    });
  }

  function render() {
    app.innerHTML = mode === 'done' ? doneView() : formView();
    wire();
  }

  render();
})();
