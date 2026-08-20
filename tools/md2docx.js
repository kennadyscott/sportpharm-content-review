/* Markdown -> .docx for the SportPharm handoff docs.
   The point of the Word version is that the recipient can COPY OUT of it —
   the PowerShell command, the app-setting names, the tenant id. So code stays
   real text in a monospace run, never an image, and table cells hold the bare
   value with no decoration to strip off after pasting. */
const fs = require('fs');
const d = require('docx');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, ExternalHyperlink, LevelFormat
} = d;

const MONO = 'Consolas';
const BODY = 'Calibri';
const INK = '15202B', DEEP = '0F1D33', RED = 'D6202A', GREY = '566371';

/* US Letter, 0.85in margins. A4 is the docx-js default and would reflow every
   table for a US recipient. */
const PAGE = { size: { width: 12240, height: 15840 }, margin: { top: 1224, right: 1224, bottom: 1224, left: 1224 } };
const CONTENT_W = 12240 - 1224 * 2;

const src = fs.readFileSync(process.argv[2], 'utf8');
const outPath = process.argv[3];

/* ---- inline: **bold**, `code`, [text](url) ---- */
function runs(text, opts = {}) {
  const base = { font: opts.font || BODY, size: opts.size || 21, color: opts.color || INK, ...opts };
  const out = [];
  /* Italic must come AFTER bold in this alternation or ** matches as two
     single asterisks. It was missing entirely at first and *emphasis* went
     into the document as literal asterisks. */
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0, m;
  const push = (t, extra = {}) => { if (t) out.push(new TextRun({ text: t, ...base, ...extra })); };
  while ((m = re.exec(text))) {
    push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) push(tok.slice(2, -2), { bold: true, color: DEEP });
    else if (tok.startsWith('*')) push(tok.slice(1, -1), { italics: true });
    else if (tok.startsWith('`')) push(tok.slice(1, -1), { font: MONO, size: 19, shading: { type: ShadingType.CLEAR, fill: 'F1F3F5' } });
    else {
      const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
      out.push(new ExternalHyperlink({
        link: mm[2],
        children: [new TextRun({ text: mm[1], ...base, color: '337FA7', underline: {} })]
      }));
    }
    last = m.index + tok.length;
  }
  push(text.slice(last));
  return out.length ? out : [new TextRun({ text: '', ...base })];
}

const kids = [];
const lines = src.split('\n');
let i = 0;

const cellsOf = row => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

