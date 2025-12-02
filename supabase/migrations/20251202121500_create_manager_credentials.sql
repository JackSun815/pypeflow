-- Create a dedicated table to store manager login credentials in the database
-- so that manager logins work consistently across environments (localhost, pypeflow.com, etc.).
-- NOTE: Passwords are stored as bcrypt hashes, never in plain text.

create table if not exists public.manager_credentials (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text,
  role text not null default 'manager',
  agency_id uuid references public.agencies(id) on delete set null,
  agency_subdomain text,
  super_admin boolean default false,
  developer boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.manager_credentials enable row level security;

-- Allow public (anon + authenticated) to read manager credential records.
-- This exposes only the bcrypt hash and metadata to the client,
-- which then performs password comparison locally.
create policy "manager_credentials_public_select"
  on public.manager_credentials
  for select
  to anon, authenticated
  using (true);

-- Only authenticated users (e.g. admins / managers from the app) can insert/update rows.
create policy "manager_credentials_insert"
  on public.manager_credentials
  for insert
  to authenticated
  with check (true);

create policy "manager_credentials_update"
  on public.manager_credentials
  for update
  to authenticated
  using (true)
  with check (true);


