INSERT INTO public.offerwalls (provider, display_name, url_template, active)
VALUES
  ('monlix', 'Monlix', 'https://offers.monlix.com/?appid=YOUR&userid={user_id}', true),
  ('gemi', 'Gemi Offery', 'https://gemiads.com/offerwall?apikey=YOUR&user_id={user_id}', true),
  ('gemiads', 'GemiAds', 'https://gemiads.com/offerwall?apikey=YOUR&user_id={user_id}', true)
ON CONFLICT (provider) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  url_template = EXCLUDED.url_template,
  active = EXCLUDED.active,
  updated_at = NOW();
