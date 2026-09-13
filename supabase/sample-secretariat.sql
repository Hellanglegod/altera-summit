-- Sample Secretariat Members for Altera Summit
-- Run this in your Supabase SQL Editor

INSERT INTO secretariat_members (
  name,
  designation,
  bio,
  email,
  linkedin_url,
  display_order,
  is_active
) VALUES
(
  'Alexandra Sterling',
  'Secretary-General',
  'A fourth-year International Relations major with 6+ years of MUN experience. Alexandra has chaired at Harvard MUN and represented at THIMUN. Passionate about sustainable diplomacy and multilateral cooperation.',
  'alexandra@alterasummit.com',
  'https://linkedin.com/in/alexandrasterling',
  1,
  true
),
(
  'Marcus Chen',
  'Director-General',
  'Economics and Political Science dual major. Former Deputy Secretary-General at Yale MUN. Marcus specializes in crisis simulations and has designed innovative committee formats for three international conferences.',
  'marcus@alterasummit.com',
  'https://linkedin.com/in/marcuschen',
  2,
  true
),
(
  'Priya Kapoor',
  'Director of Registrations',
  'Business Administration major with expertise in event management. Priya has coordinated delegate registration for conferences with 500+ participants and ensures seamless onboarding for all tracks.',
  'priya@alterasummit.com',
  'https://linkedin.com/in/priyakapoor',
  3,
  true
),
(
  'David Okonkwo',
  'Director of Committees',
  'Philosophy and Government major. David has served as Chair at multiple UN simulations and brings extensive research experience. Oversees all committee operations and chair training.',
  'david@alterasummit.com',
  'https://linkedin.com/in/davidokonkwo',
  4,
  true
),
(
  'Sofia Martinez',
  'Director of Logistics',
  'Event Planning specialist. Sofia manages venue coordination, catering, accommodation partnerships, and ensures smooth execution of all conference operations.',
  'sofia@alterasummit.com',
  'https://linkedin.com/in/sofiamartinez',
  5,
  true
),
(
  'James Park',
  'Director of Communications',
  'Journalism and Media Studies major. James leads social media strategy, press relations, and marketing campaigns. Former editor of the university newspaper.',
  'james@alterasummit.com',
  'https://linkedin.com/in/jamespark',
  6,
  true
),
(
  'Amara Thompson',
  'Director of Finance',
  'Accounting major with nonprofit financial management experience. Amara oversees budgets, sponsorships, and ensures financial transparency for all conference operations.',
  'amara@alterasummit.com',
  'https://linkedin.com/in/amarathompson',
  7,
  true
),
(
  'Yuki Tanaka',
  'Director of Technology',
  'Computer Science major. Yuki manages the conference platform, virtual integrations, livestreaming, and all technical infrastructure to ensure a seamless digital experience.',
  'yuki@alterasummit.com',
  'https://linkedin.com/in/yukitanaka',
  8,
  true
);

-- Verify
SELECT name, designation FROM secretariat_members WHERE is_active = true ORDER BY display_order;
