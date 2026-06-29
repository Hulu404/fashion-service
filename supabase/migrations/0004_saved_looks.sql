-- Block 5: favourites. A saved look is one generated outfit the user kept.
-- The full look object is stored as JSON so Favourites can re-render the exact
-- card; look_key is a stable content hash used for dedupe + save/unsave toggle.
create table if not exists public.saved_looks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  look_key   text not null,
  look       jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, look_key)
);

create index if not exists saved_looks_user_created_idx
  on public.saved_looks (user_id, created_at desc);

alter table public.saved_looks enable row level security;

drop policy if exists "Saved looks are viewable by owner" on public.saved_looks;
create policy "Saved looks are viewable by owner"
  on public.saved_looks for select
  using (auth.uid() = user_id);

drop policy if exists "Saved looks are insertable by owner" on public.saved_looks;
create policy "Saved looks are insertable by owner"
  on public.saved_looks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Saved looks are deletable by owner" on public.saved_looks;
create policy "Saved looks are deletable by owner"
  on public.saved_looks for delete
  using (auth.uid() = user_id);
