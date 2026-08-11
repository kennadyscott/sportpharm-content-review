/* =============================================================================
   SportPharm HQ — reading a filled order form back in

   The team's half of this stays exactly as simple as the CEO asked for: fill
   the PDF, save it, email it to orders@. Nobody in sales signs into anything.

   This is the other half. Whoever is watching the orders mailbox drops that
   same emailed PDF onto the Orders page and the record appears, populated —
   so the order is tracked without anybody typing it a second time. The PDF
   stays the thing people touch; HQ just reads it.

   It is all done in the browser. The file never leaves the machine, which
   matters because HQ is a public static bundle and a real order carries a
   customer's name, address and email.

   The field names here are the field names in forms/build_order_form.py.
   That is the contract between the two, and the build script fails loudly if
   one of them goes missing.
============================================================================= */
window.HQ = window.HQ || {};
HQ.orderImport = (() => {
  'use strict';

  const LIB = 'vendor/pdf-lib.min.js';
  const LINE_ROWS = 5;      /* section B */
  const FREE_ROWS = 2;      /* section C */

  /* The PDF stores what fits in a PDF — a short export value. HQ stores the
     label it shows people. These two maps are the whole translation. */
  const PAY = {
    invoice: 'Invoice', card: 'Credit card', po: 'Purchase order',
    prepaid: 'Prepaid', nocharge: 'No charge'
  };
  const SHIP = {
    ground: 'Ground', '2day': '2-day', overnight: 'Overnight',
    freight: 'Freight', pickup: 'Customer pickup'
  };
  const SWAG = {
    hat: 'SportPharm hat', tee: 'SportPharm tee', stickers: 'Stickers',
    bottle: 'Water bottle', towel: 'Towel', samplepack: 'Sample pack'
  };

  /* ------------------------------------------------------------ the library
     pdf-lib is half a megabyte and only ever needed by whoever is doing the
     importing, so it is fetched on first use rather than on every page load
     for everyone. */
  let loading = null;
  function library() {
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = LIB;
      s.onload = () => window.PDFLib ? resolve(window.PDFLib)
        : reject(new Error('The PDF reader loaded but did not start.'));
      s.onerror = () => reject(new Error(
        'Could not load the PDF reader (' + LIB + '). If HQ was opened from a ' +
        'file rather than a web address, that is usually the cause.'));
      document.head.appendChild(s);
    });
    return loading;
  }

  /* --------------------------------------------------------------- reading */
  const clean = v => String(v == null ? '' : v).replace(/\r\n?/g, '\n').trim();

  /* "$1,234.50" and "1234.5" both mean the same thing to a person. */
  function num(v) {
    const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : 0;
  }

  /* Pull every field into a plain object. Minified pdf-lib mangles class
     names, so the type test has to be instanceof and never constructor.name. */
  async function readFields(file) {
    const PDFLib = await library();
    const { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup } = PDFLib;
    let doc;
    try {
      doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    } catch (e) {
      throw new Error('That file could not be opened as a PDF.');
    }
    let fields;
    try {
      fields = doc.getForm().getFields();
    } catch (e) {
      fields = [];
    }
    const out = {};
    fields.forEach(f => {
      const name = f.getName();
      try {
        if (f instanceof PDFTextField) out[name] = clean(f.getText());
        else if (f instanceof PDFCheckBox) out[name] = f.isChecked();
        else if (f instanceof PDFRadioGroup) out[name] = clean(f.getSelected());
      } catch (e) { /* a single unreadable field must not lose the rest */ }
    });
    return out;
  }

  /* --------------------------------------------------- fields -> a record */
  function toRecord(f) {
    const lines = [];
    for (let i = 1; i <= LINE_ROWS; i++) {
      const name = clean(f['line' + i + '_item']);
      if (!name) continue;
      lines.push({
        name,
        qty: num(f['line' + i + '_qty']) || 1,
        price: num(f['line' + i + '_unit']),
        note: ''
      });
    }

    const freebies = [];
    for (let i = 1; i <= FREE_ROWS; i++) {
      const name = clean(f['free' + i + '_item']);
      if (!name) continue;
      freebies.push({
        name,
        qty: num(f['free' + i + '_qty']) || 1,
        note: clean(f['free' + i + '_reason'])
      });
    }

    const swag = Object.keys(SWAG).filter(k => f['swag_' + k] === true).map(k => SWAG[k]);

    const rec = {
      org: clean(f.org),
      contactName: clean(f.contactName),
      contactEmail: clean(f.contactEmail),
      shipTo: clean(f.shipTo),
      notes: clean(f.notes),
      needBy: clean(f.needBy),
      lines, freebies, swag,
      approvedBy: clean(f.approvedBy),
      pay: PAY[f.pay] || 'Invoice',
      ship: SHIP[f.ship] || 'Ground',
      shipCost: num(f.shipCost),
      poNumber: clean(f.poNumber),
      /* Kept as written on the paper. `raisedBy` on the record is a user id,
         so the name off the form cannot go there without breaking it. */
      invoiceEmail: clean(f.invoiceEmail),
      raisedByName: clean(f.raisedBy),
      submittedBy: clean(f.submittedBy),
      submittedDate: clean(f.submittedDate),
      paperRef: clean(f.ref),
      paperDate: clean(f.orderDate),
      importedAt: new Date().toISOString()
    };
    return rec;
  }

  /* ------------------------------------------------------------- the checks
     Everything here is something that actually went wrong on a real order.
     None of it blocks the import — the record is still better than an email —
     but it all gets said out loud before anyone acts on it. */
  function check(f, rec) {
    const w = [];
    const money = n => '$' + (Number(n) || 0).toFixed(2);

    if (!rec.lines.length && !rec.freebies.length) {
      w.push('Nothing is listed under "what are they ordering". The form may be ' +
             'blank, or it may have been filled in a viewer that did not save the values.');
    }
    if (!rec.org && !rec.contactName) w.push('No organisation and no contact name.');
    if (!rec.shipTo) w.push('No shipping address.');

    if (rec.freebies.length && !rec.approvedBy) {
      w.push('Something is going out free of charge with nobody named as having ' +
             'approved it. That is the line that gets queried later.');
    }

    /* The Oklahoma State mistake, caught before it reaches invoicing: the
       typed total and the lines disagreeing means somebody was charged for
       the wrong thing, in one direction or the other. */
    const goods = rec.lines.reduce((n, l) => n + l.price * l.qty, 0);
    const typedGoods = num(f.totalGoods);
    const typedTotal = num(f.totalDue);
    const off = (a, b) => Math.abs(a - b) > 0.005;

    if (typedGoods && off(typedGoods, goods)) {
      w.push('The goods total on the form says ' + money(typedGoods) +
             ' but the lines add up to ' + money(goods) + '.');
    }
    if (typedTotal && off(typedTotal, goods + rec.shipCost)) {
      w.push('The total on the form says ' + money(typedTotal) +
             ' but the lines plus shipping come to ' + money(goods + rec.shipCost) + '.');
    }
    if (rec.pay === 'Invoice' && !rec.invoiceEmail) {
      w.push('It is marked to be invoiced but there is no address to send the invoice to.');
    }
    if (rec.poNumber && rec.pay !== 'Purchase order') {
      w.push('There is a PO number but the payment method is "' + rec.pay + '".');
    }
    /* Written in the free list and ticked as SWAG is one item entered twice.
       Nothing can tell which was meant, and left alone it takes double the
       stock off the shelf. */
    const swag = rec.swag.map(s => s.trim().toLowerCase());
    const twice = rec.freebies.filter(f => swag.includes(f.name.trim().toLowerCase()));
    twice.forEach(f => w.push(
      f.name + ' is both a free item and a ticked SWAG box. If that is one ' +
      f.name.toLowerCase() + ' rather than two, take it off one of them — ' +
      'as it stands the inventory count sees two.'));
    return w;
  }

  /* A second copy of the same order is the likeliest mistake here — the same
     PDF forwarded twice, or dropped twice by two people. */
  function duplicateOf(rec) {
    const same = s => String(s || '').trim().toLowerCase();
    return (Store.orders() || []).find(o =>
      same(o.org) === same(rec.org) &&
      same(o.contactEmail) === same(rec.contactEmail) &&
      (o.lines || []).length === rec.lines.length &&
      Math.abs(Store.orderTotal(o) -
        (rec.lines.reduce((n, l) => n + l.price * l.qty, 0) + rec.shipCost)) < 0.005
    ) || null;
  }

  /* Read a file and say what is in it, without writing anything. */
  async function inspect(file) {
    const fields = await readFields(file);
    if (!Object.keys(fields).length) {
      throw new Error(
        'That PDF has no form fields in it. It may be a scan or a printout ' +
        'rather than the fillable order form.');
    }
    if (!('org' in fields) || !('line1_item' in fields)) {
      throw new Error(
        'That is a fillable PDF, but not the SportPharm order form — the ' +
        'fields it needs are not in it.');
    }
    const rec = toRecord(fields);
    return { fields, record: rec, warnings: check(fields, rec), duplicate: duplicateOf(rec) };
  }

  return { inspect, library, PAY, SHIP, SWAG };
})();
