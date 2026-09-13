-- Run this migration on existing projects after schema.sql.
-- It creates customizable admin roles, user assignments, and the approval inbox.

CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE RESTRICT,
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_action_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
    resource VARCHAR(100) NOT NULL,
    record_id UUID,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO admin_roles (name, description, permissions, is_system)
VALUES
    ('super_admin', 'Full control over the summit administration.', '["*"]', true),
    ('director_registrations', 'Manage applications and portal settings.', '["applications.read", "applications.manage", "portals.manage"]', true),
    ('committee_director', 'Manage committee content.', '["committees.read", "committees.manage"]', true)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COALESCE(
        auth.jwt() -> 'app_metadata' ->> 'role' = 'super_admin'
        OR auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin'
        OR EXISTS (
            SELECT 1 FROM public.admin_role_assignments a
            JOIN public.admin_roles r ON r.id = a.role_id
            WHERE a.user_id = auth.uid() AND r.name = 'super_admin'
        ), false
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
                        WHERE role_definition.name IN (
                                auth.jwt() -> 'app_metadata' ->> 'role',
                                auth.jwt() -> 'user_metadata' ->> 'role'
                        )
                            AND (
                                role_definition.permissions @> jsonb_build_array('*')
                                OR role_definition.permissions @> jsonb_build_array(required_permission)
                            )
                ),
                false
        );
$$;

CREATE OR REPLACE FUNCTION public.find_auth_user_id_by_email(target_email TEXT)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
        SELECT id
        FROM auth.users
        WHERE LOWER(email) = LOWER(target_email)
            AND (
                admin_has_permission('secretariat.manage')
                OR admin_has_permission('roles.manage')
            )
        LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_auth_user_id_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_auth_user_id_by_email(TEXT) TO authenticated;

DROP POLICY IF EXISTS "Super admins manage role definitions" ON admin_roles;
DROP POLICY IF EXISTS "Super admins manage non-founder role definitions" ON admin_roles;
DROP POLICY IF EXISTS "Authenticated users can read role definitions" ON admin_roles;
DROP POLICY IF EXISTS "Admins can read their assigned role" ON admin_role_assignments;
DROP POLICY IF EXISTS "Super admins manage role assignments" ON admin_role_assignments;
DROP POLICY IF EXISTS "Super admins manage non-founder assignments" ON admin_role_assignments;
DROP POLICY IF EXISTS "Secretariat managers assign non-founder roles" ON admin_role_assignments;
DROP POLICY IF EXISTS "Secretariat managers update non-founder roles" ON admin_role_assignments;
DROP POLICY IF EXISTS "Admins can read action requests" ON admin_action_requests;
DROP POLICY IF EXISTS "Admins can request actions" ON admin_action_requests;
DROP POLICY IF EXISTS "Super admins review actions" ON admin_action_requests;

CREATE POLICY "Super admins manage non-founder role definitions" ON admin_roles
    FOR ALL TO authenticated
    USING (is_super_admin() AND name <> 'super_admin')
    WITH CHECK (is_super_admin() AND name <> 'super_admin');
CREATE POLICY "Authenticated users can read role definitions" ON admin_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can read their assigned role" ON admin_role_assignments
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR is_super_admin()
        OR admin_has_permission('secretariat.manage')
    );
CREATE POLICY "Super admins manage non-founder assignments" ON admin_role_assignments
    FOR ALL TO authenticated
    USING (
        is_super_admin()
        AND NOT EXISTS (
            SELECT 1 FROM public.admin_roles founder_role
            WHERE founder_role.id = role_id
              AND founder_role.name = 'super_admin'
        )
    )
    WITH CHECK (
        is_super_admin()
        AND NOT EXISTS (
            SELECT 1 FROM public.admin_roles founder_role
            WHERE founder_role.id = role_id
              AND founder_role.name = 'super_admin'
        )
    );

CREATE POLICY "Secretariat managers assign non-founder roles" ON admin_role_assignments
    FOR INSERT TO authenticated
    WITH CHECK (
        admin_has_permission('secretariat.manage')
        AND NOT EXISTS (
            SELECT 1 FROM public.admin_roles founder_role
            WHERE founder_role.id = role_id
              AND founder_role.name = 'super_admin'
        )
    );

CREATE POLICY "Secretariat managers update non-founder roles" ON admin_role_assignments
    FOR UPDATE TO authenticated
    USING (
        admin_has_permission('secretariat.manage')
        AND NOT EXISTS (
            SELECT 1 FROM public.admin_roles founder_role
            WHERE founder_role.id = role_id
              AND founder_role.name = 'super_admin'
        )
    )
    WITH CHECK (
        admin_has_permission('secretariat.manage')
        AND NOT EXISTS (
            SELECT 1 FROM public.admin_roles founder_role
            WHERE founder_role.id = role_id
              AND founder_role.name = 'super_admin'
        )
    );
CREATE POLICY "Admins can read action requests" ON admin_action_requests FOR SELECT TO authenticated USING (requested_by = auth.uid() OR is_super_admin());
CREATE POLICY "Admins can request actions" ON admin_action_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        requested_by = auth.uid()
        AND admin_has_permission('secretariat.manage')
    );
CREATE POLICY "Super admins review actions" ON admin_action_requests FOR UPDATE TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());