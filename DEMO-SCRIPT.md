# SportPharm HQ — demo script

Twelve minutes, five moves. It opens on the mess Brandon already knows about,
and only widens once he has seen it fixed.

**Before you start**

1. Open HQ, sign in.
2. **Settings → Demo data → Load it.** Two orders, a task mid-handoff, some
   messages and four weeks of KPI figures.
3. Check the amber **Demo data** chip is showing top-right. It stays there the
   whole time — the numbers are illustrative and the chip says so, which
   matters the moment somebody photographs the screen.
4. **Settings → Demo data → Clear it** when you are done.

One thing to know: the KPI figures are invented and round. If Brandon asks
what revenue was last week, say so. Everything else on screen — the Oklahoma
State order, its contents, its total — is real, from Julia's own email.

---

## 1 · Open on the problem (2 min) — *Orders*

Go to **Orders**. Open **SP-0001**.

> "This is the Oklahoma State order Julia sent last month. Same order, same
> details — but it was written from scratch in an email, which is why the
> warehouse, invoicing and Enova each read it slightly differently."

Scroll the form. Point at three things and nothing else:

- **Free of charge** — 2 × Super Hot, approved by Brandon. *"On the email
  these were a sentence. Nobody could tell later whether they were free or
  just unbilled."*
- **The total** — $279.95. *"Matches her email to the cent."*
- **Where it is** — Acknowledged. *"Not a status somebody typed. It moved
  because Enova acknowledged it."*

## 2 · The thing they will ask for (1 min) — *Print / PDF*

Hit **Print / PDF**.

> "Same record, as a purchase order. This is what goes in the file and what
> the warehouse picks from."

Close the dialog. Do not linger — the point is that it exists.

## 3 · Send it (1 min) — *Open in Outlook*

Hit **Open in Outlook**.

> "The message is written from the form, so it reads identically every time.
> Julia is not composing anything."

Then close the compose window without sending, and say the honest part:

> "Right now it hands the finished message to Outlook and Julia presses send.
> When this is on Azure it sends straight from orders@sportpharm.com, with a
> copy in that mailbox — so 'did that go out?' has an answer that isn't
> someone's laptop."

## 4 · The move that lands (3 min) — *View as → Dana R · EN*

Bottom of the rail, **View as → Dana R · EN**. Let the screen change before
you say anything.

> "That is the same HQ, seen by Enovachem."

Point out what is *not* there: no Marketing, no projects, no KPIs. One
section, one page.

Open **SP-0001** and scroll to **Talk to Enovachem**. Type a reply as Dana —
*"40 units on hand, picking today"* — and post it.

Switch **View as** back to yourself. The reply is there.

> "One order record. Both companies. Not two systems and an email chain
> between them."

Worth saying plainly, because it is the obvious question: Enovachem are not
on Microsoft. They sign in with whatever address they already use and Entra
emails them a code. Nothing to install on their side.

## 5 · The question he cannot answer today (2 min) — *Analytics → Orders*

Go to **Analytics → Orders**. Go straight to **Given away**.

> "Freebies and SWAG have no price on an order, so they never show up in any
> total. This is the only place that counts them — and it flags any giveaway
> with nobody named as having approved it."

Then **How long each step takes**.

> "Average days from raised to each handoff. Only counts orders that actually
> reached the step, so a stalled one doesn't make the process look faster."

## 6 · Close on the day-to-day (2 min) — *Today*

Back to **Today**.

- **Assigned to you** — the handoff, with the note attached. *"Not just a name
  on a task. The reason travels with it."*
- **Messages** — pick a person, send.
- **The week** — drag an item out of the running log onto Thursday.

> "That is the whole thing. Orders is the piece that pays for itself on day
> one; the rest is where the work actually gets tracked."

---

## What to say when asked

**"Is this live?"** It runs today, and everyone has their own copy in their
own browser — good for showing, not for two people working together. Shared
data is a day's work on Supabase, free, or it comes with the Azure move.

**"What does it cost?"** Nothing to run as it stands. Azure Static Web Apps
Standard is roughly $9/month, and they already pay for Microsoft 365.

**"Can Enovachem see our numbers?"** No — they see the orders addressed to
them and nothing else, not even drafts. *(Be straight if pushed: that is
enforced in the interface today. Before a real Enovachem account exists it has
to be enforced on the server too, and that is part of the Azure work.)*

**"How long?"** Half a day for private hosting and real logins. Another day
for sending as SportPharm, mostly waiting on admin consent.

**"Who has to do something?"** One person with Entra admin rights, for about
half an hour, to register the app. Nothing else touches IT.

---

## Do not demo

- **KPIs** unless asked — the numbers are invented, and the real report has
  customer names in it, which is exactly why it is not loaded.
- **The WooCommerce pull** — not built, and it needs the server first.
- Anything from **Marketing** unless Jessie is in the room. It is a different
  pitch and it dilutes this one.
