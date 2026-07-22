# SportPharm Content Studio — going live (uploads + shared review)

The page works right now in **demo mode** (saves to your own browser only; uploads are session previews).
To make it a real shared tool — where the director's approvals sync back to you and uploaded finals are saved
for everyone — connect a free **Supabase** project. About 15 minutes, mostly clicks.

---

## 1. Create a Supabase project
1. Go to https://supabase.com → sign in → **New project** (free tier is fine).
2. Name it e.g. `sportpharm-review`, set a database password, pick a region, **Create**.
3. Wait ~2 min for it to provision.

## 2. Create the database table + storage bucket
In the Supabase dashboard → **SQL Editor** → **New query** → paste this and **Run**:

```sql
-- shared review state (approvals, scheduling, notes, uploaded-file metadata)
create table if not exists public.kv (
  k text primary key,
  v jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.kv enable row level security;

-- any signed-in reviewer can read/write the review state
create policy "reviewers read"   on public.kv for select to authenticated using (true);
create policy "reviewers write"  on public.kv for insert to authenticated with check (true);
create policy "reviewers update" on public.kv for update to authenticated using (true);
create policy "reviewers delete" on public.kv for delete to authenticated using (true);

-- realtime so the director's changes appear on your screen
alter publication supabase_realtime add table public.kv;
```

Then create the file bucket → **Storage** → **New bucket**:
- Name: **`finals`**
- **Public bucket: ON** (so uploaded images/PDFs preview in the dashboard)
- Create.

Add upload permission → Storage → **Policies** → on the `finals` bucket, **New policy** → *For full customization*, paste:

```sql
-- signed-in reviewers can upload / manage files; anyone can view (public bucket)
create policy "reviewers upload" on storage.objects for insert to authenticated with check (bucket_id = 'finals');
create policy "reviewers delete" on storage.objects for delete to authenticated using (bucket_id = 'finals');
create policy "public read"      on storage.objects for select to public using (bucket_id = 'finals');
```

## 3. Lock sign-in to just your team
Authentication → **Providers** → **Email**: make sure it's enabled.
Authentication → **Providers** → turn **"Allow new users to sign up" OFF** (so only people you add can get in).
Authentication → **Users** → **Add user** → add yourself and the marketing director by email (invite / create).
> Sign-in is passwordless: they enter their email, get a one-time link, click it, they're in.

## 4. Paste your keys into the page
In Supabase → **Project Settings → API**, copy:
- **Project URL** (looks like `https://xxxx.supabase.co`)
- **anon public** key

Open `index.html` in this repo (GitHub → the file → ✏️ edit) and set the two values near the top of the script:

```js
const SB_CFG = {
  url: "https://xxxx.supabase.co",   // ← your Project URL
  key: "eyJhbGciOi...long string..." // ← your anon public key
};
```

Commit. GitHub Pages redeploys in ~1 minute. Reload the page — the badge should read **● Live**, and you'll
get a sign-in screen. (The anon key is safe to put in the page; it only allows what the policies above permit.)

---

## What you get once live
- **Uploads are saved** to Supabase Storage and visible to everyone (not just your browser).
- **Approvals, scheduling, and notes sync** — the director's decisions show up on your screen (realtime).
- **Sign-in is invite-only** — only the emails you added in step 3 can get in.

Nothing else about the tool changes — same campaigns, same workflow (approve direction → approve assets → schedule).
