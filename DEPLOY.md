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

**https://sphq-47ae9b.kennady.workers.dev**

The name is deliberately non-obvious. `*.kennady.workers.dev` is a wildcard in
certificate transparency, so the account subdomain is public knowledge but the
worker name is not — and an unguessable one means the URL is not discoverable
while Access is being set up. Access is still the actual gate; this is only
belt-and-braces.

An earlier deploy at `sportpharm-hq.kennady.workers.dev` served the repo's
`.git` directory for about 14 minutes on 2026-07-28. That worker has been
deleted and the seat passcode rotated. See the note at the bottom.

## The 10-minute setup — Cloudflare Access

Free, and it gates the whole site behind an emailed one-time code. Up to 50
people at no cost.

### 1. Connect the repo

1. Sign in at <https://dash.cloudflare.com> (create a free account if needed).
2. **Workers & Pages → Create → Pages → Connect to Git**.
3. Authorise Cloudflare for GitHub and pick **kennadyscott/sportpharm-hq**.
4. Build settings — there is no build step, this is static files:
   - Framework preset: **None**
   - Build command: *leave empty*
   - Build output directory: **`/`**
5. **Save and Deploy.** You get a URL like `sportpharm-hq.pages.dev`.

At this point the site is live but **open to anyone with the link**. Do step 2
before sending it to anybody.

### 2. Put Access in front of it

1. **Zero Trust** in the left sidebar → complete the one-time team setup
   (pick a team name; choose the **Free** plan — it asks for a card and does
   not charge).
2. **Access → Applications → Add an application → Self-hosted**.
3. Application name: `SportPharm HQ`. Session duration: 24 hours or a week.
4. Subdomain: `sphq-47ae9b` · Domain: `kennady.workers.dev`
5. **Add a policy** → Action **Allow** → Include → **Emails**, and list:
   - `kennady.nickell@gmail.com`
   - `brandonw@sportpharm.com`
   - `jessiet@sportpharm.com`
6. Save.

Now anyone hitting the URL is asked for their email, gets a one-time code, and
only those three addresses get in. Adding a fourth person is one line in that
policy.

### 3. Check it

Open the URL in a private window. You should see the Cloudflare code prompt
*before* HQ's seat picker. If HQ loads without the prompt, the Access policy
is not attached to the right hostname — recheck step 2.4.

---

## Deploying after this

`git push` to `main`. Cloudflare rebuilds in under a minute.

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
