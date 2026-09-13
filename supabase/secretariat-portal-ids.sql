-- Give every assigned Secretariat/admin portal a short stable identifier.
-- Run after admin-roles.sql.

ALTER TABLE admin_role_assignments
  ADD COLUMN IF NOT EXISTS portal_id VARCHAR(8);

UPDATE admin_role_assignments
SET portal_id = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 8))
WHERE portal_id IS NULL;

ALTER TABLE admin_role_assignments
  ALTER COLUMN portal_id SET DEFAULT UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 8)),
  ALTER COLUMN portal_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS admin_role_assignments_portal_id_key
  ON admin_role_assignments(portal_id);

-- Backfill portal records for admin users configured through Supabase metadata.
INSERT INTO admin_role_assignments (user_id, email, role_id, portal_id)
SELECT
  auth_user.id,
  auth_user.email,
  role_definition.id,
  UPPER(SUBSTRING(REPLACE(auth_user.id::TEXT, '-', '') FROM 1 FOR 8))
FROM auth.users AS auth_user
JOIN admin_roles AS role_definition
  ON role_definition.name = COALESCE(
    auth_user.raw_app_meta_data ->> 'role',
    auth_user.raw_user_meta_data ->> 'role'
  )
WHERE role_definition.permissions <> '[]'::jsonb
  AND NOT EXISTS (
    SELECT 1
    FROM admin_role_assignments existing_assignment
    WHERE existing_assignment.user_id = auth_user.id
  )
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON COLUMN admin_role_assignments.portal_id IS
  'Short stable identifier linked to the assigned Secretariat/admin portal user.';