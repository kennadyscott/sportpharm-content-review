# SportPharm HQ

The internal hub for everything SportPharm: the work, the CMS that feeds the
public site, the content plan, the campaign briefs, the brand decisions,
analytics, platform spend, and the team.

**Live:** <https://kennadyscott.github.io/sportpharm-content-review/> — HQ at the
root, the Content Studio at `/campaigns/`. Deploy = `git push` to `main` on
**`kennadyscott/sportpharm-content-review`**; Pages rebuilds in ~60s.

> **This page is public.** The seat picker is a UI overlay, not a gate — the
> full source has always been readable without credentials, which is also true
> of the Studio and always was. Nothing in either bundle should be anything you
> would mind a competitor reading. Internal channel strategy was stripped on
> 2026-07-29 for exactly this reason; do not put it back. When Supabase Auth
> lands, private content loads after sign-in and never ships in the bundle.

**Source of truth:** `~/Documents/Claude/sportpharm-hq/`
**Preview:** launch config `sportpharm-hq` (port 4196) serves `/tmp/sportpharm-hq`.
After edits: `rm -rf /tmp/sportpharm-hq && cp -R ~/Documents/Claude/sportpharm-hq /tmp/sportpharm-hq`

It is a port of **Kindred HQ** (`~/Documents/Claude/kindred-hq/`) — same shell,
router, board, sheet and command palette, re-skinned to SportPharm and with two
substitutions: Outreach HQ is gone, and a CMS was added.

---

## Signing in

Seat-picker login. Passcode for every seat is `summit-anchor-40`.

> Rotated 2026-07-29. The previous passcode (`sportpharm`) was briefly readable
> in a git history published by a misconfigured deploy — see DEPLOY.md. It is
> burned; do not reuse it.

| Seat | Role | |
|---|---|---|
| Brandon Welch | Owner | President |
| Jessie T | Editor | Marketing |
| Kennady Scott | Owner | Build & web |

| Role | Can |
|---|---|
| Owner | Everything, including managing the team and clearing their own writing |
| Editor | Write, edit, schedule, approve someone else's work, comment |
| Viewer | Read and leave notes |

### What the gate is (and isn't)

The login is a **door, not a lock**. Passcodes are lightly hashed in
localStorage, all data lives in the visitor's own browser, and anyone with
devtools is past it in a minute. That is fine while it is the three of you on a
private link. **Before this URL goes anywhere else**, connect Supabase Auth —
see below. There is a launch gate on the Today page saying exactly this.

---

## The modules

**Today** · **Project Planning** · **Idea Bank** · **Content** (Articles ·
Media · Plan) · **Campaigns** · **Branding** · **Analytics** · **Platforms** ·
**Team** · **Settings**

### Campaigns is the Content Studio

This one is different on purpose, and it matters.

`campaigns/index.html` **is** the existing SportPharm Content Studio — the same
329KB app that is live at
<https://kennadyscott.github.io/sportpharm-content-review/>, holding all eleven
campaign briefs and sixty-four drafted assets, Brandon and Jessie's comment
threads, the weekly calendars, the Meta ad mockups, the creator kits and the
per-campaign ROI tables. It was copied in whole and mounted in an iframe.

It keeps **its own Supabase project** (`vleudvlmvnuvoipgcmfc`) and **its own
sign-in**, deliberately. Nothing was migrated, so every approval and note the
team has already left is exactly where it was. You will see its own sign-in
inside the frame the first time.

- `#/campaigns` — HQ's index of the eleven campaigns
- `#/campaigns/<id>` — the Studio, deep-linked with its own `?c=<id>`
- `#/campaigns/all` — the Studio, unfiltered

If you need to change a brief, an asset or the review flow, edit
`campaigns/index.html` — **not** `hq-campaigns.js`, which is only the index and
the frame. Keep the copy in sync with the `kennadyscott/sportpharm-content-review`
repo (a clone sits at `/tmp/sportpharm-review-git`).

### The CMS

`hq-cms.js` + the `articles` / `media` keys in the store.

The field model is ported from `admin.html` in the website repo (title,
auto-slug, excerpt, markdown-lite body, category, tag chips, author, featured
image) plus the three things it did not have:

**Review.** An article moves `draft → review → approved → (scheduled) →
published`. While *Require review* is on in Settings, nothing skips it, and an
**editor cannot approve their own writing** — an owner can, so a three-person
team is never deadlocked. Approval is also blocked until all five guardrails
are ticked, and the error names the ones that aren't:

- OTC language only · No endorsement implied · Testimonials disclosed ·
  Medical disclaimer · Claims sourced

**Scheduling.** Approved pieces can take a future date. With no server behind
this, a scheduled article goes live on the **first page load after that date**,
not to the minute. Fine for a blog; not fine for a price deadline. There is a
launch gate saying so.

**A publish feed.** `Store.publishedFeed()` returns exactly the shape the public
site should read. The Articles page can copy it as JSON; Settings can download it.

### The block editor

An article body is **a stack of blocks you assemble**, the way a page gets built
in Squarespace — not a markdown textarea. The ⊕ between blocks opens a
searchable, grouped inserter; blocks drag to reorder, duplicate and delete.

| Group | Blocks |
|---|---|
| Essentials | Text · Heading · Image · Button · Line · Spacer |
| Layout | Image + text · Two columns · Gallery |
| Editorial | Quote · List · Callout · Video |
| **SportPharm** | **Product · Offer code · Disclaimer** |

That last group is the reason for building it rather than buying it. The
Product block pulls a real rub with its real price; the Offer block carries a
promo code (and warns that it has to exist in-store first); the Disclaimer block
emits the medical disclaimer worded correctly, every time, so nobody retypes it.

