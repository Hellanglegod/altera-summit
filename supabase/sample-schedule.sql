-- Sample Schedule for Altera Summit
-- Run this in your Supabase SQL Editor

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

-- Verify
SELECT day, time, title FROM schedule_items WHERE is_active = true ORDER BY day, display_order;
