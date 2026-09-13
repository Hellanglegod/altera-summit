-- Complete fix for Secretariat and Schedule not showing up
-- Run this entire script in your Supabase SQL Editor

-- ============================================
-- SECRETARIAT MEMBERS FIX
-- ============================================

-- Step 1: Enable RLS and recreate policies for secretariat
ALTER TABLE secretariat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read secretariat" ON secretariat_members;
DROP POLICY IF EXISTS "Admins can manage secretariat" ON secretariat_members;

CREATE POLICY "Public can read secretariat" ON secretariat_members
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Admins can manage secretariat" ON secretariat_members
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'director_registrations')
    );

-- Step 2: Clear and insert secretariat data
DELETE FROM secretariat_members;

INSERT INTO secretariat_members (name, designation, bio, email, linkedin_url, display_order, is_active) VALUES
('Alexandra Sterling', 'Secretary-General', 'A fourth-year International Relations major with 6+ years of MUN experience. Alexandra has chaired at Harvard MUN and represented at THIMUN. Passionate about sustainable diplomacy and multilateral cooperation.', 'alexandra@alterasummit.com', 'https://linkedin.com/in/alexandrasterling', 1, true),
('Marcus Chen', 'Director-General', 'Economics and Political Science dual major. Former Deputy Secretary-General at Yale MUN. Marcus specializes in crisis simulations and has designed innovative committee formats for three international conferences.', 'marcus@alterasummit.com', 'https://linkedin.com/in/marcuschen', 2, true),
('Priya Kapoor', 'Director of Registrations', 'Business Administration major with expertise in event management. Priya has coordinated delegate registration for conferences with 500+ participants and ensures seamless onboarding for all tracks.', 'priya@alterasummit.com', 'https://linkedin.com/in/priyakapoor', 3, true),
('David Okonkwo', 'Director of Committees', 'Philosophy and Government major. David has served as Chair at multiple UN simulations and brings extensive research experience. Oversees all committee operations and chair training.', 'david@alterasummit.com', 'https://linkedin.com/in/davidokonkwo', 4, true),
('Sofia Martinez', 'Director of Logistics', 'Event Planning specialist. Sofia manages venue coordination, catering, accommodation partnerships, and ensures smooth execution of all conference operations.', 'sofia@alterasummit.com', 'https://linkedin.com/in/sofiamartinez', 5, true),
('James Park', 'Director of Communications', 'Journalism and Media Studies major. James leads social media strategy, press relations, and marketing campaigns. Former editor of the university newspaper.', 'james@alterasummit.com', 'https://linkedin.com/in/jamespark', 6, true),
('Amara Thompson', 'Director of Finance', 'Accounting major with nonprofit financial management experience. Amara oversees budgets, sponsorships, and ensures financial transparency for all conference operations.', 'amara@alterasummit.com', 'https://linkedin.com/in/amarathompson', 7, true),
('Yuki Tanaka', 'Director of Technology', 'Computer Science major. Yuki manages the conference platform, virtual integrations, livestreaming, and all technical infrastructure to ensure a seamless digital experience.', 'yuki@alterasummit.com', 'https://linkedin.com/in/yukitanaka', 8, true);

-- Verify secretariat
SELECT 'Secretariat members:' as status, COUNT(*) as count FROM secretariat_members WHERE is_active = true;

-- ============================================
-- SCHEDULE ITEMS FIX
-- ============================================

-- Step 1: Enable RLS and recreate policies for schedule
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read schedule" ON schedule_items;
DROP POLICY IF EXISTS "Admins can manage schedule" ON schedule_items;

CREATE POLICY "Public can read schedule" ON schedule_items
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Admins can manage schedule" ON schedule_items
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'committee_director')
    );

-- Step 2: Clear and insert schedule data
DELETE FROM schedule_items;

-- DAY 1: Opening & Committee Sessions
INSERT INTO schedule_items (day, time, title, description, location, display_order, is_active) VALUES
(1, '08:00', 'Registration & Check-In', 'Delegate registration and welcome kit distribution', 'Main Lobby', 1, true),
(1, '09:30', 'Opening Ceremony', 'Welcome address by the Secretary-General and keynote speaker', 'Grand Ballroom', 2, true),
(1, '11:00', 'Committee Session 1', 'First committee session - Opening statements and initial debates', 'Committee Rooms', 3, true),
(1, '13:00', 'Lunch Break', 'Networking lunch with fellow delegates', 'Dining Hall', 4, true),
(1, '14:30', 'Committee Session 2', 'Continued debate and working paper discussions', 'Committee Rooms', 5, true),
(1, '17:00', 'Secretariat Social Hour', 'Informal networking with secretariat and chairs', 'Terrace Lounge', 6, true),
(1, '19:00', 'Welcome Dinner', 'Formal dinner and cultural performances', 'Grand Ballroom', 7, true);

-- DAY 2: Intensive Debate & Crisis Updates
INSERT INTO schedule_items (day, time, title, description, location, display_order, is_active) VALUES
(2, '09:00', 'Committee Session 3', 'Resolution drafting and amendments', 'Committee Rooms', 1, true),
(2, '11:00', 'Crisis Update Briefing', 'Breaking developments for crisis committees', 'Executive Chambers', 2, true),
(2, '12:30', 'Lunch & Press Conference', 'International Press Corps holds press briefing', 'Media Center', 3, true),
(2, '14:00', 'Committee Session 4', 'Voting procedures and resolution passage', 'Committee Rooms', 4, true),
(2, '16:00', 'Coffee Break & Networking', 'Refreshments and delegate networking', 'Central Atrium', 5, true),
(2, '16:30', 'Committee Session 5', 'Final debate round and emergency sessions', 'Committee Rooms', 6, true),
(2, '19:30', 'Delegate Social Night', 'Themed party and entertainment', 'Starlight Pavilion', 7, true);

-- DAY 3: Closing Sessions & Awards
INSERT INTO schedule_items (day, time, title, description, location, display_order, is_active) VALUES
(3, '09:00', 'Committee Session 6', 'Final resolutions and closing statements', 'Committee Rooms', 1, true),
(3, '11:00', 'General Assembly Plenary', 'Presentation of committee outcomes to full assembly', 'Grand Ballroom', 2, true),
(3, '13:00', 'Farewell Lunch', 'Final networking and goodbyes', 'Dining Hall', 3, true),
(3, '15:00', 'Closing Ceremony', 'Award presentations and Secretary-General closing remarks', 'Grand Ballroom', 4, true),
(3, '17:00', 'Conference Concludes', 'Safe travels and see you next year!', 'Main Lobby', 5, true);

-- Verify schedule
SELECT 'Schedule items:' as status, COUNT(*) as count FROM schedule_items WHERE is_active = true;
SELECT 'By day:' as breakdown, day, COUNT(*) as events FROM schedule_items WHERE is_active = true GROUP BY day ORDER BY day;

-- ============================================
-- FINAL VERIFICATION (test as anonymous user)
-- ============================================

SET ROLE anon;
SELECT 'Test 1: Secretariat' as test, name, designation FROM secretariat_members WHERE is_active = true LIMIT 3;
SELECT 'Test 2: Schedule' as test, day, time, title FROM schedule_items WHERE is_active = true LIMIT 3;
RESET ROLE;

-- All done! You should see data returned above.
