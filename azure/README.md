# Moving SportPharm HQ onto Azure

This folder is what turns HQ from a public static page into a private
tenant-only app that can send mail and hold real numbers. Nothing here is
deployed yet — it is written and ready to go.

## Why Azure specifically

SportPharm is already a Microsoft tenant (Outlook, company accounts). That
makes Azure the cheap option rather than the fashionable one:

- **Sign-in already exists.** Entra ID means Brandon, Jessie, Julia and Marissa
  use the accounts they already have. No new passwords, and offboarding someone
  removes their HQ access at the same time it removes their email.
- **Mail sends as the company, not on behalf of it.** Microsoft Graph sends
  from a real SportPharm mailbox in their own tenant, so SPF, DKIM and DMARC
  all pass and a copy lands in Sent Items. A third-party mailer putting
  `@sportpharm.com` in the From line does none of that and gets junked.
- **A place to keep a secret.** Which is the whole blocker on both the
  WooCommerce pull and the KPI figures.

## What gets deployed

```
azure/
  staticwebapp.config.json   auth + routing: Entra ID, this tenant only,
                             no anonymous route at all
  api/sendOrder/index.js     POST — sends an order through Graph
  api/woo/index.js           GET  — WooCommerce totals, credentials server-side
```

The HQ bundle itself (`index.html`, `hq-*.js`, `hq.css`, `assets/`,
`campaigns/`) is copied in alongside them as the static content.

## Steps

1. **App registration** in Entra ID. Note the tenant ID, client ID; create a
   client secret. Add the **application** permission `Mail.Send` under Microsoft
   Graph and grant admin consent.
2. **Scope the mail permission down.** By default `Mail.Send` (application) can
   send as *any* mailbox in the tenant. Restrict it:
   ```powershell
   New-ApplicationAccessPolicy -AppId <CLIENT_ID> `
     -PolicyScopeGroupId orders@sportpharm.com `
     -AccessRight RestrictAccess `
     -Description "SportPharm HQ may only send as the orders mailbox"
   ```
3. **Create the Static Web App** (Standard tier — Free does not support a
   custom Entra registration). Point it at this repo.
4. **Replace `<TENANT_ID>`** in `staticwebapp.config.json` with the real tenant
   ID. This is what stops any Microsoft account in the world from signing in;
   the default AAD provider is multi-tenant.
5. **Application settings** — Configuration → Application settings:

   | Setting | Value |
   |---|---|
   | `AAD_CLIENT_ID` / `AAD_CLIENT_SECRET` | the app registration, for sign-in |
   | `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET` | the same registration, for Graph |
   | `SEND_AS` | `orders@sportpharm.com` |
   | `ALLOWED_TO` | `orders@sportpharm.com,AdminUnit@sportpharm.com` |
   | `WOO_URL`, `WOO_KEY`, `WOO_SECRET` | the store, key created **read-only** |

6. **Point HQ at the endpoint.** In `hq-config.js`:
   ```js
   window.SPHQ_MAIL = { endpoint: '/api/sendOrder', from: 'orders@sportpharm.com' };
   ```
   Until this is set, `HQ.mailer.ready()` is false and the Send button explains
   what is missing rather than appearing to work.

## Two things worth being deliberate about

**`ALLOWED_TO` is not optional.** Without it, anyone who can sign in to HQ can
use the company tenant to send mail to any address. It is three lines of config
and it is the difference between a send button and an open relay.

**Create the WooCommerce key read-only.** The KPI grid only ever reads totals.
A read/write key in an app setting is a standing risk for no benefit, and
`api/woo` deliberately calls the `reports/*` endpoints rather than the orders
list so customer records never cross the boundary in the first place.

## People who do not have an @sportpharm.com address

Most of them will not, and it does not matter. This is what Entra **B2B guest
accounts** are for, and it is why the tenant pin in `staticwebapp.config.json`
can stay exactly as it is.

A guest is invited by whatever address they already use — `@enovachem.com`,
gmail, anything. They become a guest object in *SportPharm's* directory, so
the app is still single-tenant and `openIdIssuer` stays pinned. How they prove
who they are depends on what they have:

| What the guest has | How they sign in |
|---|---|
| Their own Entra tenant | Their normal work login, SSO |
| A personal Microsoft account | That account |
| **Neither** | **Email one-time passcode** — Entra mails them a code |

That last row is the important one. `enovachem.com` has **no Microsoft
tenant** — `login.microsoftonline.com` returns `AADSTS90002: Tenant not found`
for it. So one-time passcode is the route for Enovachem, and it needs nothing
from Enovachem's side: no tenant, no admin, no software. Turn it on under
External Identities → All identity providers → Email one-time passcode.

**Do not make the app multi-tenant to solve this.** It looks like the obvious
answer and it means any Microsoft tenant on earth can sign in unless you also
validate the `tid` claim against an allowlist in every Function. Same class of
mistake as leaving `ALLOWED_TO` empty on the mailer. Guests into one pinned
tenant is both simpler and tighter.

**The address never decides what someone can see.** Company is set when you
invite them, in HQ's own Team page. Domain matching exists as a convenience
for addresses we recognise, and an unrecognised domain resolves to no company
at all — which means they see nothing until a person assigns them. That is the
safe direction to fail.

## Retiring the public URL

Decided: once Azure is up, the HQ URL goes. Three things have to happen in
order, and the first one is the one people forget.

**1. Move the Content Studio too, or the takedown breaks it.** `/campaigns/`
is served from the same repo, and Brandon and Jessie hold links straight to
it. Pulling the Pages site pulls the Studio with it. Both of them have
@sportpharm.com accounts, so the Studio can sit behind the same Entra login —
but it has to move first, not after.

**2. Kennady cannot sign in as things stand.** Her account is
`kennady.nickell@gmail.com`, and `staticwebapp.config.json` pins sign-in to
the SportPharm tenant. She needs either a B2B guest invite or a
@sportpharm.com mailbox. Sort this before cutover, not on the day.

**3. Turning off Pages does not un-publish anything.** The repo is public, so
every past version of every file stays readable at
github.com/kennadyscott/sportpharm-content-review — including the internal
strategy text that was stripped from the live bundle back in July. It is
still in the history today.

Deleting the Pages deployment closes the website and nothing else. To actually
close the exposure, **make the repo private** — one setting, takes effect
immediately, and it covers the history as well as the current files. Rewriting
history instead is not worth it: forks, clones and caches survive it, and
nobody can prove they got them all.

Order of operations: Studio moved → Kennady's access sorted → repo set to
private (which takes Pages down with it).

## Also once this is live

The passcode gate in `hq-app.js` becomes redundant — Entra is the real gate.
Leave it or remove it, but do not rely on it; it is a door, not a lock.

## The thing Azure does not fix

Each person's HQ still lives in their own browser. A handoff to Julia only
reaches her when her browser next loads. Multi-user needs a database behind
the same Entra login — Supabase, or Azure Table Storage via a third Function.
It changes nothing about the UI and everything about whether handoffs work,
so it is worth settling before this goes to the team.
