-- Complete fix for Portal Settings, Event Config, and verify all RLS policies
-- Run this entire script in your Supabase SQL Editor

-- ============================================
-- PORTAL SETTINGS FIX
-- ============================================

ALTER TABLE portal_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read portal settings" ON portal_settings;
DROP POLICY IF EXISTS "Admins can update portal settings" ON portal_settings;

CREATE POLICY "Public can read portal settings" ON portal_settings
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admins can update portal settings" ON portal_settings
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'director_registrations')
    );

-- Clear and insert portal settings
DELETE FROM portal_settings;

INSERT INTO portal_settings (portal_type, is_active, form_mode, form_url, closed_message) VALUES
('delegate', true, 'google_form', 'https://forms.google.com/delegate-application', 'Delegate applications are currently closed. Stay tuned for updates!'),
('chair', true, 'google_form', 'https://forms.google.com/chair-application', 'Chair applications are currently closed. We will notify shortlisted candidates.'),
('secretariat', false, 'external_link', NULL, 'Secretariat applications are closed. Our team has been finalized for this year.');

SELECT 'Portal settings:' as status, portal_type, is_active FROM portal_settings ORDER BY portal_type;

-- ============================================
-- EVENT CONFIG FIX
-- ============================================

ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read event config" ON event_config;
DROP POLICY IF EXISTS "Admins can update event config" ON event_config;

CREATE POLICY "Public can read event config" ON event_config
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admins can update event config" ON event_config
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    );

-- Clear and insert event config
DELETE FROM event_config;

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

SELECT 'Event config:' as status, event_name, delegate_count, committee_count FROM event_config;

-- ============================================
-- VERIFY ALL TABLES AS ANONYMOUS USER
-- ============================================

SET ROLE anon;

SELECT '✅ Committees' as table_name, COUNT(*) as count FROM committees WHERE is_active = true;
SELECT '✅ Secretariat' as table_name, COUNT(*) as count FROM secretariat_members WHERE is_active = true;
SELECT '✅ Schedule' as table_name, COUNT(*) as count FROM schedule_items WHERE is_active = true;
SELECT '✅ Portal Settings' as table_name, COUNT(*) as count FROM portal_settings;
SELECT '✅ Event Config' as table_name, COUNT(*) as count FROM event_config;

RESET ROLE;

-- You should see non-zero counts for all tables above
-- If any show 0, there's still an RLS issue with that table
