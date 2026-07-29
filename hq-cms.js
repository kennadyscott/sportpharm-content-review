/* =============================================================================
   SportPharm HQ — the CMS

   Articles (#/content, #/content/<id>) and the media library (#/media).

   The field model is ported from the admin.html prototype on the website —
   title, slug, excerpt, markdown-lite body, category, tags, author, featured
   image — with the three things it didn't have: a review loop, scheduling, and
   a publish feed the public site can actually read.
============================================================================= */
(() => {
  'use strict';
  const { esc, svg, avatar, ago, dueLabel, toast, copy, go } = HQ;

  const stOf = a => ARTICLE_STATES[a.status] || ARTICLE_STATES.draft;
  const fmtDate = d => d ? new Date(d.length > 10 ? d : d + 'T12:00:00')
    .toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  function pill(a) {
    const s = stOf(a);
    return `<span class="a-pill t-${s.tone === 'muted' ? 'navy' : s.tone} ${s.tone === 'muted' ? 'muted' : ''}">${esc(s.label)}</span>`;
  }

  /* --------------------------- markdown-lite ---------------------------- */
  /* Same subset the prototype documented: ## headings, - lists, blank-line
     paragraphs. Deliberately small — the body is written by humans in a hurry. */
  function mdLite(src) {
    const blocks = String(src || '').split(/\n{2,}/);
    return blocks.map(b => {
      const lines = b.split('\n').filter(l => l.trim());
      if (!lines.length) return '';
      if (/^###\s/.test(lines[0])) return `<h4>${esc(lines[0].replace(/^###\s*/, ''))}</h4>`;
      if (/^##\s/.test(lines[0]))  return `<h3>${esc(lines[0].replace(/^##\s*/, ''))}</h3>`;
      if (/^#\s/.test(lines[0]))   return `<h2>${esc(lines[0].replace(/^#\s*/, ''))}</h2>`;
      if (lines.every(l => /^[-*]\s/.test(l.trim()))) {
        return `<ul class="md-list">${lines.map(l => `<li>${esc(l.trim().replace(/^[-*]\s*/, ''))}</li>`).join('')}</ul>`;
      }
      return `<p>${esc(lines.join(' '))}</p>`;
    }).join('');
  }
  const readMins = body => Math.max(1, Math.round(String(body || '').split(/\s+/).filter(Boolean).length / 220));

  /* =========================== ARTICLES INDEX =========================== */
  let filter = { status: 'all', q: '', cat: 'all', series: 'all' };

  const TABS = [
    ['all', 'Everything'], ['review', 'Waiting on review'], ['changes', 'Needs changes'],
    ['draft', 'Drafts'], ['approved', 'Approved'], ['scheduled', 'Scheduled'], ['published', 'Live']
  ];

  function matches(a) {
    if (filter.status !== 'all' && a.status !== filter.status) return false;
    if (filter.cat !== 'all' && a.category !== filter.cat) return false;
    if (filter.series !== 'all' && (a.series || '') !== filter.series) return false;
    if (filter.q) {
      const hay = (a.title + ' ' + a.excerpt + ' ' + a.author + ' ' + (a.tags || []).join(' ')).toLowerCase();
      if (!hay.includes(filter.q)) return false;
    }
    return true;
  }

  function articlesIndex() {
    const s = Store.articleStats();
    const me = Store.currentUser();
    const list = Store.articles().filter(matches)
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

    /* the pipeline strip — where everything currently sits, in flow order */
    const flow = ARTICLE_FLOW.map(k => ({ k, n: k === 'draft' ? s.draft + s.changes : s[k], st: ARTICLE_STATES[k] }));

    const mine = Store.articles().filter(a => a.status === 'review' && Store.canApprove(a));

    return `<div class="wrap">
      <div class="page-head">
        <div><h1>Articles</h1>
          <p>Everything SportPharm publishes, from a first draft to a live page. Nothing reaches the site
             without someone other than the writer clearing it.</p></div>
        <div class="page-actions">
          ${Store.can('edit') ? `<button class="btn btn-dark" id="new-article">${svg('plus')}New article</button>` : ''}
        </div>
      </div>

      <div class="pipeline">
        ${flow.map((f, i) => `
          <button class="pipe ${filter.status === f.k ? 'on' : ''}" data-pipe="${f.k}">
            <b>${f.n}</b><span>${esc(f.st.label)}</span>
          </button>
          ${i < flow.length - 1 ? `<i class="pipe-arrow">${svg('right')}</i>` : ''}`).join('')}
      </div>

      ${mine.length ? `<section class="panel cms-callout t-amber">
        <div class="panel-head"><h2>Waiting on you</h2>
          <span class="note">${mine.length} piece${mine.length === 1 ? '' : 's'} you can sign off</span></div>
        ${mine.map(a => `<button class="row t-amber" data-open="${a.id}">
          <i class="row-dot"></i>
          <span class="row-body">
            <span class="row-title">${esc(a.title)}</span>
            <span class="row-meta">${esc(a.author)} · ${esc(a.category)} · ${Store.openChecks(a).length} check${Store.openChecks(a).length === 1 ? '' : 's'} outstanding</span>
          </span>
          <span class="row-side">${svg('arrow')}</span>
        </button>`).join('')}
      </section>` : ''}

      <div class="toolbar">
        <div class="chipbar">
          ${TABS.map(([k, l]) => `<button class="chip ${filter.status === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}
        </div>
        <div class="tb-tools">
          <select id="cat-filter" aria-label="Category">
            <option value="all">All categories</option>
            ${ARTICLE_CATS.map(c => `<option value="${esc(c)}" ${filter.cat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
          </select>
          <select id="series-filter" aria-label="Series">
            <option value="all">All series</option>
            ${ARTICLE_SERIES.map(x => `<option value="${x.id}" ${filter.series === x.id ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}
            <option value="" ${filter.series === '' ? 'selected' : ''}>Not in a series</option>
          </select>
          <input id="a-q" type="search" placeholder="Search articles…" value="${esc(filter.q)}" aria-label="Search articles">
        </div>
      </div>

      <div class="a-table-wrap">
        <table class="a-table">
          <thead><tr>
            <th>Article</th><th>Category</th><th>Status</th><th>Date</th><th>Notes</th><th></th>
          </tr></thead>
          <tbody>
          ${list.length ? list.map(a => {
            const nc = Store.noteCount(a);
            const open = Store.openChecks(a).length;
            return `<tr data-open="${a.id}">
              <td>
                <div class="a-cell">
                  <span class="a-thumb">${a.image
                    ? `<img src="${esc(a.image)}" alt="" loading="lazy" onerror="this.remove()">`
                    : ''}</span>
                  <span>
                    <span class="a-title">${esc(a.title)}</span>
                    <span class="a-sub">${esc(a.author)} · /${esc(a.slug)} · ${readMins(a.body)} min${
                      a.series ? ' · <b class="a-series">' + esc((ARTICLE_SERIES.find(x => x.id === a.series) || {}).label || a.series) + '</b>' : ''}</span>
                  </span>
                </div>
              </td>
              <td><span class="a-cat">${esc(a.category)}</span></td>
              <td>${pill(a)}${open && a.status !== 'published' ? `<span class="a-open" title="${open} guardrail${open === 1 ? '' : 's'} unchecked">${open}</span>` : ''}</td>
              <td class="a-date">${a.status === 'scheduled' ? '→ ' + fmtDate(a.scheduledFor) : fmtDate(a.publishedAt || a.date)}</td>
              <td class="a-notes">${nc ? nc : '<span class="dash">—</span>'}</td>
              <td class="a-acts">${svg('right')}</td>
            </tr>`;
          }).join('') : `<tr><td colspan="6"><p class="panel-empty">Nothing matches that.
            ${Store.can('edit') ? '<button class="linky" id="empty-new">Start one</button>' : ''}</p></td></tr>`}
          </tbody>
        </table>
      </div>

      <section class="panel" style="margin-top:1.2rem">
        <div class="panel-head"><h2>The published feed</h2>
          <span class="note">what sportpharm.com would fetch</span></div>
        <p class="rem-sub">${s.published} live article${s.published === 1 ? '' : 's'}. This is the exact shape
          <code>articles.html</code> reads once it points at Supabase — until it does, publishing means
          published <em>in here</em>.</p>
        <div class="feed-acts">
          <button class="btn btn-outline btn-sm" id="feed-copy">${svg('copy')}Copy the feed as JSON</button>
          <button class="btn btn-ghost btn-sm" id="feed-peek">Show it</button>
        </div>
        <pre class="feed-peek" id="feed-out" hidden></pre>
      </section>
    </div>`;
  }

  function wireIndex(root) {
    root.querySelectorAll('[data-tab]').forEach(b =>
      b.addEventListener('click', () => { filter.status = b.dataset.tab; HQ.render(); }));
    root.querySelectorAll('[data-pipe]').forEach(b =>
      b.addEventListener('click', () => {
        filter.status = filter.status === b.dataset.pipe ? 'all' : b.dataset.pipe;
        HQ.render();
      }));
    root.querySelectorAll('[data-open]').forEach(el =>
      el.addEventListener('click', () => go('#/content/' + el.dataset.open)));

    const cat = root.querySelector('#cat-filter');
    if (cat) cat.addEventListener('change', () => { filter.cat = cat.value; HQ.render(); });
    const ser = root.querySelector('#series-filter');
    if (ser) ser.addEventListener('change', () => { filter.series = ser.value; HQ.render(); });

    const q = root.querySelector('#a-q');
    if (q) q.addEventListener('input', () => {
      const pos = q.selectionStart;
      filter.q = q.value.trim().toLowerCase();
      HQ.render();
      const nq = HQ.$('#a-q');
      if (nq) { nq.focus(); nq.setSelectionRange(pos, pos); }
    });

    const mk = () => {
      const a = Store.addArticle({});
      go('#/content/' + a.id);
    };
    const nb = root.querySelector('#new-article');
    if (nb) nb.addEventListener('click', mk);
    const en = root.querySelector('#empty-new');
    if (en) en.addEventListener('click', mk);

    const fc = root.querySelector('#feed-copy');
    if (fc) fc.addEventListener('click', () => copy(JSON.stringify(Store.publishedFeed(), null, 2)));
    const fp = root.querySelector('#feed-peek');
    if (fp) fp.addEventListener('click', () => {
      const out = root.querySelector('#feed-out');
      out.hidden = !out.hidden;
      fp.textContent = out.hidden ? 'Show it' : 'Hide it';
      if (!out.hidden) out.textContent = JSON.stringify(Store.publishedFeed(), null, 2);
    });
  }

  /* ============================== THE EDITOR ============================= */
  let showPreview = false;

  function workflowCard(a) {
    const me = Store.currentUser();
    const editable = Store.can('edit');
    const canOk = Store.canApprove(a);
    const why = Store.approveBlockedReason(a);
    const open = Store.openChecks(a);
    const s = stOf(a);

    let actions = '';
    let note = '';

    if (!editable) {
      note = 'You can read this and leave notes.';
    } else if (a.status === 'draft' || a.status === 'changes') {
      actions = `<button class="btn btn-dark" id="w-submit">${svg('send')}Send for review</button>`;
      note = a.status === 'changes'
        ? 'A reviewer sent this back. Their notes are below.'
        : 'Nobody is waiting on this yet.';
    } else if (a.status === 'review') {
      if (canOk) {
        actions = `<button class="btn btn-dark" id="w-approve">${svg('check')}Approve</button>
                   <button class="btn btn-outline" id="w-changes">Request changes</button>`;
        note = open.length
          ? `${open.length} guardrail${open.length === 1 ? '' : 's'} still unchecked — approve is blocked until they are.`
          : 'Everything is checked. This is yours to clear.';
      } else {
        note = why || 'Waiting on a reviewer.';
      }
    } else if (a.status === 'approved') {
      actions = `<button class="btn btn-dark" id="w-publish">${svg('arrow')}Publish now</button>
                 <button class="btn btn-outline" id="w-schedule">${svg('cal')}Schedule</button>`;
      note = 'Cleared. Put it out now, or pick a date.';
    } else if (a.status === 'scheduled') {
      actions = `<button class="btn btn-dark" id="w-publish">Publish now instead</button>
                 <button class="btn btn-outline" id="w-unschedule">Unschedule</button>`;
      note = `Goes live ${fmtDate(a.scheduledFor)} — on the first visit after that date, not to the minute.`;
    } else if (a.status === 'published') {
      actions = `<button class="btn btn-outline" id="w-unpublish">Pull it back</button>`;
      note = `Live since ${fmtDate(a.publishedAt)}.`;
    }

    return `<div class="side-card t-${s.tone === 'muted' ? 'navy' : s.tone}">
      <h4>Status</h4>
      <div class="w-now">${pill(a)}<span>${esc(s.hint)}</span></div>
      ${a.status === 'scheduled' ? `<div class="w-when">${svg('cal')}<b>${fmtDate(a.scheduledFor)}</b></div>` : ''}
      ${actions ? `<div class="w-acts">${actions}</div>` : ''}
      <p class="w-note">${esc(note)}</p>
    </div>`;
  }

  function checksCard(a) {
    const editable = Store.can('edit');
    return `<div class="side-card">
      <h4>Before it goes out</h4>
      <p class="side-sub">These aren’t style notes. They’re the rules the brand has already committed to.</p>
      <div class="checks">
        ${ARTICLE_CHECKS.map(c => {
          const on = !!(a.checks || {})[c.k];
          return `<label class="check ${on ? 'on' : ''}" title="${esc(c.why)}">
            <input type="checkbox" data-check="${c.k}" ${on ? 'checked' : ''} ${editable ? '' : 'disabled'}>
            <span><b>${esc(c.label)}</b><small>${esc(c.why)}</small></span>
          </label>`;
        }).join('')}
      </div>
    </div>`;
  }

  function threadCard(a) {
    const thread = a.thread || [];
    const noteHTML = (n, isReply) => {
      const u = Store.user(n.by);
      return `<div class="cnote ${isReply ? 'reply' : ''}">
        ${avatar(u, 'sm')}
        <div class="cnote-body">
          <span class="cnote-who"><b>${esc(u ? u.name.split(' ')[0] : 'Someone')}</b> · ${ago(n.at)}</span>
          <p>${esc(n.text)}</p>
          ${!isReply && Store.can('comment') ? `<button class="cnote-reply" data-reply="${n.id}">${svg('reply')}Reply</button>` : ''}
        </div>
        ${Store.can('edit') ? `<button class="cnote-del" data-delnote="${n.id}" aria-label="Delete note">${svg('trash')}</button>` : ''}
      </div>
      ${(n.replies || []).map(r => noteHTML(r, true)).join('')}`;
    };
    return `<div class="side-card">
      <h4>Review notes ${thread.length ? `<span class="side-n">${Store.noteCount(a)}</span>` : ''}</h4>
      <div class="cthread">
        ${thread.length ? thread.map(n => noteHTML(n, false)).join('')
          : '<p class="side-sub">No notes yet.</p>'}
      </div>
      ${Store.can('comment') ? `<form class="cform" id="note-form">
        <textarea id="note-text" rows="2" placeholder="Leave a note…" aria-label="New note"></textarea>
        <button class="btn btn-outline btn-sm" type="submit">Add note</button>
      </form>` : ''}
    </div>`;
  }

  /* =========================================================================
     THE BLOCK EDITOR

     An article is a stack of blocks you assemble, the way a page gets built in
     Squarespace. Each block edits in place and looks close to what it will
     become; the ⊕ between blocks opens the inserter.

     renderBlocks() below is the single renderer — the preview, and the `html`
     in the published feed, both come out of it, so what a writer sees is what
     the site gets.
  ========================================================================= */

  const mdInline = s => esc(s || '')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  const paras = s => String(s || '').split(/\n{2,}/).filter(x => x.trim())
    .map(p => `<p>${mdInline(p.trim())}</p>`).join('');

  const productOf = id => PRODUCTS.find(p => p.id === id) || PRODUCTS[0];
  const offerOf = code => OFFER_CODES.find(o => o.code === code) || OFFER_CODES[0];

  /* A YouTube/Vimeo watch link → the embeddable one. */
  function embedURL(url) {
    const u = String(url || '').trim();
    let m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (m) return 'https://www.youtube.com/embed/' + m[1];
    m = u.match(/vimeo\.com\/(\d+)/);
    if (m) return 'https://player.vimeo.com/video/' + m[1];
    return u;
  }

  /* ------------------------- the one true renderer ------------------------ */
  function renderBlock(b) {
    switch (b.type) {
      case 'heading':
        return `<h${b.level || 2} class="b-heading">${mdInline(b.text)}</h${b.level || 2}>`;

      case 'text':
        return `<div class="b-text">${paras(b.text)}</div>`;

      case 'image':
        return `<figure class="b-image w-${b.width || 'full'}">
          ${b.src ? `<img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy">`
                  : '<span class="b-ph">No image chosen</span>'}
          ${b.caption ? `<figcaption>${mdInline(b.caption)}</figcaption>` : ''}
        </figure>`;

      case 'split':
        return `<div class="b-split side-${b.side || 'left'}">
          <figure>${b.src ? `<img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy">`
                          : '<span class="b-ph">No image chosen</span>'}</figure>
          <div class="b-text">${paras(b.text)}</div>
        </div>`;

      case 'columns':
        return `<div class="b-cols">
          <div class="b-text">${paras(b.left)}</div>
          <div class="b-text">${paras(b.right)}</div>
        </div>`;

      case 'gallery':
        return `<div class="b-gallery n-${Math.min((b.images || []).length, 4)}">
          ${(b.images || []).map(g => `<figure><img src="${esc(g.src)}" alt="${esc(g.alt)}" loading="lazy"></figure>`).join('')
            || '<span class="b-ph">No images yet</span>'}
        </div>`;

      case 'quote':
        return `<blockquote class="b-quote">
          <p>${mdInline(b.text)}</p>
          ${b.cite ? `<cite>${esc(b.cite)}</cite>` : ''}
        </blockquote>`;

      case 'list': {
        const tag = b.ordered ? 'ol' : 'ul';
        return `<${tag} class="b-list">${(b.items || []).filter(i => i.trim())
          .map(i => `<li>${mdInline(i)}</li>`).join('')}</${tag}>`;
      }

      case 'callout':
        return `<aside class="b-callout t-${b.tone || 'blue'}">
          ${b.title ? `<h4>${esc(b.title)}</h4>` : ''}
          ${paras(b.text)}
        </aside>`;

      case 'button':
        return `<p class="b-button"><a class="b-btn ${b.style || 'primary'}"
          href="${esc(b.href)}" target="_blank" rel="noopener">${esc(b.label)}</a></p>`;

      case 'video':
        return `<figure class="b-video">
          ${b.url ? `<iframe src="${esc(embedURL(b.url))}" title="${esc(b.caption || 'Video')}"
              allowfullscreen loading="lazy"></iframe>` : '<span class="b-ph">No video link yet</span>'}
          ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}
        </figure>`;

      case 'product': {
        const p = productOf(b.productId);
        return `<aside class="b-product t-${p.tone}">
          <div class="b-product-body">
            <span class="b-product-tier">${esc(p.tier)}</span>
            <h4>${esc(p.name)}</h4>
            <p>${esc(b.note || p.line)}</p>
          </div>
          <div class="b-product-buy">
            <span class="b-price">${p.price ? '$' + p.price.toFixed(2) : (p.status === 'rx' ? 'Rx only' : 'Coming soon')}</span>
            ${p.price ? `<a class="b-btn primary" href="https://sportpharm.com/store/" target="_blank" rel="noopener">Shop it</a>` : ''}
          </div>
        </aside>`;
      }

      case 'offer': {
        const o = offerOf(b.code);
        return `<aside class="b-offer">
          <span class="b-offer-code">${esc(o.code)}</span>
          <span class="b-offer-what">${esc(b.note || o.what)}</span>
        </aside>`;
      }

      case 'disclaimer':
        return `<p class="b-disclaimer">${esc(DISCLAIMER_TEXT)}</p>`;

      case 'line':   return '<hr class="b-line">';
      case 'spacer': return `<div class="b-spacer s-${b.size || 'medium'}"></div>`;
      default:       return '';
    }
  }

  function renderBlocks(blocks) {
    return (blocks || []).map(renderBlock).join('\n');
  }
  HQ.renderBlocks = renderBlocks;   /* the published feed uses this too */

  /* ---------------------------- the inserter ------------------------------ */
  /* Opens in the right-hand sheet, grouped and searchable — the same shape as
     the panel the user pointed at. */
  let inserterQuery = '';

  function openInserter(articleId, atIndex) {
    inserterQuery = '';
    HQ.openSheet(() => {
      const q = inserterQuery.trim().toLowerCase();
      const hit = k => {
        const t = BLOCK_TYPES[k];
        return !q || t.label.toLowerCase().includes(q) || t.hint.toLowerCase().includes(q) || t.group.toLowerCase().includes(q);
      };
      const groups = BLOCK_GROUPS
        .map(g => ({ g, keys: Object.keys(BLOCK_TYPES).filter(k => BLOCK_TYPES[k].group === g && hit(k)) }))
        .filter(x => x.keys.length);

      return {
        cls: 't-red',
        html: `
          <div class="sheet-head">
            <span class="tag">Add a block</span>
            <button class="btn btn-ghost btn-sm" data-sheet-close aria-label="Close" style="margin-left:auto">${svg('close')}</button>
          </div>
          <div class="sheet-body">
            <div class="ins-search">
              ${svg('search')}
              <input id="ins-q" type="search" placeholder="Search blocks…" value="${esc(inserterQuery)}" aria-label="Search blocks">
            </div>
            ${groups.length ? groups.map(({ g, keys }) => `
              <div class="ins-group">
                <h4>${esc(g)}</h4>
                <div class="ins-grid">
                  ${keys.map(k => `<button class="ins-item" data-add="${k}" title="${esc(BLOCK_TYPES[k].hint)}">
                    ${svg(BLOCK_TYPES[k].icon)}<span>${esc(BLOCK_TYPES[k].label)}</span>
                  </button>`).join('')}
                </div>
              </div>`).join('') : '<p class="panel-empty">No block matches that.</p>'}
          </div>`,
        wire(sheet) {
          const qi = sheet.querySelector('#ins-q');
          qi.addEventListener('input', () => {
            const pos = qi.selectionStart;
            inserterQuery = qi.value;
            HQ.refreshSheet();
            const nq = document.querySelector('#ins-q');
            if (nq) { nq.focus(); nq.setSelectionRange(pos, pos); }
          });
          sheet.querySelectorAll('[data-add]').forEach(b =>
            b.addEventListener('click', () => {
              Store.addBlock(articleId, b.dataset.add, atIndex);
              HQ.closeSheet();
              HQ.render();
            }));
          setTimeout(() => { const el = document.querySelector('#ins-q'); if (el) el.focus(); }, 30);
        }
      };
    });
  }

  /* ------------------------- editing a single block ----------------------- */
  const ta = (id, val, ph, rows) =>
    `<textarea class="b-in b-grow" data-bin="${id}" rows="${rows || 2}" placeholder="${esc(ph)}">${esc(val || '')}</textarea>`;
  const inp = (id, val, ph) =>
    `<input class="b-in" data-bin="${id}" value="${esc(val || '')}" placeholder="${esc(ph)}">`;

  function imageField(b, key) {
    const src = b[key === 'split' ? 'src' : 'src'];
    return `<div class="b-imgfield ${src ? '' : 'empty'}">
      ${src ? `<img src="${esc(src)}" alt="" onerror="this.parentElement.classList.add('broken')">`
            : `<span class="b-ph">No image yet</span>`}
      <div class="b-imgacts">
        <button class="btn btn-outline btn-sm" data-pickimg="${b.id}">${svg('image')}Library</button>
        <button class="btn btn-ghost btn-sm" data-upimg="${b.id}">Upload</button>
        ${src ? `<button class="btn btn-ghost btn-sm" data-clearimg="${b.id}">Remove</button>` : ''}
      </div>
    </div>`;
  }

  function blockForm(b) {
    switch (b.type) {
      case 'heading':
        return `<div class="b-row">
          <div class="b-seg">
            ${[2, 3].map(l => `<button data-set="${b.id}:level:${l}" class="${(b.level || 2) === l ? 'on' : ''}">H${l}</button>`).join('')}
          </div>
          ${inp(b.id + ':text', b.text, 'Section heading')}
        </div>`;

      case 'text':
        return ta(b.id + ':text', b.text, 'Write…  **bold**  *italic*  — blank line starts a new paragraph', 3);

      case 'image':
        return `${imageField(b)}
          ${inp(b.id + ':caption', b.caption, 'Caption (optional)')}
          ${inp(b.id + ':alt', b.alt, 'Alt text — what it shows, for someone who can’t see it')}
          <div class="b-seg wide">
            ${[['inset', 'Inset'], ['full', 'Full'], ['wide', 'Wide']].map(([k, l]) =>
              `<button data-set="${b.id}:width:${k}" class="${(b.width || 'full') === k ? 'on' : ''}">${l}</button>`).join('')}
          </div>`;

      case 'split':
        return `<div class="b-seg wide">
            ${[['left', 'Image left'], ['right', 'Image right']].map(([k, l]) =>
              `<button data-set="${b.id}:side:${k}" class="${(b.side || 'left') === k ? 'on' : ''}">${l}</button>`).join('')}
          </div>
          ${imageField(b)}
          ${inp(b.id + ':alt', b.alt, 'Alt text')}
          ${ta(b.id + ':text', b.text, 'The text beside it…', 4)}`;

      case 'columns':
        return `<div class="b-twocol">
          ${ta(b.id + ':left', b.left, 'Left column…', 4)}
          ${ta(b.id + ':right', b.right, 'Right column…', 4)}
        </div>`;

      case 'gallery':
        return `<div class="b-gal-edit">
          ${(b.images || []).map((g, i) => `<div class="b-gal-item">
            <img src="${esc(g.src)}" alt="" onerror="this.classList.add('broken')">
            <button data-galrm="${b.id}:${i}" aria-label="Remove image">${svg('close')}</button>
          </div>`).join('')}
          <button class="b-gal-add" data-galadd="${b.id}">${svg('plus')}<span>Add</span></button>
        </div>`;

      case 'quote':
        return `${ta(b.id + ':text', b.text, 'The quote…', 2)}
          ${inp(b.id + ':cite', b.cite, 'Who said it')}`;

      case 'list':
        return `<div class="b-seg">
            ${[['false', 'Bulleted'], ['true', 'Numbered']].map(([k, l]) =>
              `<button data-set="${b.id}:ordered:${k}" class="${String(!!b.ordered) === k ? 'on' : ''}">${l}</button>`).join('')}
          </div>
          <div class="b-listedit">
            ${(b.items || []).map((it, i) => `<div class="b-listrow">
              <i></i><input class="b-in" data-listin="${b.id}:${i}" value="${esc(it)}" placeholder="List item">
              <button data-listrm="${b.id}:${i}" aria-label="Remove item">${svg('close')}</button>
            </div>`).join('')}
            <button class="btn btn-ghost btn-sm" data-listadd="${b.id}">${svg('plus')}Add item</button>
          </div>`;

      case 'callout':
        return `<div class="b-seg wide">
            ${CALLOUT_TONES.map(t => `<button data-set="${b.id}:tone:${t.id}" class="ct-${t.id} ${(b.tone || 'blue') === t.id ? 'on' : ''}">${t.label}</button>`).join('')}
          </div>
          ${inp(b.id + ':title', b.title, 'Callout heading')}
          ${ta(b.id + ':text', b.text, 'What the reader should stop and take in…', 3)}`;

      case 'button':
        return `${inp(b.id + ':label', b.label, 'Button label')}
          ${inp(b.id + ':href', b.href, 'https://…')}
          <div class="b-seg">
            ${[['primary', 'Red'], ['navy', 'Navy'], ['ghost', 'Outline']].map(([k, l]) =>
              `<button data-set="${b.id}:style:${k}" class="${(b.style || 'primary') === k ? 'on' : ''}">${l}</button>`).join('')}
          </div>`;

      case 'video':
        return `${inp(b.id + ':url', b.url, 'YouTube or Vimeo link')}
          ${inp(b.id + ':caption', b.caption, 'Caption (optional)')}`;

      case 'product':
        return `<select class="b-in" data-bin="${b.id}:productId">
            ${PRODUCTS.map(p => `<option value="${p.id}" ${p.id === b.productId ? 'selected' : ''}>${esc(p.name)}${p.price ? ' — $' + p.price.toFixed(2) : ''}</option>`).join('')}
          </select>
          ${ta(b.id + ':note', b.note, 'Override the description (optional)', 2)}`;

      case 'offer':
        return `<select class="b-in" data-bin="${b.id}:code">
            ${OFFER_CODES.map(o => `<option value="${o.code}" ${o.code === b.code ? 'selected' : ''}>${esc(o.code)}</option>`).join('')}
          </select>
          ${inp(b.id + ':note', b.note, 'What it gets them (optional)')}
          <p class="b-warn">${svg('lock')}This code has to exist in-store before the piece goes live.</p>`;

      case 'spacer':
        return `<div class="b-seg wide">
          ${[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']].map(([k, l]) =>
            `<button data-set="${b.id}:size:${k}" class="${(b.size || 'medium') === k ? 'on' : ''}">${l}</button>`).join('')}
        </div>`;

      case 'disclaimer':
        return `<p class="b-fixed">${esc(DISCLAIMER_TEXT)}</p>`;

      case 'line':
        return '<div class="b-fixed-line"><hr></div>';

      default: return '';
    }
  }

  function blockShell(a, b, i, total) {
    const t = BLOCK_TYPES[b.type] || { label: b.type, icon: 'text' };
    const editable = Store.can('edit');
    return `
      <div class="b-insert" data-insert="${i}"><button aria-label="Add a block here">${svg('plus')}</button></div>
      <section class="bk" data-block="${b.id}" data-idx="${i}" ${editable ? 'draggable="true"' : ''}>
        <div class="bk-bar">
          <span class="bk-type">${svg(t.icon)}${esc(t.label)}</span>
          ${editable ? `<span class="bk-acts">
            <button data-bmove="${b.id}:-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">${svg('up')}</button>
            <button data-bmove="${b.id}:1" ${i === total - 1 ? 'disabled' : ''} aria-label="Move down">${svg('down')}</button>
            <button data-bdup="${b.id}" aria-label="Duplicate">${svg('copy')}</button>
            <button data-bdel="${b.id}" aria-label="Delete">${svg('trash')}</button>
            <span class="bk-grip" title="Drag to reorder">${svg('grip')}</span>
          </span>` : ''}
        </div>
        <div class="bk-body">${blockForm(b)}</div>
      </section>`;
  }

  function canvas(a) {
    const blocks = Store.ensureBlocks(a);
    return `<div class="bk-canvas" id="bk-canvas">
      ${blocks.map((b, i) => blockShell(a, b, i, blocks.length)).join('')}
      <div class="b-insert last" data-insert="${blocks.length}"><button aria-label="Add a block">${svg('plus')}</button></div>
    </div>`;
  }

  /* ------------------------------ the page -------------------------------- */
  function editor(a) {
    const editable = Store.can('edit');
    const ro = editable ? '' : 'readonly';
    const dis = editable ? '' : 'disabled';
    const blocks = Store.ensureBlocks(a);
    return `<div class="wrap">
      <button class="crumb" data-go="#/content">${svg('left')} All articles</button>
      <div class="page-head">
        <div>
          <h1 class="ed-h1">${esc(a.title || 'Untitled article')}</h1>
          <p>${esc(a.author)} · updated ${ago(a.updatedAt)} · ${readMins(a.body)} min read ·
             ${blocks.length} block${blocks.length === 1 ? '' : 's'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm" id="ed-preview">${showPreview ? 'Back to building' : 'Preview'}</button>
        </div>
      </div>

      <div class="editor-grid">
        <div class="ed-main">
          ${showPreview ? `
            <article class="ed-preview">
              ${a.image ? `<img class="ed-hero" src="${esc(a.image)}" alt="${esc(a.excerpt)}" onerror="this.remove()">` : ''}
              <span class="ed-eyebrow">${esc(a.category)}</span>
              <h2>${esc(a.title)}</h2>
              ${a.excerpt ? `<p class="ed-dek">${esc(a.excerpt)}</p>` : ''}
              <div class="ed-body">${renderBlocks(blocks) || '<p class="panel-empty">Nothing built yet.</p>'}</div>
            </article>` : `
            <div class="card-pad ed-meta">
              <div class="field"><label for="e-title">Title</label>
                <input id="e-title" value="${esc(a.title)}" placeholder="A clear, specific headline" ${dis}></div>
              <div class="field"><label for="e-slug">Slug <span class="hint">the article’s URL</span></label>
                <div class="slug-row"><span>/articles/</span><input id="e-slug" value="${esc(a.slug)}" ${dis}></div></div>
              <div class="field"><label for="e-excerpt">Excerpt <span class="hint">shown on cards and previews</span></label>
                <textarea id="e-excerpt" rows="2" placeholder="One or two sentences…" ${ro}>${esc(a.excerpt)}</textarea></div>
            </div>
            ${canvas(a)}`}
        </div>

        <div class="ed-side">
          ${workflowCard(a)}
          ${checksCard(a)}

          <div class="side-card">
            <h4>Organisation</h4>
            <div class="field"><label for="e-cat">Category</label>
              <select id="e-cat" ${dis}>${ARTICLE_CATS.map(c =>
                `<option ${a.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
            <div class="field"><label for="e-author">Author</label>
              <input id="e-author" value="${esc(a.author)}" ${dis}></div>
            ${a.sourceUrl ? `<p class="side-sub">Originally published at
              <a class="linky" href="${esc(a.sourceUrl)}" target="_blank" rel="noopener">sportpharm.com ↗</a></p>` : ''}
            <div class="field"><label for="e-series">Series <span class="hint">which hub page pulls it</span></label>
              <select id="e-series" ${dis}>
                <option value="">Not in a series</option>
                ${ARTICLE_SERIES.map(x => `<option value="${x.id}" ${a.series === x.id ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}
              </select></div>
            <div class="field"><label>Tags <span class="hint">enter to add</span></label>
              <div class="tagbox" id="tagbox">
                ${(a.tags || []).map((t, i) => `<span class="tagchip">${esc(t)}<b data-rmtag="${i}" aria-label="Remove ${esc(t)}">×</b></span>`).join('')}
                ${editable ? '<input id="tagin" placeholder="add tag…" aria-label="Add tag">' : ''}
              </div></div>
          </div>

          <div class="side-card">
            <h4>Featured image</h4>
            <div class="imgprev">${a.image
              ? `<img src="${esc(a.image)}" alt="" onerror="this.parentElement.classList.add('broken')">`
              : '<span class="imgprev-none">No image yet</span>'}</div>
            <div class="field"><label for="e-image">Image URL</label>
              <input id="e-image" value="${esc(a.image)}" placeholder="https://… or a library image" ${dis}></div>
            ${editable ? `<div class="img-acts">
              <button class="btn btn-outline btn-sm" id="pick-img">${svg('image')}From library</button>
              <button class="btn btn-ghost btn-sm" id="upload-img">Upload</button>
              <input type="file" id="file-in" accept="image/*" hidden>
            </div>` : ''}
          </div>

          ${threadCard(a)}

          ${editable ? `<div class="side-card danger">
            <button class="link-danger" id="ed-del">Delete this article</button>
          </div>` : ''}
        </div>
      </div>
    </div>`;
  }

  /* ------------------------------- wiring --------------------------------- */
  function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight + 2) + 'px';
  }

  function wireEditor(root, a) {
    const editable = Store.can('edit');

    root.querySelector('#ed-preview').addEventListener('click', () => {
      Store.flushBlocks(); showPreview = !showPreview; HQ.render();
    });

    /* ---- the article's own fields ---- */
    const bind = (sel, key) => {
      const el = root.querySelector(sel);
      if (!el) return;
      el.addEventListener('change', () => {
        Store.updateArticle(a.id, { [key]: el.value });
        if (key === 'title' || key === 'category') HQ.render();
      });
    };

    if (editable && !showPreview) {
      const title = root.querySelector('#e-title');
      const slug = root.querySelector('#e-slug');
      title.addEventListener('input', () => { if (!a.slugTouched) slug.value = Store.slugify(title.value); });
      title.addEventListener('change', () => {
        Store.updateArticle(a.id, { title: title.value.trim() || 'Untitled article', slug: slug.value });
        HQ.render();
      });
      slug.addEventListener('input', () => Store.updateArticle(a.id, { slugTouched: true }));
      slug.addEventListener('change', () => { Store.updateArticle(a.id, { slug: slug.value }); HQ.render(); });
      bind('#e-excerpt', 'excerpt');
    }
    if (editable) { bind('#e-cat', 'category'); bind('#e-author', 'author'); bind('#e-image', 'image'); bind('#e-series', 'series'); }

    /* ---- blocks: typing never repaints, so the caret stays put ---- */
    root.querySelectorAll('[data-bin]').forEach(el => {
      const [blockId, key] = el.dataset.bin.split(':');
      if (el.tagName === 'TEXTAREA') autoGrow(el);
      const ev = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, () => {
        Store.setBlock(a.id, blockId, { [key]: el.value });
        if (el.tagName === 'TEXTAREA') autoGrow(el);
        if (el.tagName === 'SELECT') HQ.render();
      });
    });

    /* ---- segmented choices inside a block ---- */
    root.querySelectorAll('[data-set]').forEach(b =>
      b.addEventListener('click', () => {
        const [blockId, key, raw] = b.dataset.set.split(':');
        let val = raw;
        if (raw === 'true' || raw === 'false') val = raw === 'true';
        else if (/^\d+$/.test(raw)) val = Number(raw);
        Store.setBlock(a.id, blockId, { [key]: val });
        Store.flushBlocks();
        HQ.render();
      }));

    /* ---- list items ---- */
    root.querySelectorAll('[data-listin]').forEach(el => {
      const [blockId, i] = el.dataset.listin.split(':');
      el.addEventListener('input', () => {
        const blk = Store.blocksOf(a).find(x => x.id === blockId);
        const items = (blk.items || []).slice();
        items[Number(i)] = el.value;
        Store.setBlock(a.id, blockId, { items });
      });
      el.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const blk = Store.blocksOf(a).find(x => x.id === blockId);
        const items = (blk.items || []).slice();
        items.splice(Number(i) + 1, 0, '');
        Store.setBlock(a.id, blockId, { items });
        Store.flushBlocks(); HQ.render();
      });
    });
    root.querySelectorAll('[data-listadd]').forEach(b =>
      b.addEventListener('click', () => {
        const blk = Store.blocksOf(a).find(x => x.id === b.dataset.listadd);
        Store.setBlock(a.id, blk.id, { items: (blk.items || []).concat('') });
        Store.flushBlocks(); HQ.render();
      }));
    root.querySelectorAll('[data-listrm]').forEach(b =>
      b.addEventListener('click', () => {
        const [blockId, i] = b.dataset.listrm.split(':');
        const blk = Store.blocksOf(a).find(x => x.id === blockId);
        const items = (blk.items || []).slice();
        items.splice(Number(i), 1);
        Store.setBlock(a.id, blockId, { items: items.length ? items : [''] });
        Store.flushBlocks(); HQ.render();
      }));

    /* ---- images inside blocks ---- */
    root.querySelectorAll('[data-pickimg]').forEach(b =>
      b.addEventListener('click', () => openPicker(src => {
        Store.setBlock(a.id, b.dataset.pickimg, { src });
        Store.flushBlocks(); HQ.closeSheet(); HQ.render();
      })));
    root.querySelectorAll('[data-clearimg]').forEach(b =>
      b.addEventListener('click', () => {
        Store.setBlock(a.id, b.dataset.clearimg, { src: '' });
        Store.flushBlocks(); HQ.render();
      }));
    root.querySelectorAll('[data-upimg]').forEach(b =>
      b.addEventListener('click', () => pickFile(f => readImage(f, (src, name) => {
        Store.addMedia({ name, src, kind: 'upload' });
        Store.setBlock(a.id, b.dataset.upimg, { src });
        Store.flushBlocks(); HQ.render();
        toast('Added to the library and used here.');
      }))));

    /* ---- gallery ---- */
    root.querySelectorAll('[data-galadd]').forEach(b =>
      b.addEventListener('click', () => openPicker(src => {
        const blk = Store.blocksOf(a).find(x => x.id === b.dataset.galadd);
        Store.setBlock(a.id, blk.id, { images: (blk.images || []).concat({ src, alt: '' }) });
        Store.flushBlocks(); HQ.closeSheet(); HQ.render();
      })));
    root.querySelectorAll('[data-galrm]').forEach(b =>
      b.addEventListener('click', () => {
        const [blockId, i] = b.dataset.galrm.split(':');
        const blk = Store.blocksOf(a).find(x => x.id === blockId);
        const images = (blk.images || []).slice();
        images.splice(Number(i), 1);
        Store.setBlock(a.id, blockId, { images });
        Store.flushBlocks(); HQ.render();
      }));

    /* ---- block structure ---- */
    root.querySelectorAll('[data-insert]').forEach(el =>
      el.addEventListener('click', () => openInserter(a.id, Number(el.dataset.insert))));
    root.querySelectorAll('[data-bmove]').forEach(b =>
      b.addEventListener('click', () => {
        const [id, dir] = b.dataset.bmove.split(':');
        Store.moveBlock(a.id, id, Number(dir)); HQ.render();
      }));
    root.querySelectorAll('[data-bdup]').forEach(b =>
      b.addEventListener('click', () => { Store.duplicateBlock(a.id, b.dataset.bdup); HQ.render(); }));
    root.querySelectorAll('[data-bdel]').forEach(b =>
      b.addEventListener('click', () => { Store.removeBlock(a.id, b.dataset.bdel); HQ.render(); }));

    wireBlockDrag(root, a);

    /* ---- tags ---- */
    const tagin = root.querySelector('#tagin');
    if (tagin) tagin.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ',') return;
      e.preventDefault();
      const v = tagin.value.trim().replace(/,$/, '');
      if (!v) return;
      const tags = (a.tags || []).slice();
      if (tags.indexOf(v) === -1) tags.push(v);
      Store.updateArticle(a.id, { tags }); HQ.render();
    });
    root.querySelectorAll('[data-rmtag]').forEach(b =>
      b.addEventListener('click', () => {
        const tags = (a.tags || []).slice();
        tags.splice(Number(b.dataset.rmtag), 1);
        Store.updateArticle(a.id, { tags }); HQ.render();
      }));

    /* ---- featured image ---- */
    const pick = root.querySelector('#pick-img');
    if (pick) pick.addEventListener('click', () => openPicker(src => {
      Store.updateArticle(a.id, { image: src }); HQ.closeSheet(); HQ.render();
    }));
    const up = root.querySelector('#upload-img');
    if (up) up.addEventListener('click', () => root.querySelector('#file-in').click());
    const fin = root.querySelector('#file-in');
    if (fin) fin.addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      readImage(f, (src, name) => {
        Store.addMedia({ name, alt: '', kind: 'upload', src, tags: [] });
        Store.updateArticle(a.id, { image: src });
        HQ.render(); toast('Added to the library and used here.');
      });
    });

    /* ---- guardrails ---- */
    root.querySelectorAll('[data-check]').forEach(c =>
      c.addEventListener('change', () => { Store.toggleCheck(a.id, c.dataset.check); HQ.render(); }));

    /* ---- workflow ---- */
    const act = (sel, fn) => { const b = root.querySelector(sel); if (b) b.addEventListener('click', fn); };
    const run = r => { if (!r.ok) { toast(r.error); return false; } HQ.render(); return true; };

    act('#w-submit', () => { Store.flushBlocks(); if (run(Store.submitForReview(a.id))) toast('Sent for review.'); });
    act('#w-approve', () => { if (run(Store.approveArticle(a.id))) toast('Approved.'); });
    act('#w-changes', () => {
      const note = prompt('What needs to change? (this goes in the notes)');
      if (note === null) return;
      if (run(Store.requestChanges(a.id, note))) toast('Sent back.');
    });
    act('#w-publish', () => { Store.flushBlocks(); if (run(Store.publishArticle(a.id))) toast('Published.'); });
    act('#w-unpublish', () => {
      if (!confirm('Pull “' + a.title + '” back off the site?')) return;
      if (run(Store.unpublishArticle(a.id))) toast('Pulled back.');
    });
    act('#w-unschedule', () => { if (run(Store.unpublishArticle(a.id))) toast('Unscheduled.'); });
    act('#w-schedule', () => {
      const d = prompt('Publish on which date? (YYYY-MM-DD)', Store.today());
      if (!d) return;
      if (run(Store.scheduleArticle(a.id, d.trim()))) toast('Scheduled for ' + d.trim() + '.');
    });

    /* ---- notes ---- */
    const nf = root.querySelector('#note-form');
    if (nf) nf.addEventListener('submit', e => {
      e.preventDefault();
      const t = root.querySelector('#note-text');
      if (!t.value.trim()) return;
      Store.addArticleNote(a.id, t.value); HQ.render();
    });
    root.querySelectorAll('[data-reply]').forEach(b =>
      b.addEventListener('click', () => {
        const txt = prompt('Reply');
        if (!txt) return;
        Store.addArticleNote(a.id, txt, b.dataset.reply); HQ.render();
      }));
    root.querySelectorAll('[data-delnote]').forEach(b =>
      b.addEventListener('click', () => { Store.removeArticleNote(a.id, b.dataset.delnote); HQ.render(); }));

    act('#ed-del', () => {
      if (!confirm('Delete “' + a.title + '”? There is no undo.')) return;
      Store.removeArticle(a.id); go('#/content'); toast('Deleted.');
    });
  }

  /* Drag a block to reorder. The drop line shows where it will land. */
  let dragBlock = null;
  function wireBlockDrag(root, a) {
    const canvasEl = root.querySelector('#bk-canvas');
    if (!canvasEl) return;

    canvasEl.querySelectorAll('[data-block]').forEach(el => {
      el.addEventListener('dragstart', e => {
        /* don't hijack text selection inside a field */
        if (e.target.closest('.b-in, input, textarea, select')) { e.preventDefault(); return; }
        dragBlock = el.dataset.block;
        el.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', dragBlock); } catch (err) {}
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
        dragBlock = null;
        canvasEl.querySelectorAll('.b-insert.over').forEach(x => x.classList.remove('over'));
      });
    });

    canvasEl.querySelectorAll('[data-insert]').forEach(slot => {
      slot.addEventListener('dragover', e => {
        if (!dragBlock) return;
        e.preventDefault(); e.dataTransfer.dropEffect = 'move';
        slot.classList.add('over');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('over'));
      slot.addEventListener('drop', e => {
        e.preventDefault(); slot.classList.remove('over');
        if (!dragBlock) return;
        Store.placeBlock(a.id, dragBlock, Number(slot.dataset.insert));
        dragBlock = null;
        HQ.render();
      });
    });
  }

  function pickFile(done) {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = 'image/*';
    i.addEventListener('change', () => { if (i.files[0]) done(i.files[0]); });
    i.click();
  }

  /* Uploads become data URIs. Fine for mockups, not for a photo library —
     see the launch gate on Today. */
  function readImage(file, done) {
    const r = new FileReader();
    r.onload = () => done(r.result, file.name);
    r.readAsDataURL(file);
  }

  /* The media library, as a picker inside the sheet. */
  function openPicker(onPick) {
    HQ.openSheet(() => ({
      cls: 't-blue',
      html: `
        <div class="sheet-head">
          <span class="tag">Media library</span>
          <button class="btn btn-ghost btn-sm" data-sheet-close aria-label="Close" style="margin-left:auto">${svg('close')}</button>
        </div>
        <div class="sheet-body">
          <div class="pick-grid">
            ${Store.media().map(m => `<button class="pick" data-pick="${esc(m.src)}">
              <img src="${esc(m.src)}" alt="${esc(m.alt)}" loading="lazy" onerror="this.parentElement.classList.add('broken')">
              <span>${esc(m.name)}</span>
            </button>`).join('') || '<p class="panel-empty">The library is empty.</p>'}
          </div>
        </div>`,
      wire(sheet) {
        sheet.querySelectorAll('[data-pick]').forEach(b =>
          b.addEventListener('click', () => onPick(b.dataset.pick)));
      }
    }));
  }

  HQ.view('content', {
    render(r) {
      const a = r.id ? Store.article(r.id) : null;
      return a ? editor(a) : articlesIndex();
    },
    wire(root, r) {
      const a = r.id ? Store.article(r.id) : null;
      if (a) wireEditor(root, a); else wireIndex(root);
    }
  });

  /* ============================ MEDIA LIBRARY =========================== */
  HQ.view('media', {
    render() {
      const list = Store.media();
      const editable = Store.can('edit');
      return `<div class="wrap">
        <div class="page-head">
          <div><h1>Media</h1>
            <p>Every image the CMS can reach. Link to something already in the site repo where you can —
               uploads live inside the record until Supabase Storage is wired up.</p></div>
          <div class="page-actions">
            ${editable ? `<button class="btn btn-outline" id="m-link">${svg('plus')}Add by URL</button>
            <button class="btn btn-dark" id="m-upload">Upload</button>
            <input type="file" id="m-file" accept="image/*" multiple hidden>` : ''}
          </div>
        </div>

        <div class="media-grid">
          ${list.length ? list.map(m => {
            const used = Store.mediaUsedBy(m.src);
            return `<figure class="mcard" data-media="${m.id}">
              <div class="mcard-img"><img src="${esc(m.src)}" alt="${esc(m.alt)}" loading="lazy"
                onerror="this.parentElement.classList.add('broken')"></div>
              <figcaption>
                <b>${esc(m.name)}</b>
                <span>${m.kind === 'upload' ? 'Uploaded' : 'Linked'}${used.length ? ' · used by ' + used.length : ''}</span>
                ${m.alt ? `<small>${esc(m.alt)}</small>` : '<small class="warn">No alt text</small>'}
              </figcaption>
            </figure>`;
          }).join('') : '<p class="panel-empty">Nothing here yet.</p>'}
        </div>
      </div>`;
    },
    wire(root) {
      root.querySelectorAll('[data-media]').forEach(el =>
        el.addEventListener('click', () => openMediaSheet(el.dataset.media)));

      const link = root.querySelector('#m-link');
      if (link) link.addEventListener('click', () => {
        const src = prompt('Image URL');
        if (!src) return;
        const m = Store.addMedia({ src: src.trim(), name: src.split('/').pop().split('?')[0] || 'Image' });
        HQ.render(); openMediaSheet(m.id);
      });
      const up = root.querySelector('#m-upload');
      if (up) up.addEventListener('click', () => root.querySelector('#m-file').click());
      const fin = root.querySelector('#m-file');
      if (fin) fin.addEventListener('change', e => {
        const files = [...e.target.files];
        let left = files.length;
        files.forEach(f => readImage(f, (src, name) => {
          Store.addMedia({ name, src, kind: 'upload' });
          if (--left === 0) { HQ.render(); toast(files.length + ' added.'); }
        }));
      });
    }
  });

  function openMediaSheet(id) {
    HQ.openSheet(() => {
      const m = Store.mediaItem(id);
      if (!m) return null;
      const used = Store.mediaUsedBy(m.src);
      const editable = Store.can('edit');
      return {
        cls: 't-blue',
        html: `
          <div class="sheet-head">
            <span class="tag">${m.kind === 'upload' ? 'Uploaded' : 'Linked'}</span>
            <button class="btn btn-ghost btn-sm" data-sheet-close aria-label="Close" style="margin-left:auto">${svg('close')}</button>
          </div>
          <div class="sheet-body">
            <div class="imgprev lg"><img src="${esc(m.src)}" alt="${esc(m.alt)}"
              onerror="this.parentElement.classList.add('broken')"></div>
            <div class="field"><label for="m-name">Name</label>
              <input id="m-name" value="${esc(m.name)}" ${editable ? '' : 'disabled'}></div>
            <div class="field"><label for="m-alt">Alt text <span class="hint">what it shows, for someone who can’t see it</span></label>
              <textarea id="m-alt" rows="2" ${editable ? '' : 'readonly'}>${esc(m.alt)}</textarea></div>
            ${m.kind === 'link' ? `<div class="field"><label for="m-src">URL</label>
              <input id="m-src" value="${esc(m.src)}" ${editable ? '' : 'disabled'}></div>` : ''}
            <div class="used-by">
              <b>Used by</b>
              ${used.length ? used.map(a => `<button class="linky" data-goart="${a.id}">${esc(a.title)}</button>`).join('')
                : '<span class="side-sub">Nothing yet.</span>'}
            </div>
            ${editable ? `<div class="sheet-danger">
              <span style="font-size:.78rem;color:var(--ink-faint)">Added ${ago(m.createdAt)}</span>
              <button class="link-danger" id="m-del">Remove from the library</button>
            </div>` : ''}
          </div>`,
        wire(sheet) {
          sheet.querySelectorAll('[data-goart]').forEach(b =>
            b.addEventListener('click', () => { HQ.closeSheet(); go('#/content/' + b.dataset.goart); }));
          if (!editable) return;
          const bind = (sel, key) => {
            const el = sheet.querySelector(sel);
            if (el) el.addEventListener('change', () => { Store.updateMedia(m.id, { [key]: el.value }); HQ.render(); });
          };
          bind('#m-name', 'name'); bind('#m-alt', 'alt'); bind('#m-src', 'src');
          sheet.querySelector('#m-del').addEventListener('click', () => {
            if (used.length && !confirm(used.length + ' article(s) use this image. Remove it anyway?')) return;
            if (!used.length && !confirm('Remove “' + m.name + '”?')) return;
            Store.removeMedia(m.id); HQ.closeSheet(); HQ.render(); toast('Removed.');
          });
        }
      };
    });
  }
})();
