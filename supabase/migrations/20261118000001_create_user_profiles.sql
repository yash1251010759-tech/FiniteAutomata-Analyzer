create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text,
  created_at timestamptz not null default now(),
  constraint profiles_username_format
    check (username is null or username ~ '^[a-z0-9_]{3,30}$')
);

insert into public.profiles (id)
select id
from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;

grant select, update on table public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    nullif(pg_catalog.lower(new.raw_user_meta_data ->> 'username'), ''),
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), '')
  );
  return new;
end;
$$;

drop trigger if exists create_profile_for_new_auth_user on auth.users;
create trigger create_profile_for_new_auth_user
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();
