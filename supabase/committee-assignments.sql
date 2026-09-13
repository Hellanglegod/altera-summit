-- Add committee assignment and committee-director review access.
-- Run this after schema.sql and admin-roles.sql.

ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS committee_id UUID REFERENCES committees(id) ON DELETE SET NULL;

ALTER TABLE admin_role_assignments
  ADD COLUMN IF NOT EXISTS committee_id UUID REFERENCES committees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS form_submissions_committee_id_idx
  ON form_submissions(committee_id);

CREATE INDEX IF NOT EXISTS admin_role_assignments_committee_id_idx
  ON admin_role_assignments(committee_id);

CREATE OR REPLACE FUNCTION public.admin_has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role' = required_role
    OR EXISTS (
      SELECT 1
      FROM public.admin_role_assignments assignment
      JOIN public.admin_roles role_definition
        ON role_definition.id = assignment.role_id
      WHERE assignment.user_id = auth.uid()
        AND role_definition.name = required_role
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_has_permission(required_permission TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.admin_role_assignments assignment
      JOIN public.admin_roles role_definition
        ON role_definition.id = assignment.role_id
      WHERE assignment.user_id = auth.uid()
        AND (
          role_definition.permissions @> jsonb_build_array('*')
          OR role_definition.permissions @> jsonb_build_array(required_permission)
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.admin_roles role_definition
      WHERE role_definition.name = (auth.jwt() -> 'app_metadata' ->> 'role')
        AND (
          role_definition.permissions @> jsonb_build_array('*')
          OR role_definition.permissions @> jsonb_build_array(required_permission)
        )
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_assigned_committee_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT committee_id
  FROM public.admin_role_assignments
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

UPDATE admin_roles
SET permissions = '["applications.read", "applications.review", "applications.delegate.accept", "applications.chair.accept", "committees.read"]'::jsonb,
    updated_at = NOW()
WHERE name = 'committee_director';

UPDATE admin_roles
SET permissions = permissions || '["applications.delegate.accept", "applications.chair.accept", "applications.secretariat.accept"]'::jsonb,
    updated_at = NOW()
WHERE name = 'director_registrations';

DROP POLICY IF EXISTS "Admins can manage submissions" ON form_submissions;
DROP POLICY IF EXISTS "Committee directors review delegate submissions" ON form_submissions;
DROP POLICY IF EXISTS "Committee directors assign delegates" ON form_submissions;

DROP POLICY IF EXISTS "Users can read own submissions" ON form_submissions;
CREATE POLICY "Users can read own submissions" ON form_submissions
  FOR SELECT TO authenticated
  USING (
    LOWER(applicant_email) = LOWER(auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS "Registrations directors manage submissions" ON form_submissions;
CREATE POLICY "Registrations directors manage submissions" ON form_submissions
  FOR ALL TO authenticated
  USING (
    admin_has_permission('applications.manage')
  )
  WITH CHECK (
    admin_has_permission('applications.manage')
  );

DROP POLICY IF EXISTS "Application reviewers can read submissions" ON form_submissions;
CREATE POLICY "Application reviewers can read submissions" ON form_submissions
  FOR SELECT TO authenticated
  USING (
    admin_has_permission('applications.read')
    AND (
      admin_has_permission('applications.manage')
      OR admin_has_permission('roles.manage')
      OR committee_id = admin_assigned_committee_id()
    )
  );

DROP POLICY IF EXISTS "Secretariat managers can read accepted Secretariat applications" ON form_submissions;
CREATE POLICY "Secretariat managers can read accepted Secretariat applications" ON form_submissions
  FOR SELECT TO authenticated
  USING (
    portal_type = 'secretariat'
    AND status IN ('Accepted', 'Confirmed')
    AND admin_has_permission('secretariat.manage')
  );

DROP POLICY IF EXISTS "Application reviewers can update submissions" ON form_submissions;
CREATE POLICY "Application reviewers can update submissions" ON form_submissions
  FOR UPDATE TO authenticated
  USING (
    (
      admin_has_permission('applications.review')
      OR admin_has_permission('applications.delegate.accept')
      OR admin_has_permission('applications.chair.accept')
      OR admin_has_permission('applications.secretariat.accept')
    )
    AND (
      admin_has_permission('applications.manage')
      OR admin_has_permission('roles.manage')
      OR committee_id = admin_assigned_committee_id()
    )
  )
  WITH CHECK (
    (
      admin_has_permission('applications.review')
      OR admin_has_permission('applications.delegate.accept')
      OR admin_has_permission('applications.chair.accept')
      OR admin_has_permission('applications.secretariat.accept')
    )
    AND (
      admin_has_permission('applications.manage')
      OR admin_has_permission('roles.manage')
      OR committee_id = admin_assigned_committee_id()
    )
  );

-- Rebuild content-management policies around permissions so custom roles work.
DROP POLICY IF EXISTS "Admins can update portal settings" ON portal_settings;
CREATE POLICY "Admins can update portal settings" ON portal_settings
  FOR ALL TO authenticated
  USING (admin_has_permission('portals.manage'))
  WITH CHECK (admin_has_permission('portals.manage'));

DROP POLICY IF EXISTS "Admins can manage committees" ON committees;
CREATE POLICY "Admins can manage committees" ON committees
  FOR ALL TO authenticated
  USING (admin_has_permission('committees.manage'))
  WITH CHECK (admin_has_permission('committees.manage'));

DROP POLICY IF EXISTS "Admins can manage secretariat" ON secretariat_members;
CREATE POLICY "Admins can manage secretariat" ON secretariat_members
  FOR ALL TO authenticated
  USING (admin_has_permission('secretariat.manage'))
  WITH CHECK (admin_has_permission('secretariat.manage'));

DROP POLICY IF EXISTS "Admins can update event config" ON event_config;
CREATE POLICY "Admins can update event config" ON event_config
  FOR ALL TO authenticated
  USING (admin_has_permission('settings.manage'))
  WITH CHECK (admin_has_permission('settings.manage'));

DROP POLICY IF EXISTS "Admins can manage custom forms" ON custom_forms;
CREATE POLICY "Admins can manage custom forms" ON custom_forms
  FOR ALL TO authenticated
  USING (admin_has_permission('forms.manage'))
  WITH CHECK (admin_has_permission('forms.manage'));

DROP POLICY IF EXISTS "Admins can manage schedule" ON schedule_items;
CREATE POLICY "Admins can manage schedule" ON schedule_items
  FOR ALL TO authenticated
  USING (admin_has_permission('schedule.manage'))
  WITH CHECK (admin_has_permission('schedule.manage'));

COMMENT ON COLUMN form_submissions.committee_id IS
  'Committee selected by an authorized registration or committee director.';
