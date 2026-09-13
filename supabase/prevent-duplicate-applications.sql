-- ============================================
-- PREVENT DUPLICATE APPLICATIONS & ALLOW SELF-READ
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Grant authenticated users ability to read their own application submissions
DROP POLICY IF EXISTS "Users can read own submissions" ON form_submissions;

CREATE POLICY "Users can read own submissions" ON form_submissions
  FOR SELECT TO authenticated
  USING (
    LOWER(applicant_email) = LOWER(auth.jwt() ->> 'email')
  );

-- Index to optimize querying submissions by email
CREATE INDEX IF NOT EXISTS idx_form_submissions_applicant_email ON form_submissions(LOWER(applicant_email));

