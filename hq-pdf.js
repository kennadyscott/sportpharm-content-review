/* =============================================================================
   SportPharm HQ — making the paper

   Two documents come out of one order record: the order form Enova picks and
   packs from, and the invoice the customer pays against. Both are produced by
   filling a template that was designed in forms/, not by drawing a layout in
   JavaScript. That is deliberate — it means the branding lives in one place,
   the document can be looked at on its own, and nothing here has an opinion
   about where the logo goes.

   It is the same trick as the import, run backwards, against the same field
   names. HQ reads a filled form into a record; HQ writes a record back into a
   form. If those names drift, both directions break together and loudly.
============================================================================= */
window.HQ = window.HQ || {};
HQ.pdf = (() => {
  'use strict';

  const ORDER_TPL = 'forms/SportPharm-Order-Form.pdf';
  const INVOICE_TPL = 'forms/SportPharm-Invoice.pdf';
  const ORDER_LINES = 5;      /* section B of the paper form */
  const ORDER_FREE = 2;       /* section C */
  const INVOICE_LINES = 12;

  const PAY_VALUE = {
    'Invoice': 'invoice', 'Credit card': 'card', 'Purchase order': 'po',
    'Prepaid': 'prepaid', 'No charge': 'nocharge'
  };
  const SHIP_VALUE = {
    'Ground': 'ground', '2-day': '2day', 'Overnight': 'overnight',
    'Freight': 'freight', 'Customer pickup': 'pickup'
  };
  const SWAG_FIELD = {
    'SportPharm hat': 'swag_hat', 'SportPharm tee': 'swag_tee',
    'Stickers': 'swag_stickers', 'Water bottle': 'swag_bottle',
    'Towel': 'swag_towel', 'Sample pack': 'swag_samplepack'
  };

  const money = n => (Number(n) || 0).toFixed(2);
  const date = d => d ? new Date(d).toLocaleDateString(undefined,
    { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  const goodsOf = o => (o.lines || []).reduce((n, l) =>
    n + (Number(l.price) || 0) * (Number(l.qty) || 0), 0);

  async function template(url) {
    const lib = await HQ.orderImport.library();     /* same pdf-lib, already lazy */
    const res = await fetch(url + '?v=' + Date.now());
    if (!res.ok) throw new Error('Could not load the template at ' + url + '.');
    return { lib, doc: await lib.PDFDocument.load(await res.arrayBuffer()) };
  }

  /* Set a field only if the template has it. A template that has moved on
     should not take the whole document down over one renamed box — but it
     should say so, which is what `missing` is for. */
  function writer(form, lib, missing) {
    return {
      text(name, value) {
        if (value == null || value === '') return;
        try { form.getTextField(name).setText(String(value)); }
        catch (e) { missing.push(name); }
      },
      check(name) {
        try { form.getCheckBox(name).check(); } catch (e) { missing.push(name); }
      },
      pick(name, value) {
        if (!value) return;
        try { form.getRadioGroup(name).select(value); } catch (e) { missing.push(name); }
      }
    };
  }

  function download(bytes, filename) {
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    /* Revoked late: Safari has been known to cancel the download if the URL
       dies in the same tick as the click. */
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /* ---------------------------------------------------------- order form */
  async function orderForm(o, { save = true } = {}) {
    const { lib, doc } = await template(ORDER_TPL);
    const form = doc.getForm();
    const missing = [];
    const w = writer(form, lib, missing);
    const notes = [];

    w.text('ref', o.ref);
    w.text('orderDate', date(o.createdAt));
    w.text('raisedBy', (Store.user(o.raisedBy) || {}).name || o.raisedByName || '');
    w.text('needBy', o.needBy);
    w.text('org', o.org);
    w.text('contactName', o.contactName);
    w.text('contactEmail', o.contactEmail);
    w.text('shipTo', o.shipTo);
    w.text('notes', o.notes);

    /* The paper form has five line rows and two free rows. More than that is
       not silently dropped — it goes in the notes box AND comes back as a
       warning, because a picking sheet missing a line is how the wrong box
       gets shipped. */
    const lines = o.lines || [];
    lines.slice(0, ORDER_LINES).forEach((l, i) => {
      const n = i + 1;
      w.text(`line${n}_qty`, l.qty);
      w.text(`line${n}_item`, l.name);
      w.text(`line${n}_unit`, money(l.price));
      w.text(`line${n}_amount`, money((Number(l.price) || 0) * (Number(l.qty) || 0)));
    });
    if (lines.length > ORDER_LINES) {
      notes.push(`${lines.length - ORDER_LINES} more line(s) than the form holds: ` +
        lines.slice(ORDER_LINES).map(l => `${l.qty} × ${l.name}`).join('; '));
    }

    const free = o.freebies || [];
    free.slice(0, ORDER_FREE).forEach((f, i) => {
      const n = i + 1;
      w.text(`free${n}_qty`, f.qty);
      w.text(`free${n}_item`, f.name);
      w.text(`free${n}_reason`, f.note || '');
    });
    if (free.length > ORDER_FREE) {
      notes.push(`${free.length - ORDER_FREE} more free item(s): ` +
        free.slice(ORDER_FREE).map(f => `${f.qty} × ${f.name}`).join('; '));
    }
    w.text('approvedBy', o.approvedBy);

    (o.swag || []).forEach(s => {
      const field = SWAG_FIELD[s];
      if (field) w.check(field);
      else notes.push('SWAG with no box on the form: ' + s);
    });

    w.pick('pay', PAY_VALUE[o.pay]);
    w.pick('ship', SHIP_VALUE[o.ship]);
    w.text('poNumber', o.poNumber);
    w.text('invoiceEmail', o.invoiceEmail || '');
    w.text('totalGoods', money(goodsOf(o)));
    w.text('shipCost', money(o.shipCost));
    w.text('totalDue', money(Store.orderTotal(o)));
    w.text('submittedBy', (Store.user(o.raisedBy) || {}).name || o.submittedBy || '');
    w.text('submittedDate', date(new Date().toISOString()));

    if (notes.length) {
      const field = form.getTextField('notes');
      const had = o.notes ? o.notes + '\n' : '';
      field.setText(had + notes.join('\n'));
    }

    /* Left fillable on purpose — this one goes to Enova and Julia may still
       want to correct a line before it does. */
    const bytes = await doc.save();
    const filename = `${o.ref || 'order'}-order-form.pdf`;
    if (save) download(bytes, filename);
    return { bytes, filename, warnings: notes, missing };
  }

  /* ------------------------------------------------------------- invoice */
  async function invoice(o, { save = true } = {}) {
    const m = Store.moneyOf(o);
    const { lib, doc } = await template(INVOICE_TPL);
    const form = doc.getForm();
    const missing = [];
    const w = writer(form, lib, missing);
    const notes = [];

    w.text('invoiceNo', m.invoiceNo || '');
    w.text('invoiceDate', date(m.raisedAt || new Date().toISOString()));
    w.text('terms', m.terms || REMIT_TO.terms);
    w.text('orderRef', [o.ref, o.poNumber && 'PO ' + o.poNumber].filter(Boolean).join('  ·  '));

    /* Due date derived from the terms rather than typed, so "Net 30" and the
       date on the page cannot disagree. Anything that is not Net <n> leaves
       the box empty instead of inventing a deadline. */
    const net = /net\s*(\d+)/i.exec(m.terms || '');
    if (net) {
      const from = new Date(m.raisedAt || Date.now());
      from.setDate(from.getDate() + Number(net[1]));
      w.text('dueDate', date(from.toISOString()));
    }

    const billTo = [o.org, o.contactName, o.contactEmail].filter(Boolean).join('\n');
    w.text('billTo', o.invoiceEmail ? billTo + '\n' + o.invoiceEmail : billTo);
    w.text('shipTo', o.shipTo);

    /* Free items and SWAG are listed at zero rather than left off. The
       customer is receiving them and the packing slip shows them; an invoice
       that disagrees with the box is the one that generates a phone call. */
    const rows = (o.lines || []).map(l => ({
      qty: l.qty, item: l.name,
      unit: money(l.price),
      amount: money((Number(l.price) || 0) * (Number(l.qty) || 0))
    })).concat(
      (o.freebies || []).map(f => ({
        qty: f.qty, item: f.name + '  —  no charge' + (o.approvedBy ? ', approved by ' + o.approvedBy : ''),
        unit: '0.00', amount: '0.00'
      })),
      (o.swag || []).map(s => ({ qty: 1, item: s + '  —  included', unit: '0.00', amount: '0.00' }))
    );

    rows.slice(0, INVOICE_LINES).forEach((r, i) => {
      const n = i + 1;
      w.text(`line${n}_qty`, r.qty);
      w.text(`line${n}_item`, r.item);
      w.text(`line${n}_unit`, r.unit);
      w.text(`line${n}_amount`, r.amount);
    });
    if (rows.length > INVOICE_LINES) {
      notes.push(`${rows.length - INVOICE_LINES} line(s) did not fit on this invoice.`);
    }

    const total = Store.orderTotal(o);
    const paid = Number(m.amountPaid) || 0;
    w.text('subtotal', money(goodsOf(o)));
    w.text('shipping', money(o.shipCost));
    w.text('paid', money(paid));
    w.text('amountDue', money(Math.max(0, total - paid)));
    w.text('notes', [o.notes, m.note].filter(Boolean).join('\n'));
    w.text('remitTo', [REMIT_TO.name].concat(REMIT_TO.lines).join('\n'));

    /* Flattened, unlike the order form. This one leaves the building as a
       final statement of what is owed, and a customer being able to retype
       the amount due is not a feature. */
    try { form.flatten(); } catch (e) { notes.push('Could not flatten: ' + e.message); }

    const bytes = await doc.save();
    const filename = `${m.invoiceNo || o.ref || 'invoice'}.pdf`;
    if (save) download(bytes, filename);
    return { bytes, filename, warnings: notes, missing };
  }

  return { orderForm, invoice };
})();
