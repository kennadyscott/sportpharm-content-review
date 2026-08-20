# SportPharm HQ — handoff

**Read this first.** It is the current state, the decisions already made, and
the traps that cost real time. Last updated 2026-08-11.

---

## What it is

An internal hub for SportPharm — a group of companies (SportPharm, Enovachem,
Pharmco) run by Brandon Welch. It replaces a specific mess: Julia writing the
fulfilment order to Enovachem from scratch in an email every time, so the
warehouse, invoicing and the vendor each read it slightly differently.

It also carries the team's week, task handoffs, messaging, marketing planning
and a CMS.

| | |
|---|---|
| **Live** | `https://kennadyscott.github.io/sportpharm-content-review/` |
| **Source** | `~/Documents/Claude/sportpharm-hq/` |
| **Deploy clone** | `~/.claude-apps/sportpharm-deploy` |
| **Repo** | `kennadyscott/sportpharm-content-review` (**public** — see Risks) |
| **Also at** | `/campaigns/` — the Content Studio, unchanged, do not restyle |
| **And** | `/order/` — standalone order form, no login, for Julia and Marissa |

## Deploying

```sh
cd ~/Documents/Claude/sportpharm-hq
./bump.sh                 # ?v= on every asset + window.HQ_BUILD + build.txt
# copy changed files into ~/.claude-apps/sportpharm-deploy, commit, push
```

Then **verify against the served file, not the local one**, and gate the
success message on that check. An ungated `echo` after an `&&` chain claimed a
deploy that never happened, and the site sat two builds behind while I said it
was live.

**Never hand-edit `?v=`.** Three things have to agree — the asset version,
`window.HQ_BUILD` and `build.txt` — or the stale-cache guard in `hq-boot.js`
compares the wrong values and silently stops working. That drifted twice, most
recently on 2026-08-11 (assets on 74, the other two on 73).

---

## State: what works today

Everything below is built and verified in a browser against the live URL.

- **Orders** — the core. One record moves draft → sent → acknowledged →
  invoiced → shipped → complete. The message to the vendor is generated from
  the form, so it reads identically every time. Verified against Julia's real
  Oklahoma State order: SP-0001, $279.95, matching her email to the cent.
- **Printed PO** — its own document, not the form with the boxes hidden.
- **Order analytics** — value raised vs open, days to each handoff, who orders
  what, and *what is going out free* (freebies and SWAG carry no price, so they
  appear in no total anywhere else).
- **Inventory / Money / Raise an order / PDF export** — built in a parallel
  session, so I have not driven them end to end. They work; they are not in the
  demo script. Bundles explode by SKU for stock, and only the Trifecta's
  contents are known — the rest are deliberately empty rather than guessed.
- **The week** — ClearK12-style day lists, running log, drag onto a day.
- **Task handoffs** — pass work with a note, passback, "waiting on someone".
- **Messaging** — threads per person plus a Team room.
- **Multi-company** — one HQ; orders carry from/to company and a thread both
  sides post on. A partner sees only orders addressed to them, sent only.
- **Demo mode** — Settings → Demo data, and "View as" in the rail.
- **CMS, campaigns, content plan, KPI grid** — all present.

## State: what is blocked, and on exactly what

All four are blocked on the **same one thing**: HQ is a public static site with
no server, so it can hold no secret and no customer data.

| Blocked | Needs |
|---|---|
| Real KPI figures | A private host |
| Website orders (WooCommerce) | `azure/api/woo` deployed |
| Payment state (Stripe) | `azure/api/stripe` deployed |
| Sending as the company | `azure/api/sendOrder` deployed |

**The code for all of it is written.** These need provisioning, not
development. `azure/SETUP.md` is the handoff for the tenant admin — also built
as `.docx` and `.pdf` via `tools/md2docx.js` and `tools/md2doc.py`.

Until then each of those explains what is missing rather than looking broken.
Send opens Outlook on the web with everything filled in.

---

## Decisions already made — do not re-litigate

- **One HQ, companies as data.** Not one instance per company with a sync
  between them. Two copies of an order can disagree, which is the exact
  problem Orders was built to end.
- **WooCommerce is the source for orders; Stripe only for money.** Stripe sees
  a payment, not a basket — no line items, no SKUs, no address. The checkout
  also takes Affirm, Klarna, Afterpay and Amazon Pay, which may never pass
  through Stripe, so a Stripe-only list would miss orders *and look complete*.
- **Azure, not something else.** They are already a Microsoft tenant, so Entra
  gives real logins with no new passwords, and Graph sends mail genuinely *as*
  the company rather than spoofing the domain.
