-- =============================================================================
-- SportPharm HQ — shared workspace schema
--
-- Run this once in the Supabase SQL editor, then paste the project URL and anon
-- key into hq-config.js. That switches HQ from "everyone has their own copy" to
-- one shared workspace with realtime sync.
--
-- Two things happen here:
--   1. hq_kv          — the workspace itself. Signed-in members only.
--   2. published_articles — a public, read-only view of what the CMS published,
--                      for sportpharm.com to fetch. This is the whole point of
--                      choosing Supabase: publishing reaches the live site
--                      without a rebuild and without a backend.
--
-- NOTE: this is HQ's own project. The Content Studio (campaigns/index.html)
-- keeps its own separate Supabase project and its own accounts, on purpose.
-- =============================================================================

-- ------------------------------------------------------------------ workspace
create table if not exists public.hq_kv (
  k          text primary key,
  v          jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.hq_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists hq_kv_touch on public.hq_kv;
create trigger hq_kv_touch before update on public.hq_kv
  for each row execute function public.hq_touch();

-- ------------------------------------------------------------------- members
-- Who is allowed in. A Supabase auth account alone is not enough — the account
-- has to be listed here. That is what stops an open signup becoming a seat.
create table if not exists public.hq_members (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  email      text not null,
  role       text not null default 'editor'
             check (role in ('owner', 'editor', 'viewer')),
  tone       text default 'red',
  title      text,
  created_at timestamptz not null default now()
);

create or replace function public.hq_is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.hq_members m where m.id = auth.uid());
$$;

-- ----------------------------------------------------------------------- RLS
alter table public.hq_kv      enable row level security;
alter table public.hq_members enable row level security;

drop policy if exists hq_kv_read  on public.hq_kv;
drop policy if exists hq_kv_write on public.hq_kv;

create policy hq_kv_read on public.hq_kv
  for select to authenticated
  using (public.hq_is_member());

create policy hq_kv_write on public.hq_kv
  for all to authenticated
  using (public.hq_is_member())
  with check (public.hq_is_member());

drop policy if exists hq_members_read on public.hq_members;
drop policy if exists hq_members_self on public.hq_members;

create policy hq_members_read on public.hq_members
  for select to authenticated
  using (public.hq_is_member());

-- A member may edit their own row (name, title). Roles are changed in the
-- dashboard on purpose — an editor should not be able to promote themselves.
create policy hq_members_self on public.hq_members
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.hq_members where id = auth.uid()));

-- -------------------------------------------------------------------- realtime
-- So an approval on one laptop shows up on the other without a refresh.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hq_kv'
  ) then
    alter publication supabase_realtime add table public.hq_kv;
  end if;
end $$;

-- ============================================================================
-- THE PUBLISHED FEED — what sportpharm.com reads
--
-- HQ stores every article in hq_kv under the key 'articles'. This view unpacks
-- that array and exposes ONLY the published ones, only the public fields.
-- Drafts, review notes, guardrail checks and author ids never leave the table.
--
-- `series` is how a hub page pulls its own articles — e.g. the Push Through or
-- Stop page filters on series = 'push-through-or-stop'. `blocks` is the
-- structured body; `html` is the same thing pre-rendered so a static page can
-- inject it without knowing our block types.
--
-- The view runs with the owner's rights (security_invoker = false), so anon can
-- read it without being able to read hq_kv itself.
-- ============================================================================
create or replace view public.published_articles
with (security_invoker = false) as
select
  a ->> 'slug'                          as slug,
  a ->> 'title'                         as title,
  a ->> 'excerpt'                       as excerpt,
  a ->> 'body'                          as body,
  a ->> 'category'                      as category,
  nullif(a ->> 'series', '')            as series,
  a ->> 'author'                        as author,
  nullif(a ->> 'image', '')             as image,
  coalesce(a -> 'tags', '[]'::jsonb)    as tags,
  coalesce(a -> 'blocks', '[]'::jsonb)  as blocks,
  a ->> 'html'                          as html,
  coalesce(
    nullif(a ->> 'publishedAt', ''),
    a ->> 'date'
  )::timestamptz                        as published_at
from public.hq_kv kv
cross join lateral jsonb_array_elements(kv.v) as a
where kv.k = 'articles'
  and a ->> 'status' = 'published';

grant select on public.published_articles to anon, authenticated;

-- ============================================================================
-- FIRST OWNER
--
-- 1. Create your account in Authentication → Users (or sign up once in HQ).
-- 2. Copy its UUID.
-- 3. Run the insert below. Until at least one row exists here, hq_is_member()
--    is false for everyone and nothing is readable — including by you.
-- ============================================================================
-- insert into public.hq_members (id, name, email, role, tone, title)
-- values ('<your-auth-uuid>', 'Kennady Scott', 'kennady.nickell@gmail.com', 'owner', 'blue', 'Build & web');
--
-- Then the others, once they have accounts:
-- insert into public.hq_members (id, name, email, role, tone, title) values
--   ('<uuid>', 'Brandon Welch', 'brandonw@sportpharm.com', 'owner',  'navy', 'President'),
--   ('<uuid>', 'Jessie T',      'jessiet@sportpharm.com',  'editor', 'red',  'Marketing');
--
-- Finally: Authentication → Providers → Email → turn OFF "Allow new users to
-- sign up", so the only accounts that exist are the ones you made.
