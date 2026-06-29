-- Block 2: photo upload + analysis storage.
create extension if not exists pgcrypto;

-- Recognised attributes from a selfie are kept on the profile.
alter table public.profiles add column if not exists body_type    text;
alter table public.profiles add column if not exists color_season text;

-- Wardrobe items recognised from a photo (or, later, added manually).
create table if not exists public.wardrobe_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  source     text not null default 'photo',
  image_path text,
  category   text,
  color_name text,
  color_hex  text,
  material   text,
  style_tags text[] not null default '{}',
  season     text,
  created_at timestamptz not null default now()
);

alter table public.wardrobe_items enable row level security;

drop policy if exists "Wardrobe items are viewable by owner" on public.wardrobe_items;
create policy "Wardrobe items are viewable by owner"
  on public.wardrobe_items for select
  using (auth.uid() = user_id);

drop policy if exists "Wardrobe items are insertable by owner" on public.wardrobe_items;
create policy "Wardrobe items are insertable by owner"
  on public.wardrobe_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "Wardrobe items are updatable by owner" on public.wardrobe_items;
create policy "Wardrobe items are updatable by owner"
  on public.wardrobe_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Wardrobe items are deletable by owner" on public.wardrobe_items;
create policy "Wardrobe items are deletable by owner"
  on public.wardrobe_items for delete
  using (auth.uid() = user_id);

-- Private storage bucket; objects are keyed by "<user_id>/<file>".
insert into storage.buckets (id, name, public)
values ('wardrobe', 'wardrobe', false)
on conflict (id) do nothing;

-- Each user may only touch objects under their own "<user_id>/" prefix.
drop policy if exists "Wardrobe photos: owner upload" on storage.objects;
create policy "Wardrobe photos: owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'wardrobe'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Wardrobe photos: owner read" on storage.objects;
create policy "Wardrobe photos: owner read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'wardrobe'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Wardrobe photos: owner delete" on storage.objects;
create policy "Wardrobe photos: owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'wardrobe'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
