-- Showcase trends for the home page. Public, read-only content.
create table if not exists public.trends (
  id          uuid primary key default gen_random_uuid(),
  number      int not null unique,
  eyebrow     text not null,
  title       text not null,
  description text not null,
  lead        text not null,            -- longer copy shown in the story overlay
  color_story jsonb not null default '[]', -- [{ "name": "...", "hex": "#..." }]
  created_at  timestamptz not null default now()
);

alter table public.trends enable row level security;

-- Trends are public showcase data — anyone may read them.
drop policy if exists "Trends are public" on public.trends;
create policy "Trends are public"
  on public.trends for select
  using (true);

insert into public.trends (number, eyebrow, title, description, lead, color_story) values
  (1, 'Colour of the season', 'Warm neutral',
   'Brown is the new black: softer, richer, calmer.',
   'Warm brown is the new neutral. It is softer than black and richer than beige. Wear it tonal for a long silhouette, or set it against cream so the look can breathe.',
   '[{"name":"Camel","hex":"#C19A6B"},{"name":"Mocha","hex":"#6F5240"},{"name":"Cream","hex":"#EFE7D3"},{"name":"Espresso","hex":"#3B2A20"}]'),
  (2, 'Wardrobe', 'A 7-look capsule',
   'Fewest pieces, most combinations.',
   'Seven basics in a muted palette give more than twenty outfits. The secret is a single colour temperature: all warm or all cool, and any combination works.',
   '[{"name":"Beige","hex":"#C9B79A"},{"name":"Graphite","hex":"#3A3A3C"},{"name":"Olive","hex":"#73703F"},{"name":"White","hex":"#F4EFE3"}]'),
  (3, 'Dress code', 'The new office',
   'Sharp bottom, soft top, one signature detail.',
   'The office has moved from the suit to a mix: straight ink-toned trousers, soft knit on top, and one bordeaux detail as a signature. Sharp, but with character.',
   '[{"name":"Ink","hex":"#222831"},{"name":"Stone","hex":"#ABA197"},{"name":"Bordeaux","hex":"#6E2A38"}]'),
  (4, 'Textures', 'Quiet luxury',
   'Cashmere, wool and linen instead of logos.',
   'Quiet luxury is about material, not the brand. Cashmere knits, wool trousers, light linen: pieces speak through the quality of cut and cloth, not prints.',
   '[{"name":"Champagne","hex":"#C7B299"},{"name":"Pebble","hex":"#B7AE9E"},{"name":"Espresso","hex":"#3B2A20"}]'),
  (5, 'Silhouette', 'A soft shoulder line',
   'A rounded, relaxed top sets the tone.',
   'The rigid fitted silhouette gives way to a soft shoulder line. A slightly dropped sleeve and gentle volume make a look feel more modern and comfortable without losing polish.',
   '[{"name":"Powder","hex":"#D9BFB7"},{"name":"Beige","hex":"#C9B79A"},{"name":"Olive","hex":"#73703F"}]'),
  (6, 'Evening', 'No shimmer',
   'Deep warm tones instead of black and sequins.',
   'Evening moves from shimmer to depth of colour. An espresso-toned dress, a bordeaux clutch, a thin champagne belt — dressier, softer and more modern than any classic in black.',
   '[{"name":"Espresso","hex":"#3B2A20"},{"name":"Bordeaux","hex":"#6E2A38"},{"name":"Champagne","hex":"#C7B299"}]')
on conflict (number) do nothing;
