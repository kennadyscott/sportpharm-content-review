# Connect Supabase — make notes, assignments & metrics shared

Right now the site saves to each person's own browser. Connecting a free Supabase project makes
everything shared and persistent (notes, approvals, task owners, dates, metrics, and uploaded files),
with invite-style email sign-in. ~10 minutes. Then send Claude the two values at the end.

---

## 1. Create the project
1. Go to https://supabase.com → sign in → **New project** (free tier is fine).
2. Name it `sportpharm-review`, set a database password, pick a region → **Create**. Wait ~2 min.

## 2. Run one SQL block (creates everything)
Left sidebar → **SQL Editor** → **New query** → paste all of this → **Run**:

```sql
-- shared review state (notes, approvals, assignments, dates, metrics, upload metadata)
create table if not exists public.kv (
  k text primary key,
  v jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.kv enable row level security;
drop policy if exists "kv read"   on public.kv;
drop policy if exists "kv insert" on public.kv;
drop policy if exists "kv update" on public.kv;
drop policy if exists "kv delete" on public.kv;
create policy "kv read"   on public.kv for select to authenticated using (true);
create policy "kv insert" on public.kv for insert to authenticated with check (true);
create policy "kv update" on public.kv for update to authenticated using (true);
create policy "kv delete" on public.kv for delete to authenticated using (true);

-- file storage for uploaded assets
insert into storage.buckets (id, name, public)
values ('finals','finals', true)
on conflict (id) do nothing;
drop policy if exists "finals upload" on storage.objects;
drop policy if exists "finals delete" on storage.objects;
drop policy if exists "finals read"   on storage.objects;
create policy "finals upload" on storage.objects for insert to authenticated with check (bucket_id = 'finals');
create policy "finals delete" on storage.objects for delete to authenticated using (bucket_id = 'finals');
create policy "finals read"   on storage.objects for select to public using (bucket_id = 'finals');
```

Then turn on live sync — run this too (if it says kv is "already a member", ignore it):

```sql
alter publication supabase_realtime add table public.kv;
```

## 3. Allow sign-in from the site
Left sidebar → **Authentication** → **URL Configuration**:
- **Site URL:** `https://kennadyscott.github.io/sportpharm-content-review/`
- **Redirect URLs:** add the same URL.
- Save. (Email sign-in is on by default — no other auth setup needed. Sign-in is a one-time link emailed to you.)

*(Optional hardening later: Authentication → Providers → Email → turn OFF "Allow new users to sign up," then add just your team under Authentication → Users. Skip for now if you want it working fast.)*

## 4. Send Claude two values
**Project Settings → API**, copy and send back:
- **Project URL** — `https://xxxx.supabase.co`
- **anon public** key — the long `eyJ...` string

Both are safe to share — the anon key is designed to live in the page, and the SQL policies above are what
actually control access. Claude pastes them in, pushes, and it goes live: you'll get a sign-in screen,
and from then on everything is shared.
