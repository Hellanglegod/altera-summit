-- ============================================
-- PREVENT DUPLICATE APPLICATIONS & SECURE SUBMISSIONS
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Restrict application submissions to authenticated users only
DROP POLICY IF EXISTS "Public can submit applications" ON form_submissions;
DROP POLICY IF EXISTS "Authenticated users can submit applications" ON form_submissions;

CREATE POLICY "Authenticated users can submit applications" ON form_submissions
  FOR INSERT TO authenticated
  WITH CHECK (status = 'Submitted');

-- 2. Grant authenticated users ability to read their own application submissions
DROP POLICY IF EXISTS "Users can read own submissions" ON form_submissions;

CREATE POLICY "Users can read own submissions" ON form_submissions
  FOR SELECT TO authenticated
  USING (
    LOWER(applicant_email) = LOWER(auth.jwt() ->> 'email')
  );

-- Index to optimize querying submissions by email
CREATE INDEX IF NOT EXISTS idx_form_submissions_applicant_email ON form_submissions(LOWER(applicant_email));
