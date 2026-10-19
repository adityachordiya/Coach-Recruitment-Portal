-- Coach Portal moves onto the Ascend Academy database (project "Ascend General",
-- jbiqzdavkwioxhtwchiy), 2026-10-19. The portal's own free Supabase project
-- (hyrvygotkunolcegdfhb) was paused for inactivity; 2027 starts fresh, so
-- nothing is copied across. Run once in the Supabase SQL editor.
--
-- Before running: replace PASTE-PASSWORD-HERE (step 3) with a long
-- random password (`openssl rand -hex 24`). The same password goes into the
-- portal's DATABASE_URL on Vercel:
--   postgresql://coach_portal.jbiqzdavkwioxhtwchiy:<password>@aws-1-us-west-1.pooler.supabase.com:6543/postgres

-- 1. The portal's two tables. Coaches are rows in public.referrers (managed in
--    Ascend OS → Referral Management); owners need no referrer row.
create table if not exists public.coach_accounts (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references public.referrers(id) on delete cascade,
  email text unique not null,
  password_hash text,
  role text not null default 'coach' check (role in ('coach', 'owner')),
  invite_token text,
  invite_token_expires_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists coach_accounts_referrer_id_idx on public.coach_accounts (referrer_id);
create index if not exists coach_accounts_invite_token_idx on public.coach_accounts (invite_token);

create table if not exists public.coach_outreach_log (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.referrers(id) on delete cascade,
  prospect_id uuid,
  contact_name text not null,
  contact_method text not null,
  status text not null default 'Reached Out',
  notes text,
  grade text,
  school text,
  follow_up_date date,
  student_email text,
  student_phone text,
  parent_name text,
  parent_email text,
  parent_phone text,
  created_at timestamptz not null default now()
);
create index if not exists coach_outreach_log_coach_id_idx on public.coach_outreach_log (coach_id);
create index if not exists coach_outreach_log_prospect_id_idx on public.coach_outreach_log (prospect_id);
create index if not exists coach_outreach_log_created_at_idx on public.coach_outreach_log (created_at);

-- 2. Nobody reaches these through the public API keys: RLS on, no policy for
--    anon or authenticated, and their table grants removed.
alter table public.coach_accounts enable row level security;
alter table public.coach_outreach_log enable row level security;
revoke all on public.coach_accounts, public.coach_outreach_log from anon, authenticated;

-- 3. The portal's own login. It can read five columns of referrers (no
--    commission, no notes) and use its two tables. Nothing else in the
--    database: no registrations, payments or revenue.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'coach_portal') then
    create role coach_portal login noinherit password 'PASTE-PASSWORD-HERE';
  end if;
end $$;
grant usage on schema public to coach_portal;
grant select (id, first_name, last_name, email, referral_code, active) on public.referrers to coach_portal;
grant select, insert, update, delete on public.coach_accounts, public.coach_outreach_log to coach_portal;

drop policy if exists coach_portal_all on public.coach_accounts;
create policy coach_portal_all on public.coach_accounts for all to coach_portal using (true) with check (true);
drop policy if exists coach_portal_all on public.coach_outreach_log;
create policy coach_portal_all on public.coach_outreach_log for all to coach_portal using (true) with check (true);
drop policy if exists coach_portal_read on public.referrers;
create policy coach_portal_read on public.referrers for select to coach_portal using (true);

-- 4. The first owner account (Aditya). The query returns the link to set a password.
insert into public.coach_accounts (email, role, invite_token, invite_token_expires_at)
values (
  'aditya.chordiya@ascendspeech.org', 'owner',
  replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  now() + interval '7 days'
)
on conflict (email) do update
  set invite_token = excluded.invite_token,
      invite_token_expires_at = excluded.invite_token_expires_at
returning 'https://coach-recruitment-portal.vercel.app/setup-password?token=' || invite_token as setup_link;
