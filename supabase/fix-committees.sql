-- Simplified Committee Insert (Test with just 2 committees first)
-- Run this in your Supabase SQL Editor

-- First, let's check if RLS is blocking reads
SELECT * FROM committees LIMIT 1;

-- If that returns nothing, temporarily disable RLS to test:
ALTER TABLE committees DISABLE ROW LEVEL SECURITY;

-- Now try inserting 2 test committees
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
);

-- Verify insertion
SELECT name, category, is_active FROM committees ORDER BY display_order;

-- Re-enable RLS after testing
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;

-- Check the RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'committees';