- **B2B guests into one pinned tenant** — never make the app multi-tenant.
  That lets any Microsoft tenant on earth sign in unless `tid` is also
  allowlisted in every Function.
- **The domain comes last.** `hq.sportpharm.com` on the current public hosting
  would change nothing and make it *worse* — an obscure URL becomes the first
  one anyone would try.
- **sportpharm.com is not touched.** The live WooCommerce store stays exactly
  as it is. HQ is additive, on a subdomain.
- **Do not redesign the Content Studio** (`/campaigns/`). It was reverted
  byte-for-byte once already after an unrequested restyle. "Make it live here"
  is a plumbing request, not licence to reinterpret the design.

## Facts established by checking, not assuming

| | |
|---|---|
| sportpharm.com | WordPress + WooCommerce on Automattic; Entra tenant `c18f5ce2-49ee-4bb9-9c5e-9ddab1991d0c` |
| wasabirub.com | **static GitHub Pages marketing site** — takes no orders |
| enovachem.com | **no Microsoft tenant** (`AADSTS90002`) → guests via emailed code |
| pharmco.com | a *different* tenant — may not be theirs, confirm before inviting |
| DNS (both) | `ns1/ns2.v2640474.hostpapavps.net` — HostPapa VPS |
| `hq.sportpharm.com` | free |
| Store SKUs | **do not match HQ's catalogue**; two products have no SKU at all, including WasabiRub |

---

## Open risks

1. **The repo is public.** Turning off Pages closes the website only — all
   history stays readable, including internal strategy text stripped from the
   live bundle in July. **Setting the repo private is the fix.** Order:
   move `/campaigns/` → sort Kennady's access → set private.
2. **Company scoping is UI, not security.** It is one browser and one
   localStorage; a determined partner could read the whole store. The same
   rules must be enforced server-side as RLS **before a real Enovachem person
   gets an account**.
3. **No shared data — but the adapter is already written.** Each person's HQ
   lives in their own browser, so a handoff to Julia reaches her only when her
   browser next loads. Azure does not fix this on its own.

   `hq-cloud.js` is a **complete Supabase adapter** — per-key sync into
   `hq_kv`, realtime merge, real Supabase accounts — and `supabase/hq.sql` is
   the schema. It is switched off: `SPHQ_CLOUD` in `hq-config.js` is empty on
   both the source and the served bundle. Filling in two values turns live mode
   on. This is a decision, not a build.

   One gotcha already fixed but worth knowing: `hq-cloud.js` synced 13 keys
   while the store had 18 — `orders`, `messages`, `todos`, `kpis` and
   `campReview` were added later and were missing, so live mode would have
   shared the CMS and silently stranded every order. **Keep `KEYS` in step with
   `seed()`.** The Content Studio keeps its own separate Supabase project and
   its own sign-in, deliberately.

   Settle this before it goes to the team — it changes nothing visible and
   everything about whether handoffs actually work.
4. **Two sessions edit this folder.** Sync *everything that differs* when
   deploying, not a hand-picked list — shipping `hq-store.js` without
   `hq-data.js` broke the whole app once.

## Traps that cost real time

- **`node --check` only catches syntax.** An undefined reference passes it and
  kills every module after it. There is a harness pattern in the transcript
  that constructs `Store` and `HQ` in Node and asserts every export resolves —
  use it.
- **Silent no-op edits.** A string replace anchored on text that does not exist
  writes nothing and reports nothing. This happened three times. **Assert the
  anchor.**
- **`URLSearchParams` encodes spaces as `+`.** Correct for a form body, wrong
  in a URL a mail client reads — every word in the order email was separated by
  a plus sign. Use `encodeURIComponent`.
- **`mailto:` / `window.open` must fire inside the click's user activation.**
  Any `await`, `confirm()` or re-render before it and the browser silently
  blocks it.
- **Grid tracks size to max-content.** `1fr` is `minmax(auto, 1fr)`; `auto`
  will not go below min-content. `min-width: 0` on children does not help —
  the *track* needs `minmax(0, 1fr)`. This put the whole page into a
  horizontal scroll.
- **`/tmp` is purged by macOS.** It destroyed the deploy clone twice; the
  second time it left an empty `.git` so `cd` worked and every git command
  failed. Hence `~/.claude-apps/`.
- **A seed only applies to a brand-new store.** Changing `SEED_*` does nothing
  for anyone who has already opened HQ. Write a migration, and only touch data
  that is still recognisably the seed.

---

## If you are picking this up

**Next action is not code.** It is `azure/SETUP.md` reaching the tenant admin
and Part 1 being provisioned. Everything else is downstream of that.

The demo script (`DEMO-SCRIPT.md`, three minutes) is what to show Brandon in
the meantime — load demo data in Settings first, and clear it after.
