-- Sample Committee Data for Altera Summit
-- Run this in your Supabase SQL Editor to populate the committees table

INSERT INTO committees (
  name,
  abbreviation,
  category,
  agenda,
  chair_name,
  cochair_name,
  status,
  is_active,
  display_order
) VALUES
-- Flagship Committees
(
  'United Nations Security Council',
  'UNSC',
  'Flagship',
  'Addressing the proliferation of autonomous weapons systems and their implications for international security',
  'Alexandra Chen',
  'Marcus Thompson',
  'active',
  true,
  1
),
(
  'International Press Corps',
  'IPC',
  'Flagship',
  'Covering the intersections of media ethics, disinformation, and press freedom in the digital age',
  'Sofia Rodriguez',
  'James Wilson',
  'active',
  true,
  2
),
(
  'Galactic Senate',
  'GALSN',
  'Flagship',
  'Navigating interstellar diplomacy in a fictional universe where humanity has joined a coalition of alien civilizations',
  'Dr. Kenji Yamamoto',
  NULL,
  'active',
  true,
  3
),

-- Crisis Committees
(
  'The Congress of Vienna (1814-1815)',
  'COV',
  'Crisis',
  'Reshaping Europe after the Napoleonic Wars while balancing power and legitimacy',
  'Elizabeth Thornton',
  'Philippe Dubois',
  'active',
  true,
  4
),
(
  'The Cold War Space Race (1957-1969)',
  'CWSR',
  'Crisis',
  'Dual committee: USA vs USSR competing for supremacy in space exploration and satellite technology',
  'Maria Volkov',
  'David Patterson',
  'active',
  true,
  5
),
(
  'The Fall of Constantinople (1453)',
  'FOCON',
  'Crisis',
  'Byzantine Empire''s last stand against the Ottoman siege',
  'Ayşe Demir',
  NULL,
  'active',
  true,
  6
),

-- Conventional Committees
(
  'United Nations Human Rights Council',
  'UNHRC',
  'Conventional',
  'Protecting the rights of refugees and internally displaced persons in conflict zones',
  'Amara Okonkwo',
  'Lars Eriksson',
  'active',
  true,
  7
),
(
  'World Health Organization',
  'WHO',
  'Conventional',
  'Combating antimicrobial resistance: a global health security threat',
  'Dr. Priya Sharma',
  NULL,
  'active',
  true,
  8
),
(
  'United Nations Environment Programme',
  'UNEP',
  'Conventional',
  'Addressing plastic pollution in oceans and its impact on marine ecosystems',
  'Carlos Mendoza',
  'Yuki Tanaka',
  'active',
  true,
  9
),
(
  'International Atomic Energy Agency',
  'IAEA',
  'Conventional',
  'Nuclear energy in the 21st century: balancing sustainability and non-proliferation',
  'Dr. Hans Mueller',
  NULL,
  'active',
  true,
  10
),

-- Regional Committees
(
  'African Union Peace and Security Council',
  'AUPSC',
  'Regional',
  'Strengthening regional peacekeeping mechanisms in the Sahel',
  'Ibrahim Diallo',
  'Grace Mutiso',
  'active',
  true,
  11
),
(
  'Association of Southeast Asian Nations',
  'ASEAN',
  'Regional',
  'Maritime security and territorial disputes in the South China Sea',
  'Nguyen Thi Mai',
  'Rajesh Kumar',
  'active',
  true,
  12
),
(
  'Organization of American States',
  'OAS',
  'Regional',
  'Migration and human security in the Americas',
  'Ana García',
  'Michael O''Brien',
  'active',
  true,
  13
),
(
  'Arab League',
  'AL',
  'Regional',
  'Water scarcity and resource management in the Middle East',
  'Fatima Al-Rashid',
  'Omar Hassan',
  'active',
  true,
  14
);

-- Update the committees count
SELECT COUNT(*) as total_committees FROM committees WHERE is_active = true;
