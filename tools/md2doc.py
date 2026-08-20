#!/usr/bin/env python3
"""Turn one of our Markdown docs into a standalone HTML page, and a PDF.

Written rather than pulled in: there is no markdown library on this machine
and no pandoc, and this only has to handle the subset our docs actually use —
headings, tables, fenced code, blockquotes, lists, rules, bold, inline code
and links. Anything fancier would be a dependency for no gain.

    python3 tools/md2doc.py azure/SETUP.md "SportPharm HQ — Azure setup"
"""
import html
import re
import subprocess
import sys
from pathlib import Path

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def inline(t: str) -> str:
    t = html.escape(t)
    # code first, so nothing inside a span of code gets bolded or linked
    holds: list[str] = []

    def hold(m):
        holds.append(m.group(1))
        return f"\x00{len(holds) - 1}\x00"

    t = re.sub(r"`([^`]+)`", hold, t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*([^*]+)\*(?![\w*])", r"<em>\1</em>", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', t)
    t = re.sub(r"\x00(\d+)\x00", lambda m: f"<code>{holds[int(m.group(1))]}</code>", t)
    return t


def convert(md: str) -> str:
    out, i, lines = [], 0, md.split("\n")
    while i < len(lines):
        ln = lines[i]

        if ln.startswith("```"):                                    # fenced code
            lang = ln[3:].strip()
            i += 1
            buf = []
            while i < len(lines) and not lines[i].startswith("```"):
                buf.append(html.escape(lines[i]))
                i += 1
            i += 1
            out.append(f'<pre class="code" data-lang="{lang}"><code>' + "\n".join(buf) + "</code></pre>")
            continue

        if re.match(r"^\s*\|", ln) and i + 1 < len(lines) and re.match(r"^\s*\|[\s:|-]+\|\s*$", lines[i + 1]):
            def cells(row):
                return [c.strip() for c in row.strip().strip("|").split("|")]
            head = cells(ln)
            i += 2
            body = []
            while i < len(lines) and re.match(r"^\s*\|", lines[i]):
                body.append(cells(lines[i]))
                i += 1
            out.append("<table><thead><tr>" +
                       "".join(f"<th>{inline(c)}</th>" for c in head) +
                       "</tr></thead><tbody>" +
                       "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in body) +
                       "</tbody></table>")
            continue

        if re.match(r"^\s*(---|___|\*\*\*)\s*$", ln):
            out.append("<hr>"); i += 1; continue

        m = re.match(r"^(#{1,4})\s+(.*)$", ln)
        if m:
            lvl = len(m.group(1))
            out.append(f"<h{lvl}>{inline(m.group(2))}</h{lvl}>"); i += 1; continue

        if ln.startswith(">"):
            buf = []
            while i < len(lines) and lines[i].startswith(">"):
                buf.append(lines[i].lstrip("> ").rstrip()); i += 1
            out.append("<blockquote>" + inline(" ".join(buf)) + "</blockquote>")
            continue

        m = re.match(r"^(\s*)([-*]|\d+\.)\s+(.*)$", ln)
        if m:
            ordered = bool(re.match(r"\d+\.", m.group(2)))
            tag = "ol" if ordered else "ul"
            items = []
            while i < len(lines):
                mm = re.match(r"^(\s*)([-*]|\d+\.)\s+(.*)$", lines[i])
                if not mm:
                    # a wrapped continuation line belongs to the item above
                    if items and lines[i].startswith("  ") and lines[i].strip():
                        items[-1] += " " + inline(lines[i].strip()); i += 1; continue
                    break
                items.append(inline(mm.group(3))); i += 1
            out.append(f"<{tag}>" + "".join(f"<li>{x}</li>" for x in items) + f"</{tag}>")
            continue

        if not ln.strip():
            i += 1; continue

        buf = []
        while i < len(lines) and lines[i].strip() and not re.match(r"^(#{1,4}\s|```|>|\s*\||\s*([-*]|\d+\.)\s)", lines[i]):
            buf.append(lines[i].strip()); i += 1
        if buf:
            out.append("<p>" + inline(" ".join(buf)) + "</p>")
    return "\n".join(out)


CSS = """
*{box-sizing:border-box}
body{max-width:52rem;margin:0 auto;padding:3rem 2rem 4rem;
 font:16px/1.65 -apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#15202b;background:#fff}
h1{font-size:2rem;font-weight:900;letter-spacing:-.03em;margin:0 0 .3rem;
 padding-bottom:.7rem;border-bottom:3px solid #d6202a;text-transform:uppercase}
h2{font-size:1.25rem;font-weight:800;letter-spacing:-.02em;margin:2.4rem 0 .7rem;color:#0f1d33}
h3{font-size:1rem;font-weight:800;margin:1.6rem 0 .4rem;color:#0f1d33}
p{margin:.7rem 0}
a{color:#337fa7}
code{font:.88em/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;
 background:#f1f3f5;padding:.1em .35em;border-radius:4px}
pre.code{background:#0f1d33;color:#e7edf5;padding:1rem 1.1rem;border-radius:8px;
 overflow-x:auto;font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;margin:1rem 0}
pre.code code{background:none;padding:0;color:inherit}
table{width:100%;border-collapse:collapse;margin:1.1rem 0;font-size:.94rem}
th{text-align:left;font-size:.7rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
 color:#566371;padding:.5rem .6rem;border-bottom:2px solid #0f1d33}
td{padding:.55rem .6rem;border-bottom:1px solid #e1e4e7;vertical-align:top}
blockquote{margin:1.2rem 0;padding:.8rem 1.1rem;background:#fdf4f4;
 border-left:4px solid #d6202a;border-radius:0 6px 6px 0}
blockquote p{margin:0}
hr{border:none;border-top:1px solid #e1e4e7;margin:2.2rem 0}
ul,ol{margin:.7rem 0;padding-left:1.4rem}
li{margin:.35rem 0}
strong{font-weight:700;color:#0f1d33}
@page{margin:16mm}
@media print{body{padding:0;max-width:none}
 h2{break-after:avoid}table,pre.code,blockquote{break-inside:avoid}}
"""


def main():
    src = Path(sys.argv[1])
    title = sys.argv[2] if len(sys.argv) > 2 else src.stem
    body = convert(src.read_text())
    page = (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f"<title>{html.escape(title)}</title><style>{CSS}</style></head><body>{body}</body></html>")

    out_html = src.with_suffix(".html")
    out_html.write_text(page)
    print(f"html -> {out_html}")

    out_pdf = src.with_suffix(".pdf")
    r = subprocess.run(
        [CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
         f"--print-to-pdf={out_pdf}", out_html.resolve().as_uri()],
        capture_output=True, text=True, timeout=120)
    if out_pdf.exists():
        print(f"pdf  -> {out_pdf} ({out_pdf.stat().st_size // 1024}KB)")
    else:
        print("pdf failed:", (r.stderr or "")[-400:])


if __name__ == "__main__":
    main()
