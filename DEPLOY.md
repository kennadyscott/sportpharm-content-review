# Deploying SportPharm HQ

**Repo:** `kennadyscott/sportpharm-hq` — **private**, on purpose.

HQ ships its content in `hq-data.js`, which the browser downloads in plain
text. That file contains internal material — the President's reasoning for
moving off the marketplace (which the brand rules themselves mark *"internal
only. Never in public creative"*), platform spend figures, offer codes, and
project plans. A public repo or a public URL publishes all of it.

So: **private repo, and a real gate in front of the site.** The seat picker
inside HQ is a door, not a lock; it is not the gate.

---

## Live URL

**https://kennadyscott.github.io/sportpharm-content-review/** — served by
GitHub Pages from the deploy clone (repo `kennadyscott/sportpharm-content-review`).

An earlier plan hosted HQ on Cloudflare Workers at a deliberately unguessable
`*.kennady.workers.dev` address gated by Cloudflare Access. That worker is gone
(it now returns 404) and was never the live site — ignore any `workers.dev` URL.

> ⚠️ **The live site is public and ungated.** `sportpharm-content-review` is a
> **public** repo, so `hq-data.js` — internal reasoning, spend figures, offer
> codes, and the seat passcode — is readable by anyone who has the URL. HQ's
> seat picker is a door, not a lock. Putting a real gate in front (and rotating
> the passcode) is still open.

---

## Deploying after this

The live site is the **deploy clone**, not this repo — see **Deploying** below. Pushing this repo alone does not move the live site.

```bash
cd ~/Documents/Claude/sportpharm-hq
RAW=$(security find-generic-password -s "gh:github.com" -w)
TOKEN=$(printf '%s' "${RAW#go-keyring-base64:}" | base64 -d)
AUTH=$(printf 'x-access-token:%s' "$TOKEN" | base64)
git add -A && git commit -m "…"
git -c http.extraheader="Authorization: Basic $AUTH" push origin HEAD
```

Bump the `?v=N` on the script and stylesheet tags in `index.html` whenever you
change JS or CSS, or browsers will serve the old copy.

---

## What about the Content Studio's existing URL?

Untouched. `kennadyscott/sportpharm-content-review` is still public and still
live at <https://kennadyscott.github.io/sportpharm-content-review/>, so every
`?c=<id>` review link already shared with Brandon and Jessie keeps working.

The copy inside this repo at `campaigns/index.html` is the same app, mounted so
HQ can show it under **Campaigns**. It talks to the same Supabase project, so
approvals and comment threads are shared between the two — the same review, two
front doors.

**Keep the two copies in sync.** If you edit a brief, do it in one place and
copy the file across:

```bash
cp /tmp/sportpharm-review-git/index.html ~/Documents/Claude/sportpharm-hq/campaigns/index.html
```

---

## Merging the two repos properly, later

Once Supabase Auth is wired into HQ (see the README) the seed content moves out
of `hq-data.js` and into the database. At that point the client bundle carries
no internal material, and HQ could be public like the Studio — one repo, one
deploy, the Studio at `/campaigns/` and a redirect from the old Pages URL.

That is the tidy end state. It is not available until the data moves, which is
why it isn't the setup today.


---

## Incident note — 2026-07-28

The first deploy pointed `assets.directory` at the repo root. Cloudflare's
Workers asset uploader does **not** exclude `.git`, so the full git history was
served publicly for roughly 14 minutes: anyone with the hostname could have
cloned this private repo, including the seat passcode in README.md and the
internal seed data in hq-data.js.

The hostname was never shared, never linked, and `workers.dev` uses a wildcard
certificate so it never appeared in certificate transparency logs. Real-world
exposure is very unlikely but not provably zero.

Remediation, all done:

- `build.sh` assembles `dist/` from an explicit allow-list; wrangler deploys
  that, so nothing can be published by omission.
- The exposed worker was deleted; the site moved to an unguessable name.
- The seat passcode was rotated from `sportpharm` to `summit-anchor-40`. Treat
  the old one as burned.

Still outstanding: **Cloudflare Access**. Until it is on, anyone who has the URL
can read hq-data.js.

## Where the deploy clone lives

`~/.claude-apps/sportpharm-deploy`

**Not `/tmp`.** macOS purges it, and it has now destroyed this clone twice —
the second time it left the directory and an empty `.git` behind, so `cd`
succeeded and every git command failed with "not a git repository". If a
deploy ever reports success but the live site does not move, check that first.

## Deploying

```sh
./bump.sh                     # ?v= on every asset, HQ_BUILD, build.txt — together
# copy changed files into ~/.claude-apps/sportpharm-deploy, then commit and push
```

Then **verify against the served file**, not the local one, and gate the
success message on the check — an ungated `echo` after `&&` chains will
happily claim a deploy that never happened.
