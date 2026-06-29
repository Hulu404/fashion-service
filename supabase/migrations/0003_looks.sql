-- Block 4: generated outfits ("образы").
-- Each row is one generation request and holds its array of 3 looks as JSON.
create table if not exists public.looks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  occasion   text,
  params     jsonb,          -- snapshot of the build params used
  looks      jsonb not null, -- array of generated look objects
  created_at timestamptz not null default now()
);

create index if not exists looks_user_created_idx
  on public.looks (user_id, created_at desc);

alter table public.looks enable row level security;

drop policy if exists "Looks are viewable by owner" on public.looks;
create policy "Looks are viewable by owner"
  on public.looks for select
  using (auth.uid() = user_id);

drop policy if exists "Looks are insertable by owner" on public.looks;
create policy "Looks are insertable by owner"
  on public.looks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Looks are deletable by owner" on public.looks;
create policy "Looks are deletable by owner"
  on public.looks for delete
  using (auth.uid() = user_id);
