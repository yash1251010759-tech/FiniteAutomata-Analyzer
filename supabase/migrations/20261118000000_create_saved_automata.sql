create table if not exists public.saved_automata (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  machine_id text not null,
  name text not null,
  machine_type text not null,
  definition jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, machine_id)
);

alter table public.saved_automata enable row level security;

grant select, insert, update, delete on table public.saved_automata to authenticated;

create policy "Users can read their own automata"
  on public.saved_automata for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own automata"
  on public.saved_automata for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own automata"
  on public.saved_automata for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own automata"
  on public.saved_automata for delete
  to authenticated
  using ((select auth.uid()) = user_id);
