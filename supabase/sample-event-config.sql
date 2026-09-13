-- Sample Event Configuration for Altera Summit
-- Run this in your Supabase SQL Editor

INSERT INTO event_config (
  event_name,
  event_tagline,
  event_start_at,
  event_end_at,
  venue_name,
  venue_address,
  venue_map_url,
  delegate_count,
  committee_count,
  days_of_debate,
  prize_pool_display,
  announcement_banner_text,
  announcement_banner_active
) VALUES (
  'Altera Summit',
  'Forging Destiny Among the Stars',
  '2027-03-15 09:00:00+00',
  '2027-03-17 18:00:00+00',
  'The Grand Convention Center',
  '123 Diplomatic Avenue, Capital City',
  'https://maps.google.com/?q=Grand+Convention+Center',
  300,
  14,
  3,
  '$5,000',
  'Early bird delegate applications close in 7 days! Apply now to secure your spot.',
  true
);

-- Verify
SELECT * FROM event_config;