while (i < lines.length) {
  const ln = lines[i];

  /* fenced code — one Paragraph per line; \n inside a run is not allowed */
  if (ln.startsWith('```')) {
    i++;
    const buf = [];
    while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
    i++;
    buf.forEach((l, n) => kids.push(new Paragraph({
      children: [new TextRun({ text: l || ' ', font: MONO, size: 18, color: 'E7EDF5' })],
      shading: { type: ShadingType.CLEAR, fill: DEEP },
      spacing: { before: n === 0 ? 120 : 0, after: n === buf.length - 1 ? 160 : 0, line: 260 },
      indent: { left: 170, right: 170 }
    })));
    continue;
  }

  /* table */
  if (/^\s*\|/.test(ln) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
    const head = cellsOf(ln);
    i += 2;
    const body = [];
    while (i < lines.length && /^\s*\|/.test(lines[i])) body.push(cellsOf(lines[i++]));
    const n = head.length;
    const w = Math.floor(CONTENT_W / n);
    const widths = Array(n).fill(w);
    widths[n - 1] = CONTENT_W - w * (n - 1);      // must sum exactly
    const cell = (t, isHead, idx) => new TableCell({
      width: { size: widths[idx], type: WidthType.DXA },
      shading: isHead ? { type: ShadingType.CLEAR, fill: 'F1F3F5' } : undefined,
      margins: { top: 80, bottom: 80, left: 110, right: 110 },
      children: [new Paragraph({
        children: runs(t, isHead ? { bold: true, size: 18, color: GREY } : {}),
        spacing: { before: 0, after: 0 }
      })]
    });
    kids.push(new Table({
      columnWidths: widths,
      width: { size: CONTENT_W, type: WidthType.DXA },
      rows: [new TableRow({ tableHeader: true, children: head.map((h, x) => cell(h, true, x)) })]
        .concat(body.map(r => new TableRow({ children: r.map((c, x) => cell(c, false, x)) })))
    }));
    kids.push(new Paragraph({ text: '', spacing: { after: 160 } }));
    continue;
  }

  if (/^\s*(---|___|\*\*\*)\s*$/.test(ln)) {
    kids.push(new Paragraph({
      text: '', spacing: { before: 160, after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E1E4E7' } }
    }));
    i++; continue;
  }

  let m = /^(#{1,4})\s+(.*)$/.exec(ln);
  if (m) {
    const lvl = m[1].length, txt = m[2];
    const spec = {
      1: { size: 40, color: DEEP, before: 0, after: 200, heading: HeadingLevel.HEADING_1, caps: true },
      2: { size: 28, color: DEEP, before: 360, after: 120, heading: HeadingLevel.HEADING_2 },
      3: { size: 23, color: DEEP, before: 260, after: 100, heading: HeadingLevel.HEADING_3 },
      4: { size: 21, color: DEEP, before: 200, after: 80, heading: HeadingLevel.HEADING_4 }
    }[lvl];
    kids.push(new Paragraph({
      heading: spec.heading,
      spacing: { before: spec.before, after: spec.after },
      border: lvl === 1 ? { bottom: { style: BorderStyle.SINGLE, size: 18, color: RED } } : undefined,
      children: runs(txt, { bold: true, size: spec.size, color: spec.color, allCaps: !!spec.caps })
    }));
    i++; continue;
  }

  if (ln.startsWith('>')) {
    const buf = [];
    while (i < lines.length && lines[i].startsWith('>')) buf.push(lines[i++].replace(/^>\s?/, '').trim());
    kids.push(new Paragraph({
      children: runs(buf.join(' ')),
      shading: { type: ShadingType.CLEAR, fill: 'FDF4F4' },
      border: { left: { style: BorderStyle.SINGLE, size: 18, color: RED } },
      indent: { left: 200, right: 200 }, spacing: { before: 160, after: 160, line: 300 }
    }));
    continue;
  }

  m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(ln);
  if (m) {
    const ordered = /\d+\./.test(m[2]);
    while (i < lines.length) {
      const mm = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
      if (!mm) {
        if (lines[i].startsWith('  ') && lines[i].trim() && kids.length) { i++; continue; }
        break;
      }
      kids.push(new Paragraph({
        children: runs(mm[3]),
        numbering: ordered ? { reference: 'nums', level: 0 } : undefined,
        bullet: ordered ? undefined : { level: 0 },
        spacing: { before: 40, after: 40, line: 300 }
      }));
      i++;
    }
    continue;
  }

  if (!ln.trim()) { i++; continue; }

  const buf = [];
  while (i < lines.length && lines[i].trim() &&
         !/^(#{1,4}\s|```|>|\s*\||\s*([-*]|\d+\.)\s|\s*(---|___|\*\*\*)\s*$)/.test(lines[i])) {
    buf.push(lines[i++].trim());
  }
  if (buf.length) kids.push(new Paragraph({
    children: runs(buf.join(' ')), spacing: { before: 80, after: 80, line: 300 }
  }));
}

const doc = new Document({
  numbering: {
    config: [{
      reference: 'nums',
      levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START,
                 style: { paragraph: { indent: { left: 460, hanging: 260 } } } }]
    }]
  },
  sections: [{ properties: { page: PAGE }, children: kids }]
});

Packer.toBuffer(doc).then(b => { fs.writeFileSync(outPath, b); console.log('wrote', outPath, (b.length / 1024 | 0) + 'KB'); });
