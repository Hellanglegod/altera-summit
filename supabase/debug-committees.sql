-- Debug query to check committees table
-- Run this in your Supabase SQL Editor to see what's in the table

-- Check if table exists and has data
SELECT COUNT(*) as total_committees FROM committees;

-- Check all committees
SELECT id, name, abbreviation, category, status, is_active, display_order
FROM committees
ORDER BY display_order;

-- Check only active committees (what the frontend queries)
SELECT id, name, abbreviation, category, status, is_active, display_order
FROM committees
WHERE is_active = true
ORDER BY display_order;
