-- Sample Portal Settings Data for Altera Summit
-- Run this in your Supabase SQL Editor to populate the portal_settings table

INSERT INTO portal_settings (
  portal_type,
  is_active,
  form_mode,
  form_url,
  closed_message
) VALUES
(
  'delegate',
  true,
  'google_form',
  'https://forms.google.com/delegate-application',
  'Delegate applications are currently closed. Stay tuned for updates!'
),
(
  'chair',
  true,
  'google_form',
  'https://forms.google.com/chair-application',
  'Chair applications are currently closed. We will notify shortlisted candidates.'
),
(
  'secretariat',
  false,
  'external_link',
  NULL,
  'Secretariat applications are closed. Our team has been finalized for this year.'
);

-- Verify the data
SELECT portal_type, is_active, form_mode FROM portal_settings ORDER BY portal_type;
