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

## Once this is live

- The public GitHub Pages copy should be taken down or reduced to nothing. It
  is currently readable by anyone with the link, which is why no real KPI
  figures were ever seeded into `hq-data.js`.
- The passcode gate in `hq-app.js` becomes redundant — Entra is the real gate.
  Leave it or remove it, but do not rely on it; it is a door, not a lock.
