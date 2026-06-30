-- Re-seed the showcase trends in English. 0005 used `do nothing`, so databases
-- that were already seeded with the original Russian copy keep the old rows.
-- This migration upserts with `do update`, translating those existing rows in
-- place (and is a no-op on a freshly seeded English database).
insert into public.trends (number, eyebrow, title, description, lead, color_story) values
  (1, 'Colour of the season', 'Warm neutral',
   'Brown is the new black — softer, richer, calmer.',
   'Warm brown is the new neutral: softer than black, richer than beige. Wear it tonal for a long, lean line, or set it against cream to let the look breathe.',
   '[{"name":"Camel","hex":"#C19A6B"},{"name":"Mocha","hex":"#6F5240"},{"name":"Cream","hex":"#EFE7D3"},{"name":"Espresso","hex":"#3B2A20"}]'),
  (2, 'Wardrobe', 'A 7-piece capsule',
   'Fewest pieces, most combinations.',
   'Seven basics in a muted palette make more than twenty outfits. The secret is a single colour temperature — all warm or all cool — so any combination works.',
   '[{"name":"Beige","hex":"#C9B79A"},{"name":"Graphite","hex":"#3A3A3C"},{"name":"Olive","hex":"#73703F"},{"name":"White","hex":"#F4EFE3"}]'),
  (3, 'Dress code', 'The new office',
   'Sharp on the bottom, soft on top, one signature detail.',
   'The office has moved on from the suit to a mix: straight ink-toned trousers, a soft knit on top, and a single bordeaux detail as the signature. Sharp, but with character.',
   '[{"name":"Ink","hex":"#222831"},{"name":"Stone","hex":"#ABA197"},{"name":"Bordeaux","hex":"#6E2A38"}]'),
  (4, 'Textures', 'Quiet luxury',
   'Cashmere, wool and linen instead of logos.',
   'Quiet luxury is about the material, not the brand. Cashmere knits, wool trousers, fine linen — pieces that speak through the quality of the cut and the cloth, not prints.',
   '[{"name":"Champagne","hex":"#C7B299"},{"name":"Pebble","hex":"#B7AE9E"},{"name":"Espresso","hex":"#3B2A20"}]'),
  (5, 'Silhouette', 'A soft shoulder line',
   'A rounded, relaxed top sets the tone.',
   'The rigid, fitted silhouette is giving way to a soft shoulder line. A slightly dropped sleeve and a little volume make a look feel more modern and comfortable without losing its polish.',
   '[{"name":"Powder","hex":"#D9BFB7"},{"name":"Beige","hex":"#C9B79A"},{"name":"Olive","hex":"#73703F"}]'),
  (6, 'Evening', 'No shimmer',
   'Deep warm tones instead of black and sequins.',
   'Evening is shifting from shimmer to depth of colour: an espresso dress, a bordeaux clutch, a slim champagne belt — dressier, softer and more modern than any black classic.',
   '[{"name":"Espresso","hex":"#3B2A20"},{"name":"Bordeaux","hex":"#6E2A38"},{"name":"Champagne","hex":"#C7B299"}]')
on conflict (number) do update set
  eyebrow     = excluded.eyebrow,
  title       = excluded.title,
  description = excluded.description,
  lead        = excluded.lead,
  color_story = excluded.color_story;