`HQ.renderBlocks()` is the single renderer — the preview and the `html` in the
published feed both come out of it, so what a writer sees is what the site gets.
Typing never re-renders the page, so the caret stays put; writes debounce.

Blocks live on `article.blocks`. `article.body` is kept in sync as plain text so
search, excerpts and read-time keep working on something simple. Old
markdown-only articles migrate automatically via `blocksFromText()`.

### Series

An article can belong to a **series** — a hub page that pulls its own articles.
`ARTICLE_SERIES` in `hq-data.js` is the list; tagging a piece to one is what
puts it on that page. The feed carries `series`, so the hub filters on it
instead of anyone hand-listing articles.

Two are seeded.

**Athlete Hub** (`articles.html`) — the **nine articles currently live on
sportpharm.com/news/**, pulled 2026-07-28 and converted into blocks so they are
editable here instead of trapped in WordPress. They live in their own file,
`hq-articles-live.js`, and every record carries `sourceUrl` pointing at the
canonical original (shown as a link in the editor sidebar). They are seeded as
**published**, because they are — with all five guardrails ticked, since the
company has already vetted them.

Five hero images point at sportpharm.com's own uploads and are stable. Four
originals were on LinkedIn's CDN behind expiring signed URLs, or had no hero at
all — those are left blank rather than seeded with a link that 404s in a few
weeks. They need real images before the hub renders them.

**Push Through or Stop?** (`push-through-or-stop.html`) — six
drafts already blocked out from the hub page's own content — soreness vs signal,
recurring pain, training decisions, mindset, modifications, and when to get
checked. Their images live in `assets/articles/` (compressed from the 9.7MB the
zip shipped to 1.5MB).

---

## Where data lives

Everything reads and writes through **`hq-store.js`** (one adapter). Right now
that adapter is localStorage, so each browser is its own copy.

The exception is Campaigns, which is the Studio and has its own store.

### Going shared / live — and reaching the public site

The user chose **Supabase** for publishing. Two things happen at once:

1. Create a Supabase project (a new one — not the Studio's).
2. Run `supabase/hq.sql` in the SQL editor. It creates:
   - `hq_kv` — the shared workspace, members only, realtime on.
   - `hq_members` — who is allowed in. An auth account alone is not enough.
   - `published_articles` — a **public, read-only view** exposing only published
     articles and only their public fields. Drafts, review notes, guardrail
     checks and author ids never leave the table.
3. Create your account, then insert your `hq_members` owner row (bottom of the
   SQL). Until one row exists, nothing is readable — including by you.
4. Paste the project URL and anon key into `hq-config.js`.
5. Turn **off** "Allow new users to sign up" in Authentication → Providers.

Then `articles.html` on the website repo fetches the feed client-side:

```js
const SB = 'https://<project>.supabase.co';
const KEY = '<anon key>';
const res = await fetch(
  `${SB}/rest/v1/published_articles?select=*&order=published_at.desc`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
);
const articles = await res.json();
```

That is the whole publish pipeline: HQ writes, the static site reads, GitHub
Pages stays where it is, and nothing needs a rebuild.

**Until step 5 is done, "Publish" means published inside HQ.** Review is
finished, the piece is locked and dated — but it is not on the internet. Don't
let anyone believe otherwise; there is a launch gate about this too.

---

## Files

| File | What it is |
|---|---|
| `index.html` | Shell: gate, rail, topbar, sheet, command palette |
| `hq.css` | All styling — SportPharm palette, Bebas Neue + Inter |
| `hq-data.js` | Seed content: team, projects, campaigns index, articles, media, brand, platforms, the launch playbook |
| `hq-store.js` | **The data layer** — swap this file to go live |
| `hq-app.js` | Shell logic: sign-in, nav registry, router, palette, sheet |
| `hq-views.js` | Today, Projects, Branding, Ideas, Analytics, Platforms, Team, Settings |
| `hq-cms.js` | **Articles + media library** — the new build |
| `hq-campaigns.js` | The index and frame in front of the Content Studio |
| `hq-plan.js` | The content plan — planner, board, calendar, launch playbook |
| `hq-cloud.js` / `hq-config.js` | Supabase sync layer + the switch |
| `campaigns/index.html` | **The Content Studio itself** — do not rewrite, keep in sync |
| `supabase/hq.sql` | Shared-mode schema + the public published-articles view |

---

## Conventions

- Brand red `#E0312A`, deep navy `#0B1E3B`. **Bebas Neue for display only** —
  page titles and big numbers. Inter for everything else, because Bebas is
  all-caps and loses too much at UI sizes.
- Bump the `?v=N` query on `hq.css` / the JS tags after edits — the preview
  browser caches hard. Same for any image whose filename you overwrite.
- `⌘K` (or `/`) opens the command palette anywhere. It searches articles,
  campaigns, tasks and projects, and will start an article from whatever you
  typed.
- The user is highly visual and reacts strongly to unrequested redesigns. This
  is Kindred HQ's proven layout on purpose. Confirm before changing look/feel.
- Settled arguments (WasabiRub is red not green; don't redesign the FEEL IT
  WORK page) are listed in the **Branding** tab so they stop being re-litigated.

## Related

- Website repo: `kennadyscott/sportpharm-site` — `HANDOFF.md` and
  `docs/sportpharm-website-project.md` are the full decision log.
- Content Studio repo: `kennadyscott/sportpharm-content-review`.
- Reference app this was ported from: `~/Documents/Claude/kindred-hq/`.
