-- Sample Applications & Submissions RLS Fix for Altera Summit
-- Run this in your Supabase SQL Editor

-- 1. Ensure RLS on form_submissions
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit applications" ON form_submissions;
DROP POLICY IF EXISTS "Admins can manage submissions" ON form_submissions;
DROP POLICY IF EXISTS "Anyone can insert submissions" ON form_submissions;
DROP POLICY IF EXISTS "Authenticated users can manage submissions" ON form_submissions;

-- Allow anyone to submit applications
CREATE POLICY "Public can submit applications" ON form_submissions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow admins/secretariat to view and manage submissions
CREATE POLICY "Admins can manage submissions" ON form_submissions
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'director_registrations', 'committee_director')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'director_registrations', 'committee_director')
    );

-- 2. Clear old test submissions and insert diverse sample applicants
DELETE FROM form_submissions;

INSERT INTO form_submissions (
  applicant_name,
  applicant_email,
  applicant_phone,
  portal_type,
  submission_data,
  status,
  notes,
  created_at,
  updated_at
) VALUES
(
  'Aria Vance',
  'aria.vance@celestial.edu',
  '+1 (555) 234-5678',
  'delegate',
  jsonb_build_object(
    'institution', 'Celestial Diplomatic Academy',
    'mun_experience', '4 conferences (Best Delegate at SolMUN 2026)',
    'committee_preference_1', 'UNSC (Solar Crisis Council)',
    'committee_preference_2', 'Interstellar Trade Federation',
    'essay', 'Global governance requires multilateral consensus rooted in stellar diplomacy and pragmatic crisis response.'
  ),
  'Confirmed',
  'Outstanding profile. Assigned to UNSC as Delegate of France.',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '2 days'
),
(
  'Marcus Thorne',
  'm.thorne@orbital.org',
  '+1 (555) 876-5432',
  'chair',
  jsonb_build_object(
    'institution', 'Nova Horizon University',
    'past_chairing_experience', 'Head Chair at CosmosMUN 2025, Vice Chair at StellarSummit 2024',
    'preferred_committee', 'Crisis: Deep Space Conflict 2089',
    'study_guide_sample', 'https://drive.google.com/sample-guide-marcus',
    'philosophy', 'Empowering delegates through rigorous procedural mastery and dynamic crisis directives.'
  ),
  'Accepted',
  'Approved for Co-Chairing Crisis Committee. Interview scheduled for final briefing.',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '1 day'
),
(
  'Elena Rostova',
  'elena.r@nebula.ac.uk',
  '+44 7700 900123',
  'delegate',
  jsonb_build_object(
    'institution', 'Aegis Institute of International Affairs',
    'mun_experience', '2 conferences (Honorable Mention)',
    'committee_preference_1', 'Planetary Environment & Terraforming Council',
    'committee_preference_2', 'UNGA DISEC',
    'essay', 'Climate transition in extraterrestrial colonies demands aggressive resource equity.'
  ),
  'Shortlisted',
  'Strong essay, awaiting second round matrix allocation.',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '12 hours'
),
(
  'Kaelen Voss',
  'kvoss@astrocorp.net',
  '+1 (555) 432-1098',
  'secretariat',
  jsonb_build_object(
    'department_applied', 'Directorate of Logistics & Protocol',
    'relevant_experience', 'Lead Organizer for National Science Summit 2025 (400+ attendees)',
    'software_skills', 'Notion, Airtable, Figma, Eventbrite, Supabase',
    'availability', 'Full 3 days on-site + 20 hrs/week pre-summit'
  ),
  'In Review',
  'Interview with Secretary-General pending next Monday.',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '6 hours'
),
(
  'Zainab Al-Mansoor',
  'z.mansoor@gulfdiplomacy.ae',
  '+971 50 123 4567',
  'delegate',
  jsonb_build_object(
    'institution', 'Emirates Diplomatic Academy',
    'mun_experience', 'First-time delegate',
    'committee_preference_1', 'UN Human Rights Council',
    'committee_preference_2', 'UNESCO Cultural Preservation',
    'essay', 'I want to advocate for digital rights and ethical AI governance across sovereign territories.'
  ),
  'Submitted',
  NULL,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  'Dmitri Volkov',
  'dvolkov@eurasian.ru',
  '+7 999 123-45-67',
  'delegate',
  jsonb_build_object(
    'institution', 'St. Petersburg State University',
    'mun_experience', '6 conferences',
    'committee_preference_1', 'UNSC',
    'committee_preference_2', 'DISEC',
    'essay', 'Incomplete application response.'
  ),
  'Rejected',
  'Failed minimum word count requirements on policy essay.',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '8 days'
);

-- Confirm data
SELECT '✅ Applications seeded:' as status, portal_type, applicant_name, status FROM form_submissions ORDER BY created_at DESC;
